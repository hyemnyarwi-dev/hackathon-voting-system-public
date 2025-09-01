import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const teams = await query("SELECT * FROM teams ORDER BY team_group, team_number")

    return NextResponse.json({ teams })
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "팀 목록을 가져오는 중 오류가 발생했습니다." }, { status: 500 })
  }
}
