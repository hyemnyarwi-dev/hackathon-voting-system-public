import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    console.log("[v0] Teams API: Starting to fetch teams from database")

    const teams = await query(`
      SELECT 
        id,
        team_number,
        team_name,
        leader_name,
        member2_name,
        member3_name,
        member4_name,
        total_members,
        team_group,
        created_at
      FROM teams 
      ORDER BY team_group, team_number
    `)

    console.log("[v0] Teams API: Query result:", teams)
    console.log("[v0] Teams API: Number of teams found:", teams?.length || 0)

    return NextResponse.json({
      success: true,
      teams,
    })
  } catch (error) {
    console.error("[v0] Teams API: Database error:", error)
    return NextResponse.json({ error: "팀 정보를 불러오는 중 오류가 발생했습니다." }, { status: 500 })
  }
}
