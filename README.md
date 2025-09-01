# Hackathon Voting System

해커톤 참가자들이 팀을 선택하고 투표할 수 있는 시스템입니다. 관리자는 결과를 실시간으로 확인하고 데이터를 관리할 수 있습니다.

## 🚀 배포

### Railway 배포
1. [Railway](https://railway.app)에 접속
2. GitHub로 로그인
3. "New Project" → "Deploy from GitHub repo"
4. `hyemnyarwi-dev/hackathon-voting-system` 선택
5. 자동 배포 완료

### 로컬 개발
```bash
npm install
npm run dev
```

## 🎯 주요 기능

- **참가자 투표**: 아이디어와 완성도 부문 투표
- **심사위원 투표**: 각 부문당 최대 2표까지 투표
- **실시간 결과**: 투표 결과와 순위 확인
- **관리자 대시보드**: 팀 데이터 관리 및 투표자/심사위원 관리

## 🛠 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI
- **Database**: JSON 파일 기반 (로컬)
- **Deployment**: Railway

## 📁 프로젝트 구조

```
hackathon-voting/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── admin/              # 관리자 페이지
│   ├── vote/               # 투표 페이지
│   ├── judge/              # 심사위원 페이지
│   └── results/            # 결과 페이지
├── components/             # UI 컴포넌트
├── data/                   # JSON 데이터 파일
├── lib/                    # 유틸리티 함수
└── public/                 # 정적 파일
```

## 🔧 환경 설정

- Node.js 18+ 필요
- npm 또는 pnpm 패키지 매니저
