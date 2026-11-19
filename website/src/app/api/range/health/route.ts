import { NextResponse } from "next/server";
import { getCyberRangeHealth } from "@/lib/server/range/driver";

export async function GET() {
  try {
    const health = getCyberRangeHealth();
    return NextResponse.json({ health });
  } catch (error) {
    console.error("Range Health Error:", error);
    return NextResponse.json({ error: "Gagal memuat status kesehatan Cyber Range." }, { status: 500 });
  }
}
