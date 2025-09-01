import { type NextRequest, NextResponse } from "next/server"
import { query, execute } from "@/lib/database"
import type { Team } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { teams }: { teams: Team[] } = await request.json()
    console.log("[v0] Save Teams API: Received teams data:", teams?.length || 0, "teams")

    if (!teams || teams.length === 0) {
      return NextResponse.json({ error: "팀 데이터가 없습니다." }, { status: 400 })
    }

    console.log("[v0] Save Teams API: Clearing existing teams")
    // Clear existing teams
    await execute("DELETE FROM teams")

    console.log("[v0] Save Teams API: Inserting new teams")
    // Insert new teams
    for (const team of teams) {
      console.log("[v0] Save Teams API: Inserting team:", team.team_name)
      await execute(
        `INSERT INTO teams (team_number, leader_name, member2_name, member3_name, member4_name, team_name, total_members, team_group) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          team.team_number,
          team.leader_name,
          team.member2_name || null,
          team.member3_name || null,
          team.member4_name || null,
          team.team_name,
          team.total_members,
          team.team_group,
        ],
      )
    }

    console.log("[v0] Save Teams API: Successfully saved all teams")
    return NextResponse.json({
      success: true,
      message: `${teams.length}개 팀이 성공적으로 저장되었습니다.`,
    })
  } catch (error) {
    console.error("[v0] Save Teams API: Database error:", error)
    return NextResponse.json({ error: "팀 저장 중 오류가 발생했습니다." }, { status: 500 })
  }
}
