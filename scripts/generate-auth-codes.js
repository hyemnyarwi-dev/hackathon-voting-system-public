const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 팀 데이터 읽기
const teamsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/teams.json'), 'utf8'));

// Excel 데이터 준비
const excelData = [];

teamsData.forEach(team => {
  // 팀장 정보
  excelData.push({
    '팀 번호': team.team_number,
    '팀명': team.team_name,
    '멤버 구분': '팀장',
    'LDAP 닉네임': team.leader_name,
    '인증 번호': team.leader_auth_code
  });

  // 팀원2 정보
  if (team.member2_name) {
    excelData.push({
      '팀 번호': team.team_number,
      '팀명': team.team_name,
      '멤버 구분': '팀원2',
      'LDAP 닉네임': team.member2_name,
      '인증 번호': team.member2_auth_code
    });
  }

  // 팀원3 정보
  if (team.member3_name) {
    excelData.push({
      '팀 번호': team.team_number,
      '팀명': team.team_name,
      '멤버 구분': '팀원3',
      'LDAP 닉네임': team.member3_name,
      '인증 번호': team.member3_auth_code
    });
  }

  // 팀원4 정보
  if (team.member4_name) {
    excelData.push({
      '팀 번호': team.team_number,
      '팀명': team.team_name,
      '멤버 구분': '팀원4',
      'LDAP 닉네임': team.member4_name,
      '인증 번호': team.member4_auth_code
    });
  }
});

// Excel 파일 생성
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(excelData);

// 컬럼 너비 설정
worksheet['!cols'] = [
  { width: 8 },  // 팀 번호
  { width: 25 }, // 팀명
  { width: 10 }, // 멤버 구분
  { width: 20 }, // LDAP 닉네임
  { width: 12 }  // 인증 번호
];

XLSX.utils.book_append_sheet(workbook, worksheet, '인증번호');

// 파일 저장
const outputPath = path.join(__dirname, '../auth-codes.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`✅ 인증 번호 Excel 파일이 생성되었습니다: ${outputPath}`);
console.log(`📊 총 ${excelData.length}명의 인증 번호가 포함되었습니다.`); 