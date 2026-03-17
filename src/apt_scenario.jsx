import { useState } from "react";

// ═══════════════════════════════════════════════════════════
// SCENARIO METADATA
// ═══════════════════════════════════════════════════════════
const SCENARIO_META = {
  title: "Operation SilentDragon",
  subtitle: "APT 국가 지원 해킹 그룹 침투 사고",
  threat_actor: "APT-K (가상)",
  classification: "기밀 — 침해사고 분석 훈련용",
  date: "2024-09-02 ~ 2024-09-15",
  target: "방위산업체 A사 연구개발 네트워크",
  hostname: "RD-WS-009",
  os: "Windows 10 Pro 22H2 (KB 미적용 다수)",
  user: "choi_researcher",
  image: "RD-WS-009_full.E01 (2TB)",
  md5: "3f7a1b9c2e4d6f8a0b5c7e9d1f3a5b7c",
  sha1: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
  attacker_ip: "45.142.212.xx (Netherlands VPS)",
  c2: "update-ms-cdn[.]com",
  mitre: ["T1566.001","T1059.001","T1547.001","T1055","T1003.001","T1021.001","T1041","T1070.001","T1083","T1560"],
};

// ═══════════════════════════════════════════════════════════
// ATTACK TIMELINE (ground truth)
// ═══════════════════════════════════════════════════════════
const ATTACK_TIMELINE = [
  { time:"09-02 09:14", type:"initial", label:"초기 침투", event:"피싱 메일 수신 — '방산청_협력사_공문_2024.docx' 첨부", artifact:"브라우저/메일", mitre:"T1566.001" },
  { time:"09-02 09:31", type:"initial", label:"초기 침투", event:"Word 파일 열기 → 매크로 실행 → PowerShell Dropper 실행", artifact:"프리패치/이벤트로그", mitre:"T1059.001" },
  { time:"09-02 09:32", type:"execution", label:"실행", event:"C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe 드롭 & 실행", artifact:"MFT/프리패치", mitre:"T1059.001" },
  { time:"09-02 09:33", type:"persistence", label:"지속성", event:"HKLM Run 키 등록 — svcupd.exe 자동실행 설정", artifact:"레지스트리", mitre:"T1547.001" },
  { time:"09-02 09:34", type:"evasion", label:"방어 우회", event:"Windows Defender 비활성화 레지스트리 변조", artifact:"레지스트리", mitre:"T1562.001" },
  { time:"09-02 09:35", type:"c2", label:"C2 통신", event:"svcupd.exe → update-ms-cdn[.]com:443 첫 비콘 전송", artifact:"SRUM/브라우저", mitre:"T1071.001" },
  { time:"09-02 10:02", type:"discovery", label:"정찰", event:"whoami /all, ipconfig /all, net user, net localgroup 실행", artifact:"프리패치/이벤트로그", mitre:"T1083" },
  { time:"09-02 10:18", type:"privilege", label:"권한상승", event:"svcupd.exe → explorer.exe 프로세스 인젝션 (DLL Injection)", artifact:"이벤트로그(4688)/메모리", mitre:"T1055" },
  { time:"09-02 10:44", type:"credential", label:"자격증명탈취", event:"lsass.exe 메모리 덤프 생성 (C:\\Windows\\Temp\\lss.dmp)", artifact:"MFT/프리패치", mitre:"T1003.001" },
  { time:"09-02 11:15", type:"lateral", label:"측면이동", event:"RDP로 내부 서버 RD-SRV-002 (192.168.10.20) 접속", artifact:"이벤트로그(4624)/레지스트리", mitre:"T1021.001" },
  { time:"09-03 ~ 09-10", type:"collection", label:"수집", event:"연구 문서 수집 — C:\\Staging\\ 폴더 생성 후 문서 복사", artifact:"MFT/쉘백/LNK", mitre:"T1560" },
  { time:"09-10 22:30", type:"exfil", label:"유출", event:"7z.exe로 문서 압축 → C2 서버로 HTTPS 전송 (487MB)", artifact:"프리패치/SRUM/MFT", mitre:"T1041" },
  { time:"09-15 03:12", type:"cleanup", label:"흔적 삭제", event:"svcupd.exe, lss.dmp, Staging 폴더 삭제 + 이벤트 로그 삭제", artifact:"MFT($UsnJrnl)/이벤트로그(1102)", mitre:"T1070.001" },
];

// ═══════════════════════════════════════════════════════════
// MISSIONS — 8개 미션 (문제 + 정답 + XWF 분석법)
// ═══════════════════════════════════════════════════════════
const MISSIONS = [
  {
    id: "m1",
    no: "01",
    color: "#4cc9f0",
    icon: "📧",
    title: "최초 침투 경로 규명",
    artifact: "이벤트 로그 + 브라우저 히스토리 + LNK",
    difficulty: "★★☆☆☆",
    mitre: "T1566.001",
    question: `침해 분석 결과 공격자가 최초 시스템에 침투한 방법을 규명하시오.
다음을 특정하라:
  1) 침투 벡터 (피싱? RDP? 취약점?)
  2) 악성 파일명과 최초 실행 시간
  3) 악성 파일이 실행된 경위`,

    xways_path: [
      {
        step: "이벤트 로그 확인",
        menu: "경로: C:\\Windows\\System32\\winevt\\Logs\\Security.evtx",
        actions: [
          "Security.evtx 더블클릭 → 내장 뷰어 실행",
          "시간 범위 필터: 2024-09-02 09:00 ~ 10:00",
          "Event ID 4688 검색 → 프로세스 생성 이력 확인",
          "WINWORD.EXE 가 부모 프로세스인 cmd.exe / powershell.exe 찾기",
          "CommandLine 컬럼에서 -enc (Base64 인코딩) 패턴 확인",
        ],
      },
      {
        step: "LNK 파일 분석",
        menu: "경로: C:\\Users\\choi_researcher\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\",
        actions: [
          "*.lnk 파일 목록 → Created 시간 기준 정렬",
          "09-02 09:14~09:31 사이 생성된 LNK 확인",
          "LNK 선택 → 미리보기 Parsed 탭",
          "원본 파일 경로: Downloads\\방산청_협력사_공문_2024.docx 확인",
          "LNK의 Created = 파일 최초 접근 시간",
        ],
      },
      {
        step: "프리패치로 실행 확인",
        menu: "경로: C:\\Windows\\Prefetch\\",
        actions: [
          "WINWORD.EXE-XXXXXXXX.pf 선택 → Parsed 탭",
          "최근 실행 시간: 09-02 09:31 확인",
          "POWERSHELL.EXE-XXXXXXXX.pf → 09-02 09:31 실행 확인",
          "실행 횟수 확인 — 평소 대비 이상 여부",
          "접근 파일 목록에서 .docx 파일 경로 확인",
        ],
      },
    ],

    answer: {
      summary: "침투 벡터: 스피어 피싱 이메일 첨부파일 (T1566.001)",
      details: [
        { label: "침투 벡터", value: "스피어 피싱 이메일 — Word 문서 악성 매크로", highlight: true },
        { label: "악성 파일명", value: "방산청_협력사_공문_2024.docx (매크로 포함)", highlight: true },
        { label: "최초 실행 시간", value: "2024-09-02 09:31:44 (KST)", highlight: true },
        { label: "실행 경위", value: "WINWORD.EXE → PowerShell -enc [Base64] → svcupd.exe 드롭", highlight: false },
        { label: "증거 아티팩트", value: "LNK(09:14 접근), Event 4688(09:31 WINWORD→POWERSHELL), Prefetch", highlight: false },
      ],
      evidence_chain: "이메일 수신(09:14) → LNK 생성(09:14) → Word 열기(09:31) → 4688 WINWORD→PowerShell → Prefetch POWERSHELL.EXE 실행",
      ioc: ["방산청_협력사_공문_2024.docx", "powershell.exe -enc JABzAHYAYwB..."],
    },
  },

  {
    id: "m2",
    no: "02",
    color: "#ff4d6d",
    icon: "🔴",
    title: "악성코드 드롭 & 실행 경로 분석",
    artifact: "MFT + 프리패치 + 이벤트 로그(4688)",
    difficulty: "★★★☆☆",
    mitre: "T1059.001",
    question: `PowerShell Dropper가 시스템에 심은 악성 파일을 모두 찾아라.
다음을 특정하라:
  1) 드롭된 악성 파일 경로와 이름 (전체)
  2) 각 파일의 생성 시간 (MFT 기준)
  3) 악성 파일의 MD5/SHA-1 해시
  4) 확장자 위조 여부 확인`,

    xways_path: [
      {
        step: "MFT 시간 기반 악성 파일 탐지",
        menu: "View → Filter → Date Range",
        actions: [
          "파일 목록 → View → Filter 열기",
          "Created: 2024-09-02 09:31 ~ 09:35 범위 설정",
          "비정상 경로 우선 확인: C:\\ProgramData\\, C:\\Windows\\Temp\\, C:\\Users\\..\\AppData\\",
          "결과: svcupd.exe (09:32), svcupd.cfg (09:32) 발견",
        ],
      },
      {
        step: "확장자 위조 탐지",
        menu: "RVS → Identify File Types",
        actions: [
          "F2 → Refine Volume Snapshot",
          "✅ Identify file types (Magic Bytes vs 확장자 비교) 체크",
          "완료 후 View → Filter → Type Mismatch 선택",
          "발견: svcupd.cfg → 실제 파일 시그니처는 PE32 (EXE) → .cfg로 위장한 실행 파일",
          "헥스 뷰어로 파일 헤더 4D 5A (MZ) 직접 확인",
        ],
      },
      {
        step: "해시 값 확인 및 IOC 매칭",
        menu: "RVS → Compute Hash Values",
        actions: [
          "svcupd.exe 선택 → 우클릭 → Properties",
          "MD5 / SHA-1 해시 값 확인",
          "우클릭 → Search Online (VirusTotal) 해시 검색",
          "svcupd.cfg 도 동일하게 해시 확인",
          "해시를 케이스 북마크에 기록",
        ],
      },
      {
        step: "프리패치로 실행 횟수·시간 확인",
        menu: "경로: C:\\Windows\\Prefetch\\SVCUPD.EXE-XXXXXXXX.pf",
        actions: [
          "SVCUPD.EXE-XXXXXXXX.pf 선택 → Parsed 탭",
          "실행 횟수, 최근 8회 실행 시간 확인",
          "접근 파일 목록에서 네트워크 경로 또는 추가 드롭 경로 확인",
        ],
      },
    ],

    answer: {
      summary: "PowerShell이 2개 파일을 드롭. svcupd.cfg는 PE32 실행파일로 확장자를 위장.",
      details: [
        { label: "드롭 파일 1", value: "C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe (09-02 09:32:11)", highlight: true },
        { label: "드롭 파일 2", value: "C:\\ProgramData\\MicrosoftUpdate\\svcupd.cfg (09-02 09:32:11)", highlight: true },
        { label: "svcupd.exe MD5", value: "a4f2e8b1c3d5f7a9b2c4e6f8a0b3d5e7", highlight: false },
        { label: "확장자 위조", value: "svcupd.cfg → 실제 Magic Bytes: 4D 5A (PE32 실행파일)", highlight: true },
        { label: "XWF 탐지 방법", value: "RVS → Identify File Types → Filter: Type Mismatch", highlight: false },
      ],
      evidence_chain: "Event 4688 (PowerShell 실행) → MFT 생성 09:32 → Prefetch SVCUPD.EXE → Type Mismatch: svcupd.cfg=PE32",
      ioc: ["C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe", "MD5: a4f2e8b1c3d5f7a9b2c4e6f8a0b3d5e7"],
    },
  },

  {
    id: "m3",
    no: "03",
    color: "#ffd166",
    icon: "🗝",
    title: "지속성 메커니즘 분석",
    artifact: "레지스트리 + 이벤트 로그(7045/4698) + MFT",
    difficulty: "★★★☆☆",
    mitre: "T1547.001",
    question: `공격자가 재부팅 후에도 악성코드가 실행되도록 심어둔 지속성 메커니즘을 모두 찾아라.
다음을 특정하라:
  1) 지속성 유형 (Run키? 서비스? 예약작업?)
  2) 등록된 키/값 경로와 데이터
  3) 등록 시간
  4) 추가로 생성된 계정 여부`,

    xways_path: [
      {
        step: "레지스트리 Run 키 확인",
        menu: "경로: Windows\\System32\\config\\SOFTWARE",
        actions: [
          "SOFTWARE 하이브 로드 → 레지스트리 뷰어",
          "Microsoft\\Windows\\CurrentVersion\\Run 키 이동",
          "정상 항목과 다른 경로값 찾기",
          "발견: 'WindowsUpdate' = 'C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe /silent'",
          "키 LastWrite 시간 확인: 09-02 09:33",
        ],
      },
      {
        step: "예약 작업 확인",
        menu: "경로: Windows\\System32\\Tasks\\",
        actions: [
          "C:\\Windows\\System32\\Tasks\\ 폴더 이동",
          "XML 파일 목록 → 침해 시간대 생성 파일 확인",
          "발견: 'MicrosoftEdgeUpdateCore' 태스크 파일 (09-02 09:33)",
          "파일 선택 → 텍스트 뷰 → <Command> 태그에서 실행 경로 확인",
          "이벤트 로그 4698 (예약작업 생성)과 교차 검증",
        ],
      },
      {
        step: "Windows Defender 비활성화 확인",
        menu: "경로: SOFTWARE\\Policies\\Microsoft\\Windows Defender",
        actions: [
          "SOFTWARE 하이브 → Policies\\Microsoft\\Windows Defender 키",
          "DisableAntiSpyware = 1 값 확인 (비활성화)",
          "DisableRealtimeMonitoring = 1 값 확인",
          "LastWrite 시간: 09-02 09:34 — 악성코드 실행 직후 방어 비활성화",
        ],
      },
      {
        step: "백도어 계정 확인",
        menu: "경로: Windows\\System32\\config\\SAM",
        actions: [
          "SAM 하이브 로드",
          "SAM\\Domains\\Account\\Users 키 확인",
          "침해 시간대 생성된 계정 여부 확인",
          "이벤트 로그 4720 (계정 생성) 교차 확인",
          "발견 없음 (이 공격자는 계정 생성 대신 토큰 탈취 사용)",
        ],
      },
    ],

    answer: {
      summary: "Run 키 + 예약 작업 2중 지속성 확보. Windows Defender도 비활성화.",
      details: [
        { label: "지속성 1: Run 키", value: "HKLM\\SOFTWARE\\...\\Run\\WindowsUpdate → svcupd.exe /silent (09:33)", highlight: true },
        { label: "지속성 2: 예약 작업", value: "Tasks\\MicrosoftEdgeUpdateCore → svcupd.exe (09:33)", highlight: true },
        { label: "방어 우회", value: "Windows Defender DisableAntiSpyware=1, DisableRealtimeMonitoring=1 (09:34)", highlight: true },
        { label: "백도어 계정", value: "없음 — 토큰 탈취 방식 사용 (Stealthy)", highlight: false },
        { label: "XWF 확인 방법", value: "Registry Explorer → Run키 LastWrite 시간, Tasks 폴더 XML", highlight: false },
      ],
      evidence_chain: "Event 4698 (예약작업 09:33) → Registry Run 키 LastWrite 09:33 → Defender 비활성화 09:34",
      ioc: ["HKLM\\...\\Run\\WindowsUpdate", "Tasks\\MicrosoftEdgeUpdateCore", "DisableAntiSpyware=1"],
    },
  },

  {
    id: "m4",
    no: "04",
    color: "#a29bfe",
    icon: "💉",
    title: "프로세스 인젝션 탐지",
    artifact: "이벤트 로그(4688/10) + 프리패치 + MFT",
    difficulty: "★★★★☆",
    mitre: "T1055",
    question: `악성코드가 정상 프로세스에 자신을 숨기는 프로세스 인젝션을 수행했다.
다음을 규명하라:
  1) 인젝션 소스 프로세스 (공격자 코드)
  2) 인젝션 대상 프로세스 (피해 프로세스)
  3) 인젝션 시점
  4) X-Ways에서 인젝션 흔적을 확인하는 방법`,

    xways_path: [
      {
        step: "이벤트 로그 4688 체인 분석",
        menu: "Security.evtx → Event ID 4688",
        actions: [
          "Security.evtx → Event ID: 4688 필터",
          "시간 범위: 09-02 10:00 ~ 10:30",
          "svcupd.exe 가 부모 프로세스인 항목 찾기",
          "svcupd.exe → explorer.exe 내 스레드 생성 패턴 확인",
          "SubjectLogonId를 통해 동일 세션 내 연속 프로세스 추적",
        ],
      },
      {
        step: "Sysmon 로그 확인 (있는 경우)",
        menu: "경로: Microsoft-Windows-Sysmon%4Operational.evtx",
        actions: [
          "Sysmon Event ID 8 (CreateRemoteThread) 검색",
          "SourceImage: C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe",
          "TargetImage: C:\\Windows\\explorer.exe 확인",
          "09-02 10:18 에 CreateRemoteThread 이벤트 존재 시 인젝션 증명",
          "※ Sysmon 미설치 시 — 프리패치 접근 파일로 우회 분석",
        ],
      },
      {
        step: "프리패치로 비정상 DLL 로딩 확인",
        menu: "경로: Windows\\Prefetch\\EXPLORER.EXE-XXXXXXXX.pf",
        actions: [
          "EXPLORER.EXE PF 파일 → Parsed 탭",
          "접근 파일(Loaded Files) 목록에서 비정상 DLL 경로 확인",
          "C:\\ProgramData\\MicrosoftUpdate\\ 경로의 DLL이 있으면 인젝션 증거",
          "정상 explorer.exe는 절대 ProgramData 폴더 DLL 로드 안 함",
        ],
      },
      {
        step: "MFT에서 임시 파일 추적",
        menu: "View → Filter → Path Contains: ProgramData",
        actions: [
          "파일 경로 필터: C:\\ProgramData\\MicrosoftUpdate\\ 포함",
          "침해 시간대 생성된 모든 파일 목록 확인",
          "메모리 덤프용 임시 파일 여부 확인",
          "MFT $STANDARD_INFORMATION vs $FILE_NAME 타임스탬프 비교",
          "차이 발생 시 → Timestomping(시간 조작) 의심",
        ],
      },
    ],

    answer: {
      summary: "svcupd.exe → explorer.exe DLL Injection (T1055). Sysmon Event ID 8로 직접 증명.",
      details: [
        { label: "인젝션 소스", value: "C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe (PID: 4392)", highlight: true },
        { label: "인젝션 대상", value: "C:\\Windows\\explorer.exe (PID: 1204)", highlight: true },
        { label: "인젝션 시점", value: "2024-09-02 10:18:33 (Sysmon Event ID 8 기준)", highlight: true },
        { label: "증거 1: Sysmon", value: "Event ID 8 — CreateRemoteThread SourceImage=svcupd.exe TargetImage=explorer.exe", highlight: false },
        { label: "증거 2: Prefetch", value: "EXPLORER.EXE PF → 접근 파일에 C:\\ProgramData\\...\\inject.dll 포함", highlight: false },
        { label: "XWF 분석 포인트", value: "Sysmon 없으면 → PF 파일 접근 목록에서 비정상 DLL 경로로 간접 증명", highlight: false },
      ],
      evidence_chain: "Event 4688 svcupd.exe(10:18) → Sysmon ID8 CreateRemoteThread → EXPLORER.EXE PF 비정상 DLL → 인젝션 확인",
      ioc: ["CreateRemoteThread: svcupd.exe→explorer.exe", "inject.dll in ProgramData"],
    },
  },

  {
    id: "m5",
    no: "05",
    color: "#ff6b6b",
    icon: "🔑",
    title: "자격증명 탈취 분석",
    artifact: "MFT + 프리패치 + 이벤트 로그(4656/4663) + 볼륨 섀도",
    difficulty: "★★★★☆",
    mitre: "T1003.001",
    question: `공격자가 자격증명 탈취를 시도했다. LSASS 메모리 덤프 방식을 사용한 것으로 의심된다.
다음을 규명하라:
  1) 자격증명 탈취 도구/방법 특정
  2) 덤프 파일 생성 경로와 시간
  3) 탈취 후 덤프 파일 처리 방법 (전송? 삭제?)
  4) 이를 통해 어떤 계정 정보가 탈취됐는지 추정`,

    xways_path: [
      {
        step: "MFT에서 덤프 파일 탐지",
        menu: "View → Filter → Extension: .dmp, .tmp + 생성 시간",
        actions: [
          "파일 목록 → 확장자 필터: .dmp, .tmp",
          "생성 시간: 09-02 10:40 ~ 10:50 범위",
          "발견: C:\\Windows\\Temp\\lss.dmp (09-02 10:44:17, 41MB)",
          "파일 크기 40~50MB 범위 → lsass 메모리 덤프 일치",
          "선택 후 Alt+Enter → Properties에서 MACE 4개 시간 확인",
        ],
      },
      {
        step: "프리패치로 덤핑 도구 확인",
        menu: "경로: Windows\\Prefetch\\",
        actions: [
          "09-02 10:40~10:50 시간대 생성된 PF 파일 확인",
          "PROCDUMP.EXE 또는 RUNDLL32.EXE PF 존재 여부",
          "발견: RUNDLL32.EXE PF → 접근 파일에 comsvcs.dll 포함",
          "이는 'rundll32.exe comsvcs.dll MiniDump' 방식 — LOLBins 기법",
          "별도 해킹 도구 없이 Windows 내장 도구만 사용 (탐지 우회)",
        ],
      },
      {
        step: "이벤트 로그 4656/4663 확인",
        menu: "Security.evtx → Event ID 4656, 4663",
        actions: [
          "Event ID 4656 (Object Handle Requested) 검색",
          "ObjectName: \\Device\\HarddiskVolume#\\Windows\\System32\\lsass.exe",
          "AccessMask: 0x1FFFFF (PROCESS_ALL_ACCESS) 확인",
          "이 이벤트 = lsass.exe 프로세스에 전체 접근 시도 → 덤프 전 단계",
          "Event 4663과 조합 → 실제 읽기 성공 여부 확인",
        ],
      },
      {
        step: "MFT로 삭제 파일 추적 ($UsnJrnl)",
        menu: "Specialist → File System Data Structure → $UsnJrnl",
        actions: [
          "lss.dmp 현재 존재 여부 확인 (이미 삭제됐을 수 있음)",
          "삭제됐다면 → $UsnJrnl에서 생성/삭제 이벤트 확인",
          "$UsnJrnl → lss.dmp 생성(10:44) → 삭제(09-15 03:12) 이벤트 쌍 확인",
          "카빙으로 lss.dmp 복구 시도 — RVS → Carve from unallocated",
          "복구 성공 시 Mimikatz 등으로 해시 추출 가능 (별도 환경 필요)",
        ],
      },
    ],

    answer: {
      summary: "LOLBins 기법: rundll32.exe + comsvcs.dll로 LSASS 메모리 덤프. 흔적 삭제 확인.",
      details: [
        { label: "탈취 방법", value: "LOLBins — rundll32.exe comsvcs.dll MiniDump lsass.exe lss.dmp full", highlight: true },
        { label: "덤프 파일 경로", value: "C:\\Windows\\Temp\\lss.dmp (09-02 10:44:17, 41.3MB)", highlight: true },
        { label: "이벤트 증거", value: "Event 4656: lsass.exe AccessMask=0x1FFFFF by svcupd.exe (10:44)", highlight: true },
        { label: "Prefetch 증거", value: "RUNDLL32.EXE PF → 접근 파일에 comsvcs.dll, lss.dmp 포함", highlight: false },
        { label: "덤프 처리", value: "09-02 10:44 생성 → 09-15 03:12 삭제 ($UsnJrnl 확인)", highlight: false },
        { label: "탈취 추정 정보", value: "choi_researcher 계정 NTLM 해시 → 내부 이동에 사용 추정", highlight: false },
      ],
      evidence_chain: "Event 4656 lsass.exe(10:44) → Prefetch RUNDLL32+comsvcs.dll → MFT lss.dmp 생성(10:44) → $UsnJrnl 삭제(09-15)",
      ioc: ["rundll32.exe comsvcs.dll MiniDump", "C:\\Windows\\Temp\\lss.dmp", "Event 4656 lsass"],
    },
  },

  {
    id: "m6",
    no: "06",
    color: "#06d6a0",
    icon: "🌐",
    title: "C2 통신 & 측면 이동 분석",
    artifact: "SRUM + 이벤트 로그(4624) + 레지스트리(RDP)",
    difficulty: "★★★★☆",
    mitre: "T1021.001 + T1041",
    question: `악성코드의 C2 통신 패턴과 내부 네트워크 측면 이동을 분석하라.
다음을 규명하라:
  1) C2 서버 주소와 통신 시작 시간
  2) C2 통신에 사용된 프로세스와 포트
  3) 내부 측면 이동 대상 시스템과 시간
  4) 측면 이동에 사용된 자격증명`,

    xways_path: [
      {
        step: "SRUM으로 C2 통신 탐지",
        menu: "경로: Windows\\System32\\sru\\SRUDB.dat",
        actions: [
          "SRUDB.dat 선택 → XWF 내장 ESE DB 뷰어",
          "{DD6636C4-8929-4683-974E-22C046A43763} 테이블 → 네트워크 사용량",
          "ExeInfo 컬럼에서 svcupd.exe 행 찾기",
          "BytesSent 컬럼 확인 → 대용량 송신 = 유출 의심",
          "ConnectStartTime으로 C2 첫 통신 시간 확인",
        ],
      },
      {
        step: "브라우저 DNS 캐시 & 호스트 파일 확인",
        menu: "경로: Windows\\System32\\drivers\\etc\\hosts",
        actions: [
          "hosts 파일 열기 → 비정상 도메인 매핑 확인",
          "update-ms-cdn[.]com 등 위장 도메인 등록 여부",
          "C:\\Windows\\System32\\drivers\\etc\\ 에서 hosts 파일 수정 시간 확인",
          "MFT에서 hosts 파일 Modified 시간 = C2 도메인 주입 시점",
        ],
      },
      {
        step: "RDP 측면 이동 이벤트 분석",
        menu: "Security.evtx + Microsoft-Windows-TerminalServices-RDPClient",
        actions: [
          "Security.evtx → Event ID 4624 (Logon Type=10) 검색",
          "대상 IP: 192.168.10.20 (RD-SRV-002) 확인",
          "시간: 09-02 11:15 — lsass 덤프(10:44) 이후 30분 내 이동",
          "RDPClient 이벤트 로그 → 접속한 서버 IP 기록",
          "NTUSER.DAT → Software\\Microsoft\\Terminal Server Client\\Servers 키에서 RDP 접속 이력",
        ],
      },
      {
        step: "레지스트리 RDP MRU 분석",
        menu: "NTUSER.DAT → Software\\Microsoft\\Terminal Server Client",
        actions: [
          "NTUSER.DAT 로드 → 레지스트리 뷰어",
          "Software\\Microsoft\\Terminal Server Client\\Default 키",
          "MRU0, MRU1... 값에서 접속한 서버 목록 확인",
          "192.168.10.20 발견 시 → 측면 이동 내부 목적지 특정",
          "키 LastWrite 시간 = 마지막 RDP 접속 시간",
        ],
      },
    ],

    answer: {
      summary: "C2: update-ms-cdn[.]com:443 (HTTPS 위장). lsass 해시로 RDP 측면 이동.",
      details: [
        { label: "C2 서버", value: "update-ms-cdn[.]com (45.142.212.xx:443) — HTTPS로 위장", highlight: true },
        { label: "C2 첫 통신", value: "2024-09-02 09:35:02 — svcupd.exe (SRUM BytesSent 누적 487MB)", highlight: true },
        { label: "측면 이동 대상", value: "192.168.10.20 (RD-SRV-002) — 09-02 11:15 RDP 접속", highlight: true },
        { label: "사용 자격증명", value: "choi_researcher NTLM 해시 (lsass 덤프에서 탈취)", highlight: false },
        { label: "SRUM 증거", value: "svcupd.exe BytesSent: 487,302,144 bytes (10일간)", highlight: false },
        { label: "레지스트리 증거", value: "Terminal Server Client MRU0 = 192.168.10.20 (LastWrite: 11:15)", highlight: false },
      ],
      evidence_chain: "SRUM svcupd.exe C2통신(09:35~) → lsass 탈취(10:44) → RDP 4624 Type10(11:15) → MRU 192.168.10.20",
      ioc: ["update-ms-cdn[.]com", "45.142.212.xx", "RDP to 192.168.10.20"],
    },
  },

  {
    id: "m7",
    no: "07",
    color: "#ffa657",
    icon: "📦",
    title: "데이터 수집 & 유출 분석",
    artifact: "MFT + 쉘백 + LNK + SRUM + 프리패치",
    difficulty: "★★★★★",
    mitre: "T1560 + T1041",
    question: `공격자가 10일에 걸쳐 연구 문서를 수집하고 최종 유출했다.
다음을 모두 규명하라:
  1) 문서 수집에 사용된 스테이징 경로
  2) 수집된 파일의 종류와 범위
  3) 압축 도구와 압축 파일 경로
  4) 유출 시간과 유출량 (바이트 단위)
  5) 삭제된 증거의 복구 가능 여부`,

    xways_path: [
      {
        step: "스테이징 폴더 탐지 (MFT + 쉘백)",
        menu: "쉘백: USRCLASS.DAT + MFT 경로 필터",
        actions: [
          "USRCLASS.DAT 로드 → 쉘백 뷰어",
          "09-03 ~ 09-10 기간 생성된 폴더 항목 확인",
          "발견: C:\\Staging\\ 폴더 (09-03 14:22 탐색기 접근)",
          "MFT에서 C:\\Staging\\ 경로 내 파일 목록 확인",
          "현재 삭제됐더라도 $UsnJrnl에 생성/삭제 이벤트 남아있음",
        ],
      },
      {
        step: "수집 파일 범위 파악 (LNK + MFT)",
        menu: "LNK 경로: Users\\choi_researcher\\...\\Recent\\",
        actions: [
          "Recent 폴더 LNK 파일 → 09-03 ~ 09-10 생성분 필터",
          "원본 경로가 연구 문서 폴더(D:\\Research\\)인 LNK 수집",
          "LNK Parsed → 파일명, 원본 경로, 접근 시간 목록 작성",
          "MFT에서 D:\\Research\\ 경로 파일의 Accessed 시간 확인",
          "09-03~09-10 기간 Accessed 파일 = 공격자가 접근한 파일",
        ],
      },
      {
        step: "압축 도구 및 압축 파일 탐지",
        menu: "프리패치: 7Z.EXE PF + MFT 확장자 필터 .7z",
        actions: [
          "Prefetch → 7Z.EXE-XXXXXXXX.pf 확인",
          "실행 시간: 09-10 22:28, 22:29, 22:30 (3회 실행)",
          "접근 파일 목록 → C:\\Staging\\ 경로 파일들 확인",
          "MFT 확장자 필터: .7z → C:\\ProgramData\\tmp_arch.7z 발견",
          "파일 크기: 487,221,843 bytes ≈ 487MB",
        ],
      },
      {
        step: "SRUM으로 유출량 확인",
        menu: "SRUDB.dat → 네트워크 사용량 테이블",
        actions: [
          "SRUDB.dat → 네트워크 테이블",
          "svcupd.exe + 09-10 22:30 ~ 09-11 02:00 범위",
          "BytesSent: 487,302,144 bytes → 압축 파일과 크기 일치!",
          "BytesRecvd와 비교 → 업로드 위주 = 유출 확인",
          "이 데이터로 유출 파일 크기 법적 증명 가능",
        ],
      },
      {
        step: "삭제 증거 복구 ($UsnJrnl + 카빙)",
        menu: "Specialist → $UsnJrnl + RVS → Carving",
        actions: [
          "$UsnJrnl 파싱 → C:\\Staging\\ 파일들 생성/삭제 이벤트 확인",
          "C:\\ProgramData\\tmp_arch.7z 삭제 이벤트 (09-15 03:14) 확인",
          "MFT 미할당 영역 카빙 → tmp_arch.7z 복구 시도",
          "복구 성공 시 7z 파일 내용으로 유출 문서 목록 확인 가능",
          "카빙 실패 시 → LNK + 쉘백으로 파일 목록 간접 증명",
        ],
      },
    ],

    answer: {
      summary: "C:\\Staging\\ 스테이징 → 7z 압축(487MB) → C2 HTTPS 전송. $UsnJrnl로 삭제 증거 확인.",
      details: [
        { label: "스테이징 경로", value: "C:\\Staging\\ (09-03 14:22 생성, 09-15 03:14 삭제)", highlight: true },
        { label: "수집 파일 범위", value: "D:\\Research\\ 하위 .docx, .xlsx, .pdf, .dwg 총 143개 (LNK 143개)", highlight: true },
        { label: "압축 도구", value: "7z.exe (C:\\Windows\\Temp\\7z.exe) — 09-10 22:28~22:30 3회 실행", highlight: true },
        { label: "압축 파일", value: "C:\\ProgramData\\tmp_arch.7z (487,221,843 bytes) → 삭제됨", highlight: true },
        { label: "유출 시간/량", value: "09-10 22:30 ~ 09-11 01:47 / 487,302,144 bytes (SRUM)", highlight: true },
        { label: "복구 가능 여부", value: "$UsnJrnl로 파일 목록 증명 가능. 카빙으로 7z 파일 부분 복구 시도 필요", highlight: false },
      ],
      evidence_chain: "쉘백 C:\\Staging\\(09-03) → LNK 143개 접근 → Prefetch 7Z.EXE(09-10) → MFT tmp_arch.7z → SRUM 487MB 송신",
      ioc: ["C:\\Staging\\", "C:\\ProgramData\\tmp_arch.7z", "7Z.EXE BytesSent 487MB"],
    },
  },

  {
    id: "m8",
    no: "08",
    color: "#d2a8ff",
    icon: "🧹",
    title: "흔적 삭제 & 최종 타임라인 재구성",
    artifact: "MFT($UsnJrnl) + 이벤트 로그(1102) + 전체 타임라인",
    difficulty: "★★★★★",
    mitre: "T1070.001",
    question: `공격자가 철수하면서 흔적을 삭제했다. 삭제된 증거를 복구하고 전체 공격 타임라인을 재구성하라.
다음을 규명하라:
  1) 삭제된 파일/폴더 목록과 삭제 시간
  2) 로그 삭제 여부 및 삭제된 로그 범위
  3) X-Ways로 삭제 증거를 복구하는 방법
  4) 전체 공격 MITRE ATT&CK 매핑`,

    xways_path: [
      {
        step: "이벤트 로그 삭제 탐지",
        menu: "Security.evtx + System.evtx → Event ID 1102, 104",
        actions: [
          "Security.evtx → Event ID 1102 (감사 로그 삭제) 검색",
          "발견: 09-15 03:12 — 'The audit log was cleared' by choi_researcher",
          "System.evtx → Event ID 104 (System 로그 삭제) 확인",
          "1102 이후 Security 로그 공백 = 삭제된 구간",
          "1102 이전 로그는 정상 — 그 전까지의 분석 결과 유효",
        ],
      },
      {
        step: "$UsnJrnl로 삭제 파일 목록 복구",
        menu: "Specialist → File System Data Structure → $UsnJrnl",
        actions: [
          "증거 선택 → Specialist → File System Data Structure",
          "$UsnJrnl 파싱 선택",
          "Reason 코드: FILE_DELETE 또는 CLOSE 필터",
          "시간 범위: 09-15 03:00 ~ 03:30 (정리 시간대)",
          "삭제 파일 목록: svcupd.exe, svcupd.cfg, lss.dmp, tmp_arch.7z, C:\\Staging\\",
        ],
      },
      {
        step: "삭제 파일 카빙 복구",
        menu: "RVS → Carve from unallocated space",
        actions: [
          "F2 → Carve files from unallocated space 체크",
          "대상 유형: .exe, .dmp, .7z 선택",
          "완료 후 [Carved] 태그 파일 확인",
          "svcupd.exe 복구 성공 시 → 해시로 악성코드 확인 가능",
          "lss.dmp 복구 성공 시 → 자격증명 추출 가능 (별도 환경)",
        ],
      },
      {
        step: "전체 타임라인 생성 (최종)",
        menu: "View → Timeline → Generate",
        actions: [
          "View → Timeline (Ctrl+T)",
          "시간 범위: 2024-09-02 ~ 2024-09-15 전체",
          "모든 소스 체크: FS Timestamps + Registry + Event Log",
          "CSV 내보내기 → Timeline Explorer 또는 Excel에서 시각화",
          "MITRE ATT&CK 프레임워크 매핑 추가",
        ],
      },
    ],

    answer: {
      summary: "09-15 03:12~03:30 전체 증거 삭제. $UsnJrnl로 삭제 목록 복구. 10개 MITRE 기술 매핑.",
      details: [
        { label: "로그 삭제", value: "Event 1102 (09-15 03:12): Security 로그 전체 삭제, Event 104: System 로그 삭제", highlight: true },
        { label: "삭제된 파일", value: "svcupd.exe, svcupd.cfg, lss.dmp, tmp_arch.7z, C:\\Staging\\ 전체 — $UsnJrnl 확인", highlight: true },
        { label: "복구 방법", value: "RVS 카빙으로 svcupd.exe 부분 복구 가능. lss.dmp는 덮어쓰여 복구 불가", highlight: false },
        { label: "전체 체류 기간", value: "2024-09-02 09:14 ~ 09-15 03:30 (약 13일)", highlight: true },
        { label: "MITRE 매핑", value: "T1566.001 → T1059.001 → T1547.001 → T1055 → T1003.001 → T1021.001 → T1560 → T1041 → T1070.001", highlight: false },
      ],
      evidence_chain: "전체: 피싱(T1566)→드롭(T1059)→지속성(T1547)→인젝션(T1055)→자격증명(T1003)→이동(T1021)→수집(T1560)→유출(T1041)→삭제(T1070)",
      ioc: ["Event 1102 (03:12)", "$UsnJrnl 삭제 레코드", "카빙 복구 svcupd.exe"],
    },
  },
];

// ═══════════════════════════════════════════════════
// TIMELINE COLOR MAP
// ═══════════════════════════════════════════════════
const TL_COLORS = {
  initial: "#ff4d6d", execution: "#ffa657", persistence: "#ffd166",
  evasion: "#a29bfe", c2: "#4cc9f0", discovery: "#8b949e",
  privilege: "#d2a8ff", credential: "#ff6b6b", lateral: "#06d6a0",
  collection: "#4ecdc4", exfil: "#f77f00", cleanup: "#495057",
};

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function APTScenario() {
  const [view, setView] = useState("briefing"); // briefing | timeline | mission
  const [activeMission, setActiveMission] = useState(null);
  const [showAnswer, setShowAnswer] = useState({});
  const [showXways, setShowXways] = useState({});
  const [completed, setCompleted] = useState({});

  const toggleAnswer = (id) => setShowAnswer(p => ({ ...p, [id]: !p[id] }));
  const toggleXways  = (id) => setShowXways(p =>  ({ ...p, [id]: !p[id] }));
  const markDone     = (id) => setCompleted(p => ({ ...p, [id]: true }));

  const mission = MISSIONS.find(m => m.id === activeMission);
  const doneCount = Object.values(completed).filter(Boolean).length;

  // ── BRIEFING VIEW ─────────────────────────────────
  const BriefingView = () => (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Header Card */}
      <div style={{
        background: "linear-gradient(135deg, #1a0a0a, #0d1117)",
        border: "1px solid #ff4d6d44", borderRadius: 14,
        padding: "28px 32px", marginBottom: 20,
        boxShadow: "0 0 40px #ff4d6d18",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 40 }}>🔴</div>
          <div>
            <div style={{ color: "#ff4d6d", fontSize: 11, fontWeight: 800, letterSpacing: ".1em", marginBottom: 4 }}>
              APT SIMULATION · {SCENARIO_META.classification}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{SCENARIO_META.title}</div>
            <div style={{ color: "#8b949e", fontSize: 14, marginTop: 4 }}>{SCENARIO_META.subtitle}</div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ background: "#ff4d6d22", border: "1px solid #ff4d6d44", borderRadius: 8, padding: "6px 14px" }}>
              <div style={{ color: "#ff4d6d", fontSize: 10, fontWeight: 800 }}>위협 행위자</div>
              <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700 }}>{SCENARIO_META.threat_actor}</div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            ["🗓 사고 기간", SCENARIO_META.date],
            ["🏢 피해 대상", SCENARIO_META.target],
            ["🖥 호스트명", SCENARIO_META.hostname],
            ["💻 OS", SCENARIO_META.os],
            ["👤 사용자", SCENARIO_META.user],
            ["💾 증거 이미지", SCENARIO_META.image],
            ["🔐 MD5", SCENARIO_META.md5],
            ["🌐 공격자 IP", SCENARIO_META.attacker_ip],
            ["📡 C2 도메인", SCENARIO_META.c2],
          ].map(([k, v]) => (
            <div key={k} style={{ background: "#0d1117", borderRadius: 8, padding: "10px 12px", border: "1px solid #21262d" }}>
              <div style={{ color: "#8b949e", fontSize: 9, marginBottom: 3 }}>{k}</div>
              <div style={{ color: "#e6edf3", fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MITRE Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        <span style={{ color: "#8b949e", fontSize: 12, alignSelf: "center" }}>MITRE ATT&CK:</span>
        {SCENARIO_META.mitre.map(t => (
          <span key={t} style={{ background: "#21262d", border: "1px solid #30363d", borderRadius: 4, padding: "3px 9px", fontSize: 11, color: "#d2a8ff", fontFamily: "monospace" }}>{t}</span>
        ))}
      </div>

      {/* Mission Progress */}
      <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>🎯 분석 미션 ({doneCount}/{MISSIONS.length} 완료)</div>
          <div style={{
            color: doneCount === MISSIONS.length ? "#06d6a0" : "#ffd166",
            fontSize: 12, fontWeight: 700,
          }}>{Math.round((doneCount / MISSIONS.length) * 100)}%</div>
        </div>
        <div style={{ background: "#21262d", borderRadius: 4, height: 6, marginBottom: 14 }}>
          <div style={{ width: `${(doneCount / MISSIONS.length) * 100}%`, height: "100%", background: "linear-gradient(90deg, #4cc9f0, #06d6a0)", borderRadius: 4, transition: "width .4s" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {MISSIONS.map((m, i) => (
            <button key={m.id} onClick={() => { setActiveMission(m.id); setView("mission"); }} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: completed[m.id] ? "#06d6a010" : "#0d1117",
              border: `1px solid ${completed[m.id] ? "#06d6a033" : "#21262d"}`,
              borderRadius: 8, padding: "10px 14px", cursor: "pointer",
              textAlign: "left", transition: "all .15s",
            }}>
              <span style={{
                background: m.color + "22", color: m.color, border: `1px solid ${m.color}44`,
                borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}>MISSION {m.no}</span>
              <span style={{ fontSize: 16 }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#e6edf3", fontSize: 12, fontWeight: 700 }}>{m.title}</div>
                <div style={{ color: "#8b949e", fontSize: 10, marginTop: 2 }}>{m.artifact} · {m.difficulty}</div>
              </div>
              <span style={{ color: completed[m.id] ? "#06d6a0" : "#30363d", fontSize: 16 }}>
                {completed[m.id] ? "✅" : "○"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => setView("timeline")} style={{
        width: "100%", background: "#21262d", border: "1px solid #30363d",
        borderRadius: 8, padding: "12px", cursor: "pointer", color: "#8b949e", fontSize: 12,
      }}>📊 전체 공격 타임라인 보기</button>
    </div>
  );

  // ── TIMELINE VIEW ─────────────────────────────────
  const TimelineView = () => (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>📊 전체 공격 타임라인</div>
        <div style={{ color: "#8b949e", fontSize: 12 }}>공격 시작부터 종료까지 — 각 이벤트와 연관 아티팩트</div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {Object.entries(TL_COLORS).map(([k, v]) => (
          <span key={k} style={{ fontSize: 10, color: v, background: v + "22", border: `1px solid ${v}44`, borderRadius: 10, padding: "2px 8px" }}>
            ● {k}
          </span>
        ))}
      </div>

      <div style={{ position: "relative", paddingLeft: 24 }}>
        <div style={{ position: "absolute", left: 9, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom, #ff4d6d44, #06d6a044)" }} />
        {ATTACK_TIMELINE.map((ev, i) => {
          const c = TL_COLORS[ev.type] || "#8b949e";
          return (
            <div key={i} style={{ display: "flex", gap: 14, marginBottom: 10, position: "relative" }}>
              <div style={{ position: "absolute", left: -19, top: 6, width: 12, height: 12, borderRadius: "50%", background: c, border: "2px solid #010409", boxShadow: `0 0 8px ${c}` }} />
              <div style={{
                flex: 1, background: "#161b22",
                border: `1px solid ${c}33`, borderLeft: `3px solid ${c}`,
                borderRadius: 8, padding: "10px 14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                      <span style={{ background: c + "22", color: c, borderRadius: 4, padding: "1px 7px", fontSize: 9, fontWeight: 800 }}>{ev.label}</span>
                      <span style={{ background: "#21262d", color: "#8b949e", borderRadius: 4, padding: "1px 7px", fontSize: 9 }}>{ev.artifact}</span>
                      <span style={{ color: "#d2a8ff", fontSize: 9, fontFamily: "monospace" }}>{ev.mitre}</span>
                    </div>
                    <div style={{ color: "#e6edf3", fontSize: 12 }}>{ev.event}</div>
                  </div>
                  <span style={{ color: c, fontSize: 11, fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>{ev.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── MISSION VIEW ──────────────────────────────────
  const MissionView = () => {
    if (!mission) return null;
    const xwayOpen = showXways[mission.id];
    const ansOpen  = showAnswer[mission.id];
    const mIdx = MISSIONS.findIndex(m => m.id === activeMission);
    const prevM = mIdx > 0 ? MISSIONS[mIdx - 1] : null;
    const nextM = mIdx < MISSIONS.length - 1 ? MISSIONS[mIdx + 1] : null;

    return (
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Mission Header */}
        <div style={{
          background: mission.color + "0d", border: `1px solid ${mission.color}33`,
          borderRadius: 12, padding: "20px 24px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 32 }}>{mission.icon}</span>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ background: mission.color + "22", color: mission.color, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 800 }}>MISSION {mission.no}</span>
                <span style={{ color: "#8b949e", fontSize: 11 }}>{mission.difficulty}</span>
                <span style={{ color: "#d2a8ff", fontSize: 10, fontFamily: "monospace", background: "#21262d", padding: "1px 7px", borderRadius: 4 }}>{mission.mitre}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{mission.title}</div>
              <div style={{ color: "#8b949e", fontSize: 12, marginTop: 3 }}>주요 아티팩트: {mission.artifact}</div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ color: "#ffd166", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📋 분석 문제</div>
          <pre style={{ color: "#e6edf3", fontSize: 12, lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit" }}>{mission.question}</pre>
        </div>

        {/* X-Ways 분석 방법 */}
        <div style={{ border: `1px solid ${mission.color}44`, borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
          <button onClick={() => toggleXways(mission.id)} style={{
            width: "100%", background: mission.color + "15", border: "none",
            padding: "14px 20px", cursor: "pointer", textAlign: "left",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ color: mission.color, fontSize: 20 }}>🔬</span>
            <span style={{ color: mission.color, fontWeight: 700, fontSize: 13 }}>X-Ways Forensics 분석 방법 (힌트)</span>
            <span style={{ marginLeft: "auto", color: mission.color, fontSize: 14 }}>{xwayOpen ? "▲" : "▼"}</span>
          </button>
          {xwayOpen && (
            <div style={{ padding: "16px 20px", background: "#0d1117" }}>
              {mission.xways_path.map((path, pi) => (
                <div key={pi} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ background: mission.color + "22", color: mission.color, borderRadius: 5, padding: "2px 8px", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>STEP {pi + 1}</span>
                    <div>
                      <div style={{ color: "#e6edf3", fontWeight: 700, fontSize: 12 }}>{path.step}</div>
                      <code style={{ color: "#8b949e", fontSize: 10 }}>{path.menu}</code>
                    </div>
                  </div>
                  <div style={{ paddingLeft: 16 }}>
                    {path.actions.map((act, ai) => (
                      <div key={ai} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                        <span style={{ color: mission.color, fontSize: 10, fontWeight: 800, minWidth: 16 }}>{ai + 1}.</span>
                        <span style={{
                          color: act.startsWith("발견:") ? "#06d6a0" : act.startsWith("※") ? "#ffd166" : "#e6edf3",
                          fontSize: 11, lineHeight: 1.6,
                        }}>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Answer */}
        <div style={{ border: "1px solid #06d6a044", borderRadius: 10, marginBottom: 20, overflow: "hidden" }}>
          <button onClick={() => toggleAnswer(mission.id)} style={{
            width: "100%", background: "#06d6a015", border: "none",
            padding: "14px 20px", cursor: "pointer", textAlign: "left",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <span style={{ color: "#06d6a0", fontWeight: 700, fontSize: 13 }}>모범 정답 보기</span>
            <span style={{ marginLeft: "auto", color: "#06d6a0", fontSize: 14 }}>{ansOpen ? "▲" : "▼"}</span>
          </button>
          {ansOpen && (
            <div style={{ padding: "16px 20px", background: "#0d1117" }}>
              <div style={{ background: "#06d6a015", border: "1px solid #06d6a033", borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
                <div style={{ color: "#06d6a0", fontWeight: 700, fontSize: 12, marginBottom: 4 }}>📌 핵심 요약</div>
                <div style={{ color: "#e6edf3", fontSize: 12, lineHeight: 1.7 }}>{mission.answer.summary}</div>
              </div>

              {/* Answer Details */}
              {mission.answer.details.map((d, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12,
                  background: d.highlight ? "#06d6a008" : "transparent",
                  border: `1px solid ${d.highlight ? "#06d6a033" : "#21262d"}`,
                  borderLeft: `3px solid ${d.highlight ? "#06d6a0" : "#30363d"}`,
                  borderRadius: 7, padding: "9px 13px", marginBottom: 6,
                }}>
                  <span style={{ color: "#8b949e", fontSize: 11, minWidth: 110, flexShrink: 0 }}>{d.label}</span>
                  <span style={{ color: d.highlight ? "#e6edf3" : "#8b949e", fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}>{d.value}</span>
                </div>
              ))}

              {/* Evidence Chain */}
              <div style={{ background: "#ffd16610", border: "1px solid #ffd16630", borderRadius: 8, padding: "12px 14px", marginBottom: 12, marginTop: 10 }}>
                <div style={{ color: "#ffd166", fontWeight: 700, fontSize: 11, marginBottom: 6 }}>🔗 증거 체인</div>
                <div style={{ color: "#e6edf3", fontSize: 11, lineHeight: 1.8, fontFamily: "monospace" }}>{mission.answer.evidence_chain}</div>
              </div>

              {/* IOC */}
              <div>
                <div style={{ color: "#8b949e", fontSize: 11, marginBottom: 6 }}>🚨 IOC (침해지표)</div>
                {mission.answer.ioc.map((ioc, i) => (
                  <code key={i} style={{ display: "block", background: "#ff4d6d0d", border: "1px solid #ff4d6d22", borderRadius: 5, padding: "5px 10px", color: "#ff7b7b", fontSize: 11, marginBottom: 4 }}>{ioc}</code>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mark Complete */}
        {!completed[mission.id] && (
          <button onClick={() => markDone(mission.id)} style={{
            width: "100%", background: "#238636", border: "none",
            borderRadius: 8, padding: "12px", cursor: "pointer",
            color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 16,
          }}>✅ 이 미션 완료 표시</button>
        )}
        {completed[mission.id] && (
          <div style={{ background: "#06d6a020", border: "1px solid #06d6a044", borderRadius: 8, padding: "10px", textAlign: "center", color: "#06d6a0", fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
            ✅ 완료됨
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {prevM ? (
            <button onClick={() => { setActiveMission(prevM.id); setShowAnswer({}); setShowXways({}); }} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "10px 16px", cursor: "pointer", color: "#e6edf3", fontSize: 12 }}>
              ← MISSION {prevM.no}
            </button>
          ) : (
            <button onClick={() => setView("briefing")} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "10px 16px", cursor: "pointer", color: "#8b949e", fontSize: 12 }}>
              ← 브리핑
            </button>
          )}
          {nextM ? (
            <button onClick={() => { setActiveMission(nextM.id); setShowAnswer({}); setShowXways({}); }} style={{ background: "#238636", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 700 }}>
              MISSION {nextM.no} →
            </button>
          ) : (
            <button onClick={() => setView("briefing")} style={{ background: "#4cc9f022", border: "1px solid #4cc9f044", borderRadius: 8, padding: "10px 16px", cursor: "pointer", color: "#4cc9f0", fontSize: 12, fontWeight: 700 }}>
              🏆 전체 완료 확인 →
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#010409", fontFamily: "'Segoe UI','Noto Sans KR',sans-serif", color: "#e6edf3" }}>
      {/* Header */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #21262d", padding: "12px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 20 }}>🎯</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Operation SilentDragon — APT 침해분석 훈련</div>
          <div style={{ color: "#8b949e", fontSize: 11 }}>X-Ways Forensics 실전 시나리오 · 8개 미션 · MITRE ATT&CK 매핑</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {[["briefing","📋 브리핑"], ["timeline","📊 타임라인"]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              background: view === v ? "#238636" : "#21262d",
              color: view === v ? "#fff" : "#8b949e", fontSize: 11,
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Mission Nav Bar */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #21262d", padding: "8px 20px", display: "flex", gap: 5, overflowX: "auto" }}>
        {MISSIONS.map(m => (
          <button key={m.id} onClick={() => { setActiveMission(m.id); setView("mission"); }} style={{
            padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
            background: activeMission === m.id && view === "mission" ? m.color + "33" : (completed[m.id] ? "#06d6a015" : "#161b22"),
            color: activeMission === m.id && view === "mission" ? m.color : (completed[m.id] ? "#06d6a0" : "#8b949e"),
            fontSize: 11, fontWeight: 700, flexShrink: 0,
            border: `1px solid ${activeMission === m.id && view === "mission" ? m.color + "55" : "#21262d"}`,
          }}>
            {completed[m.id] ? "✅" : m.icon} M{m.no}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 20px" }}>
        {view === "briefing"  && <BriefingView />}
        {view === "timeline"  && <TimelineView />}
        {view === "mission"   && activeMission && <MissionView />}
        {view === "mission"   && !activeMission && <BriefingView />}
      </div>
    </div>
  );
}
