import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 })
    }

    // Read the Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    // Skip header row and process data
    const teams = jsonData
      .slice(1)
      .map((row, index) => {
        const [no, leader_name, member2_name, member3_name, member4_name, team_name, total_members, team_group] = row

        return {
          team_number: Number.parseInt(no) || index + 1,
          team_name: team_name || `팀 ${index + 1}`,
          leader_name: leader_name || "",
          member2_name: member2_name || null,
          member3_name: member3_name || null,
          member4_name: member4_name || null,
          total_members: Number.parseInt(total_members) || 1,
          team_group: (team_group || "A").toString().toUpperCase(),
        }
      })
      .filter((team) => team.leader_name) // Filter out empty rows

    // Clear all existing data before uploading new teams
    await query("DELETE FROM teams")
    await query("DELETE FROM voters")
    await query("DELETE FROM judges")
    await query("DELETE FROM votes")

    for (const team of teams) {
      await query(
        `INSERT INTO teams (team_number, team_name, leader_name, member2_name, member3_name, member4_name, total_members, team_group) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          team.team_number,
          team.team_name,
          team.leader_name,
          team.member2_name,
          team.member3_name,
          team.member4_name,
          team.total_members,
          team.team_group,
        ],
      )
    }

    return NextResponse.json({
      success: true,
      teams,
      message: `${teams.length}개 팀이 성공적으로 저장되었습니다. 이전 투표 이력이 모두 삭제되었습니다.`,
    })
  } catch (error) {
    console.error("Excel upload error:", error)
    return NextResponse.json({ error: "파일 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
}
