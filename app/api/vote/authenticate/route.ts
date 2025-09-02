import { type NextRequest, NextResponse } from "next/server"
import { query, execute } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { teamId, ldapNickname, voterGroup } = await request.json()

    // Validate input
    if (!ldapNickname) {
      return NextResponse.json({ error: "LDAP 닉네임을 입력해주세요." }, { status: 400 })
    }

    // Check if voter already exists
    const existingVoters = await query("SELECT * FROM voters WHERE ldap_nickname = ?", [ldapNickname])
    if (existingVoters.length > 0) {
      const existingVoter = existingVoters[0]
      return NextResponse.json({
        success: true,
        voter: existingVoter,
        message: "기존 투표자 정보를 불러왔습니다.",
      })
    }

    // If teamId is provided, use it; otherwise search by LDAP nickname
    let targetTeamId = teamId
    let targetVoterGroup = voterGroup

    if (!targetTeamId) {
      // Search for team by LDAP nickname in team members
      const allTeams = await query("SELECT * FROM teams")
      const foundTeam = allTeams.find((team: any) => {
        const members = [
          team.leader_name,
          team.member2_name,
          team.member3_name,
          team.member4_name
        ].filter(Boolean)
        return members.some(member => 
          member && member.toLowerCase() === ldapNickname.toLowerCase()
        )
      })

      if (foundTeam) {
        targetTeamId = foundTeam.id
        targetVoterGroup = foundTeam.team_group
      } else {
        return NextResponse.json({ 
          error: "해당 LDAP 닉네임으로 팀을 찾을 수 없습니다. 정확한 LDAP 닉네임을 입력해주세요." 
        }, { status: 400 })
      }
    }

    // Validate voter group if provided
    if (targetVoterGroup && !["A", "B", "C"].includes(targetVoterGroup)) {
      return NextResponse.json({ error: "유효하지 않은 그룹입니다." }, { status: 400 })
    }

    // Check if team exists
    const teams = await query("SELECT * FROM teams WHERE id = ?", [targetTeamId])
    if (teams.length === 0) {
      return NextResponse.json({ error: "존재하지 않는 팀입니다." }, { status: 400 })
    }

    const team = teams[0]
    
    // Use team's group if voter group is not provided
    if (!targetVoterGroup) {
      targetVoterGroup = team.team_group
    }

    // Create new voter
    const voters = await query("SELECT * FROM voters")
    const newVoterId = voters.length > 0 ? Math.max(...voters.map(v => v.id)) + 1 : 1

    const newVoter = {
      id: newVoterId,
      ldap_nickname: ldapNickname,
      team_id: targetTeamId,
      voter_group: targetVoterGroup,
      has_voted_idea: false,
      has_voted_implementation: false,
      created_at: new Date().toISOString(),
    }

    // Save to database
    await execute(
      "INSERT INTO voters (ldap_nickname, team_id, voter_group, has_voted_idea, has_voted_implementation, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        newVoter.ldap_nickname,
        newVoter.team_id,
        newVoter.voter_group,
        newVoter.has_voted_idea,
        newVoter.has_voted_implementation,
        newVoter.created_at,
      ]
    )

    return NextResponse.json({
      success: true,
      voter: newVoter,
      message: "인증이 완료되었습니다.",
    })
  } catch (error) {
    console.error("Authentication error:", error)
    return NextResponse.json({ error: "인증 중 오류가 발생했습니다." }, { status: 500 })
  }
}
