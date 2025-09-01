import { type NextRequest, NextResponse } from "next/server"
import { query, execute } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { voterId, teamId, voteType } = await request.json()

    // Validate input
    if (!voterId || !teamId || !voteType) {
      return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 })
    }

    if (!["idea", "implementation"].includes(voteType)) {
      return NextResponse.json({ error: "유효하지 않은 투표 유형입니다." }, { status: 400 })
    }

    // Check if voter exists
    const voters = await query("SELECT * FROM voters WHERE id = ?", [voterId])
    if (voters.length === 0) {
      return NextResponse.json({ error: "존재하지 않는 투표자입니다." }, { status: 400 })
    }

    const voter = voters[0]

    // Check if voter has already voted for this category
    if (voteType === "idea" && voter.has_voted_idea) {
      return NextResponse.json({ error: "이미 아이디어 부문에 투표하셨습니다." }, { status: 400 })
    }

    if (voteType === "implementation" && voter.has_voted_implementation) {
      return NextResponse.json({ error: "이미 완성도 부문에 투표하셨습니다." }, { status: 400 })
    }

    // Check if team exists
    const teams = await query("SELECT * FROM teams WHERE id = ?", [teamId])
    if (teams.length === 0) {
      return NextResponse.json({ error: "존재하지 않는 팀입니다." }, { status: 400 })
    }

    // Submit vote using the correct execute format
    await execute("INSERT INTO votes", [voterId, undefined, teamId, voteType, voter.ldap_nickname, undefined])

    // Update voter's voting status
    if (voteType === "idea") {
      await execute("UPDATE voters SET has_voted_idea = true", [voterId])
    } else {
      await execute("UPDATE voters SET has_voted_implementation = true", [voterId])
    }

    return NextResponse.json({
      success: true,
      message: `${voteType === "idea" ? "아이디어" : "구현/완성도"} 부문 투표가 완료되었습니다.`,
    })
  } catch (error) {
    console.error("Vote submission error:", error)
    return NextResponse.json({ error: "투표 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
}
