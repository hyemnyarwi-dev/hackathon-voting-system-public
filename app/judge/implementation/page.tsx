"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Code, Users, CheckCircle, Circle, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Team } from "@/lib/database"

interface JudgeSession {
  id: number
  name: string
  judge_group: "A" | "B" | "C"
  has_voted_idea: boolean
  has_voted_implementation: boolean
  idea_votes_used: number
  implementation_votes_used: number
}

export default function JudgeImplementationBallotPage() {
  const [judgeSession, setJudgeSession] = useState<JudgeSession | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeams, setSelectedTeams] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const session = sessionStorage.getItem("judgeSession")
    if (!session) {
      router.push("/judge")
      return
    }

    const judgeData = JSON.parse(session)
    
    // Check if idea voting is not completed
    if (judgeData.idea_votes_used < 2) {
      router.push("/judge/ballot")
      return
    }

    // Check if already voted for implementation
    if (judgeData.implementation_votes_used >= 2) {
      router.push("/judge/complete")
      return
    }

    setJudgeSession(judgeData)
    fetchTeams(judgeData.judge_group)
  }, [router])

  const fetchTeams = async (judgeGroup: string) => {
    try {
      const response = await fetch("/api/teams")
      if (response.ok) {
        const data = await response.json()
        const filteredTeams = data.teams?.filter((team: Team) => team.team_group === judgeGroup) || []
        setTeams(filteredTeams)
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error)
    }
  }

  const handleTeamSelect = (teamId: number) => {
    setSelectedTeams(prev => {
      const maxVotes = 2
      
      if (prev.includes(teamId)) {
        // Remove team if already selected
        return prev.filter(id => id !== teamId)
      } else if (prev.length < maxVotes) {
        // Add team if under limit
        return [...prev, teamId]
      } else {
        // Show error if at limit
        toast({
          title: "투표 제한",
          description: "완성도 부문은 최대 2표까지 투표 가능합니다.",
          variant: "destructive",
        })
        return prev
      }
    })
  }

  const handleVote = async () => {
    if (selectedTeams.length === 0) {
      toast({
        title: "투표 선택 필요",
        description: "투표할 팀을 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      for (const teamId of selectedTeams) {
        const response = await fetch("/api/judge/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            judgeId: judgeSession!.id,
            teamId,
            voteType: "implementation",
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "투표 실패")
        }
      }

      // Update session
      const updatedSession = {
        ...judgeSession!,
        implementation_votes_used: judgeSession!.implementation_votes_used + selectedTeams.length
      }
      setJudgeSession(updatedSession)
      sessionStorage.setItem("judgeSession", JSON.stringify(updatedSession))

      toast({
        title: "완성도 투표 완료",
        description: `${selectedTeams.length}개 팀에 투표가 완료되었습니다.`,
      })

      // Redirect to completion page
      setTimeout(() => {
        router.push("/judge/complete")
      }, 2000)
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

  if (!judgeSession) {
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
            <h1 className="text-2xl font-bold text-foreground mb-2">심사위원 완성도 투표</h1>
            <p className="text-sm text-muted-foreground">
              심사위원: {judgeSession.name} | 그룹: {judgeSession.judge_group}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">진행률</div>
              <div className="flex items-center gap-2">
                <Progress value={(judgeSession.implementation_votes_used / 2) * 100} className="w-24" />
                <span className="text-xs font-medium">{judgeSession.implementation_votes_used}/2</span>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Code className="h-5 w-5 text-blue-500" />
              완성도 부문
            </CardTitle>
            <CardDescription>
              가장 완성도가 높고 기술적으로 우수한 구현을 한 팀에 투표하세요. (최대 2표)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center mb-4">
                <Badge className="bg-primary text-primary-foreground">
                  선택된 팀: {selectedTeams.length}/2
                </Badge>
              </div>

              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleTeamSelect(team.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedTeams.includes(team.id)
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedTeams.includes(team.id) ? (
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

              <Button 
                onClick={handleVote} 
                disabled={selectedTeams.length === 0 || isSubmitting} 
                className="w-full mt-6" 
                size="lg"
              >
                {isSubmitting ? (
                  "투표 중..."
                ) : (
                  <div className="flex items-center gap-2">
                    완성도 부문 투표하기 ({selectedTeams.length}표)
                    <Trophy className="h-4 w-4" />
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