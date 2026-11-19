/**
 * Multi-Tenant Security & Authorization Guard
 * Enforces strict server-side tenant isolation, role-based access control,
 * quota validation, and audit logging for Enterprise/Institutional tenants.
 */

import crypto from "crypto";
import { getDb } from "./db.ts";

export type InstitutionRole =
  | "owner"
  | "admin"
  | "academic_director"
  | "department_admin"
  | "instructor"
  | "ta"
  | "student"
  | "trainee"
  | "auditor";

const ROLE_RANK: Record<InstitutionRole, number> = {
  owner: 100,
  admin: 90,
  academic_director: 80,
  department_admin: 70,
  instructor: 50,
  ta: 40,
  auditor: 20,
  student: 10,
  trainee: 10,
};

export interface TenantAuthResult {
  authorized: boolean;
  isPlatformAdmin?: boolean;
  memberRole?: InstitutionRole;
  institution?: any;
  member?: any;
  error?: string;
  status: number;
}

/**
 * Validates whether a user has sufficient authorization for an institution.
 * Platform super-administrators inherit oversight capability.
 */
export function validateTenantAccess(
  userId: string,
  institutionIdOrSlug: string,
  minRole?: InstitutionRole
): TenantAuthResult {
  const db = getDb();

  // 1. Fetch institution
  const institution = db
    .prepare("SELECT * FROM institutions WHERE id = ? OR slug = ?")
    .get(institutionIdOrSlug, institutionIdOrSlug) as any;

  if (!institution) {
    return {
      authorized: false,
      error: "Institusi tidak ditemukan",
      status: 404,
    };
  }

  // 2. Fetch platform user
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  if (!user) {
    return {
      authorized: false,
      error: "User tidak valid atau sesi berakhir",
      status: 401,
    };
  }

  // 3. Platform superadmin bypass
  if (user.role === "admin") {
    return {
      authorized: true,
      isPlatformAdmin: true,
      memberRole: "owner",
      institution,
      status: 200,
    };
  }

  // 4. Check institution status
  if (institution.status === "suspended") {
    return {
      authorized: false,
      error: "Akses institusi ini sedang ditangguhkan (Suspended)",
      status: 403,
    };
  }

  // 5. Query tenant membership
  const member = db
    .prepare("SELECT * FROM institution_members WHERE institution_id = ? AND user_id = ? AND status = 'active'")
    .get(institution.id, userId) as any;

  if (!member) {
    return {
      authorized: false,
      error: "Anda bukan anggota terdaftar dari institusi ini (Akses Ditolak)",
      status: 403,
    };
  }

  // 6. Check required role rank
  if (minRole) {
    const userRank = ROLE_RANK[member.role as InstitutionRole] || 0;
    const requiredRank = ROLE_RANK[minRole] || 0;
    if (userRank < requiredRank) {
      return {
        authorized: false,
        error: `Otoritas tidak memadai. Diperlukan peran minimal: ${minRole}`,
        status: 403,
      };
    }
  }

  return {
    authorized: true,
    isPlatformAdmin: false,
    memberRole: member.role as InstitutionRole,
    institution,
    member,
    status: 200,
  };
}

/**
 * Strict IDOR protection: Verifies that a specific resource belongs to the tenant.
 */
export function verifyTenantResourceOwnership(
  tableName: string,
  resourceId: string,
  institutionId: string
): boolean {
  const db = getDb();
  // Whitelist table names to prevent SQL injection in internal guard
  const allowedTables = [
    "institution_departments",
    "institution_classes",
    "institution_courses",
    "institution_course_assignments",
    "institution_submissions",
    "institution_lab_assignments",
    "institution_assessments",
    "institution_certificates",
  ];

  if (!allowedTables.includes(tableName)) {
    throw new Error(`Tabel tidak diizinkan untuk validasi tenant: ${tableName}`);
  }

  const record = db
    .prepare(`SELECT institution_id FROM ${tableName} WHERE id = ?`)
    .get(resourceId) as any;

  if (!record) return false;
  return record.institution_id === institutionId;
}

/**
 * Checks plan quotas (e.g. max users, active lab concurrency)
 */
export function checkTenantQuota(
  institutionId: string,
  quotaType: "users" | "labs"
): { allowed: boolean; current: number; max: number; error?: string } {
  const db = getDb();
  const inst = db.prepare("SELECT * FROM institutions WHERE id = ?").get(institutionId) as any;
  if (!inst) return { allowed: false, current: 0, max: 0, error: "Institusi tidak ditemukan" };

  if (quotaType === "users") {
    const count = (
      db.prepare("SELECT COUNT(*) as count FROM institution_members WHERE institution_id = ?").get(institutionId) as any
    ).count;
    const max = inst.plan_max_users || 500;
    return {
      allowed: count < max,
      current: count,
      max,
      error: count >= max ? `Batas kuota pengguna paket ${inst.plan_tier} (${max} pengguna) telah tercapai.` : undefined,
    };
  }

  if (quotaType === "labs") {
    const count = (
      db.prepare("SELECT COUNT(*) as count FROM institution_lab_assignments WHERE institution_id = ?").get(institutionId) as any
    ).count;
    const max = inst.plan_max_lab_concurrency || 25;
    return {
      allowed: count < max,
      current: count,
      max,
      error: count >= max ? `Batas kuota concurrent lab paket ${inst.plan_tier} (${max} lab) telah tercapai.` : undefined,
    };
  }

  return { allowed: true, current: 0, max: 0 };
}

/**
 * Writes an immutable security audit trail for institutional actions.
 */
export function logTenantAudit(
  institutionId: string,
  userId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, any> = {},
  ipAddress: string = "127.0.0.1"
) {
  try {
    const db = getDb();
    const id = `iaud_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const timestamp = new Date().toISOString();
    db.prepare(`
      INSERT INTO institution_audit_logs (
        id, institution_id, user_id, action, target_type, target_id, details, ip_address, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, institutionId, userId, action, targetType, targetId, JSON.stringify(details), ipAddress, timestamp);
  } catch (err) {
    console.error("Failed to write institutional audit log:", err);
  }
}
