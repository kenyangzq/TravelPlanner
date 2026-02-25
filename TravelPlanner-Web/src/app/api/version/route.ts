import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const versionPath = join(process.cwd(), "VERSION");
    const version = readFileSync(versionPath, "utf-8").trim();
    return NextResponse.json({ version });
  } catch (error) {
    return NextResponse.json({ version: "unknown" }, { status: 200 });
  }
}
