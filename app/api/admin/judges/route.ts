import { NextRequest, NextResponse } from "next/server"
import { readData, writeData } from "@/lib/database"
import type { Judge } from "@/lib/database"

export async function GET() {
  try {
    const judges = readData<Judge>("data/judges.json")
    
    return NextResponse.json({
      success: true,
      judges: judges,
    })
  } catch (error) {
    console.error("Judges fetch error:", error)
    return NextResponse.json({ error: "심사위원 목록을 불러오는 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, judgeGroup } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "심사위원 이름을 입력해주세요." }, { status: 400 })
    }

    if (!judgeGroup || !["A", "B", "C"].includes(judgeGroup)) {
      return NextResponse.json({ error: "올바른 심사 그룹을 선택해주세요." }, { status: 400 })
    }

    const judges = readData<Judge>("data/judges.json")
    
    // Check if judge already exists
    const existingJudge = judges.find(j => j.name.toLowerCase() === name.trim().toLowerCase())
    if (existingJudge) {
      return NextResponse.json({ error: "이미 존재하는 심사위원입니다." }, { status: 400 })
    }

    // Create new judge
    const newJudge: Judge = {
      id: judges.length > 0 ? Math.max(...judges.map(j => j.id)) + 1 : 1,
      name: name.trim(),
      judge_group: judgeGroup as "A" | "B" | "C",
      has_voted_idea: false,
      has_voted_implementation: false,
      idea_votes_used: 0,
      implementation_votes_used: 0,
      created_at: new Date().toISOString()
    }

    judges.push(newJudge)
    writeData("data/judges.json", judges)

    return NextResponse.json({
      success: true,
      message: `${newJudge.name} 심사위원이 성공적으로 추가되었습니다.`,
      judge: newJudge
    })
  } catch (error) {
    console.error("Judge creation error:", error)
    return NextResponse.json({ error: "심사위원 추가 중 오류가 발생했습니다." }, { status: 500 })
  }
} 