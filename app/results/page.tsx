"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Award, Lightbulb, Code, Users, Download, RefreshCw, Home, Lock } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useToast } from "@/hooks/use-toast"
import type { TeamWithVotes } from "@/lib/database"

interface GroupRanking {
  group: string
  teams: TeamWithVotes[]
}

export default function ResultsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState("")
  const [results, setResults] = useState<TeamWithVotes[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isAuthenticated) {
      fetchResults()
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchResults, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthenticating(true)
    setAuthError("")

    if (password === "hack2025") {
      setIsAuthenticated(true)
      setIsLoading(false)
      toast({
        title: "인증 성공",
        description: "결과 확인 페이지에 접근할 수 있습니다.",
      })
    } else {
      setAuthError("비밀번호가 올바르지 않습니다.")
    }

    setIsAuthenticating(false)
  }

  const fetchResults = async () => {
    try {
      const response = await fetch("/api/results")
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Failed to fetch results:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExcelExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/results/export", {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Excel 내보내기 실패")
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `hackathon-voting-results-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "내보내기 완료",
        description: "Excel 파일이 성공적으로 다운로드되었습니다.",
      })
    } catch (error) {
      toast({
        title: "내보내기 실패",
        description: "Excel 파일 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const getGroupColor = (group: string) => {
    switch (group) {
      case "A":
        return "bg-chart-1 text-white"
      case "B":
        return "bg-chart-2 text-white"
      case "C":
        return "bg-chart-3 text-white"
      default:
        return "bg-muted"
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm">{rank}</div>
    }
  }

  const getGroupRankings = (voteType: "idea" | "implementation"): GroupRanking[] => {
    const groupedResults = results.reduce(
      (acc, team) => {
        if (!acc[team.team_group]) {
          acc[team.team_group] = []
        }
        acc[team.team_group].push(team)
        return acc
      },
      {} as Record<string, TeamWithVotes[]>,
    )

    return Object.entries(groupedResults).map(([group, teams]) => ({
      group,
      teams: teams
        .sort((a, b) => {
          const aVotes = voteType === "idea" ? a.idea_votes : a.implementation_votes
          const bVotes = voteType === "idea" ? b.idea_votes : b.implementation_votes
          return bVotes - aVotes
        })
        .slice(0, 10), // Top 10 teams per group
    }))
  }

  const getChartData = (voteType: "idea" | "implementation") => {
    return results
      .map((team) => ({
        name: team.team_name,
        votes: voteType === "idea" ? team.idea_votes : team.implementation_votes,
        group: team.team_group,
      }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 15) // Top 15 teams for chart
  }

  const getPieChartData = (voteType: "idea" | "implementation") => {
    const groupVotes = results.reduce(
      (acc, team) => {
        const votes = voteType === "idea" ? team.idea_votes : team.implementation_votes
        acc[team.team_group] = (acc[team.team_group] || 0) + votes
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(groupVotes).map(([group, votes]) => ({
      name: `그룹 ${group}`,
      value: votes,
      group,
    }))
  }

  const totalVotes = {
    idea: results.reduce((sum, team) => sum + team.idea_votes, 0),
    implementation: results.reduce((sum, team) => sum + team.implementation_votes, 0),
  }

  const COLORS = ["#15803d", "#4ade80", "#34d399"]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>결과 확인 페이지</CardTitle>
            <CardDescription>
              이 페이지에 접근하려면 비밀번호를 입력하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthentication} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isAuthenticating}
                />
                {authError && (
                  <p className="text-sm text-red-500">{authError}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isAuthenticating || !password.trim()}
              >
                {isAuthenticating ? "인증 중..." : "접근하기"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">투표 결과 대시보드</h1>
            <p className="text-muted-foreground">마지막 업데이트: {lastUpdated.toLocaleString("ko-KR")}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => (window.location.href = "/")} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              홈으로 돌아가기
            </Button>
            <Button onClick={fetchResults} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
            <Button onClick={handleExcelExport} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "내보내는 중..." : "Excel 다운로드"}
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 참가팀</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">아이디어 총 투표수</CardTitle>
              <Lightbulb className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVotes.idea}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">구현/완성도 총 투표수</CardTitle>
              <Code className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVotes.implementation}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 투표수</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVotes.idea + totalVotes.implementation}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 득표수</CardTitle>
              <Trophy className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {results.length > 0 ? Math.round((totalVotes.idea + totalVotes.implementation) / results.length) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overall" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overall" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              종합 순위
            </TabsTrigger>
            <TabsTrigger value="idea" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              아이디어 부문
            </TabsTrigger>
            <TabsTrigger value="implementation" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              완성도 부문
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-6">
            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>상위 15팀 종합 득표수</CardTitle>
                  <CardDescription>아이디어 + 완성도 부문 총 득표 현황</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={results
                      .map((team) => ({
                        name: team.team_name,
                        votes: team.idea_votes + team.implementation_votes,
                        group: team.team_group,
                      }))
                      .sort((a, b) => b.votes - a.votes)
                      .slice(0, 15)
                    }>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="votes" fill="#15803d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>그룹별 종합 득표 분포</CardTitle>
                  <CardDescription>각 그룹의 총 득표수 비율</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(results.reduce((acc, team) => {
                          const totalVotes = team.idea_votes + team.implementation_votes
                          acc[team.team_group] = (acc[team.team_group] || 0) + totalVotes
                          return acc
                        }, {} as Record<string, number>))
                        .map(([group, votes]) => ({
                          name: `그룹 ${group}`,
                          value: votes,
                          group,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(results.reduce((acc, team) => {
                          const totalVotes = team.idea_votes + team.implementation_votes
                          acc[team.team_group] = (acc[team.team_group] || 0) + totalVotes
                          return acc
                        }, {} as Record<string, number>))
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Group Rankings */}
            <div className="grid lg:grid-cols-3 gap-6">
              {["A", "B", "C"].map((group) => {
                const groupTeams = results
                  .filter((team) => team.team_group === group)
                  .map((team) => ({
                    ...team,
                    total_votes: team.idea_votes + team.implementation_votes,
                  }))
                  .sort((a, b) => b.total_votes - a.total_votes)
                  .slice(0, 10)

                return (
                  <Card key={group}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge className={getGroupColor(group)}>그룹 {group}</Badge>
                        종합 순위
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {groupTeams.map((team, index) => (
                          <div
                            key={team.id}
                            className={`flex items-center gap-3 p-3 rounded-lg ${
                              index < 3 ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
                            }`}
                          >
                            <div className="flex-shrink-0">{getRankIcon(index + 1)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{team.team_name}</div>
                              <div className="text-sm text-muted-foreground">팀장: {team.leader_name}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">{team.total_votes}</div>
                              <div className="text-xs text-muted-foreground">
                                ({team.idea_votes} + {team.implementation_votes})
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Overall Rankings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  전체 종합 순위 (상위 20팀)
                </CardTitle>
                <CardDescription>
                  아이디어 + 완성도 부문 총 득표수 기준 순위
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results
                    .map((team) => ({
                      ...team,
                      total_votes: team.idea_votes + team.implementation_votes,
                    }))
                    .sort((a, b) => b.total_votes - a.total_votes)
                    .slice(0, 20)
                    .map((team, index) => (
                      <div
                        key={team.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                          index < 3 ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {index < 3 ? (
                            getRankIcon(index + 1)
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{team.team_name}</div>
                          <div className="text-sm text-muted-foreground">팀장: {team.leader_name}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">아이디어</div>
                            <div className="font-bold text-sm">{team.idea_votes}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">완성도</div>
                            <div className="font-bold text-sm">{team.implementation_votes}</div>
                          </div>
                          <div className="text-center border-l pl-4">
                            <div className="text-xs text-muted-foreground">총점</div>
                            <div className="font-bold text-lg text-primary">{team.total_votes}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            #{team.team_number}
                          </Badge>
                          <Badge className={`text-xs ${getGroupColor(team.team_group)}`}>
                            {team.team_group}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="idea" className="space-y-6">
            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>상위 15팀 득표수</CardTitle>
                  <CardDescription>아이디어 부문 상위 팀들의 득표 현황</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getChartData("idea")}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="votes" fill="#15803d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>그룹별 득표 분포</CardTitle>
                  <CardDescription>각 그룹의 총 득표수 비율</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getPieChartData("idea")}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getPieChartData("idea").map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Rankings */}
            <div className="grid lg:grid-cols-3 gap-6">
              {getGroupRankings("idea").map((groupRanking) => (
                <Card key={groupRanking.group}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge className={getGroupColor(groupRanking.group)}>그룹 {groupRanking.group}</Badge>
                      순위
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {groupRanking.teams.map((team, index) => (
                        <div
                          key={team.id}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            index < 3 ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
                          }`}
                        >
                          <div className="flex-shrink-0">{getRankIcon(index + 1)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{team.team_name}</div>
                            <div className="text-sm text-muted-foreground">팀장: {team.leader_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{team.idea_votes}</div>
                            <div className="text-xs text-muted-foreground">표</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="implementation" className="space-y-6">
            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>상위 15팀 득표수</CardTitle>
                  <CardDescription>완성도 부문 상위 팀들의 득표 현황</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getChartData("implementation")}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="votes" fill="#4ade80" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>그룹별 득표 분포</CardTitle>
                  <CardDescription>각 그룹의 총 득표수 비율</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getPieChartData("implementation")}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getPieChartData("implementation").map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Rankings */}
            <div className="grid lg:grid-cols-3 gap-6">
              {getGroupRankings("implementation").map((groupRanking) => (
                <Card key={groupRanking.group}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge className={getGroupColor(groupRanking.group)}>그룹 {groupRanking.group}</Badge>
                      순위
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {groupRanking.teams.map((team, index) => (
                        <div
                          key={team.id}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            index < 3 ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
                          }`}
                        >
                          <div className="flex-shrink-0">{getRankIcon(index + 1)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{team.team_name}</div>
                            <div className="text-sm text-muted-foreground">팀장: {team.leader_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{team.implementation_votes}</div>
                            <div className="text-xs text-muted-foreground">표</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
