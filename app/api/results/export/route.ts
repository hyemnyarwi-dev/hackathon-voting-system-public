import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    // Fetch results data (in real implementation, this would come from database)
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/results`)
    const data = await response.json()
    const results = data.results || []

    // Prepare data for Excel export according to requirements
    const excelData = results.map((team: any) => ({
      그룹: team.team_group,
      팀명: team.team_name,
      팀장: team.leader_name,
      팀원2: team.member2_name || "",
      팀원3: team.member3_name || "",
      팀원4: team.member4_name || "",
      "팀원 수": team.total_members,
      "아이디어 총점": team.idea_votes,
      "구현/완성도 총점": team.implementation_votes,
      "아이디어 투표자": team.idea_voters.join(", "),
      "구현/완성도 투표자": team.implementation_voters.join(", "),
      "총 득표수": team.idea_votes + team.implementation_votes,
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths for better readability
    const columnWidths = [
      { wch: 8 }, // 그룹
      { wch: 20 }, // 팀명
      { wch: 15 }, // 팀장
      { wch: 15 }, // 팀원2
      { wch: 15 }, // 팀원3
      { wch: 15 }, // 팀원4
      { wch: 10 }, // 팀원 수
      { wch: 15 }, // 아이디어 총점
      { wch: 18 }, // 구현/완성도 총점
      { wch: 30 }, // 아이디어 투표자
      { wch: 30 }, // 구현/완성도 투표자
      { wch: 12 }, // 총 득표수
    ]
    worksheet["!cols"] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "투표 결과")

    // Create summary sheet with rankings
    const summaryData = [
      { 부문: "아이디어", "1위": "", "2위": "", "3위": "" },
      { 부문: "구현/완성도", "1위": "", "2위": "", "3위": "" },
    ]

    // Calculate rankings for each group
    const groups = ["A", "B", "C"]
    groups.forEach((group) => {
      const groupTeams = results.filter((team: any) => team.team_group === group)

      // Idea rankings
      const ideaRanked = groupTeams.sort((a: any, b: any) => b.idea_votes - a.idea_votes).slice(0, 3)

      // Implementation rankings
      const implRanked = groupTeams
        .sort((a: any, b: any) => b.implementation_votes - a.implementation_votes)
        .slice(0, 3)

      // Add group summary
      summaryData.push(
        {
          부문: `그룹 ${group} - 아이디어`,
          "1위": ideaRanked[0] ? `${ideaRanked[0].team_name} (${ideaRanked[0].idea_votes}표)` : "",
          "2위": ideaRanked[1] ? `${ideaRanked[1].team_name} (${ideaRanked[1].idea_votes}표)` : "",
          "3위": ideaRanked[2] ? `${ideaRanked[2].team_name} (${ideaRanked[2].idea_votes}표)` : "",
        },
        {
          부문: `그룹 ${group} - 구현/완성도`,
          "1위": implRanked[0] ? `${implRanked[0].team_name} (${implRanked[0].implementation_votes}표)` : "",
          "2위": implRanked[1] ? `${implRanked[1].team_name} (${implRanked[1].implementation_votes}표)` : "",
          "3위": implRanked[2] ? `${implRanked[2].team_name} (${implRanked[2].implementation_votes}표)` : "",
        },
      )
    })

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
    summaryWorksheet["!cols"] = [
      { wch: 25 }, // 부문
      { wch: 30 }, // 1위
      { wch: 30 }, // 2위
      { wch: 30 }, // 3위
    ]
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "순위 요약")

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

    // Return as downloadable file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="hackathon-voting-results-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Excel export error:", error)
    return NextResponse.json({ error: "Excel 파일 생성 중 오류가 발생했습니다." }, { status: 500 })
  }
}
