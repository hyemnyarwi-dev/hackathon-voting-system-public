import { NextRequest, NextResponse } from "next/server"
import { query, execute } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { judgeId, teamId, voteType } = await request.json()

    if (!judgeId || !teamId || !voteType) {
      return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 })
    }

    if (!["idea", "implementation"].includes(voteType)) {
      return NextResponse.json({ error: "올바른 투표 유형이 아닙니다." }, { status: 400 })
    }

    // Check if judge exists
    const judges = await query("SELECT * FROM judges WHERE id = ?", [judgeId])
    if (judges.length === 0) {
      return NextResponse.json({ error: "심사위원을 찾을 수 없습니다." }, { status: 404 })
    }

    const judge = judges[0]

    // Check if team exists
    const teams = await query("SELECT * FROM teams WHERE id = ?", [teamId])
    if (teams.length === 0) {
      return NextResponse.json({ error: "팀을 찾을 수 없습니다." }, { status: 404 })
    }

    const team = teams[0]

    // Check vote limits
    if (voteType === "idea") {
      if (judge.idea_votes_used >= 2) {
        return NextResponse.json({ error: "아이디어 부문 투표는 최대 2표까지 가능합니다." }, { status: 400 })
      }
    } else {
      if (judge.implementation_votes_used >= 2) {
        return NextResponse.json({ error: "완성도 부문 투표는 최대 2표까지 가능합니다." }, { status: 400 })
      }
    }

    // Check if judge has already voted for this team in this category
    const existingVotes = await query("SELECT * FROM votes WHERE judge_id = ? AND team_id = ? AND vote_type = ?", [judgeId, teamId, voteType])
    if (existingVotes.length > 0) {
      return NextResponse.json({ error: "이미 해당 팀에 투표하셨습니다." }, { status: 400 })
    }

    // Submit vote
    await execute("INSERT INTO votes", [undefined, judgeId, teamId, voteType, undefined, judge.name])

    // Update judge's voting status
    if (voteType === "idea") {
      await execute("UPDATE judges SET has_voted_idea = true", [judgeId])
    } else {
      await execute("UPDATE judges SET has_voted_implementation = true", [judgeId])
    }

    return NextResponse.json({
      success: true,
      message: "투표가 성공적으로 제출되었습니다.",
    })
  } catch (error) {
    console.error("Judge vote submission error:", error)
    return NextResponse.json({ error: "투표 제출 중 오류가 발생했습니다." }, { status: 500 })
  }
} 