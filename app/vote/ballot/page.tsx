"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Lightbulb, Users, CheckCircle, Circle, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getVoterSession, updateVoterSession, type VoterSession } from "@/lib/auth"
import type { Team } from "@/lib/database"

export default function IdeaBallotPage() {
  const [voterSession, setVoterSession] = useState<VoterSession | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const session = getVoterSession()
    if (!session) {
      router.push("/vote")
      return
    }
    
    if (session.has_voted_idea) {
      router.push("/vote/implementation")
      return
    }
    
    setVoterSession(session)
    fetchTeams(session)
  }, [router])

  const fetchTeams = async (session: VoterSession) => {
    try {
      console.log("[v0] Fetching teams for voter group:", session.voter_group)
      const response = await fetch("/api/teams")
      console.log("[v0] Teams API response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Teams API response data:", data)
        // Filter teams by group AND exclude the voter's own team
        const filteredTeams = data.teams?.filter((team: Team) => 
          team.team_group === session.voter_group && team.id !== session.team_id
        ) || []
        console.log("[v0] Filtered teams for group", session.voter_group, ":", filteredTeams)
        setTeams(filteredTeams)
      } else {
        console.log("[v0] Teams API failed with status:", response.status)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch teams:", error)
    }
  }

  const handleVote = async () => {
    if (!selectedTeam || !voterSession) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/vote/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voterId: voterSession.id,
          teamId: selectedTeam,
          voteType: "idea",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "투표 실패")
      }

      // Update session
      const updatedSession = { ...voterSession, has_voted_idea: true }
      setVoterSession(updatedSession)
      updateVoterSession({ has_voted_idea: true })

      toast({
        title: "아이디어 투표 완료",
        description: "아이디어 부문 투표가 성공적으로 완료되었습니다.",
      })

      router.push("/vote/implementation")
    } catch (error) {
      toast({
        title: "투표 실패",
        description: error instanceof Error ? error.message : "투표 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!voterSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-2">아이디어 부문 투표</h1>
            <p className="text-sm text-muted-foreground">
              투표자: {voterSession.ldap_nickname} | 그룹: {voterSession.voter_group}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">진행률</div>
              <div className="flex items-center gap-2">
                <Progress value={0} className="w-24" />
                <span className="text-xs font-medium">1/2</span>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              아이디어 부문
            </CardTitle>
            <CardDescription>
              그룹 {voterSession.voter_group}에서 가장 창의적이고 혁신적인 아이디어를 가진 팀에 투표하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center mb-4">
                <Badge className="bg-primary text-primary-foreground">
                  그룹 {voterSession.voter_group} • {teams.length}개 팀
                </Badge>
              </div>

              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedTeam === team.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedTeam === team.id ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{team.team_name}</div>
                        <div className="text-xs text-muted-foreground">팀장: {team.leader_name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{team.team_number}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {team.total_members}명
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}

              <Button onClick={handleVote} disabled={!selectedTeam || isSubmitting} className="w-full mt-6" size="lg">
                {isSubmitting ? (
                  "투표 중..."
                ) : (
                  <div className="flex items-center gap-2">
                    아이디어 부문 투표하기
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  )
}
