import { NextRequest, NextResponse } from "next/server"
import { query, execute } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { name, judgeGroup } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "심사위원 이름을 입력해주세요." }, { status: 400 })
    }

    if (!judgeGroup || !["A", "B", "C"].includes(judgeGroup)) {
      return NextResponse.json({ error: "올바른 심사 그룹을 선택해주세요." }, { status: 400 })
    }

    // Check if judge already exists
    const existingJudges = await query("SELECT * FROM judges WHERE name = ?", [name.trim()])
    let judge

    if (existingJudges.length > 0) {
      judge = existingJudges[0]
      // Update judge group if different
      if (judge.judge_group !== judgeGroup) {
        // For now, we'll just use the existing judge with their original group
        // You might want to add logic to handle group changes
      }
    } else {
      // Create new judge
      await execute("INSERT INTO judges", [name.trim(), judgeGroup])
      const newJudges = await query("SELECT * FROM judges WHERE name = ?", [name.trim()])
      judge = newJudges[0]
    }

    return NextResponse.json({
      success: true,
      judge: {
        id: judge.id,
        name: judge.name,
        judge_group: judge.judge_group,
        has_voted_idea: judge.has_voted_idea,
        has_voted_implementation: judge.has_voted_implementation,
        idea_votes_used: judge.idea_votes_used,
        implementation_votes_used: judge.implementation_votes_used,
      },
    })
  } catch (error) {
    console.error("Judge authentication error:", error)
    return NextResponse.json({ error: "심사위원 인증 중 오류가 발생했습니다." }, { status: 500 })
  }
} 