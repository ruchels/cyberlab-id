import { NextResponse } from "next/server";
import { getDb, logAudit, awardAchievement, createNotification } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import {
  analyzeLogs,
  analyzeNetworkTraffic,
  analyzeFileMetadata,
} from "@/lib/server/ai/security-analyzer";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const db = getDb();
    const rawReports = db
      .prepare(`
        SELECT * FROM ai_security_analyses
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `)
      .all(user.id) as any[];

    const reports = rawReports.map((r) => {
      let evidence = [];
      let indicators = [];
      let recommendations = [];
      try {
        evidence = JSON.parse(r.evidence);
      } catch {}
      try {
        indicators = JSON.parse(r.indicators);
      } catch {}
      try {
        recommendations = JSON.parse(r.recommendations);
      } catch {}

      return {
        ...r,
        evidence,
        indicators,
        recommendations,
      };
    });

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch security analyses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { analysisType, targetName = "Unknown Target", logText, packetData, filename, fileBase64 } = body;

    if (!analysisType || !["log", "pcap", "file"].includes(analysisType)) {
      return NextResponse.json({ error: "Invalid analysisType (must be 'log', 'pcap', or 'file')" }, { status: 400 });
    }

    const db = getDb();
    const id = `sec_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    let analysisResult: any = null;
    let sha256Hash = "";
    let finalTargetName = targetName;

    if (analysisType === "log") {
      if (!logText || typeof logText !== "string") {
        return NextResponse.json({ error: "logText is required for log analysis" }, { status: 400 });
      }
      analysisResult = analyzeLogs(logText);
      sha256Hash = crypto.createHash("sha256").update(logText).digest("hex");
      finalTargetName = targetName === "Unknown Target" ? "Server Access & Auth Log" : targetName;
      awardAchievement(user.id, "defensive-analyst");
    } else if (analysisType === "pcap") {
      if (!packetData) {
        return NextResponse.json({ error: "packetData is required for network traffic analysis" }, { status: 400 });
      }
      analysisResult = analyzeNetworkTraffic(packetData);
      const strData = typeof packetData === "string" ? packetData : JSON.stringify(packetData);
      sha256Hash = crypto.createHash("sha256").update(strData).digest("hex");
      finalTargetName = targetName === "Unknown Target" ? "PCAP Network Capture" : targetName;
      awardAchievement(user.id, "pcap-investigator");
    } else if (analysisType === "file") {
      if (!filename || !fileBase64) {
        return NextResponse.json({ error: "filename and fileBase64 are required for file analysis" }, { status: 400 });
      }
      const buffer = Buffer.from(fileBase64, "base64");
      analysisResult = analyzeFileMetadata(filename, buffer);
      sha256Hash = analysisResult.sha256;
      finalTargetName = filename;
      awardAchievement(user.id, "defensive-analyst");
    }

    // Save record to database
    db.prepare(`
      INSERT INTO ai_security_analyses (
        id, user_id, analysis_type, target_name, sha256_hash, summary, evidence, indicators, confidence, recommendations, limitations, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      user.id,
      analysisType,
      finalTargetName,
      sha256Hash,
      analysisResult.summary,
      JSON.stringify(analysisResult.findings || []),
      JSON.stringify(analysisResult.characteristics || analysisResult.topTalkers || []),
      analysisResult.confidence,
      JSON.stringify(analysisResult.recommendedActions || []),
      analysisResult.limitations,
      now
    );

    logAudit(user.id, "SECURITY_ANALYSIS", "ai_security_analyses", id, `Executed ${analysisType} analysis for ${finalTargetName}`);

    return NextResponse.json({
      success: true,
      reportId: id,
      targetName: finalTargetName,
      sha256: sha256Hash,
      analysis: analysisResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process security analysis" }, { status: 500 });
  }
}
