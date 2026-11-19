import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

let dbInstance: DatabaseSync | null = null;

export function hashString(str: string): string {
  return crypto.createHash("sha256").update(str.trim().toLowerCase()).digest("hex");
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

export function verifyPassword(password: string, expectedHash: string, salt: string): boolean {
  const hash = hashPassword(password, salt);
  const hashBuf = Buffer.from(hash, "hex");
  const expectedBuf = Buffer.from(expectedHash, "hex");
  if (hashBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, expectedBuf);
}

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "cyberlab.db");
  const db = new DatabaseSync(dbPath);

  // Enable foreign keys and WAL mode for reliability
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");

  initSchema(db);
  seedInitialData(db);

  dbInstance = db;
  return db;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT 'Shield',
      bio TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      total_xp INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ctf_challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      points INTEGER NOT NULL,
      flag_hash TEXT NOT NULL,
      hint TEXT DEFAULT '',
      instructions TEXT DEFAULT '',
      attachment_url TEXT DEFAULT '',
      is_published INTEGER NOT NULL DEFAULT 1,
      solves_count INTEGER NOT NULL DEFAULT 0,
      author_id TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ctf_solves (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      challenge_id TEXT NOT NULL REFERENCES ctf_challenges(id) ON DELETE CASCADE,
      points_awarded INTEGER NOT NULL,
      solved_at TEXT NOT NULL,
      UNIQUE(user_id, challenge_id)
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      likes_count INTEGER NOT NULL DEFAULT 0,
      comments_count INTEGER NOT NULL DEFAULT 0,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_reported INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_likes (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      UNIQUE(post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS community_reports (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL,
      xp_reward INTEGER NOT NULL DEFAULT 25
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_code TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      UNIQUE(user_id, achievement_code)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      link TEXT DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lab_templates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      xp_reward INTEGER NOT NULL DEFAULT 50,
      cpu_limit TEXT NOT NULL DEFAULT '0.5 core',
      memory_limit TEXT NOT NULL DEFAULT '256 MB',
      storage_limit TEXT NOT NULL DEFAULT '512 MB',
      image_name TEXT NOT NULL DEFAULT 'cyberlab/sandbox:latest',
      instructions TEXT NOT NULL,
      verification_criteria TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      version TEXT NOT NULL DEFAULT '1.0.0',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lab_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      template_id TEXT NOT NULL REFERENCES lab_templates(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      mode TEXT NOT NULL DEFAULT 'embedded',
      terminal_endpoint TEXT DEFAULT '',
      ip_address TEXT DEFAULT '10.240.0.10',
      started_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      completed_at TEXT,
      checkpoints_state TEXT NOT NULL DEFAULT '{}',
      terminal_history TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lab_completions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      template_id TEXT NOT NULL REFERENCES lab_templates(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL REFERENCES lab_sessions(id) ON DELETE CASCADE,
      xp_awarded INTEGER NOT NULL,
      evidence_summary TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      UNIQUE(user_id, template_id)
    );

    -- Phase 5 Production Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_users_total_xp ON users(total_xp DESC);
    CREATE INDEX IF NOT EXISTS idx_community_posts_cat_created ON community_posts(category, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_community_comments_post_created ON community_comments(post_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_ctf_solves_user_challenge ON ctf_solves(user_id, challenge_id);
    CREATE INDEX IF NOT EXISTS idx_ctf_solves_challenge ON ctf_solves(challenge_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON audit_logs(actor_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_lab_sessions_user_status ON lab_sessions(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_lab_sessions_expires ON lab_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_lab_completions_user ON lab_completions(user_id);

    -- =========================================================================
    -- Phase 6: Ecosystem, Academy, Certs, Arena, Contributors, Research & Events
    -- =========================================================================

    CREATE TABLE IF NOT EXISTS academy_paths (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      target_audience TEXT NOT NULL,
      prerequisites TEXT NOT NULL,
      learning_objectives TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Beginner',
      estimated_hours INTEGER NOT NULL DEFAULT 20,
      category TEXT NOT NULL,
      modules_list TEXT NOT NULL, -- JSON array of { type, id, title }
      completion_xp INTEGER NOT NULL DEFAULT 150,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academy_enrollments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      path_id TEXT NOT NULL REFERENCES academy_paths(id) ON DELETE CASCADE,
      progress_percent INTEGER NOT NULL DEFAULT 0,
      completed_items TEXT NOT NULL DEFAULT '[]', -- JSON array of completed module/lab/ctf IDs
      is_completed INTEGER NOT NULL DEFAULT 0,
      enrolled_at TEXT NOT NULL,
      completed_at TEXT,
      UNIQUE(user_id, path_id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      path_id TEXT NOT NULL REFERENCES academy_paths(id) ON DELETE CASCADE,
      user_display_name TEXT NOT NULL,
      path_title TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'valid', -- 'valid' | 'revoked'
      revocation_reason TEXT DEFAULT '',
      verification_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ctf_competitions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'individual', -- 'individual' | 'team'
      format TEXT NOT NULL DEFAULT 'jeopardy',
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'upcoming', -- 'upcoming' | 'active' | 'concluded'
      rules TEXT NOT NULL,
      challenges_list TEXT NOT NULL DEFAULT '[]', -- JSON array of challenge IDs
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ctf_teams (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      leader_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invite_code TEXT UNIQUE NOT NULL,
      total_points INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ctf_team_members (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL REFERENCES ctf_teams(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member', -- 'leader' | 'member'
      joined_at TEXT NOT NULL,
      UNIQUE(team_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS ctf_competition_solves (
      id TEXT PRIMARY KEY,
      competition_id TEXT NOT NULL REFERENCES ctf_competitions(id) ON DELETE CASCADE,
      challenge_id TEXT NOT NULL REFERENCES ctf_challenges(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      team_id TEXT REFERENCES ctf_teams(id) ON DELETE SET NULL,
      points INTEGER NOT NULL,
      solved_at TEXT NOT NULL,
      UNIQUE(competition_id, challenge_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS contributor_submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL, -- 'module' | 'tutorial' | 'lab' | 'challenge' | 'writeup' | 'tool' | 'doc' | 'research'
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'submitted', -- 'draft' | 'submitted' | 'in_review' | 'approved' | 'published' | 'rejected'
      reviewer_feedback TEXT DEFAULT '',
      reviewer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS research_articles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      abstract TEXT NOT NULL,
      category TEXT NOT NULL,
      keywords TEXT NOT NULL DEFAULT '[]',
      content TEXT NOT NULL,
      references_list TEXT NOT NULL DEFAULT '[]',
      is_writeup INTEGER NOT NULL DEFAULT 0,
      related_challenge_id TEXT REFERENCES ctf_challenges(id) ON DELETE SET NULL,
      has_spoilers INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published', -- 'published' | 'pending' | 'draft'
      views_count INTEGER NOT NULL DEFAULT 0,
      likes_count INTEGER NOT NULL DEFAULT 0,
      published_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mentors (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      bio TEXT NOT NULL,
      specialties TEXT NOT NULL DEFAULT '[]', -- JSON array
      is_available INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'verified', -- 'verified' | 'pending'
      created_at TEXT NOT NULL,
      UNIQUE(user_id)
    );

    CREATE TABLE IF NOT EXISTS mentorship_requests (
      id TEXT PRIMARY KEY,
      mentor_id TEXT NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      learning_goals TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected' | 'completed'
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'workshop', -- 'workshop' | 'webinar' | 'ctf' | 'study_group'
      speaker_name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      location_url TEXT NOT NULL DEFAULT 'https://meet.cyberlab.id',
      max_participants INTEGER NOT NULL DEFAULT 100,
      registered_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled' | 'ongoing' | 'completed'
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS event_registrations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      registered_at TEXT NOT NULL,
      UNIQUE(event_id, user_id)
    );

    -- Phase 6 Indexes
    CREATE INDEX IF NOT EXISTS idx_academy_enrollments_user_path ON academy_enrollments(user_id, path_id);
    CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
    CREATE INDEX IF NOT EXISTS idx_certificates_path ON certificates(path_id);
    CREATE INDEX IF NOT EXISTS idx_ctf_teams_invite ON ctf_teams(invite_code);
    CREATE INDEX IF NOT EXISTS idx_ctf_team_members_user ON ctf_team_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_contributor_submissions_user_status ON contributor_submissions(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_research_articles_slug ON research_articles(slug);
    CREATE INDEX IF NOT EXISTS idx_research_articles_status_cat ON research_articles(status, category);
    CREATE INDEX IF NOT EXISTS idx_mentors_status ON mentors(status);
    CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor ON mentorship_requests(mentor_id, status);
    CREATE INDEX IF NOT EXISTS idx_mentorship_requests_student ON mentorship_requests(student_id);
    CREATE INDEX IF NOT EXISTS idx_community_events_time ON community_events(start_time);

    -- Phase 7: AI Assistant, Knowledge Base, Personalization, Quizzes, Security Center & Config
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      context_type TEXT NOT NULL DEFAULT 'general', -- 'general' | 'lab' | 'challenge' | 'analysis'
      context_id TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
      content TEXT NOT NULL,
      sources TEXT NOT NULL DEFAULT '[]', -- JSON array of references [{title, path, snippet}]
      feedback TEXT DEFAULT NULL, -- 'up' | 'down'
      feedback_notes TEXT DEFAULT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_knowledge_docs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL, -- 'linux' | 'networking' | 'web' | 'crypto' | 'forensics' | 'reverse' | 'general'
      topic TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]', -- JSON array
      source_url TEXT DEFAULT '',
      is_indexed INTEGER NOT NULL DEFAULT 1,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_quiz_drafts (
      id TEXT PRIMARY KEY,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      topic TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'intermediate', -- 'beginner' | 'intermediate' | 'advanced'
      question TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice' | 'true_false' | 'scenario'
      options TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'approved' | 'rejected'
      reviewer_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_user_preferences (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      is_personalization_enabled INTEGER NOT NULL DEFAULT 1,
      preferred_domains TEXT NOT NULL DEFAULT '[]', -- JSON array
      weekly_target_hours INTEGER NOT NULL DEFAULT 5,
      consent_given INTEGER NOT NULL DEFAULT 1,
      consent_updated_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_security_analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      analysis_type TEXT NOT NULL, -- 'log' | 'pcap' | 'file'
      target_name TEXT NOT NULL,
      sha256_hash TEXT NOT NULL,
      summary TEXT NOT NULL,
      evidence TEXT NOT NULL DEFAULT '[]', -- JSON array
      indicators TEXT NOT NULL DEFAULT '[]', -- JSON array
      confidence TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high'
      recommendations TEXT NOT NULL DEFAULT '[]', -- JSON array
      limitations TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_provider_config (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL DEFAULT 'gemini', -- 'gemini' | 'openai' | 'anthropic' | 'local'
      model_name TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
      api_key_masked TEXT NOT NULL DEFAULT 'AIzaSy*******************************',
      api_key_encrypted TEXT NOT NULL DEFAULT '',
      is_enabled INTEGER NOT NULL DEFAULT 1,
      rate_limit_per_minute INTEGER NOT NULL DEFAULT 20,
      total_requests INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    -- Phase 7 Indexes
    CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(conversation_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_ai_knowledge_cat ON ai_knowledge_docs(category, is_enabled);
    CREATE INDEX IF NOT EXISTS idx_ai_quiz_drafts_status ON ai_quiz_drafts(status, category);
    CREATE INDEX IF NOT EXISTS idx_ai_security_analyses_user ON ai_security_analyses(user_id, created_at DESC);

    -- Phase 8: Global Ecosystem, Partnerships, Tasks, API Keys, Knowledge Cache & Groups
    CREATE TABLE IF NOT EXISTS partnerships (
      id TEXT PRIMARY KEY,
      organization_name TEXT NOT NULL,
      org_type TEXT NOT NULL, -- 'university' | 'vocational_school' | 'community' | 'research_org' | 'tech_edu' | 'open_source' | 'event_organizer'
      country TEXT NOT NULL DEFAULT 'ID',
      city TEXT NOT NULL DEFAULT '',
      website_url TEXT NOT NULL DEFAULT '',
      logo_url TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved', -- 'pending' | 'under_review' | 'approved' | 'rejected'
      contact_name TEXT NOT NULL DEFAULT '',
      contact_email TEXT NOT NULL DEFAULT '',
      is_contact_public INTEGER NOT NULL DEFAULT 0,
      collaboration_categories TEXT NOT NULL DEFAULT '[]', -- JSON array
      partnership_agreement_ref TEXT NOT NULL DEFAULT '',
      verified_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS partnership_applications (
      id TEXT PRIMARY KEY,
      applicant_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      org_name TEXT NOT NULL,
      org_type TEXT NOT NULL,
      country TEXT NOT NULL,
      website_url TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      proposed_collaboration TEXT NOT NULL,
      supporting_links TEXT NOT NULL DEFAULT '[]', -- JSON array
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'under_review' | 'approved' | 'rejected'
      review_notes TEXT NOT NULL DEFAULT '',
      reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contribution_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL, -- 'docs' | 'module' | 'lab' | 'bug' | 'translation' | 'ui' | 'security' | 'research'
      difficulty TEXT NOT NULL DEFAULT 'medium', -- 'easy' | 'medium' | 'hard'
      description TEXT NOT NULL,
      requirements TEXT NOT NULL DEFAULT '[]', -- JSON array
      status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'assigned' | 'in_review' | 'completed' | 'closed'
      issue_url TEXT NOT NULL DEFAULT '',
      pr_url TEXT NOT NULL DEFAULT '',
      reward_xp INTEGER NOT NULL DEFAULT 50,
      assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS developer_api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key_name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      scopes TEXT NOT NULL DEFAULT '["read:public"]', -- JSON array
      rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
      total_requests INTEGER NOT NULL DEFAULT 0,
      last_used_at TEXT,
      is_revoked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS external_knowledge_cache (
      id TEXT PRIMARY KEY,
      source_type TEXT NOT NULL, -- 'mitre_attack' | 'nist_csf' | 'owasp_top10' | 'cve_nvd'
      reference_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
      data_payload TEXT NOT NULL DEFAULT '{}', -- JSON object
      source_attribution TEXT NOT NULL,
      cached_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL, -- 'regional' | 'topic' | 'academic' | 'research'
      region_or_language TEXT NOT NULL DEFAULT 'Global',
      description TEXT NOT NULL,
      member_count INTEGER NOT NULL DEFAULT 0,
      is_official INTEGER NOT NULL DEFAULT 1,
      lead_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS certificate_verifications (
      id TEXT PRIMARY KEY,
      certificate_id TEXT NOT NULL REFERENCES digital_certificates(id) ON DELETE CASCADE,
      verifier_ip_hash TEXT NOT NULL,
      verification_method TEXT NOT NULL DEFAULT 'web_lookup', -- 'web_lookup' | 'qr_scan' | 'api_v1'
      verified_at TEXT NOT NULL
    );

    -- Phase 8 Indexes
    CREATE INDEX IF NOT EXISTS idx_partnerships_status ON partnerships(status, org_type);
    CREATE INDEX IF NOT EXISTS idx_partnership_apps_status ON partnership_applications(status);
    CREATE INDEX IF NOT EXISTS idx_contribution_tasks_status ON contribution_tasks(status, category);
    CREATE INDEX IF NOT EXISTS idx_developer_api_keys_hash ON developer_api_keys(key_hash);
    CREATE INDEX IF NOT EXISTS idx_developer_api_keys_user ON developer_api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_ext_knowledge_src ON external_knowledge_cache(source_type, reference_id);
    CREATE INDEX IF NOT EXISTS idx_cert_verifications_cert ON certificate_verifications(certificate_id, verified_at DESC);

    -- Phase 9: Enterprise & Institutional Edition (Multi-Tenant Architecture)
    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      org_type TEXT NOT NULL DEFAULT 'university', -- 'university' | 'vocational_school' | 'high_school' | 'training_center' | 'corporate' | 'community'
      description TEXT NOT NULL DEFAULT '',
      logo_url TEXT NOT NULL DEFAULT '',
      brand_color TEXT NOT NULL DEFAULT '#00ff9d',
      welcome_message TEXT NOT NULL DEFAULT '',
      website_url TEXT NOT NULL DEFAULT '',
      contact_email TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active', -- 'pending_verification' | 'active' | 'suspended' | 'archived'
      plan_tier TEXT NOT NULL DEFAULT 'education', -- 'community' | 'education' | 'professional' | 'enterprise'
      plan_max_users INTEGER NOT NULL DEFAULT 500,
      plan_max_storage_mb INTEGER NOT NULL DEFAULT 20480,
      plan_max_lab_concurrency INTEGER NOT NULL DEFAULT 25,
      plan_ai_monthly_tokens INTEGER NOT NULL DEFAULT 2000000,
      is_verified INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS institution_departments (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      head_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS institution_members (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'student', -- 'owner' | 'admin' | 'academic_director' | 'department_admin' | 'instructor' | 'ta' | 'student' | 'trainee' | 'auditor'
      department_id TEXT REFERENCES institution_departments(id) ON DELETE SET NULL,
      student_id_number TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'invited' | 'suspended'
      joined_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(institution_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS institution_invitations (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      department_id TEXT REFERENCES institution_departments(id) ON DELETE SET NULL,
      invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      expires_at TEXT NOT NULL,
      accepted_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS institution_classes (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      department_id TEXT REFERENCES institution_departments(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      academic_term TEXT NOT NULL,
      instructor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'archived'
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS institution_class_students (
      class_id TEXT NOT NULL REFERENCES institution_classes(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      enrolled_at TEXT NOT NULL,
      PRIMARY KEY (class_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS institution_courses (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      syllabus TEXT NOT NULL DEFAULT '[]', -- JSON array of topics
      module_ids TEXT NOT NULL DEFAULT '[]', -- JSON array of module IDs
      instructor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      visibility TEXT NOT NULL DEFAULT 'class_only', -- 'class_only' | 'institution_wide' | 'public'
      status TEXT NOT NULL DEFAULT 'published', -- 'draft' | 'published' | 'archived'
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS institution_course_assignments (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES institution_courses(id) ON DELETE CASCADE,
      class_id TEXT REFERENCES institution_classes(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      instructions TEXT NOT NULL,
      due_date TEXT NOT NULL,
      max_score INTEGER NOT NULL DEFAULT 100,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS institution_submissions (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      assignment_id TEXT NOT NULL REFERENCES institution_course_assignments(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      file_url TEXT NOT NULL DEFAULT '',
      score INTEGER DEFAULT NULL,
      feedback TEXT NOT NULL DEFAULT '',
      graded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      graded_at TEXT,
      submitted_at TEXT NOT NULL,
      UNIQUE(assignment_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS institution_lab_assignments (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      class_id TEXT NOT NULL REFERENCES institution_classes(id) ON DELETE CASCADE,
      template_id TEXT NOT NULL,
      title TEXT NOT NULL,
      due_date TEXT NOT NULL,
      required_flag TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS institution_assessments (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      class_id TEXT REFERENCES institution_classes(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      time_limit_minutes INTEGER NOT NULL DEFAULT 60,
      questions TEXT NOT NULL DEFAULT '[]', -- JSON array of {id, prompt, options, answer_hash, points}
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS institution_assessment_attempts (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      assessment_id TEXT NOT NULL REFERENCES institution_assessments(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER NOT NULL DEFAULT 0,
      answers TEXT NOT NULL DEFAULT '{}', -- JSON object
      submitted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS institution_certificates (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id TEXT REFERENCES institution_courses(id) ON DELETE SET NULL,
      certificate_code TEXT NOT NULL UNIQUE,
      verification_hash TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      issuing_authority TEXT NOT NULL,
      criteria TEXT NOT NULL,
      is_revoked INTEGER NOT NULL DEFAULT 0,
      revocation_reason TEXT DEFAULT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS institution_ai_settings (
      institution_id TEXT PRIMARY KEY REFERENCES institutions(id) ON DELETE CASCADE,
      ai_enabled INTEGER NOT NULL DEFAULT 1,
      custom_system_prompt TEXT DEFAULT '',
      allowed_domains TEXT NOT NULL DEFAULT '["linux","networking","web","crypto","forensics","reverse"]',
      require_human_grade_approval INTEGER NOT NULL DEFAULT 1,
      monthly_token_usage INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS institution_audit_logs (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '{}',
      ip_address TEXT NOT NULL DEFAULT '127.0.0.1',
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS institution_sso_configs (
      institution_id TEXT PRIMARY KEY REFERENCES institutions(id) ON DELETE CASCADE,
      idp_type TEXT NOT NULL DEFAULT 'saml2', -- 'saml2' | 'oidc'
      entity_id TEXT NOT NULL DEFAULT '',
      sso_url TEXT NOT NULL DEFAULT '',
      certificate_or_secret TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    -- Phase 9 Indexes
    CREATE INDEX IF NOT EXISTS idx_inst_slug ON institutions(slug);
    CREATE INDEX IF NOT EXISTS idx_inst_status ON institutions(status, plan_tier);
    CREATE INDEX IF NOT EXISTS idx_inst_members_user ON institution_members(user_id, role);
    CREATE INDEX IF NOT EXISTS idx_inst_members_inst ON institution_members(institution_id, role);
    CREATE INDEX IF NOT EXISTS idx_inst_dept_inst ON institution_departments(institution_id);
    CREATE INDEX IF NOT EXISTS idx_inst_classes_inst ON institution_classes(institution_id, status);
    CREATE INDEX IF NOT EXISTS idx_inst_courses_inst ON institution_courses(institution_id, status);
    CREATE INDEX IF NOT EXISTS idx_inst_assignments_inst ON institution_course_assignments(institution_id, course_id);
    CREATE INDEX IF NOT EXISTS idx_inst_submissions_asg ON institution_submissions(assignment_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_inst_labs_inst ON institution_lab_assignments(institution_id, class_id);
    CREATE INDEX IF NOT EXISTS idx_inst_assessments_inst ON institution_assessments(institution_id);
    CREATE INDEX IF NOT EXISTS idx_inst_certs_inst ON institution_certificates(institution_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_inst_certs_hash ON institution_certificates(verification_hash);
    CREATE INDEX IF NOT EXISTS idx_inst_audit_inst ON institution_audit_logs(institution_id, timestamp DESC);

    -- Phase 10: Cyber Defense, Security Operations (SOC) & Incident Response
    CREATE TABLE IF NOT EXISTS soc_events (
      id TEXT PRIMARY KEY,
      institution_id TEXT REFERENCES institutions(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL,
      source_type TEXT NOT NULL, -- 'auth' | 'network' | 'web' | 'endpoint' | 'firewall' | 'dns'
      source_host TEXT NOT NULL DEFAULT '',
      destination_host TEXT NOT NULL DEFAULT '',
      protocol TEXT NOT NULL DEFAULT 'TCP',
      event_category TEXT NOT NULL, -- 'authentication_failure' | 'authentication_success' | 'port_scan' | 'injection_attempt' | 'unusual_outbound' | 'file_modification' | 'privilege_escalation' | 'policy_violation'
      severity TEXT NOT NULL DEFAULT 'low', -- 'low' | 'medium' | 'high' | 'critical'
      raw_payload TEXT NOT NULL DEFAULT '',
      parsed_details TEXT NOT NULL DEFAULT '{}', -- JSON metadata
      correlation_id TEXT,
      is_simulation INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS soc_detection_rules (
      id TEXT PRIMARY KEY,
      rule_name TEXT NOT NULL,
      category TEXT NOT NULL, -- 'authentication' | 'network' | 'web' | 'endpoint'
      severity TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
      description TEXT NOT NULL,
      mitre_technique_id TEXT NOT NULL DEFAULT '',
      mitre_tactic TEXT NOT NULL DEFAULT '',
      condition_type TEXT NOT NULL DEFAULT 'pattern_match', -- 'pattern_match' | 'threshold_frequency' | 'indicator_match'
      condition_config TEXT NOT NULL DEFAULT '{}', -- JSON configuration
      is_enabled INTEGER NOT NULL DEFAULT 1,
      is_simulation_only INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS soc_alerts (
      id TEXT PRIMARY KEY,
      institution_id TEXT REFERENCES institutions(id) ON DELETE CASCADE,
      rule_id TEXT REFERENCES soc_detection_rules(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
      status TEXT NOT NULL DEFAULT 'new', -- 'new' | 'acknowledged' | 'investigating' | 'escalated' | 'resolved' | 'closed' | 'false_positive'
      affected_asset TEXT NOT NULL DEFAULT '',
      source_event_ids TEXT NOT NULL DEFAULT '[]', -- JSON array of event IDs
      indicators TEXT NOT NULL DEFAULT '[]', -- JSON array of IPs/hashes/domains
      confidence TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high'
      assigned_analyst_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      resolution_notes TEXT NOT NULL DEFAULT '',
      is_simulation INTEGER NOT NULL DEFAULT 1,
      detected_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS soc_alert_notes (
      id TEXT PRIMARY KEY,
      alert_id TEXT NOT NULL REFERENCES soc_alerts(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      note_text TEXT NOT NULL,
      evidence_refs TEXT NOT NULL DEFAULT '[]', -- JSON array of references
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS soc_incidents (
      id TEXT PRIMARY KEY,
      institution_id TEXT REFERENCES institutions(id) ON DELETE CASCADE,
      incident_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL, -- 'account_compromise' | 'malware_infection' | 'suspicious_network' | 'data_exposure' | 'web_appsec' | 'unauthorized_access' | 'phishing' | 'policy_violation' | 'other'
      severity TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
      status TEXT NOT NULL DEFAULT 'detection', -- 'detection' | 'initial_assessment' | 'containment' | 'investigation' | 'eradication' | 'recovery' | 'validation' | 'closure' | 'post_review'
      lead_analyst_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      related_alert_ids TEXT NOT NULL DEFAULT '[]', -- JSON array
      affected_assets TEXT NOT NULL DEFAULT '[]', -- JSON array
      timeline_events TEXT NOT NULL DEFAULT '[]', -- JSON array of {timestamp, description, source}
      containment_plan TEXT NOT NULL DEFAULT '',
      eradication_plan TEXT NOT NULL DEFAULT '',
      recovery_plan TEXT NOT NULL DEFAULT '',
      lessons_learned TEXT NOT NULL DEFAULT '',
      is_simulation INTEGER NOT NULL DEFAULT 1,
      declared_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS soc_threat_indicators (
      id TEXT PRIMARY KEY,
      indicator_type TEXT NOT NULL, -- 'ip' | 'domain' | 'url' | 'file_hash' | 'email' | 'cve'
      indicator_value TEXT NOT NULL,
      source_attribution TEXT NOT NULL,
      confidence_score INTEGER NOT NULL DEFAULT 80,
      severity TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
      context_notes TEXT NOT NULL DEFAULT '',
      first_observed_at TEXT NOT NULL,
      last_observed_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS soc_forensic_cases (
      id TEXT PRIMARY KEY,
      institution_id TEXT REFERENCES institutions(id) ON DELETE CASCADE,
      case_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      lead_investigator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'in_analysis' | 'completed' | 'archived'
      evidence_inventory TEXT NOT NULL DEFAULT '[]', -- JSON array of {id, name, type, sha256, acquired_at, acquired_by, custody_log}
      findings_summary TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS soc_assets (
      id TEXT PRIMARY KEY,
      institution_id TEXT REFERENCES institutions(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      ip_address TEXT NOT NULL DEFAULT '',
      hostname TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'server', -- 'server' | 'endpoint' | 'network_gateway' | 'database' | 'cloud_instance'
      criticality TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
      environment TEXT NOT NULL DEFAULT 'lab_simulation', -- 'production' | 'staging' | 'lab_simulation'
      owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'online', -- 'online' | 'degraded' | 'isolated' | 'offline'
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS soc_vulnerabilities (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL REFERENCES soc_assets(id) ON DELETE CASCADE,
      cve_id TEXT NOT NULL,
      title TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
      cvss_score REAL NOT NULL DEFAULT 5.0,
      remediation_status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'in_progress' | 'mitigated' | 'accepted_risk' | 'closed'
      remediation_notes TEXT NOT NULL DEFAULT '',
      assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
      discovered_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS soc_playbooks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL, -- 'brute_force' | 'phishing' | 'malware' | 'web_attack' | 'dns_tunneling' | 'data_leak'
      objective TEXT NOT NULL,
      trigger_conditions TEXT NOT NULL,
      required_evidence TEXT NOT NULL DEFAULT '[]', -- JSON array
      investigation_steps TEXT NOT NULL DEFAULT '[]', -- JSON array
      containment_steps TEXT NOT NULL DEFAULT '[]', -- JSON array
      recovery_steps TEXT NOT NULL DEFAULT '[]', -- JSON array
      checklist TEXT NOT NULL DEFAULT '[]', -- JSON array
      is_official INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS soc_scenarios (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL, -- 'authentication' | 'web_security' | 'network_traffic' | 'malware_triage'
      difficulty TEXT NOT NULL DEFAULT 'intermediate', -- 'beginner' | 'intermediate' | 'advanced'
      briefing TEXT NOT NULL,
      objectives TEXT NOT NULL DEFAULT '[]', -- JSON array
      telemetry_data TEXT NOT NULL DEFAULT '[]', -- JSON array of events to inject
      expected_mitigation TEXT NOT NULL,
      scoring_criteria TEXT NOT NULL DEFAULT '{}', -- JSON string
      created_at TEXT NOT NULL
    );

    -- Phase 10 Indexes
    CREATE INDEX IF NOT EXISTS idx_soc_events_time ON soc_events(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_soc_events_source ON soc_events(source_type, severity);
    CREATE INDEX IF NOT EXISTS idx_soc_events_inst ON soc_events(institution_id);
    CREATE INDEX IF NOT EXISTS idx_soc_alerts_status ON soc_alerts(status, severity);
    CREATE INDEX IF NOT EXISTS idx_soc_alerts_inst ON soc_alerts(institution_id);
    CREATE INDEX IF NOT EXISTS idx_soc_incidents_status ON soc_incidents(status, severity);
    CREATE INDEX IF NOT EXISTS idx_soc_ioc_type_val ON soc_threat_indicators(indicator_type, indicator_value);
    CREATE INDEX IF NOT EXISTS idx_soc_forensics_case ON soc_forensic_cases(case_number);
    CREATE INDEX IF NOT EXISTS idx_soc_assets_cat ON soc_assets(category, status);
    CREATE INDEX IF NOT EXISTS idx_soc_vuln_asset ON soc_vulnerabilities(asset_id, remediation_status);
  `);

  // Safe migrations for Phase 8 user attributes
  try { db.exec("ALTER TABLE users ADD COLUMN preferred_language TEXT NOT NULL DEFAULT 'id';"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN preferred_timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta';"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN github_username TEXT NOT NULL DEFAULT '';"); } catch {}
}

function seedInitialData(db: DatabaseSync) {
  // 1. Seed Achievements
  const achievements = [
    { code: "first-steps", title: "First Steps", desc: "Daftar dan buat akun pertama Anda di platform CyberLab-ID.", icon: "Sparkles", cat: "general", xp: 15 },
    { code: "linux-explorer", title: "Linux Explorer", desc: "Pelajari materi administrasi dan navigasi sistem operasi Linux.", icon: "Terminal", cat: "linux", xp: 30 },
    { code: "network-analyst", title: "Network Analyst", desc: "Selesaikan praktikum analisis paket jaringan dan topologi TCP/IP.", icon: "Network", cat: "network", xp: 35 },
    { code: "cryptographer", title: "Master Cryptographer", desc: "Pecahkan tantangan cipher klasik dan modern stream encoding.", icon: "KeyRound", cat: "crypto", xp: 40 },
    { code: "digital-detective", title: "Digital Detective", desc: "Rekonstruksi berkas rusak menggunakan inspeksi Magic Bytes.", icon: "Binary", cat: "forensics", xp: 35 },
    { code: "web-defender", title: "Web App Defender", desc: "Identifikasi kerentanan OWASP Top 10 (SQLi / XSS) pada sandbox.", icon: "Globe", cat: "web", xp: 40 },
    { code: "ctf-rookie", title: "CTF Rookie", desc: "Berhasil menyelesaikan submission flag CTF pertama Anda di platform.", icon: "Flag", cat: "ctf", xp: 50 },
    { code: "ctf-specialist", title: "CTF Specialist", desc: "Selesaikan minimal 5 tantangan Jeopardy CTF dari berbagai kategori.", icon: "Trophy", cat: "ctf", xp: 100 },
  ];

  const checkAch = db.prepare("SELECT count(*) as count FROM achievements").get() as { count: number };
  if (checkAch.count === 0) {
    const insertAch = db.prepare(`
      INSERT INTO achievements (id, code, title, description, icon, category, xp_reward)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const a of achievements) {
      insertAch.run(`ach_${a.code}`, a.code, a.title, a.desc, a.icon, a.cat, a.xp);
    }
  }

  // 2. Seed Admin & Test Users
  const checkUser = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
  if (checkUser.count === 0) {
    const now = new Date().toISOString();
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, email, password_hash, salt, display_name, avatar, bio, role, status, total_xp, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Admin user: password = "CyberLabAdmin2026!"
    const adminSalt = crypto.randomBytes(16).toString("hex");
    const adminHash = hashPassword("CyberLabAdmin2026!", adminSalt);
    insertUser.run(
      "usr_admin",
      "admin",
      "admin@cyberlab.id",
      adminHash,
      adminSalt,
      "CyberLab Administrator",
      "Shield",
      "Lead Security Engineer & System Administrator di CyberLab-ID.",
      "admin",
      "active",
      500,
      now,
      now
    );

    // Test user: password = "CyberLabUser2026!"
    const userSalt = crypto.randomBytes(16).toString("hex");
    const userHash = hashPassword("CyberLabUser2026!", userSalt);
    insertUser.run(
      "usr_budi",
      "budi_hacker",
      "budi@cyberlab.id",
      userHash,
      userSalt,
      "Budi Santoso",
      "Terminal",
      "Siswa SMK TKJ & CTF Enthusiast. Suka belajar binary exploitation dan reverse engineering.",
      "user",
      "active",
      165,
      now,
      now
    );

    // Moderator user: password = "CyberLabMod2026!"
    const modSalt = crypto.randomBytes(16).toString("hex");
    const modHash = hashPassword("CyberLabMod2026!", modSalt);
    insertUser.run(
      "usr_citra",
      "citra_sec",
      "citra@cyberlab.id",
      modHash,
      modSalt,
      "Citra Wahyuni",
      "Globe",
      "Cybersecurity Researcher & Komunitas Moderator. Fokus pada Web App Security & OWASP.",
      "moderator",
      "active",
      320,
      now,
      now
    );
  }

  // 3. Seed CTF Challenges (Server-side hashed flags - NEVER expose plain flags!)
  const checkCtf = db.prepare("SELECT count(*) as count FROM ctf_challenges").get() as { count: number };
  if (checkCtf.count === 0) {
    const now = new Date().toISOString();
    const insertCtf = db.prepare(`
      INSERT INTO ctf_challenges (id, title, description, category, difficulty, points, flag_hash, hint, instructions, is_published, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const challenges = [
      {
        id: "caesar-salat",
        title: "Caesar Says Hello",
        desc: "Julius Caesar mengirimkan ciphertext rahasia: 'Fdhvdu flskhu lv ixq'. Pecahkan pesan asli dan serahkan flag-nya dalam format CYBERLAB{...}!",
        category: "Cryptography",
        difficulty: "Beginner",
        points: 25,
        flag: "CYBERLAB{Caesar cipher is fun}",
        hint: "Gunakan Caesar Cipher shift mundur 3 langkah atau uji di Cipher Toolkit.",
        instructions: "Gunakan fitur Brute Force di menu Tools > Cipher Toolkit untuk melihat 25 rotasi alfabet sekaligus.",
      },
      {
        id: "base64-mystery",
        title: "Base64 Encoding Basics",
        desc: "Seorang sysadmin mencurigai string berikut di file konfigurasi: 'Q3liZXJMYWItSUQ='. Temukan string teks aslinya dan bungkus dalam format CYBERLAB{...}!",
        category: "Cryptography",
        difficulty: "Beginner",
        points: 25,
        flag: "CYBERLAB{CyberLab-ID}",
        hint: "Ingat Base64 menggunakan karakter padding '=' dan merupakan encoding biner-ke-teks.",
        instructions: "Jalankan decoding Base64 di Cipher Toolkit atau via command line 'echo ... | base64 -d'.",
      },
      {
        id: "hash-collision-quiz",
        title: "MD5 Integrity Verification",
        desc: "Sebuah program mendeteksi berkas dengan checksum MD5 'a59f94ef98caeb4cac0c900c2fa730a6'. Kata kunci apa yang menghasilkan hash tersebut? Submit CYBERLAB{kata_kunci}.",
        category: "Cryptography",
        difficulty: "Beginner",
        points: 30,
        flag: "CYBERLAB{cyberlab}",
        hint: "Gunakan Hash Inspector untuk menguji string sederhana terkait nama platform ini.",
        instructions: "Hash MD5 dari kata kunci terdiri dari 8 karakter huruf kecil.",
      },
      {
        id: "subnet-sleuth-ctf",
        title: "Subnet Host Range Sleuth",
        desc: "Sebuah router memiliki interface 192.168.1.100 dengan netmask /24. Berapakah alamat broadcast resmi untuk jaringan tersebut? Format flag: CYBERLAB{broadcast_ip}.",
        category: "Networking",
        difficulty: "Beginner",
        points: 35,
        flag: "CYBERLAB{192.168.1.255}",
        hint: "Hitung host bits subnet /24 menggunakan Subnet Calculator.",
        instructions: "Subnetting /24 menyisakan 8 bit host, di mana seluruh bit host bernilai 1 adalah Broadcast Address.",
      },
      {
        id: "sqli-auth-bypass",
        title: "SQL Injection Authentication Bypass",
        desc: "Pada modul Web Security Lab, ditemukan celah query dinamis string concatenation. Input klasik apa yang membuat kondisi WHERE selalu bernilai True? Format: CYBERLAB{' OR '1'='1}",
        category: "Web Exploitation",
        difficulty: "Intermediate",
        points: 50,
        flag: "CYBERLAB{' OR '1'='1}",
        hint: "Lihat demonstrasi di Web Vulnerability Lab.",
        instructions: "Celah SQLi tipe Boolean-based Auth Bypass.",
      },
      {
        id: "png-magic-repair",
        title: "File Header Carving Quest",
        desc: "Berkas PNG bukti digital dirusak 4 byte awalnya. Berapakah nilai 4-byte Magic Bytes resmi PNG dalam hex standar tanpa spasi huruf besar? Format: CYBERLAB{89504E47}.",
        category: "Digital Forensics",
        difficulty: "Intermediate",
        points: 50,
        flag: "CYBERLAB{89504E47}",
        hint: "Periksa tabel Magic Bytes pada File Signature Checker.",
        instructions: "Header PNG standar adalah: 89 50 4E 47 (ASCII: .PNG).",
      },
      {
        id: "x86-crackme-bypass",
        title: "x86 Crackme Logic Bypass",
        desc: "Pada Reverse Engineering Lab, serial key dihitung dengan persamaan (Input XOR 0x5A) == 0x1337. Berapakah angka desimal Serial Key yang sah? Format: CYBERLAB{4867}.",
        category: "Reverse Engineering",
        difficulty: "Intermediate",
        points: 60,
        flag: "CYBERLAB{4867}",
        hint: "Hitung aljabar XOR: 0x1337 ^ 0x5A = 4919 ^ 90.",
        instructions: "Gunakan CPU Stepper & Keygen Test pada Reverse Engineering Lab.",
      },
      {
        id: "linux-privilege-audit",
        title: "Linux SUID Discovery Command",
        desc: "Perintah standar Linux apa yang digunakan sysadmin untuk mencari semua file SUID root di root filesystem? Format: CYBERLAB{find / -perm -4000 -type f}.",
        category: "Linux",
        difficulty: "Intermediate",
        points: 40,
        flag: "CYBERLAB{find / -perm -4000 -type f}",
        hint: "Perintah 'find' dengan parameter permission octal 4000.",
        instructions: "SUID bit direpresentasikan dengan nilai oktal 4xxx.",
      },
      {
        id: "multi-stage-flag-hunt",
        title: "Multi-Stage Cipher Reconstruction",
        desc: "Dapatkan flag rahasia yang tersembunyi di dalam Lab 4 (Multi-Stage Decoding Workbench). Flag diawali dengan CYBERLAB{...",
        category: "Miscellaneous",
        difficulty: "Advanced",
        points: 75,
        flag: "CYBERLAB{x0r_str34m_c1ph3r_unl0ck3d}",
        hint: "Selesaikan praktikum di Crypto Challenges Lab.",
        instructions: "Lakukan Base64 decode lalu brute force XOR single-byte 0x00 - 0xFF.",
      },
    ];

    for (const c of challenges) {
      insertCtf.run(
        c.id,
        c.title,
        c.desc,
        c.category,
        c.difficulty,
        c.points,
        hashString(c.flag),
        c.hint,
        c.instructions,
        now
      );
    }
  }

  // 4. Seed Community Discussions
  const checkPosts = db.prepare("SELECT count(*) as count FROM community_posts").get() as { count: number };
  if (checkPosts.count === 0) {
    const now = new Date().toISOString();
    const insertPost = db.prepare(`
      INSERT INTO community_posts (id, user_id, title, content, category, likes_count, comments_count, is_pinned, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPost.run(
      "post_welcome",
      "usr_admin",
      "Selamat Datang di Forum Komunitas CyberLab-ID!",
      "Halo teman-teman praktisi, siswa SMK TKJ/RPL, mahasiswa TI, dan antusias keamanan digital! Forum ini adalah wadah diskusi terbuka seputar pembelajaran cybersecurity, pemecahan tantangan CTF, studi kasus insiden keamanan, dan persiapan karier di bidang pertahanan siber. Mari saling berbagi ilmu dan menjaga etika profesionalisme digital.",
      "General Discussion",
      12,
      2,
      1,
      now,
      now
    );

    insertPost.run(
      "post_wireshark_tips",
      "usr_budi",
      "Tips Memfilter Paket HTTP Kredensial di Wireshark",
      "Bagi yang sedang mengerjakan Lab Network Packet Analysis, filter Wireshark yang sangat membantu mencari form login plain text adalah: 'http.request.method == \"POST\" && (http contains \"password\" || http contains \"user\")'. Sangat efektif untuk mengisolasi paket autentikasi tanpa harus membaca ribuan frame manual!",
      "Networking",
      8,
      1,
      0,
      now,
      now
    );

    insertPost.run(
      "post_sqli_prepared",
      "usr_citra",
      "Mengapa Parameterized Query Sepenuhnya Menutup SQL Injection?",
      "Sering kali pemula bertanya kenapa sanitasi karakter seperti ' atau -- saja belum cukup. Dengan parameterized query (Prepared Statements), mesin database mengkompilasi struktur AST (Abstract Syntax Tree) SQL terlebih dahulu, kemudian menganggap nilai input pengguna murni sebagai data literal tanpa interpretasi perintah. Sehingga meskipun input mengandung \"' OR '1'='1\", query tetap aman 100%.",
      "Web Security",
      15,
      3,
      0,
      now,
      now
    );

    // Comments for post_welcome
    const insertComment = db.prepare(`
      INSERT INTO community_comments (id, post_id, user_id, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertComment.run(
      "comm_1",
      "post_welcome",
      "usr_budi",
      "Senang sekali ada platform edukasi cybersecurity asli Indonesia yang gratis dan materi praktiknya berkualitas tinggi!",
      now,
      now
    );

    insertComment.run(
      "comm_2",
      "post_welcome",
      "usr_citra",
      "Salam kenal semuanya! Jangan ragu bertanya di kanal Web Security jika butuh bantuan memahami konsep OWASP ya.",
      now,
      now
    );
  }

  // 5. Seed Phase 4 Achievements
  const phase4Achievements = [
    { code: "range-commander", title: "Range Commander", desc: "Selesaikan minimal 3 praktikum lingkungan Cyber Range terisolasi.", icon: "Shield", cat: "general", xp: 100 },
    { code: "network-architect", title: "Network Architect", desc: "Selesaikan praktikum topologi dan konfigurasi routing jaringan di Cyber Range.", icon: "Network", cat: "network", xp: 60 },
    { code: "appsec-breaker", title: "AppSec Breaker", desc: "Eksploitasi dan remediasi kerentanan OWASP Web Range secara aman.", icon: "Globe", cat: "web", xp: 60 },
    { code: "forensics-investigator", title: "Forensic Investigator", desc: "Analisis dan pulihkan barang bukti digital pada lab forensik disk.", icon: "Binary", cat: "forensics", xp: 60 },
    { code: "binary-analyst", title: "Binary Analyst", desc: "Selesaikan analisis aliran kontrol dan disassembly pada lab Reverse Engineering.", icon: "Cpu", cat: "reverse", xp: 60 },
  ];

  const insertAch = db.prepare(`
    INSERT OR IGNORE INTO achievements (id, code, title, description, icon, category, xp_reward)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of phase4Achievements) {
    insertAch.run(`ach_${a.code}`, a.code, a.title, a.desc, a.icon, a.cat, a.xp);
  }

  // 6. Seed Official Lab Templates
  const checkTemplates = db.prepare("SELECT count(*) as count FROM lab_templates").get() as { count: number };
  if (checkTemplates.count === 0) {
    const now = new Date().toISOString();
    const insertTemplate = db.prepare(`
      INSERT INTO lab_templates (
        id, title, description, category, difficulty, duration_minutes, xp_reward,
        cpu_limit, memory_limit, storage_limit, image_name, instructions,
        verification_criteria, is_published, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, '1.0.0', ?, ?)
    `);

    const templates = [
      {
        id: "tpl-linux-core",
        title: "Linux Command Line & Privilege Audit Lab",
        description: "Lingkungan terminal Linux interaktif untuk menguji navigasi direktori, audit izin berkas chmod/chown, pelacakan proses aktif (ps/top), dan identifikasi file SUID berbahaya.",
        category: "Linux",
        difficulty: "Beginner",
        duration: 60,
        xp: 60,
        cpu: "0.5 core",
        memory: "256 MB",
        storage: "512 MB",
        image: "cyberlab/linux-base:1.0",
        instructions: "1. Jalankan `pwd` dan `ls -la` untuk meninjau struktur direktori.\n2. Temukan file rahasia di dalam direktori `/opt/secret`.\n3. Periksa izin akses file tersebut dan ubah menjadi 600 menggunakan `chmod`.\n4. Jalankan perintah `find / -perm -4000 2>/dev/null` untuk mengaudit SUID binary.",
        criteria: JSON.stringify({
          checkpoints: [
            { id: "chk_ls", description: "Inspeksi direktori /opt/secret", command_trigger: "ls /opt/secret" },
            { id: "chk_chmod", description: "Perketat izin berkas ke 600", command_trigger: "chmod 600 /opt/secret/creds.txt" },
            { id: "chk_suid", description: "Audit berkas berizin SUID", command_trigger: "find / -perm -4000" }
          ],
          completion_token: "RANGE{linux_privilege_audit_completed}"
        }),
      },
      {
        id: "tpl-net-topo",
        title: "Network Topology & Packet Routing Simulation",
        description: "Laboratorium simulasi topologi jaringan multi-node (Client, Router Gateway, DNS Server, Web Server). Konfigurasi addressing IPv4, Subnet Mask, Gateway, dan analisis alur paket ICMP/TCP.",
        category: "Networking",
        difficulty: "Intermediate",
        duration: 60,
        xp: 75,
        cpu: "0.5 core",
        memory: "256 MB",
        storage: "256 MB",
        image: "cyberlab/net-sim:1.0",
        instructions: "1. Konfigurasikan IP Client Host ke 192.168.1.15/24 dengan Gateway 192.168.1.1.\n2. Tambahkan rute statis pada Router menuju subnet Server 10.0.0.0/24.\n3. Uji konektivitas hop-by-hop menggunakan simulasi ping dan inspeksi alur paket.",
        criteria: JSON.stringify({
          checkpoints: [
            { id: "chk_ip", description: "Konfigurasi antarmuka eth0 client" },
            { id: "chk_gw", description: "Tetapkan default gateway router" },
            { id: "chk_ping", description: "Verifikasi alur paket ICMP end-to-end" }
          ],
          completion_token: "RANGE{network_routing_end_to_end_verified}"
        }),
      },
      {
        id: "tpl-web-owasp",
        title: "Web Security Range: OWASP Top 10 Sandbox",
        description: "Aplikasi web sintetis yang rentan secara terisolasi untuk mempraktikkan SQL Injection (Boolean Auth Bypass), Cross-Site Scripting (XSS PoC), dan Path Traversal dengan komparasi patch aman.",
        category: "Web Security",
        difficulty: "Intermediate",
        duration: 75,
        xp: 80,
        cpu: "1.0 core",
        memory: "512 MB",
        storage: "512 MB",
        image: "cyberlab/web-vuln:1.0",
        instructions: "1. Buka antarmuka aplikasi web target pada port sandbox.\n2. Uji payload SQL Injection `' OR '1'='1` pada login form.\n3. Masukkan payload XSS `<script>alert('CYBERLAB')</script>` pada kolom ulasan tamu.\n4. Amati respons sistem dan analisis kode remediasi pertahanan.",
        criteria: JSON.stringify({
          checkpoints: [
            { id: "chk_sqli", description: "Eksploitasi celah autentikasi SQLi" },
            { id: "chk_xss", description: "Deteksi refleksi payload script XSS" },
            { id: "chk_traversal", description: "Uji batasan path traversal ../" }
          ],
          completion_token: "RANGE{appsec_owasp_remediation_mastered}"
        }),
      },
      {
        id: "tpl-forensics-disk",
        title: "Digital Forensics: Evidence Carving & Timeline Lab",
        description: "Investigasi digital terhadap image berkas barang bukti. Lakukan ekstraksi metadata EXIF, identifikasi anomali ekstensi berkas palsu, dan rekonstruksi timeline log insiden.",
        category: "Digital Forensics",
        difficulty: "Intermediate",
        duration: 60,
        xp: 70,
        cpu: "0.5 core",
        memory: "512 MB",
        storage: "1 GB",
        image: "cyberlab/forensics-suite:1.0",
        instructions: "1. Verifikasi nilai hash SHA-256 berkas bukti untuk menjamin Chain of Custody.\n2. Gunakan Hex Inspector untuk mendeteksi berkas biner PE/EXE yang disamarkan sebagai PDF.\n3. Susun urutan kronologis kejadian berdasarkan entri access.log server web.",
        criteria: JSON.stringify({
          checkpoints: [
            { id: "chk_hash", description: "Verifikasi hash integritas barang bukti" },
            { id: "chk_magic", description: "Identifikasi magic bytes file tersamar" },
            { id: "chk_log", description: "Saring entri log akses serangan" }
          ],
          completion_token: "RANGE{forensic_chain_of_custody_intact}"
        }),
      },
      {
        id: "tpl-reverse-x86",
        title: "Reverse Engineering: x86 Binary Disassembly Lab",
        description: "Analisis berkas binary ELF/PE compiled. Lacak instruksi assembly x86_64, evaluasi alur percabangan kondisional (CMP / JE / JNE), dan pahami mekanisme proteksi software crackme.",
        category: "Reverse Engineering",
        difficulty: "Advanced",
        duration: 90,
        xp: 90,
        cpu: "0.5 core",
        memory: "512 MB",
        storage: "512 MB",
        image: "cyberlab/reverse-lab:1.0",
        instructions: "1. Ekstrak string teks menggunakan fitur String Inspector.\n2. Lacak register CPU EAX dan Zero Flag (ZF) pada simulator instruksi.\n3. Hitung serial kunci matematis atau lakukan byte patch opcode lompatan percabangan.",
        criteria: JSON.stringify({
          checkpoints: [
            { id: "chk_strings", description: "Ekstraksi string dan simbol biner" },
            { id: "chk_registers", description: "Pelacakan alur register CPU x86" },
            { id: "chk_patch", description: "Bypass validasi serial crackme" }
          ],
          completion_token: "RANGE{x86_reverse_binary_disassembly_solved}"
        }),
      },
    ];

    for (const t of templates) {
      insertTemplate.run(
        t.id, t.title, t.description, t.category, t.difficulty, t.duration, t.xp,
        t.cpu, t.memory, t.storage, t.image, t.instructions, t.criteria, now, now
      );
    }
  }

  // 7. Seed Phase 6 Achievements
  const phase6Achievements = [
    { code: "academy-graduate", title: "Academy Graduate", desc: "Selesaikan minimal 1 learning path di CyberLab Academy.", icon: "GraduationCap", cat: "academy", xp: 100 },
    { code: "verified-scholar", title: "Verified Scholar", desc: "Dapatkan sertifikat internal kelulusan CyberLab-ID terverifikasi.", icon: "Award", cat: "academy", xp: 75 },
    { code: "arena-gladiator", title: "Arena Gladiator", desc: "Berpartisipasi dalam kompetisi CTF Arena individu atau tim.", icon: "Swords", cat: "ctf", xp: 60 },
    { code: "team-captain", title: "Team Captain", desc: "Bentuk dan pimpin tim kompetisi CTF di CyberLab Arena.", icon: "Users", cat: "ctf", xp: 50 },
    { code: "community-contributor", title: "Community Contributor", desc: "Ajukan kontribusi materi/lab/tools yang disetujui di Contributor Hub.", icon: "GitPullRequest", cat: "general", xp: 80 },
    { code: "security-researcher", title: "Security Researcher", desc: "Publikasikan artikel penelitian teknis di Research Hub.", icon: "BookOpen", cat: "general", xp: 90 },
    { code: "trusted-mentor", title: "Trusted Mentor", desc: "Terdaftar sebagai mentor terverifikasi di CyberLab-ID.", icon: "HeartHandshake", cat: "general", xp: 70 },
    { code: "event-attendee", title: "Event Attendee", desc: "Daftar dan ikuti workshop/webinar komunitas.", icon: "Calendar", cat: "general", xp: 40 },
  ];

  const insertPhase6Ach = db.prepare(`
    INSERT OR IGNORE INTO achievements (id, code, title, description, icon, category, xp_reward)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of phase6Achievements) {
    insertPhase6Ach.run(`ach_${a.code}`, a.code, a.title, a.desc, a.icon, a.cat, a.xp);
  }

  // Phase 7 Achievements
  const phase7Achievements = [
    { code: "ai-scholar", title: "AI Learning Scholar", desc: "Selesaikan sesi interaktif dengan AI Learning Assistant untuk memperdalam pemahaman siber.", icon: "Bot", cat: "ai", xp: 35 },
    { code: "defensive-analyst", title: "Defensive Security Analyst", desc: "Lakukan analisis log sistem atau malware menggunakan AI Security Analysis Center.", icon: "ShieldAlert", cat: "defense", xp: 45 },
    { code: "pcap-investigator", title: "Traffic Forensics Investigator", desc: "Ekstrak dan analisis lalu lintas jaringan PCAP dengan Network Traffic Analyzer.", icon: "Network", cat: "defense", xp: 40 },
    { code: "quiz-champion", title: "Adaptive Quiz Champion", desc: "Selesaikan latihan kuis terpersonalisasi yang dihasilkan oleh AI Quiz Generator.", icon: "Sparkles", cat: "ai", xp: 30 },
  ];
  for (const a of phase7Achievements) {
    insertPhase6Ach.run(`ach_${a.code}`, a.code, a.title, a.desc, a.icon, a.cat, a.xp);
  }

  // Phase 8 Achievements
  const phase8Achievements = [
    { code: "global-collaborator", title: "Global Collaborator", desc: "Terhubung dan berpartisipasi dalam program kemitraan akademik & komunitas siber internasional.", icon: "Globe", cat: "community", xp: 40 },
    { code: "open-source-hero", title: "Open Source Contributor Hero", desc: "Selesaikan tugas kontribusi repositori, lokalisasi, atau modul praktikum open-source.", icon: "GitPullRequest", cat: "opensource", xp: 50 },
    { code: "api-architect", title: "Public API Developer", desc: "Buat Developer API Key dan bangun integrasi otomatisasi dengan Public API CyberLab-ID v1.", icon: "Code", cat: "developer", xp: 30 },
    { code: "threat-intel-analyst", title: "Threat Intel Investigator", desc: "Jelajahi matriks taktik MITRE ATT&CK, NIST CSF, dan intelijen kerentanan CVE pada Knowledge Explorer.", icon: "Compass", cat: "research", xp: 35 },
  ];
  for (const a of phase8Achievements) {
    insertPhase6Ach.run(`ach_${a.code}`, a.code, a.title, a.desc, a.icon, a.cat, a.xp);
  }

  // 8. Seed 10 Academy Learning Paths
  const checkAcademyPaths = db.prepare("SELECT count(*) as count FROM academy_paths").get() as { count: number };
  if (checkAcademyPaths.count === 0) {
    const now = new Date().toISOString();
    const insertPath = db.prepare(`
      INSERT INTO academy_paths (
        id, title, description, target_audience, prerequisites, learning_objectives,
        difficulty, estimated_hours, category, modules_list, completion_xp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const paths = [
      {
        id: "path-cyber-basics",
        title: "Cybersecurity Fundamentals",
        description: "Fondasi esensial keamanan siber modern: prinsip CIA Triad, vektor ancaman digital, kebersihan siber, dan pengenalan regulasi privasi data.",
        target_audience: "Pelajar SMK, mahasiswa baru, dan pemula tanpa latar belakang teknis.",
        prerequisites: "Pengoperasian komputer dasar & pemahaman internet umum.",
        learning_objectives: "1. Memahami prinsip Confidentiality, Integrity, Availability.\n2. Mengidentifikasi teknik rekayasa sosial dan phishing.\n3. Mengoperasikan alat analisis hash dan proteksi password.",
        difficulty: "Beginner",
        estimated_hours: 15,
        category: "Fundamentals",
        modules_list: JSON.stringify([
          { type: "lesson", id: "linux-fundamentals", title: "Linux Basics & Shell" },
          { type: "tool", id: "hash-inspector", title: "Hash Integrity Inspector" },
          { type: "tool", id: "password-analyzer", title: "Password Entropy Analysis" },
          { type: "ctf", id: "ctf_caesar", title: "Challenge: Classic Caesar Decryption" },
        ]),
        completion_xp: 150,
      },
      {
        id: "path-linux-admin",
        title: "Linux & System Administration",
        description: "Penguasaan administrasi sistem operasi Linux: manajemen izin chmod/chown, audit berkas SUID, otomasi bash script, dan pengerasan sistem (hardening).",
        target_audience: "Calon Administrator Sistem, DevOps engineer, dan Security Analyst.",
        prerequisites: "Pemahaman dasar command line.",
        learning_objectives: "1. Mengelola izin hak akses pengguna dan grup.\n2. Melakukan audit berkas SUID berbahaya pada Cyber Range.\n3. Menulis skrip automasi pemantauan log Linux.",
        difficulty: "Beginner",
        estimated_hours: 20,
        category: "System Administration",
        modules_list: JSON.stringify([
          { type: "lesson", id: "linux-command-line", title: "Linux Command Line Mastery" },
          { type: "lesson", id: "file-permissions", title: "File Permissions & Hardening" },
          { type: "lab", id: "tpl-linux-core", title: "Range Lab: Linux Privilege Audit" },
        ]),
        completion_xp: 160,
      },
      {
        id: "path-networking",
        title: "Networking & Packet Routing",
        description: "Arsitektur jaringan TCP/IP, protokol DNS/DHCP, subnetting IPv4/CIDR, packet sniffing, firewall stateful, dan analisis lalu lintas data.",
        target_audience: "Siswa SMK TKJ, mahasiswa jaringan komputer, dan praktisi IT Support.",
        prerequisites: "Konsep dasar komputer dan biner sederhana.",
        learning_objectives: "1. Mengkalkulasi alokasi subnet CIDR dan gateway.\n2. Menganalisis alur paket DNS dan HTTP pada simulator jaringan.\n3. Mengkonfigurasi tabel routing antar subnet.",
        difficulty: "Intermediate",
        estimated_hours: 22,
        category: "Networking",
        modules_list: JSON.stringify([
          { type: "lesson", id: "osi-tcpip-model", title: "OSI & TCP/IP Reference Model" },
          { type: "tool", id: "subnet-calculator", title: "IPv4 Subnet & Host Calculator" },
          { type: "lab", id: "tpl-net-topo", title: "Range Lab: Network Topology & Routing" },
          { type: "ctf", id: "ctf_net_dns", title: "Challenge: Network DNS Forensics" },
        ]),
        completion_xp: 180,
      },
      {
        id: "path-web-appsec",
        title: "Web Application Security (OWASP Top 10)",
        description: "Eksploitasi dan remediasi kerentanan aplikasi web: SQL Injection, Cross-Site Scripting (XSS), CSRF, Directory Traversal, dan implementasi Parameterized Queries.",
        target_audience: "Full-Stack Web Developers, QA Engineers, dan Web Penetration Testers.",
        prerequisites: "Dasar HTML, JavaScript, dan sintaks SQL dasar.",
        learning_objectives: "1. Menemukan celah injeksi SQL pada input formulir.\n2. Melakukan mitigasi XSS melalui encoding kontekstual.\n3. Mengamankan endpoint API dengan parameterization AST.",
        difficulty: "Intermediate",
        estimated_hours: 25,
        category: "Web Security",
        modules_list: JSON.stringify([
          { type: "lesson", id: "sql-injection", title: "SQL Injection Vectors & AST Mitigation" },
          { type: "lesson", id: "cross-site-scripting", title: "XSS Stored, Reflected, & DOM" },
          { type: "lab", id: "tpl-web-owasp", title: "Range Lab: OWASP Web Sandbox" },
          { type: "ctf", id: "ctf_sqli_login", title: "Challenge: Auth Bypass SQLi" },
        ]),
        completion_xp: 200,
      },
      {
        id: "path-cryptography",
        title: "Applied Cryptography & Modern Ciphers",
        description: "Prinsip enkripsi simetris (AES), asimetris (RSA, ECC), hashing kriptografis SHA-2/3, digital signatures, dan analisis cipher klasik.",
        target_audience: "Software Engineers, Cryptography Enthusiasts, dan CTF Crypto Players.",
        prerequisites: "Aritmatika modular dasar dan representasi hex/biner.",
        learning_objectives: "1. Membedakan hashing, encoding, dan enkripsi.\n2. Memecahkan cipher klasik via analisis frekuensi.\n3. Memahami validasi public key dan sertifikat digital.",
        difficulty: "Intermediate",
        estimated_hours: 18,
        category: "Cryptography",
        modules_list: JSON.stringify([
          { type: "tool", id: "cipher-toolkit", title: "Interactive Cipher & XOR Toolkit" },
          { type: "ctf", id: "ctf_vigenere", title: "Challenge: Vigenere Cryptanalysis" },
          { type: "ctf", id: "ctf_rsa_weak", title: "Challenge: RSA Small Prime Factoring" },
        ]),
        completion_xp: 170,
      },
      {
        id: "path-digital-forensics",
        title: "Digital Forensics & Incident Response (DFIR)",
        description: "Teknik investigasi bukti digital: preservasi Chain of Custody, verifikasi hash bukti, deteksi magic bytes extension spoofing, dan rekonstruksi timeline insiden log.",
        target_audience: "Incident Responders, Forensics Investigators, dan SOC Analysts.",
        prerequisites: "Pemahaman struktur file dan sistem operasi.",
        learning_objectives: "1. Menjaga integritas barang bukti via hash SHA-256.\n2. Mengidentifikasi berkas executable terselubung.\n3. Menyusun kronologi serangan berdasarkan web server access logs.",
        difficulty: "Intermediate",
        estimated_hours: 24,
        category: "Digital Forensics",
        modules_list: JSON.stringify([
          { type: "tool", id: "file-signature-checker", title: "Hex Magic Bytes File Analyzer" },
          { type: "tool", id: "metadata-inspector", title: "EXIF & Document Metadata Inspector" },
          { type: "lab", id: "tpl-forensics-disk", title: "Range Lab: Evidence Carving & Timeline" },
        ]),
        completion_xp: 190,
      },
      {
        id: "path-reverse-engineering",
        title: "Reverse Engineering & Binary Analysis",
        description: "Dekomposisi berkas biner ELF dan PE: instruksi assembly x86_64, pelacakan alur register CPU (EAX, ZF), analisis crackme, dan penambalan byte opcode percabangan.",
        target_audience: "Malware Analysts, Exploit Developers, dan Reverse Engineers.",
        prerequisites: "Dasar bahasa C/C++ dan konsep arsitektur komputer.",
        learning_objectives: "1. Mengekstrak string teks tersembunyi dari binary terkompilasi.\n2. Menelusuri alur eksekusi logika percabangan kondisional assembly.\n3. Melakukan patching instruksi JNZ/JE untuk mem-bypass serial check.",
        difficulty: "Advanced",
        estimated_hours: 30,
        category: "Reverse Engineering",
        modules_list: JSON.stringify([
          { type: "lab", id: "tpl-reverse-x86", title: "Range Lab: x86 Binary Disassembly" },
          { type: "ctf", id: "ctf_patch_me", title: "Challenge: Crackme Binary Patch" },
        ]),
        completion_xp: 250,
      },
      {
        id: "path-secops",
        title: "Security Operations & Threat Hunting",
        description: "Operasional pusat komando keamanan (SOC): pemantauan log telemetri terpusat, korelasi indikator kompromi (IoC), deteksi anomali, dan pembuatan playbook insiden.",
        target_audience: "Tier 1/2 SOC Analysts dan Security Engineers.",
        prerequisites: "Jaringan dasar & navigasi Linux.",
        learning_objectives: "1. Menganalisis log audit insiden secara real-time.\n2. Mengidentifikasi pola serangan brute-force dan scanning.\n3. Menyusun rekomendasi remediasi insiden keamanan siber.",
        difficulty: "Intermediate",
        estimated_hours: 20,
        category: "Operations",
        modules_list: JSON.stringify([
          { type: "lesson", id: "security-headers", title: "Defense-in-Depth & Security Headers" },
          { type: "lab", id: "tpl-forensics-disk", title: "Range Lab: Log Correlation Analysis" },
        ]),
        completion_xp: 180,
      },
      {
        id: "path-defensive-sec",
        title: "Defensive Security & Infrastructure Hardening",
        description: "Strategi pertahanan siber menyeluruh: konfigurasi firewall deny-by-default, isolasi kontainer OCI, kebijakan egress NetworkPolicy, dan manajemen secret aman.",
        target_audience: "DevSecOps Engineers, Cloud Architects, dan System Administrators.",
        prerequisites: "Administrasi Linux dan konsep container Docker.",
        learning_objectives: "1. Mengkonfigurasi isolasi container dengan cap-drop ALL.\n2. Memblokir akses keluar ke Cloud Metadata Service.\n3. Mengimplementasikan rate limiting pada reverse proxy gateway.",
        difficulty: "Intermediate",
        estimated_hours: 22,
        category: "Defensive Security",
        modules_list: JSON.stringify([
          { type: "lab", id: "tpl-linux-core", title: "Range Lab: Privilege & Permission Hardening" },
          { type: "lesson", id: "security-headers", title: "Production Security Configurations" },
        ]),
        completion_xp: 190,
      },
      {
        id: "path-ethical-hacking",
        title: "Ethical Hacking & Penetration Testing",
        description: "Metodologi pengujian penetrasi etis (PTES): tahapan reconnaissance, scanning & enumeration, exploitasi terkendali, dan pelaporan temuan profesional.",
        target_audience: "Penetration Testers, Ethical Hackers, dan Security Consultants.",
        prerequisites: "Penguasaan Linux, Jaringan, dan Web Security.",
        learning_objectives: "1. Melakukan pemindaian footprinting tanpa merusak sistem.\n2. Mengevaluasi tingkat keparahan risiko berdasarkan skor CVSS.\n3. Menyusun laporan pengujian penetrasi dengan langkah remediasi.",
        difficulty: "Advanced",
        estimated_hours: 32,
        category: "Ethical Hacking",
        modules_list: JSON.stringify([
          { type: "lab", id: "tpl-web-owasp", title: "Range Lab: Web Vulnerabilities Exploitation" },
          { type: "lab", id: "tpl-net-topo", title: "Range Lab: Network Hop Traversing" },
          { type: "ctf", id: "ctf_sqli_login", title: "Challenge: Auth Bypass PenTest" },
        ]),
        completion_xp: 260,
      },
    ];

    for (const p of paths) {
      insertPath.run(
        p.id, p.title, p.description, p.target_audience, p.prerequisites, p.learning_objectives,
        p.difficulty, p.estimated_hours, p.category, p.modules_list, p.completion_xp, now
      );
    }
  }

  // 9. Seed Sample CTF Competition
  const checkComp = db.prepare("SELECT count(*) as count FROM ctf_competitions").get() as { count: number };
  if (checkComp.count === 0) {
    const now = new Date().toISOString();
    const startTime = new Date(Date.now() - 3600000).toISOString(); // Started 1 hour ago
    const endTime = new Date(Date.now() + 7 * 86400000).toISOString(); // Ends in 7 days
    db.prepare(`
      INSERT INTO ctf_competitions (
        id, title, description, type, format, start_time, end_time, status, rules, challenges_list, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "comp_nusantara_2026",
      "CyberLab Nusantara CTF Championship 2026",
      "Kompetisi CTF Jeopardy tahunan komunitas Indonesia. Uji kemampuan kriptografi, forensik, web security, dan reverse engineering dalam format tim atau individu.",
      "team",
      "jeopardy",
      startTime,
      endTime,
      "active",
      "1. Dilarang melakukan DoS/DDoS pada server scoring.\n2. Dilarang berbagi flag antar tim (Anti-flag sharing).\n3. Flag format resmi: CYBERLAB{...}.\n4. Keputusan panitia bersifat mutlak.",
      JSON.stringify(["ctf_caesar", "ctf_vigenere", "ctf_sqli_login", "ctf_magic_png", "ctf_net_dns", "ctf_patch_me"]),
      now
    );

    // Seed Sample Teams
    db.prepare(`
      INSERT INTO ctf_teams (id, name, description, leader_id, invite_code, total_points, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run("team_garuda", "Garuda RedSec", "Tim praktikum cybersecurity spesialisasi offensive dan web exploitation.", "usr_budi", "GARUDA2026", 150, now);

    db.prepare(`
      INSERT INTO ctf_teams (id, name, description, leader_id, invite_code, total_points, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run("team_merdeka", "Merdeka BlueTeam", "Fokus pada incident response, log analysis, dan sistem pertahanan.", "usr_citra", "MERDEKA77", 125, now);

    // Seed Team Members
    db.prepare(`
      INSERT INTO ctf_team_members (id, team_id, user_id, role, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `).run("tm_1", "team_garuda", "usr_budi", "leader", now);

    db.prepare(`
      INSERT INTO ctf_team_members (id, team_id, user_id, role, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `).run("tm_2", "team_merdeka", "usr_citra", "leader", now);
  }

  // 10. Seed Sample Research Articles
  const checkResearch = db.prepare("SELECT count(*) as count FROM research_articles").get() as { count: number };
  if (checkResearch.count === 0) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO research_articles (
        id, user_id, author_name, title, slug, abstract, category, keywords, content,
        references_list, is_writeup, related_challenge_id, has_spoilers, status, views_count, likes_count, published_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "art_sqli_remediation",
      "usr_citra",
      "Citra Lestari",
      "Analisis Mendalam: Parameterized Queries vs AST Level Query Sanitization",
      "analisis-parameterized-queries-ast",
      "Artikel ini membedah bagaimana Abstract Syntax Tree (AST) database parser bekerja ketika memproses prepared statement dan mengapa sanitasi karakter manual kerap gagal menangkal SQL Injection varian baru.",
      "Web Security",
      JSON.stringify(["SQLi", "Prepared Statements", "AST", "Database Security"]),
      "## 1. Pendahuluan\nBanyak pengembang pemula mengira bahwa sanitasi karakter khusus seperti kutip tunggal (`'`) atau tanda minus ganda (`--`) sudah memadai untuk mencegah SQL Injection.\n\nNamun kenyataannya, parser database mengkompilasi string SQL mentah menjadi representasi pohon sintaks abstrak (Abstract Syntax Tree). Jika parameter pengguna disuntikkan sebelum AST selesai dibentuk, interpreter SQL akan memperlakukan data sebagai instruksi kode.\n\n## 2. Prepared Statements\nDengan prepared statement, mesin database mengkompilasi AST terlebih dahulu dengan placeholder parameter bertipe `?` atau `$1`. Data input yang diberikan kemudian hanya dianggap sebagai data literal murni.",
      JSON.stringify(["OWASP SQL Injection Prevention Cheat Sheet", "RFC Database Prepared Statements Standards"]),
      0,
      null,
      0,
      "published",
      142,
      28,
      now,
      now
    );

    db.prepare(`
      INSERT INTO research_articles (
        id, user_id, author_name, title, slug, abstract, category, keywords, content,
        references_list, is_writeup, related_challenge_id, has_spoilers, status, views_count, likes_count, published_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "art_magic_bytes_forensics",
      "usr_budi",
      "Budi Santoso",
      "Teknik Forensik Digital: Deteksi File Masquerading Melalui Header Hex Magic Bytes",
      "deteksi-file-masquerading-magic-bytes",
      "Investigasi forensik terhadap teknik extension spoofing yang sering dimanfaatkan threat actor untuk menyelundupkan payload PE/EXE dengan ekstensi PDF atau PNG.",
      "Digital Forensics",
      JSON.stringify(["Magic Bytes", "File Signature", "Extension Spoofing", "DFIR"]),
      "## Ringkasan Eksekutif\nSistem operasi modern seperti Windows sering kali menentukan aplikasi pembuka berkas semata-mata berdasarkan ekstensi nama file (`.pdf`, `.jpg`). Celah ini kerap dieksploitasi oleh malware untuk mengecoh pengguna.\n\n## Metodologi Analisis Hex\nDengan memeriksa 4 hingga 8 byte pertama (File Signature / Magic Bytes), investigator digital dapat memastikan tipe MIME asli berkas:\n- `4D 5A` (MZ): Windows Portable Executable (EXE/DLL)\n- `89 50 4E 47 0D 0A 1A 0A`: PNG Image\n- `25 50 44 46`: Adobe PDF Document",
      JSON.stringify(["Gary Kessler File Signatures Table", "SANS Digital Forensics Pocket Guide"]),
      0,
      null,
      0,
      "published",
      98,
      19,
      now,
      now
    );
  }

  // 11. Seed Sample Mentors
  const checkMentors = db.prepare("SELECT count(*) as count FROM mentors").get() as { count: number };
  if (checkMentors.count === 0) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO mentors (id, user_id, display_name, bio, specialties, is_available, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "mentor_budi",
      "usr_budi",
      "Budi Santoso",
      "Praktisi keamanan Linux & infrastruktur dengan pengalaman 6+ tahun di industri data center. Senang berbagi ilmu seputar pengerasan server dan DFIR.",
      JSON.stringify(["Linux Hardening", "Digital Forensics", "Network Defense"]),
      1,
      "verified",
      now
    );

    db.prepare(`
      INSERT INTO mentors (id, user_id, display_name, bio, specialties, is_available, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "mentor_citra",
      "usr_citra",
      "Citra Lestari",
      "Spesialis Application Security & CTF player. Membantu rekan-rekan pembelajar menguasai OWASP Top 10 dan dasar reverse engineering biner.",
      JSON.stringify(["Web AppSec", "OWASP Top 10", "CTF Reverse Engineering"]),
      1,
      "verified",
      now
    );
  }

  // 12. Seed Community Events
  const checkEvents = db.prepare("SELECT count(*) as count FROM community_events").get() as { count: number };
  if (checkEvents.count === 0) {
    const now = new Date().toISOString();
    const event1Start = new Date(Date.now() + 2 * 86400000).toISOString(); // in 2 days
    const event1End = new Date(Date.now() + 2 * 86400000 + 7200000).toISOString();
    const event2Start = new Date(Date.now() + 5 * 86400000).toISOString(); // in 5 days
    const event2End = new Date(Date.now() + 5 * 86400000 + 7200000).toISOString();

    db.prepare(`
      INSERT INTO community_events (
        id, title, description, type, speaker_name, start_time, end_time, location_url, max_participants, registered_count, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "ev_websec_workshop",
      "Hands-On Workshop: Membedah Celah OWASP Top 10 pada Cyber Range",
      "Sesi praktik langsung secara daring menggunakan lingkungan Cyber Range terisolasi CyberLab-ID. Peserta akan mempraktikkan mitigasi SQL Injection dan XSS secara aman.",
      "workshop",
      "Citra Lestari (AppSec Specialist)",
      event1Start,
      event1End,
      "https://meet.cyberlab.id/websec-workshop",
      150,
      48,
      "scheduled",
      now
    );

    db.prepare(`
      INSERT INTO community_events (
        id, title, description, type, speaker_name, start_time, end_time, location_url, max_participants, registered_count, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "ev_career_webinar",
      "Webinar: Membangun Karir Profesional Cybersecurity dari Nol di Indonesia",
      "Diskusi interaktif bersama praktisi industri mengenai jalur karir cybersecurity, sertifikasi yang relevan, serta kiat membangun portofolio pembuktian kompetensi.",
      "webinar",
      "Budi Santoso & Komunitas CyberLab-ID",
      event2Start,
      event2End,
      "https://meet.cyberlab.id/career-webinar",
      250,
      112,
      "scheduled",
      now
    );
  }

  // 12. Seed Phase 7: AI Provider Config
  const checkAiConfig = db.prepare("SELECT count(*) as count FROM ai_provider_config").get() as { count: number };
  if (checkAiConfig.count === 0) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO ai_provider_config (
        id, provider, model_name, api_key_masked, api_key_encrypted, is_enabled, rate_limit_per_minute, total_requests, total_tokens, updated_at
      ) VALUES ('default_config', 'gemini', 'gemini-1.5-flash', 'AIzaSy*******************************', '', 1, 30, 0, 0, ?)
    `).run(now);
  }

  // 13. Seed Phase 7: AI Knowledge Base Documents
  const checkAiDocs = db.prepare("SELECT count(*) as count FROM ai_knowledge_docs").get() as { count: number };
  if (checkAiDocs.count === 0) {
    const now = new Date().toISOString();
    const insertDoc = db.prepare(`
      INSERT INTO ai_knowledge_docs (id, title, category, topic, content, tags, source_url, is_indexed, is_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)
    `);

    const docs = [
      {
        id: "doc-linux-privesc",
        title: "Linux File Permissions, SUID & Privilege Escalation",
        category: "linux",
        topic: "System Hardening",
        content: "Sistem izin berkas Linux menggunakan representasi octal (r=4, w=2, x=1) untuk User, Group, dan Other. SUID (Set Owner User ID Upon Execution, bit 4000) memungkinkan biner berjalan dengan hak istimewa pemilik berkas (seringkali root). Jika biner seperti /usr/bin/find atau /usr/bin/python memiliki bit SUID aktif (chmod u+s), penyerang lokal dapat mengeksploitasi fitur eksekusi skrip internal untuk eskalasi hak istimewa ke root. Mitigasi defensif meliputi audit reguler dengan perintah: find / -perm -4000 -type f 2>/dev/null dan menghapus bit SUID yang tidak esensial.",
        tags: JSON.stringify(["linux", "suid", "privesc", "permissions", "chmod"]),
        source: "/learning/linux/file-permissions",
      },
      {
        id: "doc-net-handshake",
        title: "TCP/IP 3-Way Handshake, SYN Flood & Wireshark Packet Analysis",
        category: "networking",
        topic: "Network Protocols & Defense",
        content: "Proses inisiasi koneksi TCP menggunakan mekanisme 3-Way Handshake: SYN -> SYN-ACK -> ACK. Serangan SYN Flood mengeksploitasi antrian backlog SYN dengan mengirim banyak paket SYN tanpa pernah menyelesaikan jabat tangan dengan ACK akhir, menyebabkan kehabisan tabel status koneksi (state exhaustion). Analisis lalu lintas jaringan menggunakan Wireshark atau tcpdump dapat mendeteksi anomali ini dengan filter 'tcp.flags.syn == 1 and tcp.flags.ack == 0'. Mitigasi meliputi penerapan SYN Cookies di kernel Linux (net.ipv4.tcp_syncookies = 1) dan pembatasan laju koneksi pada iptables/nftables.",
        tags: JSON.stringify(["networking", "tcp", "handshake", "syn-flood", "wireshark"]),
        source: "/learning/networking/tcp-ip-fundamentals",
      },
      {
        id: "doc-web-sqli",
        title: "OWASP Top 10: SQL Injection Mechanics & Parameterized Defense",
        category: "web",
        topic: "Web Application Security",
        content: "SQL Injection (SQLi) terjadi ketika masukan data dari pengguna langsung disatukan (concatenation) ke dalam query basis data tanpa sanitasi atau parameterisasi. Varian utama meliputi In-Band SQLi (Error-based dan UNION-based), Inferential Blind SQLi (Boolean-based dan Time-based sleep), serta Out-of-Band SQLi. Satu-satunya mitigasi definitif adalah penggunaan Parameterized Queries (Prepared Statements) dan ORM aman, di mana mesin basis data memisahkan instruksi SQL dari data literal sehingga karakter kontrol seperti ' OR 1=1 -- tidak dapat mengubah struktur sintaks query.",
        tags: JSON.stringify(["web", "sqli", "owasp", "prepared-statements", "database"]),
        source: "/learning/web-security/sql-injection",
      },
      {
        id: "doc-crypto-ciphers",
        title: "Applied Cryptography: Symmetric AES vs Asymmetric RSA & Hashing",
        category: "cryptography",
        topic: "Data Protection & Ciphers",
        content: "Kriptografi modern terbagi menjadi enkripsi simetris (AES-256 GCM) yang menggunakan satu kunci rahasia bersama untuk efisiensi transfer data cepat, dan enkripsi asimetris (RSA-4096, ECC / Ed25519) yang memanfaatkan pasangan kunci publik dan privat untuk pertukaran kunci aman dan tanda tangan digital. Fungsi Hash Kriptografis (SHA-256, SHA-3) bersifat searah (one-way) dan resisten terhadap benturan (collision-resistant), ideal untuk verifikasi integritas data dan penyimpanan kata sandi jika digabungkan dengan salt dan memory-hard KDF (PBKDF2, Argon2id, bcrypt).",
        tags: JSON.stringify(["crypto", "aes", "rsa", "sha256", "argon2", "pbkdf2"]),
        source: "/learning/cryptography/classical-ciphers",
      },
      {
        id: "doc-forensics-magic-bytes",
        title: "Digital Forensics: Magic Bytes Header Inspection & File Signature Spoofing",
        category: "digital-forensics",
        topic: "Artifact Analysis",
        content: "Ekstensi berkas (seperti .pdf atau .jpg) hanya merupakan petunjuk visual bagi sistem operasi grafis dan dapat dipalsukan secara mudah oleh penyerang. Format berkas sebenarnya ditentukan oleh Magic Bytes (file signature) pada header awal berkas: PNG selalu diawali 89 50 4E 47 0D 0A 1A 0A, JPEG diawali FF D8 FF, berkas executable Windows (PE32) diawali 4D 5A (MZ), ELF Linux diawali 7F 45 4C 46, dan PDF diawali 25 50 44 46 (%PDF). Pemeriksaan forensik mengidentifikasi anomali di mana berkas dengan ekstensi laporan.pdf ternyata memiliki magic bytes 4D 5A, menandakan teknik penyamaran malware yang berbahaya.",
        tags: JSON.stringify(["forensics", "magic-bytes", "signature", "pe", "elf", "file-spoofing"]),
        source: "/learning/digital-forensics/file-analysis",
      },
      {
        id: "doc-reverse-buffer-overflow",
        title: "Reverse Engineering: x86_64 Stack Frames & Buffer Overflow Mechanics",
        category: "reverse-engineering",
        topic: "Binary Analysis",
        content: "Dalam arsitektur x86_64, eksekusi fungsi mengalokasikan stack frame yang menampung variabel lokal, pointer frame dasar (RBP), dan alamat kembali (Return Address / RIP). Kerentanan Buffer Overflow klasik terjadi ketika fungsi rentan seperti gets(), strcpy(), atau sprintf() menulis data melebihi ukuran buffer yang dialokasikan tanpa batas panjang. Penyerang dapat menimpa RIP untuk mengalihkan alur eksekusi program ke shellcode atau ROP (Return-Oriented Programming) gadgets. Mekanisme pertahanan modern meliputi Stack Canaries, ASLR (Address Space Layout Randomization), dan DEP / NX (No-Execute) bit.",
        tags: JSON.stringify(["reverse", "buffer-overflow", "x86_64", "stack", "rop", "aslr", "nx"]),
        source: "/learning/reverse-engineering/intro-binaries",
      },
      {
        id: "doc-web-xss",
        title: "Web Security: Cross-Site Scripting (XSS) & Content Security Policy (CSP)",
        category: "web",
        topic: "Client-Side Attacks",
        content: "Cross-Site Scripting (XSS) terjadi ketika aplikasi web menyuntikkan skrip berbahaya yang tidak disanitasi ke dalam browser korban. Tiga tipe utama: Reflected XSS (skrip dikirim via parameter URL), Stored XSS (skrip disimpan permanen di basis data seperti komentar forum), dan DOM-based XSS (skrip dieksekusi di sisi klien akibat manipulasi DOM tidak aman). Pertahanan berlapis meliputi Context-Aware HTML Encoding, sanitasi konten kaya menggunakan pustaka teruji seperti DOMPurify, dan penegakan header Content Security Policy (CSP) ketat seperti 'default-src self; script-src self; object-src none'.",
        tags: JSON.stringify(["web", "xss", "csp", "dompurify", "sanitization", "javascript"]),
        source: "/learning/web-security/xss-fundamentals",
      },
      {
        id: "doc-defensive-log-analysis",
        title: "Defensive Operations: Server Log Analysis & Brute-Force Remediation",
        category: "general",
        topic: "Threat Detection & Response",
        content: "Log server merupakan sumber bukti utama investigasi insiden. Pola serangan brute-force terlihat jelas pada log autentikasi SSH (/var/log/auth.log) atau web dengan catatan ratusan upaya login gagal ('Failed password for...') dalam rentang waktu singkat dari alamat IP yang sama. Analisis pola log web (/var/log/nginx/access.log) dapat mengungkap pemindaian direktori otomatis (banyak respon HTTP 404 pada jalur sensitif seperti /admin, /.env, /wp-login.php). Tindakan pertahanan mencakup instalasi Fail2ban untuk memblokir IP penyerang secara otomatis di iptables, pemberlakuan autentikasi berbasis kunci (SSH key-only), dan implementasi Multi-Factor Authentication (MFA).",
        tags: JSON.stringify(["defense", "logs", "brute-force", "fail2ban", "detection", "incident-response"]),
        source: "/learning/linux/linux-administration",
      },
    ];

    for (const d of docs) {
      insertDoc.run(d.id, d.title, d.category, d.topic, d.content, d.tags, d.source, now, now);
    }
  }

  // 14. Seed Phase 7: AI Quiz Drafts
  const checkQuizzes = db.prepare("SELECT count(*) as count FROM ai_quiz_drafts").get() as { count: number };
  if (checkQuizzes.count === 0) {
    const now = new Date().toISOString();
    const insertQuiz = db.prepare(`
      INSERT INTO ai_quiz_drafts (id, topic, category, difficulty, question, type, options, correct_answer, explanation, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)
    `);

    insertQuiz.run(
      "quiz-01-linux-perm",
      "Linux Permissions",
      "linux",
      "beginner",
      "Berapakah representasi nilai oktal untuk hak akses read (r), write (w), dan execute (x)?",
      "multiple_choice",
      JSON.stringify(["r=4, w=2, x=1", "r=1, w=2, x=4", "r=3, w=2, x=1", "r=2, w=4, x=8"]),
      "r=4, w=2, x=1",
      "Dalam sistem perizinan berkas Linux, nilai bobot oktal bernilai 4 untuk membaca (read), 2 untuk menulis (write), dan 1 untuk mengeksekusi (execute).",
      now,
      now
    );

    insertQuiz.run(
      "quiz-02-web-sqli",
      "SQL Injection",
      "web",
      "intermediate",
      "Metode mitigasi manakah yang paling efektif dan definitif untuk mencegah serangan SQL Injection?",
      "multiple_choice",
      JSON.stringify([
        "Menggunakan regex blacklist untuk memfilter tanda petik tunggal",
        "Menggunakan Parameterized Queries (Prepared Statements)",
        "Mengenkripsi seluruh tabel database di sisi penyimpanan",
        "Mengubah port default server database"
      ]),
      "Menggunakan Parameterized Queries (Prepared Statements)",
      "Prepared Statements memisahkan struktur query dari parameter data pengguna, sehingga karakter khusus dari input pengguna tidak dapat dieksekusi sebagai perintah SQL.",
      now,
      now
    );

    insertQuiz.run(
      "quiz-03-net-syn",
      "TCP SYN Flood",
      "networking",
      "intermediate",
      "Paket flag TCP apakah yang sengaja tidak dikirimkan oleh penyerang dalam skenario serangan SYN Flood?",
      "multiple_choice",
      JSON.stringify(["ACK", "FIN", "RST", "URG"]),
      "ACK",
      "Penyerang mengirim paket SYN untuk meminta koneksi namun sengaja tidak mengirim paket ACK balasan terakhir, menyebabkan server menahan koneksi setengah terbuka (half-open) hingga kehabisan memori tabel koneksi.",
      now,
      now
    );

    insertQuiz.run(
      "quiz-04-rev-canary",
      "Binary Exploit Mitigations",
      "reverse-engineering",
      "advanced",
      "Mekanisme mitigasi biner manakah yang meletakkan nilai integritas acak di depan Return Address pada stack frame untuk mendeteksi buffer overflow?",
      "multiple_choice",
      JSON.stringify(["Stack Canary", "ASLR", "NX Bit", "PIE"]),
      "Stack Canary",
      "Stack Canary adalah nilai rahasia (sering diawali byte null) yang diletakkan tepat sebelum pointer instruksi (RIP/EIP). Sebelum fungsi kembali, nilai canary diperiksa; jika nilai telah berubah akibat luapan buffer, program langsung dihentikan (stack smashing detected).",
      now,
      now
    );
  }

  // 15. Seed Phase 8: Institutional & Community Partnerships
  const checkPartners = db.prepare("SELECT count(*) as count FROM partnerships").get() as { count: number };
  if (checkPartners.count === 0) {
    const now = new Date().toISOString();
    const insertPartner = db.prepare(`
      INSERT INTO partnerships (
        id, organization_name, org_type, country, city, website_url, logo_url,
        description, status, contact_name, contact_email, is_contact_public,
        collaboration_categories, partnership_agreement_ref, verified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, 0, ?, ?, ?, ?, ?)
    `);

    const partners = [
      {
        id: "part-ui-csc",
        name: "Universitas Indonesia - Cyber Security Center",
        type: "university",
        country: "ID",
        city: "Depok",
        website: "https://csc.ui.ac.id",
        logo: "GraduationCap",
        desc: "Kolaborasi riset keamanan siber, pelatihan mahasiswa, dan validasi kurikulum standar pertahanan nasional.",
        contact: "Dr. Pratama Cyber",
        email: "csc@ui.ac.id",
        cats: JSON.stringify(["curriculum", "research", "mentorship"]),
        ref: "MOU-UI-CYBERLAB-2026-01",
      },
      {
        id: "part-itb-seclab",
        name: "Institut Teknologi Bandung - Information Security Laboratory",
        type: "university",
        country: "ID",
        city: "Bandung",
        website: "https://stei.itb.ac.id",
        logo: "GraduationCap",
        desc: "Penyusunan modul kriptografi terapan, pengujian perangkat lunak terpercaya, dan turnamen CTF mahasiswa.",
        contact: "Prof. Ir. Kripto ITB",
        email: "seclab@stei.itb.ac.id",
        cats: JSON.stringify(["curriculum", "ctf_events", "cyber_range"]),
        ref: "MOU-ITB-CYBERLAB-2026-02",
      },
      {
        id: "part-nus-cyber",
        name: "National University of Singapore - Cybersecurity Research Group",
        type: "research_org",
        country: "SG",
        city: "Singapore",
        website: "https://nus.edu.sg/soc/research/cybersecurity",
        logo: "Compass",
        desc: "Kolaborasi regional Asia Pasifik dalam penelitian pertahanan botnet, analisis PCAP terdistribusi, dan publikasi terbuka.",
        contact: "Dr. K. Tan",
        email: "cyber-research@nus.edu.sg",
        cats: JSON.stringify(["research", "curriculum"]),
        ref: "MOU-NUS-CYBERLAB-2026-03",
      },
      {
        id: "part-id-networkers",
        name: "ID-Networkers Community",
        type: "community",
        country: "ID",
        city: "Jakarta",
        website: "https://id-networkers.com",
        logo: "Network",
        desc: "Komunitas profesional dan praktisi jaringan terbesar di Indonesia untuk edukasi routing, switching, dan pertahanan perimeter.",
        contact: "Network Lead IDN",
        email: "partner@id-networkers.com",
        cats: JSON.stringify(["mentorship", "cyber_range", "events"]),
        ref: "COM-IDN-2026-04",
      },
      {
        id: "part-owasp-id",
        name: "OWASP Indonesia Chapter",
        type: "open_source",
        country: "ID",
        city: "Jakarta",
        website: "https://owasp.org/www-chapter-indonesia/",
        logo: "Shield",
        desc: "Afiliasi komunitas global open-source untuk sosialisasi OWASP Top 10, Secure Coding, dan Web Security Application Testing.",
        contact: "OWASP Chapter Leader",
        email: "indonesia@owasp.org",
        cats: JSON.stringify(["curriculum", "events", "research"]),
        ref: "OS-OWASP-ID-2026-05",
      },
      {
        id: "part-apnic-fdn",
        name: "APNIC Foundation Community Research",
        type: "tech_edu",
        country: "AU",
        city: "Brisbane",
        website: "https://apnic.foundation",
        logo: "Globe",
        desc: "Dukungan edukasi keamanan infrastruktur Internet (RPKI, BGP Security, DNSSEC, dan IPv6 Deployment) untuk wilayah Asia Pasifik.",
        contact: "Internet Security Officer",
        email: "grants@apnic.foundation",
        cats: JSON.stringify(["curriculum", "research"]),
        ref: "EDU-APNIC-2026-06",
      },
    ];

    for (const p of partners) {
      insertPartner.run(
        p.id, p.name, p.type, p.country, p.city, p.website, p.logo,
        p.desc, p.contact, p.email, p.cats, p.ref, now, now, now
      );
    }
  }

  // 16. Seed Phase 8: Open-Source Contribution Tasks
  const checkContribTasks = db.prepare("SELECT count(*) as count FROM contribution_tasks").get() as { count: number };
  if (checkContribTasks.count === 0) {
    const now = new Date().toISOString();
    const insertTask = db.prepare(`
      INSERT INTO contribution_tasks (
        id, title, category, difficulty, description, requirements,
        status, issue_url, pr_url, reward_xp, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, '', ?, ?, ?)
    `);

    const tasks = [
      {
        id: "task-01-en-translation",
        title: "Penerjemahan Lengkap Kurikulum Linux ke Bahasa Inggris",
        cat: "translation",
        diff: "easy",
        desc: "Menerjemahkan 4 berkas markdown materi Linux Administration (Fundamentals, CLI, File Permissions, SSH Hardening) ke English dengan terminologi siber akurat.",
        reqs: JSON.stringify(["Memahami istilah Linux & Bash", "Standar penulisan Markdown bilingual"]),
        issue: "https://github.com/CyberLab-ID/cyberlab-id/issues/101",
        xp: 40,
      },
      {
        id: "task-02-range-snort",
        title: "Template Praktikum Cyber Range: Snort NIDS Live Alert",
        cat: "lab",
        diff: "hard",
        desc: "Mengembangkan skenario virtual lab inspeksi aturan Snort / Suricata yang mendeteksi port scan TCP SYN dan alert HTTP payload.",
        reqs: JSON.stringify(["Memahami sintaks Snort Rule", "JSON format stateful lab checkpoints"]),
        issue: "https://github.com/CyberLab-ID/cyberlab-id/issues/102",
        xp: 80,
      },
      {
        id: "task-03-api-docs",
        title: "Pembuatan Skema OpenAPI v3.1 & SDK Python Ringan",
        cat: "docs",
        diff: "medium",
        desc: "Menuliskan spesifikasi openapi.json untuk endpoint Public API v1 (/api/v1/*) dan membuat helper script Python client (cyberlab-py).",
        reqs: JSON.stringify(["Spesifikasi OpenAPI / Swagger", "Python requests"]),
        issue: "https://github.com/CyberLab-ID/cyberlab-id/issues/103",
        xp: 60,
      },
      {
        id: "task-04-ctf-jwt",
        title: "Tantangan CTF Baru: Injeksi JWT None Algorithm & Key Confusion",
        cat: "module",
        diff: "medium",
        desc: "Membuat tantangan Jeopardy Web Security bertema JSON Web Token: memanipulasi algoritma 'none' dan secret key brute forcing.",
        reqs: JSON.stringify(["Arsitektur CTF CyberLab-ID", "Flag hashing SHA-256 standard"]),
        issue: "https://github.com/CyberLab-ID/cyberlab-id/issues/104",
        xp: 75,
      },
    ];

    for (const t of tasks) {
      insertTask.run(t.id, t.title, t.cat, t.diff, t.desc, t.reqs, t.issue, t.xp, now, now);
    }
  }

  // 17. Seed Phase 8: External Knowledge Cache
  const checkExtCache = db.prepare("SELECT count(*) as count FROM external_knowledge_cache").get() as { count: number };
  if (checkExtCache.count === 0) {
    const now = new Date().toISOString();
    const farFuture = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
    const insertCache = db.prepare(`
      INSERT INTO external_knowledge_cache (
        id, source_type, reference_id, title, summary, severity,
        data_payload, source_attribution, cached_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const items = [
      // MITRE ATT&CK
      {
        id: "att-t1059",
        src: "mitre_attack",
        ref: "T1059",
        title: "Command and Scripting Interpreter",
        summary: "Penyerang menyalahgunakan shell perintah (Bash, PowerShell, Python) untuk mengeksekusi instruksi arbitrer pada host target.",
        sev: "high",
        payload: JSON.stringify({
          tactic: "Execution",
          subtechniques: ["T1059.004 (Unix Shell)", "T1059.001 (PowerShell)"],
          mitigations: ["M1038 (Execution Prevention)", "M1026 (Privileged Account Management)"],
          cyberlabModule: "/learning/linux/linux-command-line",
        }),
        attr: "MITRE ATT&CK Framework (https://attack.mitre.org)",
      },
      {
        id: "att-t1190",
        src: "mitre_attack",
        ref: "T1190",
        title: "Exploit Public-Facing Application",
        summary: "Pemanfaatan kelemahan keamanan pada aplikasi web atau layanan publik untuk mendapatkan akses eksekusi kode awal tanpa autentikasi.",
        sev: "critical",
        payload: JSON.stringify({
          tactic: "Initial Access",
          examples: ["SQL Injection", "Log4Shell", "Remote Code Execution"],
          mitigations: ["Patch Management", "Web Application Firewall (WAF)", "Least Privilege Network Zoning"],
          cyberlabModule: "/learning/web-security/sql-injection",
        }),
        attr: "MITRE ATT&CK Framework (https://attack.mitre.org)",
      },
      {
        id: "att-t1110",
        src: "mitre_attack",
        ref: "T1110",
        title: "Brute Force / Password Guessing",
        summary: "Upaya berulang menebak kata sandi atau kredensial autentikasi sistem secara sistematis menggunakan wordlist otomatis.",
        sev: "medium",
        payload: JSON.stringify({
          tactic: "Credential Access",
          subtechniques: ["T1110.001 (Password Guessing)", "T1110.003 (Password Spraying)"],
          mitigations: ["Account Lockout Policies", "Fail2ban Rate Limiting", "Multi-Factor Authentication (MFA)"],
          cyberlabModule: "/learning/linux/ssh-hardening",
        }),
        attr: "MITRE ATT&CK Framework (https://attack.mitre.org)",
      },
      // NIST CSF
      {
        id: "nist-pr-ac",
        src: "nist_csf",
        ref: "PR.AC",
        title: "Identity Management, Authentication and Access Control",
        summary: "Akses ke aset fisik dan logis serta fasilitas terkait dibatasi hanya untuk pengguna, proses, dan perangkat yang terverifikasi.",
        sev: "high",
        payload: JSON.stringify({
          function: "PROTECT (PR)",
          category: "Access Control",
          subcategories: ["PR.AC-1: Identitas dan kredensial dikelola terpusat", "PR.AC-4: Hak akses dikelola dengan prinsip Least Privilege"],
          cyberlabModule: "/learning/linux/file-permissions",
        }),
        attr: "NIST Cybersecurity Framework v2.0 (https://csrc.nist.gov)",
      },
      {
        id: "nist-de-cm",
        src: "nist_csf",
        ref: "DE.CM",
        title: "Security Continuous Monitoring",
        summary: "Jaringan dan aset sistem dipantau secara berkala untuk mengidentifikasi anomali, serangan siber, dan efektivitas proteksi.",
        sev: "medium",
        payload: JSON.stringify({
          function: "DETECT (DE)",
          category: "Continuous Monitoring",
          subcategories: ["DE.CM-1: Jaringan dipantau untuk mendeteksi potensi serangan", "DE.CM-7: Pemantauan aktivitas personel dan akun"],
          cyberlabModule: "/learning/networking/packet-analysis",
        }),
        attr: "NIST Cybersecurity Framework v2.0 (https://csrc.nist.gov)",
      },
      // OWASP Top 10
      {
        id: "owasp-a01",
        src: "owasp_top10",
        ref: "A01:2021",
        title: "Broken Access Control",
        summary: "Kelemahan kontrol otorisasi yang memungkinkan pengguna mengakses sumber daya, akun lain, atau fungsionalitas admin yang bukan haknya.",
        sev: "critical",
        payload: JSON.stringify({
          cweIds: ["CWE-200", "CWE-284"],
          impact: "Exfiltration of sensitive user data, unauthorized privilege escalation",
          defenses: ["Deny by default", "Enforce server-side role and ownership validation on every request"],
          cyberlabModule: "/learning/web-security/broken-access-control",
        }),
        attr: "OWASP Top 10:2021 (https://owasp.org/Top10)",
      },
      {
        id: "owasp-a03",
        src: "owasp_top10",
        ref: "A03:2021",
        title: "Injection (SQL, NoSQL, OS Command)",
        summary: "Masukan data pengguna yang tidak divalidasi langsung diselipkan ke dalam interpreter query atau perintah sistem.",
        sev: "critical",
        payload: JSON.stringify({
          cweIds: ["CWE-79", "CWE-89"],
          impact: "Database dump, remote code execution, authentication bypass",
          defenses: ["Parameterized queries (Prepared Statements)", "Context-aware output encoding"],
          cyberlabModule: "/learning/web-security/sql-injection",
        }),
        attr: "OWASP Top 10:2021 (https://owasp.org/Top10)",
      },
      // Public CVE Records
      {
        id: "cve-2023-44487",
        src: "cve_nvd",
        ref: "CVE-2023-44487",
        title: "HTTP/2 Rapid Reset Attack (DDoS)",
        summary: "Protokol HTTP/2 rentan terhadap serangan penolakan layanan (Denial of Service) melalui pengiriman aliran request RST_STREAM berulang dalam jumlah masif.",
        sev: "high",
        payload: JSON.stringify({
          cvssScore: 7.5,
          affectedProtocols: ["HTTP/2 implementations"],
          publishedDate: "2023-10-10",
          mitigation: "Batasi laju penerimaan frame RST_STREAM pada reverse proxy Nginx/Cloudflare atau turunkan batas max_concurrent_streams.",
        }),
        attr: "NVD NIST / CVE Project (https://nvd.nist.gov)",
      },
      {
        id: "cve-2021-44228",
        src: "cve_nvd",
        ref: "CVE-2021-44228",
        title: "Apache Log4j2 JNDI Remote Code Execution (Log4Shell)",
        summary: "Pustaka logging Log4j mengevaluasi lookup JNDI bersarang tanpa validasi, memungkinkan penyerang mengeksekusi kode Java arbitrer dari server LDAP/RMI eksternal.",
        sev: "critical",
        payload: JSON.stringify({
          cvssScore: 10.0,
          affectedComponents: ["Apache Log4j 2.0-beta9 through 2.15.0"],
          publishedDate: "2021-12-10",
          mitigation: "Perbarui ke Log4j versi >= 2.17.1 dan nonaktifkan lookup pesan JNDI (log4j2.formatMsgNoLookups=true).",
        }),
        attr: "NVD NIST / CVE Project (https://nvd.nist.gov)",
      },
      {
        id: "cve-2024-3094",
        src: "cve_nvd",
        ref: "CVE-2024-3094",
        title: "XZ Utils / liblzma Malicious Backdoor",
        summary: "Sisipan kode backdoor tersembunyi pada tarball rilis XZ Utils versi 5.6.0 dan 5.6.1 yang mencegat fungsi RSA SSH daemon (sshd) pada Linux.",
        sev: "critical",
        payload: JSON.stringify({
          cvssScore: 10.0,
          affectedComponents: ["XZ Utils 5.6.0, 5.6.1"],
          publishedDate: "2024-03-29",
          mitigation: "Segera lakukan downgrade paket XZ Utils ke versi 5.4.x stabil pada seluruh distribusi Linux produksi.",
        }),
        attr: "NVD NIST / CVE Project (https://nvd.nist.gov)",
      },
    ];

    for (const item of items) {
      insertCache.run(
        item.id, item.src, item.ref, item.title, item.summary, item.sev,
        item.payload, item.attr, now, farFuture
      );
    }
  }

  // 18. Seed Phase 8: Community Groups
  const checkGroups = db.prepare("SELECT count(*) as count FROM community_groups").get() as { count: number };
  if (checkGroups.count === 0) {
    const now = new Date().toISOString();
    const insertGroup = db.prepare(`
      INSERT INTO community_groups (
        id, name, slug, category, region_or_language, description, member_count, is_official, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const groups = [
      {
        id: "grp-nasional-id",
        name: "CyberLab-ID Komunitas Nasional (Indonesia)",
        slug: "indonesia-national",
        cat: "regional",
        reg: "Indonesia (Bahasa Indonesia)",
        desc: "Ruang diskusi utama bagi pelajar, mahasiswa, dan praktisi keamanan siber di seluruh pelosok nusantara.",
        count: 1420,
      },
      {
        id: "grp-global-eng",
        name: "CyberLab Global Community (English Hub)",
        slug: "global-english",
        cat: "regional",
        reg: "Global (English)",
        desc: "International hub for cross-border cybersecurity education, open-source contributors, and research collaboration.",
        count: 580,
      },
      {
        id: "grp-ctf-squad",
        name: "Competitive CTF & Bug Bounty Guild",
        slug: "ctf-bug-bounty",
        cat: "topic",
        reg: "Global",
        desc: "Diskusi taktik pemecahan tantangan Jeopardy, teknik eksploitasi defensif, serta write-up kompetisi CTF tingkat regional dan internasional.",
        count: 890,
      },
      {
        id: "grp-academic-research",
        name: "Academic Researchers & Educators Circle",
        slug: "academic-research",
        cat: "academic",
        reg: "Global",
        desc: "Forum bagi dosen, guru SMK, dan peneliti untuk merancang kurikulum praktikum siber dan publikasi ilmiah bersama.",
        count: 320,
      },
    ];

    for (const g of groups) {
      insertGroup.run(g.id, g.name, g.slug, g.cat, g.reg, g.desc, g.count, now);
    }
  }

  // 17. Seed Phase 9: Enterprise & Institutional Edition
  const checkInst = db.prepare("SELECT count(*) as count FROM institutions").get() as { count: number };
  if (checkInst.count === 0) {
    const now = new Date().toISOString();

    // Seed Phase 9 Achievements
    const insertAch = db.prepare(`
      INSERT OR IGNORE INTO achievements (id, code, title, description, xp_reward, icon, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertAch.run("ach_enterprise-admin", "enterprise-admin", "Administrator Institusi", "Menjadi pengelola tenant institusi, universitas, atau politeknik mitra CyberLab-ID.", 50, "Building2", "institution");
    insertAch.run("ach_cohort-valedictorian", "cohort-valedictorian", "Lulusan Terbaik Kohort", "Menyelesaikan seluruh kurikulum kelas institusi dengan nilai praktikum memuaskan.", 60, "GraduationCap", "institution");
    insertAch.run("ach_range-instructor", "range-instructor", "Instruktur Cyber Range", "Merancang dan menugaskan skenario praktikum siber isolasi untuk kelas pelatihan.", 45, "ShieldCheck", "institution");
    insertAch.run("ach_certified-graduate", "certified-graduate", "Alumni Tersertifikasi", "Meraih sertifikat kompetensi berverifikasi kriptografis resmi dari institusi pendidikan.", 50, "Award", "institution");

    // Seed Institutions
    const insertInstitution = db.prepare(`
      INSERT INTO institutions (
        id, slug, name, org_type, description, logo_url, brand_color,
        welcome_message, website_url, contact_email, status, plan_tier,
        plan_max_users, plan_max_storage_mb, plan_max_lab_concurrency,
        plan_ai_monthly_tokens, is_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertInstitution.run(
      "inst_ui_csc",
      "ui-csc",
      "Universitas Indonesia - Center for Cyber Security and Defense",
      "university",
      "Pusat keunggulan riset pertahanan siber dan pendidikan spesialis keamanan informasi terapan Universitas Indonesia.",
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=128&q=80",
      "#f59e0b",
      "Selamat datang di portal akademik cybersecurity terpadu Fasilkom & Puskaji Siber UI.",
      "https://csc.cs.ui.ac.id",
      "cybersecurity@cs.ui.ac.id",
      "active",
      "enterprise",
      2000,
      102400,
      100,
      10000000,
      1,
      now,
      now
    );

    insertInstitution.run(
      "inst_smk_idnet",
      "smk-idnet",
      "SMK ID-Networkers Cyber Academy",
      "vocational_school",
      "Program kejuruan vokasi Teknik Komputer Jaringan & Cybersecurity Hands-On berbasis kurikulum industri.",
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=128&q=80",
      "#00ff9d",
      "Selamat datang siswa-siswi SMK ID-Networkers di CyberLab Range & Assessment Center.",
      "https://academy.id-networkers.com",
      "academy@id-networkers.com",
      "active",
      "education",
      500,
      20480,
      25,
      2000000,
      1,
      now,
      now
    );

    // Seed Departments
    const insertDept = db.prepare(`
      INSERT INTO institution_departments (id, institution_id, name, code, head_user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertDept.run("idept_ui_fasilkom", "inst_ui_csc", "Fakultas Ilmu Komputer", "FASILKOM", "usr_admin", now);
    insertDept.run("idept_ui_secres", "inst_ui_csc", "Pusat Riset Keamanan Siber Terapan", "CS-SEC", "usr_budi", now);
    insertDept.run("idept_idnet_tkj", "inst_smk_idnet", "Teknik Komputer & Jaringan", "TKJ", "usr_admin", now);
    insertDept.run("idept_idnet_soc", "inst_smk_idnet", "SOC Analyst Fast Track", "SOC", "usr_budi", now);

    // Seed Memberships
    const insertMember = db.prepare(`
      INSERT INTO institution_members (id, institution_id, user_id, role, department_id, student_id_number, status, joined_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertMember.run("imem_ui_admin", "inst_ui_csc", "usr_admin", "owner", "idept_ui_fasilkom", "NIP-19850101", "active", now, now);
    insertMember.run("imem_ui_budi", "inst_ui_csc", "usr_budi", "instructor", "idept_ui_fasilkom", "NIDN-0412345", "active", now, now);
    insertMember.run("imem_ui_citra", "inst_ui_csc", "usr_citra", "student", "idept_ui_fasilkom", "NIM-210600123", "active", now, now);
    insertMember.run("imem_idnet_admin", "inst_smk_idnet", "usr_admin", "owner", "idept_idnet_tkj", "EMP-001", "active", now, now);
    insertMember.run("imem_idnet_budi", "inst_smk_idnet", "usr_budi", "student", "idept_idnet_tkj", "NIS-20260401", "active", now, now);

    // Seed Classes / Cohorts
    const insertClass = db.prepare(`
      INSERT INTO institution_classes (id, institution_id, department_id, name, academic_term, instructor_user_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertClass.run("icls_ui_cs401", "inst_ui_csc", "idept_ui_fasilkom", "CS-401 Network & Web Penetration Testing", "2026/2027 Ganjil", "usr_budi", "active", now);
    insertClass.run("icls_idnet_tkj12", "inst_smk_idnet", "idept_idnet_tkj", "TKJ-XII-A Cyber Defense Cohort", "Tahun Ajaran 2026", "usr_admin", "active", now);

    // Seed Class Students
    const insertClassStudent = db.prepare(`
      INSERT OR IGNORE INTO institution_class_students (class_id, user_id, enrolled_at)
      VALUES (?, ?, ?)
    `);
    insertClassStudent.run("icls_ui_cs401", "usr_citra", now);
    insertClassStudent.run("icls_idnet_tkj12", "usr_budi", now);

    // Seed Courses
    const insertCourse = db.prepare(`
      INSERT INTO institution_courses (
        id, institution_id, title, code, description, syllabus, module_ids,
        instructor_user_id, visibility, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCourse.run(
      "icrs_ui_adv_sec",
      "inst_ui_csc",
      "Advanced Network Security & Threat Defense",
      "CS401",
      "Kurikulum spesialis analisis ancaman jaringan, perancangan perimeter firewall, dan investigasi kerentanan aplikasi web modern.",
      JSON.stringify(["Arsitektur Keamanan Jaringan", "Vulnerability Assessment", "Packet Analysis Forensik", "Hardening Server"]),
      JSON.stringify(["networking", "web-security", "reverse-engineering"]),
      "usr_budi",
      "institution_wide",
      "published",
      now,
      now
    );

    insertCourse.run(
      "icrs_idnet_core",
      "inst_smk_idnet",
      "Kurikulum Kejuruan Administrasi Server & Keamanan Siber",
      "TKJ-SEC",
      "Fondasi teknis konfigurasi server Linux, manajemen port & routing, dan analisis payload mencurigakan.",
      JSON.stringify(["Administrasi Linux Dasar", "Routing & CIDR Subnetting", "Analisis Log Keamanan"]),
      JSON.stringify(["linux", "networking", "digital-forensics"]),
      "usr_admin",
      "class_only",
      "published",
      now,
      now
    );

    // Seed Course Assignment
    const insertAssignment = db.prepare(`
      INSERT INTO institution_course_assignments (
        id, institution_id, course_id, class_id, title, instructions, due_date, max_score, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAssignment.run(
      "iasg_ui_wireshark",
      "inst_ui_csc",
      "icrs_ui_adv_sec",
      "icls_ui_cs401",
      "Analisis Paket Malicious Traffic PCAP",
      "Unduh file pcap rekaman serangan brute-force SSH. Ekstrak IP penyerang, timestamp mulai serangan, dan susun aturan deteksi Snort.",
      new Date(Date.now() + 7 * 86400000).toISOString(),
      100,
      "usr_budi",
      now
    );

    // Seed Submission
    const insertSub = db.prepare(`
      INSERT INTO institution_submissions (
        id, institution_id, assignment_id, user_id, content, file_url, score, feedback, graded_by, graded_at, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSub.run(
      "isub_ui_citra",
      "inst_ui_csc",
      "iasg_ui_wireshark",
      "usr_citra",
      "Laporan analisis paket: Penyerang menggunakan IP 198.51.100.23 dengan 450 percobaan autentikasi SSH per menit. Snort rule: alert tcp 198.51.100.23 any -> any 22 (msg:\"SSH Brute Force\"; sid:100001;)",
      "https://example.com/reports/citra_wireshark_report.pdf",
      95,
      "Analisis sangat komprehensif, signature Snort akurat dan langsung dapat diimplementasikan di gateway sensor.",
      "usr_budi",
      now,
      now
    );

    // Seed Cyber Range Lab Assignment
    const insertLabAsg = db.prepare(`
      INSERT INTO institution_lab_assignments (id, institution_id, class_id, template_id, title, due_date, required_flag, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertLabAsg.run(
      "ilab_ui_topology",
      "inst_ui_csc",
      "icls_ui_cs401",
      "tpl-net-topo",
      "Praktikum Terisolasi: Segmentasi Multi-Tier Subnet & Hardening Gateway",
      new Date(Date.now() + 5 * 86400000).toISOString(),
      "FLAG{subnet_isolation_verified}",
      now
    );

    // Seed Institutional Assessment (Private CTF / Exam)
    const insertAssessment = db.prepare(`
      INSERT INTO institution_assessments (
        id, institution_id, class_id, title, description, time_limit_minutes, questions, starts_at, ends_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAssessment.run(
      "iass_ui_midterm",
      "inst_ui_csc",
      "icls_ui_cs401",
      "Ujian Tengah Semester: Penetration Testing & Web Defense",
      "Asesmen terstruktur berbatas waktu untuk menguji pemahaman mitigasi OWASP Top 10 dan analisis paket jaringan.",
      90,
      JSON.stringify([
        {
          id: "q1",
          prompt: "Manakah teknik pertahanan paling efektif untuk menghentikan serangan SQL Injection pada aplikasi backend?",
          options: ["Menghapus karakter kutip manual", "Parameterized Prepared Statements", "Base64 Encoding input pengguna", "Mengganti port database"],
          answer_hash: hashString("Parameterized Prepared Statements"),
          points: 50
        },
        {
          id: "q2",
          prompt: "Header keamanan HTTP apa yang secara efektif memitigasi serangan Clickjacking pada browser modern?",
          options: ["X-Content-Type-Options: nosniff", "Strict-Transport-Security", "Content-Security-Policy: frame-ancestors 'none'", "Server: Apache"],
          answer_hash: hashString("Content-Security-Policy: frame-ancestors 'none'"),
          points: 50
        }
      ]),
      now,
      new Date(Date.now() + 14 * 86400000).toISOString(),
      now
    );

    // Seed Institution Certificate
    const certHash = crypto.createHash("sha256").update("CERT-UI-2026-CS401-001:usr_citra:inst_ui_csc").digest("hex");
    const insertCert = db.prepare(`
      INSERT INTO institution_certificates (
        id, institution_id, user_id, course_id, certificate_code, verification_hash,
        title, issue_date, issuing_authority, criteria, is_revoked, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);

    insertCert.run(
      "icert_ui_citra",
      "inst_ui_csc",
      "usr_citra",
      "icrs_ui_adv_sec",
      "CERT-UI-2026-CS401-001",
      certHash,
      "Sertifikat Kompetensi: Advanced Network Security & Threat Defense",
      now.split("T")[0],
      "Center for Cyber Security & Defense Universitas Indonesia",
      "Menyelesaikan 100% materi kuliah, tugas analisis paket PCAP, dan praktikum laboratorium virtual terisolasi.",
      now
    );

    // Seed AI Settings
    const insertAi = db.prepare(`
      INSERT INTO institution_ai_settings (
        institution_id, ai_enabled, custom_system_prompt, allowed_domains, require_human_grade_approval, monthly_token_usage, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertAi.run(
      "inst_ui_csc",
      1,
      "Anda adalah asisten akademik cybersecurity resmi Fakultas Ilmu Komputer UI. Bantu mahasiswa memahami konsep tanpa memberikan flag CTF atau jawaban ujian langsung.",
      JSON.stringify(["linux", "networking", "web", "crypto", "forensics", "reverse"]),
      1,
      128000,
      now
    );

    insertAi.run(
      "inst_smk_idnet",
      1,
      "Anda adalah mentor AI untuk siswa SMK ID-Networkers. Berikan bimbingan ramah, praktis, dan terstruktur sesuai kurikulum kejuruan.",
      JSON.stringify(["linux", "networking", "forensics"]),
      1,
      64000,
      now
    );

    // Seed Audit Log
    const insertAudit = db.prepare(`
      INSERT INTO institution_audit_logs (id, institution_id, user_id, action, target_type, target_id, details, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAudit.run("iaud_init_ui", "inst_ui_csc", "usr_admin", "INSTITUTION_INITIALIZED", "institution", "inst_ui_csc", JSON.stringify({ note: "Enterprise workspace provisioned" }), "127.0.0.1", now);
    insertAudit.run("iaud_init_idnet", "inst_smk_idnet", "usr_admin", "INSTITUTION_INITIALIZED", "institution", "inst_smk_idnet", JSON.stringify({ note: "Education workspace provisioned" }), "127.0.0.1", now);
  }

  // 18. Seed Phase 10: Cyber Defense, Security Operations (SOC) & Incident Response
  const checkSoc = db.prepare("SELECT count(*) as count FROM soc_detection_rules").get() as { count: number };
  if (checkSoc.count === 0) {
    const now = new Date().toISOString();

    // Seed Phase 10 Achievements
    const insertAch = db.prepare(`
      INSERT OR IGNORE INTO achievements (id, code, title, description, xp_reward, icon, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertAch.run("ach_soc-analyst-tier1", "soc-analyst-tier1", "Junior SOC Analyst", "Berhasil melakukan triase alert keamanan dan mencatat analisis investigasi pertama.", 40, "ShieldAlert", "defense");
    insertAch.run("ach_incident-responder", "incident-responder", "Incident Responder", "Menyusun rencana penanganan insiden (containment & recovery) secara lengkap dan terstruktur.", 50, "Flame", "defense");
    insertAch.run("ach_threat-hunter", "threat-hunter", "Threat Intel Hunter", "Mengidentifikasi indikator ancaman (IoC) berbahaya dan memetakan ke taktik MITRE ATT&CK.", 45, "Crosshair", "defense");
    insertAch.run("ach_forensic-investigator", "forensic-investigator", "Digital Forensics Lead", "Mendokumentasikan rantai bukti digital (chain of custody) dan menghitung integritas hash SHA-256.", 50, "Search", "defense");

    // Seed Detection Rules
    const insertRule = db.prepare(`
      INSERT INTO soc_detection_rules (
        id, rule_name, category, severity, description, mitre_technique_id, mitre_tactic,
        condition_type, condition_config, is_enabled, is_simulation_only, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertRule.run(
      "rule_brute_ssh",
      "SSH Brute-Force Password Spray",
      "authentication",
      "high",
      "Mendeteksi lonjakan kegagalan autentikasi SSH berulang (>10 percobaan dalam 60 detik) dari satu sumber IP.",
      "T1110.001",
      "Credential Access",
      "threshold_frequency",
      JSON.stringify({ threshold: 10, window_seconds: 60, event_category: "authentication_failure" }),
      1,
      0,
      now
    );

    insertRule.run(
      "rule_sqli_web",
      "Web Application SQL Injection Attempt",
      "web",
      "critical",
      "Mendeteksi payload injeksi SQL klasik (' OR '1'='1, UNION SELECT, CAST, xp_cmdshell) pada query parameter HTTP.",
      "T1190",
      "Initial Access",
      "pattern_match",
      JSON.stringify({ pattern: "('|\"|--|;|UNION SELECT|OR 1=1)", event_category: "injection_attempt" }),
      1,
      0,
      now
    );

    insertRule.run(
      "rule_dns_tunnel",
      "Suspicious High-Entropy DNS Tunneling",
      "network",
      "high",
      "Mendeteksi query DNS berulang dengan label subdomain acak berentropi tinggi (>3.8 bits) yang mengindikasikan eksfiltrasi data.",
      "T1071.004",
      "Command and Control",
      "indicator_match",
      JSON.stringify({ entropy_threshold: 3.8, protocol: "DNS" }),
      1,
      0,
      now
    );

    insertRule.run(
      "rule_suid_privesc",
      "Unauthorized SUID Binary Privilege Escalation",
      "endpoint",
      "critical",
      "Mendeteksi eksekusi biner dengan bit setuid (find, nmap, vim, cp) yang menghasilkan shell interaktif root.",
      "T1548.001",
      "Privilege Escalation",
      "pattern_match",
      JSON.stringify({ targets: ["/usr/bin/find", "/bin/sh", "/usr/bin/sudo"] }),
      1,
      0,
      now
    );

    insertRule.run(
      "rule_port_scan",
      "TCP SYN Sweep Port Reconnaissance",
      "network",
      "medium",
      "Mendeteksi pengiriman paket TCP SYN beruntun ke lebih dari 15 port berbeda dalam waktu singkat.",
      "T1046",
      "Discovery",
      "threshold_frequency",
      JSON.stringify({ port_threshold: 15, window_seconds: 30 }),
      1,
      0,
      now
    );

    // Seed Defensive Assets
    const insertAsset = db.prepare(`
      INSERT INTO soc_assets (id, institution_id, name, ip_address, hostname, category, criticality, environment, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAsset.run("ast_dmz_gw", "inst_ui_csc", "Edge Perimeter Firewall & Gateway", "198.51.100.1", "gw-edge-dmz.cyberlab.local", "network_gateway", "critical", "production", "online", now);
    insertAsset.run("ast_core_db", "inst_ui_csc", "Core Academic Database Server", "10.0.1.15", "db-primary.cyberlab.local", "database", "critical", "production", "online", now);
    insertAsset.run("ast_web_portal", "inst_ui_csc", "Main Learning Web Application", "10.0.1.20", "app-portal.cyberlab.local", "server", "high", "production", "online", now);
    insertAsset.run("ast_workstation_lab", "inst_ui_csc", "SOC Analyst Training Workstation", "10.0.2.55", "ws-analyst-01.cyberlab.local", "endpoint", "medium", "lab_simulation", "online", now);

    // Seed Vulnerabilities
    const insertVuln = db.prepare(`
      INSERT INTO soc_vulnerabilities (id, asset_id, cve_id, title, severity, cvss_score, remediation_status, remediation_notes, discovered_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertVuln.run("vuln_http2_reset", "ast_web_portal", "CVE-2023-44487", "HTTP/2 Rapid Reset Denial of Service", "high", 7.5, "mitigated", "Ratelimit & stream concurrency patched pada reverse proxy.", now, now);
    insertVuln.run("vuln_log4shell", "ast_core_db", "CVE-2021-44228", "Apache Log4j2 JNDI Remote Code Execution", "critical", 10.0, "mitigated", "Dependensi Log4j diupgrade ke v2.17.1 dan JNDI lookup dimatikan permanen.", now, now);

    // Seed Threat Intelligence Indicators
    const insertIoc = db.prepare(`
      INSERT INTO soc_threat_indicators (id, indicator_type, indicator_value, source_attribution, confidence_score, severity, context_notes, first_observed_at, last_observed_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertIoc.run("ioc_ip_bruteforce", "ip", "198.51.100.23", "CISA Advisory & Internal Honeypot", 92, "high", "Sumber scanning dan spray password SSH aktif terhadap server akademik.", now, now, 1);
    insertIoc.run("ioc_ip_c2", "ip", "203.0.113.195", "AlienVault OTX & Threat Feed", 96, "critical", "Server Command and Control (C2) terafiliasi dengan payload malware infostealer.", now, now, 1);
    insertIoc.run("ioc_dom_phish", "domain", "update-service-cdn-check.biz", "Internal Incident Triage", 88, "high", "Domain mencurigakan digunakan dalam uji coba tunneling DNS dan pengunduhan backdoor.", now, now, 1);
    insertIoc.run("ioc_hash_mimikatz", "file_hash", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "Internal SOC Sandbox", 99, "critical", "Varian credential dumper terkompresi (PE executable).", now, now, 1);

    // Seed Security Playbooks
    const insertPlaybook = db.prepare(`
      INSERT INTO soc_playbooks (id, title, category, objective, trigger_conditions, required_evidence, investigation_steps, containment_steps, recovery_steps, checklist, is_official, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPlaybook.run(
      "ply_brute_force",
      "Investigasi & Mitigasi Serangan Brute-Force Kredensial",
      "brute_force",
      "Mengidentifikasi IP sumber serangan, memeriksa apakah ada akun yang berhasil dijebol, dan memblokir upaya akses lanjutan.",
      "Alert rule_brute_ssh terpicu atau terdeteksi >10 kegagalan login berturut-turut.",
      JSON.stringify(["Auth logs (/var/log/auth.log)", "Tabel sessions database", "Daftar IP sumber"]),
      JSON.stringify(["1. Filter log autentikasi berdasarkan IP penyerang", "2. Periksa apakah terdapat status 'Accepted password' setelah rentetan 'Failed password'", "3. Validasi user target apakah memiliki hak akses sudo/root"]),
      JSON.stringify(["1. Tambahkan IP penyerang ke tabel blacklist firewall / fail2ban", "2. Reset kredensial akun target jika terindikasi kompromi", "3. Wajibkan autentikasi berbasis kunci SSH (disable password authentication)"]),
      JSON.stringify(["1. Tinjau ulang audit log pasca mitigasi", "2. Pastikan service SSH berjalan normal tanpa beban CPU berlebih", "3. Laporkan insiden ke pimpinan tim keamanan"]),
      JSON.stringify(["IP penyerang diidentifikasi", "Verifikasi nihil kompromi akun", "Firewall drop rule aktif", "Tiket insiden terdokumentasi"]),
      1,
      now
    );

    insertPlaybook.run(
      "ply_sqli_response",
      "Prosedur Tanggap Darurat Web Injection & Eksfiltrasi Data",
      "web_attack",
      "Mengisolasi endpoint web yang rentan terhadap SQLi, menganalisis payload, dan memvalidasi integritas database.",
      "Alert rule_sqli_web terpicu atau Web Application Firewall (WAF) mendeteksi karakter injeksi SQL.",
      JSON.stringify(["Nginx / Web access log", "Database query execution log", "Payload URL decoded"]),
      JSON.stringify(["1. Identifikasi parameter HTTP yang dieksploitasi", "2. Replikasi kerentanan pada lingkungan staging/lab", "3. Periksa query log database untuk mendeteksi apakah data sensitif sempat tereksekusi"]),
      JSON.stringify(["1. Terapkan aturan WAF sementara untuk memblokir parameter bermasalah", "2. Perbarui kode backend menggunakan parameterized prepared statements"]),
      JSON.stringify(["1. Deploy patch kode terverifikasi ke production", "2. Uji ulang keamanan endpoint (DAST test)", "3. Dokumentasikan post-incident report"]),
      JSON.stringify(["Parameter rentan diisolasi", "Patch prepared statements deployed", "Verifikasi integritas database", "Laporan post-mortem selesai"]),
      1,
      now
    );

    // Seed Security Events (Simulation Telemetry)
    const insertEvent = db.prepare(`
      INSERT INTO soc_events (id, institution_id, timestamp, source_type, source_host, destination_host, protocol, event_category, severity, raw_payload, parsed_details, correlation_id, is_simulation, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEvent.run(
      "evt_ssh_01",
      "inst_ui_csc",
      now,
      "auth",
      "198.51.100.23",
      "10.0.1.15",
      "SSH",
      "authentication_failure",
      "high",
      "Failed password for invalid user admin from 198.51.100.23 port 48212 ssh2",
      JSON.stringify({ username: "admin", attempts: 18, port: 22 }),
      "corr_ssh_attack_01",
      1,
      now
    );

    insertEvent.run(
      "evt_web_sqli_01",
      "inst_ui_csc",
      now,
      "web",
      "203.0.113.88",
      "10.0.1.20",
      "HTTP",
      "injection_attempt",
      "critical",
      "GET /api/v1/modules?category=linux'%20OR%20'1'='1 HTTP/1.1 403 Forbidden",
      JSON.stringify({ path: "/api/v1/modules", parameter: "category", payload: "' OR '1'='1" }),
      "corr_web_attack_01",
      1,
      now
    );

    insertEvent.run(
      "evt_dns_tunnel_01",
      "inst_ui_csc",
      now,
      "dns",
      "10.0.2.55",
      "8.8.8.8",
      "DNS",
      "unusual_outbound",
      "high",
      "Query A a9f2b8c4d1e7.update-service-cdn-check.biz. TTL 60",
      JSON.stringify({ query: "a9f2b8c4d1e7.update-service-cdn-check.biz", query_type: "A", entropy: 4.1 }),
      "corr_dns_tunnel_01",
      1,
      now
    );

    insertEvent.run(
      "evt_port_scan_01",
      "inst_ui_csc",
      now,
      "network",
      "198.51.100.23",
      "198.51.100.1",
      "TCP",
      "port_scan",
      "medium",
      "TCP SYN scan detected: 25 destination ports queried in 12s",
      JSON.stringify({ ports_probed: [21, 22, 23, 25, 80, 443, 8080, 8443, 3306], count: 25 }),
      "corr_recon_01",
      1,
      now
    );

    // Seed SOC Alerts
    const insertAlert = db.prepare(`
      INSERT INTO soc_alerts (
        id, institution_id, rule_id, title, description, severity, status, affected_asset,
        source_event_ids, indicators, confidence, assigned_analyst_id, resolution_notes, is_simulation, detected_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAlert.run(
      "alr_ssh_spray",
      "inst_ui_csc",
      "rule_brute_ssh",
      "Lonjakan Kegagalan Autentikasi SSH Terdeteksi",
      "IP 198.51.100.23 melakukan 18 percobaan login gagal pada port 22 dalam 45 detik terhadap server database.",
      "high",
      "investigating",
      "Core Academic Database Server",
      JSON.stringify(["evt_ssh_01"]),
      JSON.stringify(["198.51.100.23"]),
      "high",
      "usr_budi",
      "Analisis awal: serangan otomatis (dictionary attack), tidak ada indikasi password accepted.",
      1,
      now,
      now
    );

    insertAlert.run(
      "alr_web_sqli",
      "inst_ui_csc",
      "rule_sqli_web",
      "Pola SQL Injection Terdeteksi pada Parameter Web",
      "Permintaan HTTP GET mengandung karakter kutip dan tautologi logika ' OR '1'='1.",
      "critical",
      "escalated",
      "Main Learning Web Application",
      JSON.stringify(["evt_web_sqli_01"]),
      JSON.stringify(["203.0.113.88"]),
      "high",
      "usr_admin",
      "Telah diblokir oleh WAF, eskalasi ke Incident Response untuk audit source code.",
      1,
      now,
      now
    );

    insertAlert.run(
      "alr_dns_beacon",
      "inst_ui_csc",
      "rule_dns_tunnel",
      "Anomali Query DNS Berentropi Tinggi (Indikasi C2)",
      "Workstation lab mengirimkan rentetan query subdomain berentropi 4.1 ke domain update-service-cdn-check.biz.",
      "high",
      "new",
      "SOC Analyst Training Workstation",
      JSON.stringify(["evt_dns_tunnel_01"]),
      JSON.stringify(["update-service-cdn-check.biz"]),
      "medium",
      null,
      "",
      1,
      now,
      now
    );

    // Seed Alert Notes
    const insertNote = db.prepare(`
      INSERT INTO soc_alert_notes (id, alert_id, author_id, note_text, evidence_refs, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertNote.run(
      "anot_ssh_01",
      "alr_ssh_spray",
      "usr_budi",
      "Memeriksa log /var/log/auth.log pada server target. Seluruh percobaan menggunakan akun umum (admin, root, test). Tidak ada session yang berhasil terbuka.",
      JSON.stringify(["evt_ssh_01"]),
      now
    );

    // Seed Incident
    const insertIncident = db.prepare(`
      INSERT INTO soc_incidents (
        id, institution_id, incident_number, title, category, severity, status, lead_analyst_id,
        related_alert_ids, affected_assets, timeline_events, containment_plan, eradication_plan,
        recovery_plan, lessons_learned, is_simulation, declared_at, resolved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertIncident.run(
      "inc_2026_001",
      "inst_ui_csc",
      "INC-2026-001",
      "Percobaan Akses Tidak Sah Terkoordinasi & Brute-Force SSH Server DB",
      "account_compromise",
      "high",
      "containment",
      "usr_budi",
      JSON.stringify(["alr_ssh_spray"]),
      JSON.stringify(["Core Academic Database Server"]),
      JSON.stringify([
        { timestamp: now, description: "Alert alr_ssh_spray terpicu dari 18 percobaan login SSH gagal.", source: "SOC Detection Engine" },
        { timestamp: now, description: "Analyst Budi mengkonfirmasi aktivitas serangan terarah dan mengeskalasi menjadi tiket insiden.", source: "Analyst Note" }
      ]),
      "1. Drop seluruh trafik masuk dari subnet penyerang pada gateway perimeter.\n2. Nonaktifkan otentikasi password SSH pada db-primary.",
      "1. Tinjau apakah ada SSH authorized_keys yang disusupkan.\n2. Verifikasi hash integritas biner /usr/sbin/sshd.",
      "1. Aktifkan kembali akses dengan verifikasi IP VPN internal.\n2. Pasang agent Fail2ban dengan threshold 5 kegagalan.",
      "Pentingnya mempercepat penutupan port SSH publik dan mewajibkan akses via bastion host / VPN.",
      1,
      now,
      null
    );

    // Seed Forensic Case
    const insertCase = db.prepare(`
      INSERT INTO soc_forensic_cases (id, institution_id, case_number, title, description, lead_investigator_id, status, evidence_inventory, findings_summary, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCase.run(
      "fcase_2026_001",
      "inst_ui_csc",
      "FC-2026-001",
      "Investigasi Artefak PCAP Rekaman Eksfiltrasi Data & Backdoor Traffic",
      "Pengumpulan dan verifikasi keaslian rekaman paket jaringan (PCAP) dan log sistem untuk mengungkap jejak komunikasi C2.",
      "usr_budi",
      "in_analysis",
      JSON.stringify([
        {
          id: "evd_pcap_01",
          name: "suspicious_c2_traffic.pcap",
          type: "network_pcap",
          sha256: "4b825dc642cb6eb9a060e54b3c69248f0c1a4a5ec352d3a95613a73a525a507f",
          acquired_at: now,
          acquired_by: "usr_budi",
          custody_log: "Diakuisisi dari mirror port interface eth0 switch core DMZ. Integritas hash SHA-256 terverifikasi."
        }
      ]),
      "Ditemukan 4 aliran paket TCP pada port 443 dengan TLS handshake unassigned cipher suite, bersesuaian dengan aktivitas beaconing IoC 203.0.113.195.",
      now,
      now
    );

    // Seed SOC Simulation Scenarios (Training Labs)
    const insertScenario = db.prepare(`
      INSERT INTO soc_scenarios (id, title, category, difficulty, briefing, objectives, telemetry_data, expected_mitigation, scoring_criteria, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertScenario.run(
      "scn_ssh_bruteforce",
      "Simulasi Triase Serangan SSH Password Spraying",
      "authentication",
      "beginner",
      "Sistem pemantauan mendeteksi puluhan kegagalan login SSH dari alamat IP eksternal yang tidak dikenal. Anda ditugaskan menganalisis log autentikasi, menentukan apakah ada akun yang terkompromi, dan merumuskan respons penanganan.",
      JSON.stringify([
        "Identifikasi IP penyerang dan jumlah percobaan login",
        "Periksa apakah ada username yang berhasil login (Accepted password)",
        "Tentukan tindakan penahanan (containment) yang paling tepat"
      ]),
      JSON.stringify([
        { time: "10:14:02", src: "198.51.100.23", msg: "Failed password for root from 198.51.100.23 port 51102 ssh2" },
        { time: "10:14:08", src: "198.51.100.23", msg: "Failed password for admin from 198.51.100.23 port 51103 ssh2" },
        { time: "10:14:15", src: "198.51.100.23", msg: "Failed password for student from 198.51.100.23 port 51104 ssh2" }
      ]),
      "Tambahkan rule firewall drop IP penyerang dan matikan PasswordAuthentication di sshd_config.",
      JSON.stringify({ max_score: 100, pass_threshold: 70 }),
      now
    );

    insertScenario.run(
      "scn_web_sqli_defense",
      "Triase Serangan Web SQL Injection & Data Leakage",
      "web_security",
      "intermediate",
      "Log Nginx merekam lonjakan respons HTTP 500 dan payload SQLi pada parameter pencarian modul. Sebagai analis Blue Team, telusuri dampak serangan dan sarankan perbaikan kode.",
      JSON.stringify([
        "Ekstrak parameter URL yang dijadikan sasaran injeksi",
        "Evaluasi apakah serangan berhasil mengekstrak data dari database",
        "Tuliskan rekomendasi perbaikan berbasis parameterized query"
      ]),
      JSON.stringify([
        { time: "14:22:01", src: "203.0.113.88", msg: "GET /api/v1/modules?search=1%27%20UNION%20SELECT%20null,username,password%20FROM%20users-- HTTP/1.1 200" }
      ]),
      "Ganti konkatenasi string SQL dengan Prepared Statements parameterized query.",
      JSON.stringify({ max_score: 100, pass_threshold: 70 }),
      now
    );
  }
}

export function logAudit(
  actorId: string,
  action: string,
  targetTypeOrDetails: string = "system",
  targetId: string = "none",
  details?: string
) {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const id = `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const targetType = details !== undefined ? targetTypeOrDetails : "system";
    const finalTargetId = details !== undefined ? targetId : "none";
    const finalDetails = details !== undefined ? details : targetTypeOrDetails;

    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, actorId, action, targetType, finalTargetId, finalDetails, now);
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

export function createNotification(
  userId: string,
  arg2: string,
  arg3: string,
  arg4: "info" | "achievement" | "ctf" | "comment" | "admin" | string = "info",
  arg5: string = ""
) {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const id = `notif_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const validTypes = ["info", "achievement", "ctf", "comment", "admin"];
    let type = "info";
    let title = "";
    let message = "";
    let link = "";

    if (validTypes.includes(arg4)) {
      title = arg2;
      message = arg3;
      type = arg4;
      link = arg5;
    } else if (validTypes.includes(arg2)) {
      type = arg2;
      title = arg3;
      message = arg4;
      link = arg5;
    } else {
      title = arg2;
      message = arg3;
      type = "info";
      link = typeof arg4 === "string" ? arg4 : "";
    }

    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, userId, title, message, type, link, now);
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

export function awardAchievement(userId: string, codeOrId: string) {
  try {
    const db = getDb();
    const cleanCode = codeOrId.startsWith("ach_") ? codeOrId.replace(/^ach_/, "") : codeOrId;
    const ach = db.prepare("SELECT * FROM achievements WHERE code = ? OR id = ?").get(cleanCode, codeOrId) as any;
    if (!ach) return false;

    const existing = db
      .prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_code = ?")
      .get(userId, ach.code);

    if (existing) return false;

    const id = `uach_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO user_achievements (id, user_id, achievement_code, unlocked_at)
      VALUES (?, ?, ?, ?)
    `).run(id, userId, ach.code, now);

    if (ach.xp_reward > 0) {
      db.prepare("UPDATE users SET total_xp = total_xp + ?, updated_at = ? WHERE id = ?").run(ach.xp_reward, now, userId);
    }

    createNotification(
      userId,
      `Pencapaian Terbuka: ${ach.title}!`,
      `${ach.description} (+${ach.xp_reward} XP)`,
      "achievement",
      "/progress"
    );

    return true;
  } catch (err) {
    console.error("Failed to award achievement:", err);
    return false;
  }
}

export function runTransaction<T>(callback: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE;");
  try {
    const result = callback(db);
    db.exec("COMMIT;");
    return result;
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }
}
