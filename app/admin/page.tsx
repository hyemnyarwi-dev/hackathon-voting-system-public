"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Upload, Trash2, Users, FileSpreadsheet, Home, RefreshCw, UserCheck, RotateCcw, Award, Lock } from "lucide-react"
import type { Team, Voter, Judge } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState("")
  const [teams, setTeams] = useState<Team[]>([])
  const [voters, setVoters] = useState<Voter[]>([])
  const [judges, setJudges] = useState<Judge[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingVoters, setIsLoadingVoters] = useState(false)
  const [isLoadingJudges, setIsLoadingJudges] = useState(false)
  const [isResettingVotes, setIsResettingVotes] = useState(false)
  const [newJudgeName, setNewJudgeName] = useState("")
  const [newJudgeGroup, setNewJudgeGroup] = useState("")
  const [isAddingJudge, setIsAddingJudge] = useState(false)
  const [isDeletingJudge, setIsDeletingJudge] = useState(false)
  const [isUploadingAuthCodes, setIsUploadingAuthCodes] = useState(false)
  const [uploadedAuthCodesFile, setUploadedAuthCodesFile] = useState<File | null>(null)
  const { toast } = useToast()

  // Load existing teams from database on page load
  useEffect(() => {
    if (isAuthenticated) {
      fetchExistingTeams()
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
        description: "관리자 대시보드에 접근할 수 있습니다.",
      })
    } else {
      setAuthError("비밀번호가 올바르지 않습니다.")
    }

    setIsAuthenticating(false)
  }

  const fetchExistingTeams = async () => {
    try {
      const response = await fetch("/api/teams")
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error("Failed to fetch existing teams:", error)
      toast({
        title: "데이터 로드 실패",
        description: "기존 팀 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchVoters = async () => {
    setIsLoadingVoters(true)
    try {
      const response = await fetch("/api/admin/voters")
      if (response.ok) {
        const data = await response.json()
        setVoters(data.voters || [])
      }
    } catch (error) {
      console.error("Failed to fetch voters:", error)
      toast({
        title: "투표자 데이터 로드 실패",
        description: "투표자 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingVoters(false)
    }
  }

  const fetchJudges = async () => {
    setIsLoadingJudges(true)
    try {
      const response = await fetch("/api/admin/judges")
      if (response.ok) {
        const data = await response.json()
        setJudges(data.judges || [])
      }
    } catch (error) {
      console.error("Failed to fetch judges:", error)
      toast({
        title: "심사위원 데이터 로드 실패",
        description: "심사위원 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingJudges(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast({
        title: "파일 형식 오류",
        description: "Excel 파일(.xlsx, .xls)만 업로드 가능합니다.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/upload-teams", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("파일 업로드 실패")
      }

      const result = await response.json()
      setTeams(result.teams)

      toast({
        title: "업로드 성공",
        description: `${result.teams.length}개 팀이 성공적으로 업로드되었습니다.`,
      })
    } catch (error) {
      toast({
        title: "업로드 실패",
        description: "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteTeam = async (teamId: number) => {
    try {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("팀 삭제 실패")
      }

      await fetchExistingTeams() // Refresh after deleting
      toast({
        title: "삭제 완료",
        description: "팀이 성공적으로 삭제되었습니다.",
      })
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: "팀 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleSaveTeams = async () => {
    if (teams.length === 0) {
      toast({
        title: "저장할 팀 없음",
        description: "저장할 팀 데이터가 없습니다.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/admin/save-teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teams }),
      })

      if (!response.ok) {
        throw new Error("팀 데이터 저장 실패")
      }

      await fetchExistingTeams() // Refresh after saving
      toast({
        title: "저장 완료",
        description: `${teams.length}개 팀이 성공적으로 저장되었습니다.`,
      })
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "팀 데이터 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetVotes = async (voterId: number) => {
    setIsResettingVotes(true)
    try {
      const response = await fetch(`/api/admin/voters/${voterId}/reset-votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voterId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "투표 초기화 실패")
      }

      const result = await response.json()
      await fetchVoters() // Refresh voter list
      toast({
        title: "투표 초기화 완료",
        description: result.message,
      })
    } catch (error) {
      toast({
        title: "투표 초기화 실패",
        description: error instanceof Error ? error.message : "투표 초기화 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsResettingVotes(false)
    }
  }

  const handleResetJudgeVotes = async (judgeId: number) => {
    setIsResettingVotes(true)
    try {
      const response = await fetch(`/api/admin/judges/${judgeId}/reset-votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ judgeId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "심사위원 투표 초기화 실패")
      }

      const result = await response.json()
      await fetchJudges() // Refresh judge list
      toast({
        title: "심사위원 투표 초기화 완료",
        description: result.message,
      })
    } catch (error) {
      toast({
        title: "심사위원 투표 초기화 실패",
        description: error instanceof Error ? error.message : "심사위원 투표 초기화 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsResettingVotes(false)
    }
  }

  const handleAddJudge = async () => {
    if (!newJudgeName.trim() || !newJudgeGroup) {
      toast({
        title: "추가 실패",
        description: "심사위원 이름과 그룹을 모두 입력해야 합니다.",
        variant: "destructive",
      })
      return
    }

    setIsAddingJudge(true)

    try {
      const response = await fetch("/api/admin/judges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newJudgeName, judgeGroup: newJudgeGroup }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "심사위원 추가 실패")
      }

      const result = await response.json()
      await fetchJudges() // Refresh judge list
      toast({
        title: "심사위원 추가 완료",
        description: result.message,
      })
      setNewJudgeName("")
      setNewJudgeGroup("")
    } catch (error) {
      toast({
        title: "심사위원 추가 실패",
        description: error instanceof Error ? error.message : "심사위원 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsAddingJudge(false)
    }
  }

  const handleDeleteJudge = async (judgeId: number) => {
    setIsDeletingJudge(true)
    try {
      const response = await fetch(`/api/admin/judges/${judgeId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ judgeId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "심사위원 삭제 실패")
      }

      const result = await response.json()
      await fetchJudges() // Refresh judge list
      toast({
        title: "심사위원 삭제 완료",
        description: result.message,
      })
    } catch (error) {
      toast({
        title: "심사위원 삭제 실패",
        description: error instanceof Error ? error.message : "심사위원 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingJudge(false)
    }
  }

  const handleAuthCodesFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedAuthCodesFile(file)
      toast({
        title: "파일 선택 완료",
        description: `${file.name} 파일이 선택되었습니다. 업데이트 버튼을 클릭하여 적용하세요.`,
      })
    }
  }

  const handleAuthCodesUpload = async () => {
    if (!uploadedAuthCodesFile) {
      toast({
        title: "파일 선택 필요",
        description: "인증 번호 파일을 먼저 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsUploadingAuthCodes(true)
    try {
      const formData = new FormData()
      formData.append("file", uploadedAuthCodesFile)

      const response = await fetch("/api/admin/upload-auth-codes", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "인증 번호 업로드 완료",
          description: data.message,
        })
        fetchExistingTeams() // 팀 목록 새로고침
        setUploadedAuthCodesFile(null) // 파일 상태 초기화
      } else {
        throw new Error(data.error || "업로드 실패")
      }
    } catch (error) {
      toast({
        title: "업로드 실패",
        description: error instanceof Error ? error.message : "인증 번호 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAuthCodes(false)
    }
  }

  const getVoteStatusBadge = (voter: Voter) => {
    if (voter.has_voted_idea && voter.has_voted_implementation) {
      return <Badge className="bg-green-500 text-white">완료</Badge>
    } else if (voter.has_voted_idea || voter.has_voted_implementation) {
      return <Badge className="bg-yellow-500 text-white">부분 완료</Badge>
    } else {
      return <Badge variant="outline">미완료</Badge>
    }
  }

  const getJudgeStatusBadge = (judge: Judge) => {
    const totalVotes = judge.idea_votes_used + judge.implementation_votes_used
    if (totalVotes >= 4) {
      return <Badge className="bg-green-500 text-white">완료 (4표)</Badge>
    } else if (totalVotes > 0) {
      return <Badge className="bg-yellow-500 text-white">부분 완료 ({totalVotes}표)</Badge>
    } else {
      return <Badge variant="outline">미완료</Badge>
    }
  }

  const getTeamNameById = (teamId: number) => {
    const team = teams.find(t => t.id === teamId)
    return team ? team.team_name : `팀 ${teamId}`
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>관리자 대시보드</CardTitle>
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">관리자 대시보드</h1>
            <p className="text-muted-foreground">팀 관리 및 투표자 관리</p>
          </div>
          <Button onClick={() => (window.location.href = "/")} variant="outline">
            <Home className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Button>
        </div>

        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              팀 관리
            </TabsTrigger>
            <TabsTrigger value="judges" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              심사위원 관리
            </TabsTrigger>
            <TabsTrigger value="voters" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              투표자 관리
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-6">
            {/* Team Management Section */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  팀 데이터 업로드
            </CardTitle>
            <CardDescription>
                  Excel 파일을 업로드하여 팀 정보를 관리하세요.
            </CardDescription>
          </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Excel 파일 선택</Label>
                <Input
                    id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    지원 형식: .xlsx, .xls
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveTeams} disabled={teams.length === 0 || isSaving}>
                    {isSaving ? "저장 중..." : "업데이트(저장)"}
                  </Button>
                </div>
          </CardContent>
        </Card>

        {/* Auth Codes Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              인증 번호 업로드
            </CardTitle>
            <CardDescription>
              인증 번호 Excel 파일을 업로드하여 팀별 인증 번호를 관리하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth-codes-upload">인증 번호 Excel 파일 선택</Label>
              <Input
                id="auth-codes-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleAuthCodesFileSelect}
                disabled={isUploadingAuthCodes}
              />
              <p className="text-xs text-muted-foreground">
                지원 형식: .xlsx, .xls (팀 번호, 팀명, 멤버 구분, LDAP 닉네임, 인증 번호 컬럼 포함)
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleAuthCodesUpload} 
                disabled={!uploadedAuthCodesFile || isUploadingAuthCodes}
              >
                {isUploadingAuthCodes ? "업로드 중..." : "업데이트(저장)"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teams Table */}
        <Card>
          <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  등록된 팀 목록 ({teams.length}개)
                </CardTitle>
                <CardDescription>
                  현재 등록된 모든 팀 정보입니다.
                </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                        <TableHead>팀 번호</TableHead>
                      <TableHead>팀명</TableHead>
                      <TableHead>팀장</TableHead>
                      <TableHead>팀원</TableHead>
                      <TableHead>그룹</TableHead>
                      <TableHead>인증번호</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                          <TableCell className="font-medium">#{team.team_number}</TableCell>
                          <TableCell>{team.team_name}</TableCell>
                        <TableCell>{team.leader_name}</TableCell>
                        <TableCell>
                            {[team.member2_name, team.member3_name, team.member4_name]
                              .filter(Boolean)
                              .join(", ")}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-white ${getGroupColor(team.team_group)}`}>
                              {team.team_group}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              {team.leader_name && (
                                <div><strong>{team.leader_name}</strong> : {team.leader_auth_code || "미설정"}</div>
                              )}
                              {team.member2_name && (
                                <div><strong>{team.member2_name}</strong> : {team.member2_auth_code || "미설정"}</div>
                              )}
                              {team.member3_name && (
                                <div><strong>{team.member3_name}</strong> : {team.member3_auth_code || "미설정"}</div>
                              )}
                              {team.member4_name && (
                                <div><strong>{team.member4_name}</strong> : {team.member4_auth_code || "미설정"}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>팀 삭제 확인</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    정말로 "{team.team_name}" 팀을 삭제하시겠습니까?
                                    이 작업은 되돌릴 수 없습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTeam(team.id)}>
                                    삭제
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="judges" className="space-y-6">
            {/* Judge Management Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  심사위원 추가
                </CardTitle>
                <CardDescription>
                  새로운 심사위원을 추가할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="judge-name">심사위원 이름</Label>
                    <Input
                      id="judge-name"
                      placeholder="심사위원 이름을 입력하세요"
                      value={newJudgeName}
                      onChange={(e) => setNewJudgeName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="judge-group">심사 그룹</Label>
                    <Select value={newJudgeGroup} onValueChange={setNewJudgeGroup}>
                      <SelectTrigger>
                        <SelectValue placeholder="심사 그룹을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-chart-1 text-white">A</Badge>
                            그룹 A
                          </div>
                        </SelectItem>
                        <SelectItem value="B">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-chart-2 text-white">B</Badge>
                            그룹 B
                          </div>
                        </SelectItem>
                        <SelectItem value="C">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-chart-3 text-white">C</Badge>
                            그룹 C
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={handleAddJudge} 
                  disabled={!newJudgeName.trim() || !newJudgeGroup || isAddingJudge}
                  className="w-full mt-4"
                >
                  {isAddingJudge ? "추가 중..." : "심사위원 추가"}
                </Button>
              </CardContent>
            </Card>

            {/* Judges List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  심사위원 목록 ({judges.length}명)
                </CardTitle>
                <CardDescription>
                  등록된 모든 심사위원 목록입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button onClick={fetchJudges} disabled={isLoadingJudges}>
                    {isLoadingJudges ? "로딩 중..." : "심사위원 목록 새로고침"}
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>심사위원 이름</TableHead>
                        <TableHead>심사 그룹</TableHead>
                        <TableHead>투표 상태</TableHead>
                        <TableHead>아이디어 투표</TableHead>
                        <TableHead>완성도 투표</TableHead>
                        <TableHead>작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {judges.map((judge) => (
                        <TableRow key={judge.id}>
                          <TableCell className="font-medium">{judge.id}</TableCell>
                          <TableCell>{judge.name}</TableCell>
                          <TableCell>
                            <Badge className={`text-white ${getGroupColor(judge.judge_group)}`}>
                              {judge.judge_group}
                            </Badge>
                        </TableCell>
                          <TableCell>{getJudgeStatusBadge(judge)}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {judge.idea_votes_used}/2
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {judge.implementation_votes_used}/2
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={isDeletingJudge}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>심사위원 삭제 확인</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    정말로 "{judge.name}" 심사위원을 삭제하시겠습니까?
                                    이 작업은 되돌릴 수 없으며, 관련된 모든 투표도 함께 삭제됩니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteJudge(judge.id)}>
                                    삭제
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voters" className="space-y-6">
            {/* Voter Management Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  투표자 관리
                </CardTitle>
                <CardDescription>
                  투표자 목록을 확인하고 투표를 초기화할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button onClick={fetchVoters} disabled={isLoadingVoters}>
                    {isLoadingVoters ? "로딩 중..." : "투표자 목록 새로고침"}
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>LDAP 닉네임</TableHead>
                        <TableHead>소속 팀</TableHead>
                        <TableHead>그룹</TableHead>
                        <TableHead>투표 상태</TableHead>
                        <TableHead>작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voters.map((voter) => (
                        <TableRow key={voter.id}>
                          <TableCell className="font-medium">{voter.id}</TableCell>
                          <TableCell>{voter.ldap_nickname}</TableCell>
                          <TableCell>{getTeamNameById(voter.team_id)}</TableCell>
                          <TableCell>
                            <Badge className={`text-white ${getGroupColor(voter.voter_group)}`}>
                              {voter.voter_group}
                            </Badge>
                          </TableCell>
                          <TableCell>{getVoteStatusBadge(voter)}</TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={isResettingVotes}>
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>투표 초기화 확인</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    정말로 "{voter.ldap_nickname}"의 투표를 초기화하시겠습니까?
                                    이 작업은 되돌릴 수 없습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleResetVotes(voter.id)}>
                                    초기화
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Judge Management Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  심사위원 투표 관리
                </CardTitle>
                <CardDescription>
                  심사위원 목록을 확인하고 투표를 초기화할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button onClick={fetchJudges} disabled={isLoadingJudges}>
                    {isLoadingJudges ? "로딩 중..." : "심사위원 목록 새로고침"}
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>심사위원 이름</TableHead>
                        <TableHead>심사 그룹</TableHead>
                        <TableHead>투표 상태</TableHead>
                        <TableHead>아이디어 투표</TableHead>
                        <TableHead>완성도 투표</TableHead>
                        <TableHead>작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {judges.map((judge) => (
                        <TableRow key={judge.id}>
                          <TableCell className="font-medium">{judge.id}</TableCell>
                          <TableCell>{judge.name}</TableCell>
                          <TableCell>
                            <Badge className={`text-white ${getGroupColor(judge.judge_group)}`}>
                              {judge.judge_group}
                            </Badge>
                          </TableCell>
                          <TableCell>{getJudgeStatusBadge(judge)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {judge.idea_votes_used}/2
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {judge.implementation_votes_used}/2
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={isResettingVotes}>
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>심사위원 투표 초기화 확인</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    정말로 "{judge.name}" 심사위원의 투표를 초기화하시겠습니까?
                                    이 작업은 되돌릴 수 없습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleResetJudgeVotes(judge.id)}>
                                    초기화
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
