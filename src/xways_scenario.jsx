import { useState } from "react";

// ═══════════════════════════════════════════════════
// SCENARIO DATA
// ═══════════════════════════════════════════════════
const SCENARIOS = [
  {
    id: "ransomware",
    icon: "🔴",
    difficulty: "입문",
    diffColor: "#06d6a0",
    title: "랜섬웨어 침해사고",
    subtitle: "Scenario 01",
    desc: "재무팀 PC에서 파일 암호화 발생. 공격 경로와 최초 침투 시점을 규명하라.",
    bgColor: "#ff4d6d",
    tags: ["이벤트로그", "프리패치", "레지스트리", "타임라인"],
    briefing: {
      date: "2024-03-15 (금) 오후 2시 30분",
      report: "재무팀 김OO 직원이 PC 파일들이 모두 .locked 확장자로 바뀌고 바탕화면에 랜섬노트가 생겼다고 신고",
      hostname: "FIN-PC-007",
      os: "Windows 10 22H2",
      user: "kim_finance",
      image: "FIN-PC-007.E01 (512GB)",
      hash: "MD5: a3f2...9c1b",
      mission: [
        "최초 침투 경로 파악 (피싱 메일? 취약점? RDP?)",
        "랜섬웨어 실행 시점과 최초 감염 시점 특정",
        "공격자가 수행한 내부 행위 재구성",
        "데이터 유출 여부 확인",
      ],
    },
    steps: [
      {
        id: "s1_case",
        phase: "STEP 1",
        phaseColor: "#4cc9f0",
        title: "케이스 생성 & 이미지 로드",
        icon: "📂",
        xways_menu: "Case → New Case (Ctrl+F2)",
        objective: "분석 환경을 구성하고 증거 이미지를 무결성 검증과 함께 로드한다.",
        actions: [
          {
            type: "action",
            label: "케이스 생성",
            steps: [
              "Ctrl+F2 → 새 케이스 생성",
              "사건번호: 2024-IR-015 입력",
              "조사관: 본인 이름 입력",
              "⚠️ Timezone: Asia/Seoul (UTC+9) 반드시 설정",
              "Hash: MD5 + SHA-1 체크",
              "저장 경로: D:\\Cases\\2024-IR-015\\ (증거와 다른 드라이브)",
            ],
          },
          {
            type: "action",
            label: "증거 이미지 추가",
            steps: [
              "Evidence → Add Evidence Object",
              "Image File 선택 → FIN-PC-007.E01 선택",
              "Evidence → Verify → 해시값 일치 확인",
              "📌 해시 값을 케이스 노트에 기록해둘 것",
            ],
          },
          {
            type: "action",
            label: "Volume Snapshot 생성 (RVS)",
            steps: [
              "증거 선택 후 F2 (Refine Volume Snapshot)",
              "✅ Recover deleted files",
              "✅ Identify file types (확장자 위조 탐지)",
              "✅ Compute hash values (MD5+SHA-1)",
              "✅ Extract metadata",
              "OK → 처리 완료까지 대기 (30분~1시간)",
            ],
          },
        ],
        tips: [
          "Timezone을 잘못 설정하면 타임라인 전체가 틀어짐 — 증거 시스템의 타임존 반드시 확인",
          "RVS는 한 번에 모든 옵션 체크하지 말고 우선 기본 옵션만 실행. 필요 시 추가 실행",
        ],
        xways_tip: "케이스 로그(.xfc.txt)는 모든 작업을 자동 기록. 절대 삭제하지 말 것.",
      },
      {
        id: "s1_recent",
        phase: "STEP 2",
        phaseColor: "#ffd166",
        title: "감염 시간대 파일 탐색",
        icon: "🕐",
        xways_menu: "파일 목록 → 정렬 → Modified Time",
        objective: "랜섬웨어 실행 직전 생성·수정된 파일을 찾아 최초 침투 시점을 좁힌다.",
        actions: [
          {
            type: "action",
            label: "최근 생성 파일 필터링",
            steps: [
              "파일 목록에서 컬럼 헤더 'Created' 클릭 → 최신순 정렬",
              "View → Filter 열기",
              "Date/Time Filter → Created: 2024-03-15 00:00 ~ 14:30 범위 설정",
              "Apply → 해당 시간대 생성 파일만 표시",
            ],
          },
          {
            type: "action",
            label: "의심 파일 집중 탐색",
            steps: [
              "C:\\Users\\kim_finance\\Downloads\\ 폴더 확인",
              "C:\\Users\\kim_finance\\AppData\\Local\\Temp\\ 확인",
              "C:\\Windows\\Temp\\ 확인",
              "확장자가 .exe, .bat, .ps1, .vbs 인 파일 → 즉시 의심",
              "파일 우클릭 → Properties → 생성/수정/접근 시간 비교",
            ],
          },
          {
            type: "finding",
            label: "💡 여기서 발견해야 할 것",
            findings: [
              { icon: "📧", text: "피싱 메일 첨부파일 (견적서.pdf.exe 또는 유사)" },
              { icon: "📥", text: "Downloads 폴더의 의심스러운 실행 파일" },
              { icon: "🔒", text: ".locked 확장자로 변경된 파일들의 수정 시간대" },
              { icon: "📝", text: "랜섬노트 파일 (README.txt, HOW_TO_DECRYPT.txt 등)" },
            ],
          },
        ],
        tips: [
          "파일 정렬은 Created / Modified / Accessed 모두 확인. 공격자가 하나를 조작해도 나머지가 남음",
          "랜섬노트 파일의 생성 시간 = 랜섬웨어 실행 시작 시점으로 추정 가능",
        ],
        xways_tip: "Column Filter (View → Filter) 는 XWF 최강 기능. 날짜·크기·경로·확장자 조합으로 수만 개 파일 중 수십 개로 좁힐 수 있음.",
      },
      {
        id: "s1_prefetch",
        phase: "STEP 3",
        phaseColor: "#ff4d6d",
        title: "프리패치로 실행 이력 확인",
        icon: "⚡",
        xways_menu: "파일 경로: Windows\\Prefetch\\*.pf",
        objective: "프리패치로 랜섬웨어 실행 파일명, 실행 시간, 실행 횟수를 확인한다.",
        actions: [
          {
            type: "action",
            label: "프리패치 파일 탐색",
            steps: [
              "디렉토리 브라우저 → C:\\Windows\\Prefetch\\ 이동",
              "파일 목록 → .pf 파일 목록 확인",
              "Modified 시간 기준 정렬 → 침해 시간대 .pf 파일 우선 확인",
              "의심 .pf 파일 선택 → 하단 미리보기에서 내용 확인",
            ],
          },
          {
            type: "action",
            label: "XWF 프리패치 파서 활용",
            steps: [
              "의심 .pf 파일 선택",
              "미리보기 패널 → Parsed 탭 클릭",
              "실행 파일 경로, 실행 횟수, 최근 8회 실행 시간 확인",
              "실행 파일이 접근한 파일 목록도 확인 가능",
            ],
          },
          {
            type: "finding",
            label: "💡 여기서 확인할 사항",
            findings: [
              { icon: "📍", text: "랜섬웨어 실행 파일명 특정 (예: INVOICE_MARCH.PDF.EXE-XXXX.pf)" },
              { icon: "🕐", text: "최초 실행 시간 → 감염 시점 특정" },
              { icon: "🔢", text: "실행 횟수가 1회 → 최초 실행 후 삭제된 것으로 추정" },
              { icon: "📂", text: "접근 파일 목록 → 랜섬웨어가 건드린 경로 파악" },
            ],
          },
          {
            type: "action",
            label: "추가 확인: 파워셸/CMD 실행 이력",
            steps: [
              "POWERSHELL.EXE-XXXX.pf 파일 확인",
              "CMD.EXE-XXXX.pf 파일 확인",
              "실행 횟수와 시간이 평소와 다르면 공격자 명령 실행 의심",
              "WSCRIPT.EXE, CSCRIPT.EXE, MSHTA.EXE 실행 이력도 확인",
            ],
          },
        ],
        tips: [
          "파일명은 삭제되어도 PF 파일에 원본 경로가 남아있음",
          "POWERSHELL.EXE 실행 횟수가 평소보다 높다면 → 공격자 명령 실행 가능성",
          "접근 파일 목록에 네트워크 경로(\\\\)가 있으면 → 측면 이동 시도 흔적",
        ],
        xways_tip: "XWF는 .pf 파일을 자동으로 파싱해서 읽기 쉬운 형태로 보여줌. 별도 도구 없이 바로 분석 가능.",
      },
      {
        id: "s1_eventlog",
        phase: "STEP 4",
        phaseColor: "#d2a8ff",
        title: "이벤트 로그 분석",
        icon: "📋",
        xways_menu: "경로: Windows\\System32\\winevt\\Logs\\",
        objective: "이벤트 로그로 최초 침투 방법(RDP? 피싱? 취약점?)과 공격자 행위를 확인한다.",
        actions: [
          {
            type: "action",
            label: "핵심 이벤트 로그 파일 탐색",
            steps: [
              "C:\\Windows\\System32\\winevt\\Logs\\ 이동",
              "Security.evtx 선택 → 더블클릭 (내장 이벤트 뷰어 실행)",
              "System.evtx 도 같이 확인",
              "Microsoft-Windows-PowerShell%4Operational.evtx 도 확인",
            ],
          },
          {
            type: "action",
            label: "침해 시간대 이벤트 필터링",
            steps: [
              "이벤트 뷰어 → Filter/Search 기능",
              "시간 범위: 2024-03-15 10:00 ~ 14:30 설정",
              "아래 Event ID 순서대로 검색",
            ],
          },
          {
            type: "eventid_table",
            label: "🔑 랜섬웨어 사고에서 확인할 Event ID",
            events: [
              { id: "4625", src: "Security", desc: "로그온 실패 (RDP 브루트포스)", threat: true },
              { id: "4624", src: "Security", desc: "로그온 성공 — Logon Type 10이면 RDP", threat: true },
              { id: "4648", src: "Security", desc: "명시적 자격증명 사용 (Pass-the-Hash)", threat: true },
              { id: "4688", src: "Security", desc: "프로세스 생성 — cmd.exe, powershell.exe 부모 확인", threat: true },
              { id: "4698", src: "Security", desc: "예약 작업 생성 (지속성 확보)", threat: true },
              { id: "4720", src: "Security", desc: "새 계정 생성 (백도어 계정)", threat: true },
              { id: "7045", src: "System",   desc: "새 서비스 설치 (악성 서비스)", threat: true },
              { id: "1102", src: "Security", desc: "감사 로그 삭제 (증거 인멸 시도)", threat: true },
              { id: "4104", src: "PowerShell", desc: "PowerShell 스크립트 블록 로깅", threat: true },
            ],
          },
          {
            type: "finding",
            label: "💡 여기서 찾아야 할 패턴",
            findings: [
              { icon: "🌐", text: "4625 반복 (수십~수백 회) → RDP 브루트포스 → 4624 Type 10 성공 = 침입 시점" },
              { icon: "📧", text: "4688에서 Outlook.exe → cmd.exe 생성 = 피싱 메일 매크로 실행" },
              { icon: "⚡", text: "4688에서 powershell.exe -enc ... = Base64 인코딩 명령 실행" },
              { icon: "🔇", text: "1102 이벤트 있으면 공격자가 로그 삭제 시도 — 그 직전까지만 분석 가능" },
            ],
          },
        ],
        tips: [
          "4624 Logon Type 값: 2=콘솔, 3=네트워크, 10=RDP, 7=잠금해제 — Type 10이 핵심",
          "4688에서 프로세스 명령줄(CommandLine)을 보려면 Security 정책에서 '프로세스 명령줄 감사' 활성화되어 있어야 함",
          "PowerShell 4104 로그가 있다면 공격자가 실행한 스크립트 내용 전체를 볼 수 있음 — 金광맥",
        ],
        xways_tip: "XWF의 이벤트 뷰어는 필터 기능이 있음. Event ID 컬럼 클릭 후 특정 ID만 표시 가능.",
      },
      {
        id: "s1_registry",
        phase: "STEP 5",
        phaseColor: "#ffa657",
        title: "레지스트리 지속성 분석",
        icon: "🗝",
        xways_menu: "경로: Windows\\System32\\config\\",
        objective: "공격자가 재부팅 후에도 살아남기 위해 심어둔 지속성 메커니즘을 찾는다.",
        actions: [
          {
            type: "action",
            label: "레지스트리 하이브 로드",
            steps: [
              "C:\\Windows\\System32\\config\\ 이동",
              "SYSTEM, SOFTWARE, SAM 파일 선택",
              "더블클릭 → XWF 내장 레지스트리 뷰어 실행",
              "NTUSER.DAT은 C:\\Users\\kim_finance\\ 에서 로드",
            ],
          },
          {
            type: "registry_table",
            label: "🔑 반드시 확인할 레지스트리 키",
            regs: [
              {
                key: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
                desc: "시작 시 자동 실행 → 악성코드 지속성 1순위",
                threat: true,
              },
              {
                key: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce",
                desc: "1회 실행 후 삭제 — 페이로드 드롭퍼에서 자주 사용",
                threat: true,
              },
              {
                key: "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
                desc: "사용자 로그온 시 실행 (NTUSER.DAT에 위치)",
                threat: true,
              },
              {
                key: "HKLM\\SYSTEM\\CurrentControlSet\\Services",
                desc: "악성 서비스 설치 여부 — 7045 이벤트와 교차 확인",
                threat: true,
              },
              {
                key: "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender",
                desc: "DisableAntiSpyware = 1 이면 방어 기능 비활성화",
                threat: true,
              },
              {
                key: "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon",
                desc: "Userinit, Shell 값 변조 → 로그온 시 악성코드 실행",
                threat: true,
              },
              {
                key: "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs",
                desc: "최근 열어본 문서 목록 — 피싱 파일명 확인 가능",
                threat: false,
              },
              {
                key: "HKLM\\SYSTEM\\CurrentControlSet\\Control\\TimeZoneInformation",
                desc: "시스템 타임존 확인 — 분석 전 반드시 체크",
                threat: false,
              },
            ],
          },
          {
            type: "finding",
            label: "💡 여기서 찾아야 할 것",
            findings: [
              { icon: "🚨", text: "Run 키에 C:\\Temp\\, AppData\\Local 경로 값 → 즉시 악성 의심" },
              { icon: "🛡", text: "Windows Defender 비활성화 키 → 공격자가 방어 우회한 증거" },
              { icon: "👤", text: "SAM에서 침해 시간대 신규 생성된 계정 → 백도어 계정" },
              { icon: "⏰", text: "레지스트리 키 수정 시간과 이벤트 로그 시간 비교 교차 검증" },
            ],
          },
        ],
        tips: [
          "레지스트리 키 수정 시간(LastWrite)이 침해 시간대와 일치하는 것 우선 확인",
          "Run 키 값의 경로가 System32나 Program Files가 아닌 Temp, AppData면 90% 악성",
          "Amcache.hve 도 확인 — 실행된 파일의 해시·경로·시간이 기록됨",
        ],
        xways_tip: "XWF 레지스트리 뷰어에서 키를 선택하면 LastWrite 타임스탬프가 표시됨. 이 시간이 침해 타임라인의 핵심 증거.",
      },
      {
        id: "s1_timeline",
        phase: "STEP 6",
        phaseColor: "#06d6a0",
        title: "타임라인 재구성",
        icon: "📈",
        xways_menu: "View → Timeline (Ctrl+T)",
        objective: "지금까지 수집한 모든 증거를 시간 순으로 통합하여 공격 전체 흐름을 재구성한다.",
        actions: [
          {
            type: "action",
            label: "XWF 타임라인 생성",
            steps: [
              "View → Timeline (또는 Ctrl+T)",
              "시간 범위: 2024-03-15 09:00 ~ 15:00 설정 (여유있게)",
              "포함 소스: File System Timestamps, Registry, Event Log 모두 체크",
              "Generate 클릭",
              "CSV 내보내기 → 외부 도구(Excel 또는 Timeline Explorer)에서 추가 분석",
            ],
          },
          {
            type: "timeline_example",
            label: "📊 재구성 예시 타임라인",
            events: [
              { time: "10:14", type: "critical", src: "이벤트로그", event: "4625 × 347회 — RDP 브루트포스 공격 시작 (소스 IP: 185.220.x.x)" },
              { time: "10:52", type: "critical", src: "이벤트로그", event: "4624 Logon Type 10 성공 — RDP 침입 확인" },
              { time: "10:54", type: "warning",  src: "프리패치",   event: "WHOAMI.EXE 실행 (내부 정찰 시작)" },
              { time: "10:55", type: "warning",  src: "프리패치",   event: "NET.EXE, IPCONFIG.EXE 실행 (네트워크 정찰)" },
              { time: "11:03", type: "critical", src: "이벤트로그", event: "4688 — powershell.exe -enc [Base64] 실행" },
              { time: "11:05", type: "critical", src: "MFT",        event: "C:\\Temp\\svchost32.exe 파일 생성 (드롭)" },
              { time: "11:06", type: "critical", src: "레지스트리", event: "Run 키 등록 — svchost32.exe 지속성 확보" },
              { time: "11:07", type: "critical", src: "이벤트로그", event: "7045 — 악성 서비스 설치" },
              { time: "11:15", type: "critical", src: "프리패치",   event: "MIMIKATZ.EXE 실행 (자격증명 탈취)" },
              { time: "11:28", type: "critical", src: "이벤트로그", event: "4720 — 백도어 계정 생성 (admin_bak)" },
              { time: "14:22", type: "critical", src: "MFT",        event: "랜섬웨어 실행 — 파일 암호화 시작" },
              { time: "14:23", type: "warning",  src: "MFT",        event: "README_DECRYPT.txt 생성 (랜섬노트)" },
              { time: "14:31", type: "critical", src: "이벤트로그", event: "1102 — 보안 로그 삭제 시도" },
            ],
          },
          {
            type: "finding",
            label: "💡 타임라인 분석 포인트",
            findings: [
              { icon: "⏱", text: "RDP 침입(10:52) → 랜섬웨어 실행(14:22) = 약 3.5시간 체류" },
              { icon: "🎯", text: "침투 경로: RDP 브루트포스 → 성공 → 내부 정찰 → 권한상승 → 랜섬웨어" },
              { icon: "🔑", text: "Mimikatz 실행(11:15) = 이 자격증명으로 내부 확산 시도 가능" },
              { icon: "📤", text: "11:15~14:22 사이 외부 통신 여부 → 데이터 유출 조사 필요" },
            ],
          },
        ],
        tips: [
          "타임라인은 CSV로 내보내서 Excel에서 색상 분류하면 보고서 작성이 훨씬 쉬워짐",
          "시간 역전(Modified < Created) 파일 발견 시 Timestomping 의심 — 별도 표시",
          "$STANDARD_INFORMATION과 $FILE_NAME의 타임스탬프가 다르면 조작된 것",
        ],
        xways_tip: "타임라인 뷰에서 이벤트 클릭 시 해당 파일/이벤트로 바로 이동. 증거 간 연결 추적에 활용.",
      },
    ],
  },
  // ───────────────────────────────────────────
  {
    id: "insider",
    icon: "🟡",
    difficulty: "중급",
    diffColor: "#ffd166",
    title: "내부자 데이터 유출",
    subtitle: "Scenario 02",
    desc: "퇴직 예정 연구원이 핵심 기술 문서를 외부로 빼돌렸다는 제보. USB와 이메일 유출 경로를 추적하라.",
    bgColor: "#ffd166",
    tags: ["LNK", "쉘백", "USB흔적", "레지스트리", "브라우저"],
    briefing: {
      date: "2024-05-20",
      report: "연구소 보안팀이 퇴직 예정 연구원 박OO이 기술 문서를 무단 반출했다는 제보를 접수",
      hostname: "RND-PC-023",
      os: "Windows 11 23H2",
      user: "park_research",
      image: "RND-PC-023.E01 (1TB)",
      hash: "MD5: b7e3...2d4a",
      mission: [
        "USB 연결 이력 및 복사된 파일 목록 확인",
        "이메일·클라우드 통한 외부 전송 경로 파악",
        "어떤 문서를 언제 접근·복사했는지 특정",
        "데이터 삭제 흔적 확인",
      ],
    },
    steps: [
      {
        id: "s2_usb",
        phase: "STEP 1",
        phaseColor: "#ffd166",
        title: "USB 연결 이력 추적",
        icon: "💾",
        xways_menu: "Registry → SYSTEM\\CurrentControlSet\\Enum\\USBSTOR",
        objective: "언제 어떤 USB가 연결되었는지, 어떤 드라이브 문자가 할당되었는지 확인한다.",
        actions: [
          {
            type: "action",
            label: "USB 연결 이력 확인 (레지스트리)",
            steps: [
              "SYSTEM 하이브 로드",
              "SYSTEM\\CurrentControlSet\\Enum\\USBSTOR 키 이동",
              "하위 키 목록 = 연결된 USB 장치 목록",
              "각 키의 LastWrite 시간 = 마지막 연결 시간",
              "FriendlyName, SerialNumber 기록",
            ],
          },
          {
            type: "action",
            label: "드라이브 문자 매핑 확인",
            steps: [
              "SOFTWARE\\Microsoft\\Windows Portable Devices\\Devices 확인",
              "SYSTEM\\MountedDevices 에서 드라이브 문자 확인",
              "FriendlyName과 드라이브 문자 매핑 기록",
            ],
          },
          {
            type: "registry_table",
            label: "USB 추적 레지스트리 키",
            regs: [
              { key: "SYSTEM\\CurrentControlSet\\Enum\\USBSTOR", desc: "연결된 USB 장치 목록 + 시리얼 번호", threat: false },
              { key: "SYSTEM\\CurrentControlSet\\Enum\\USB", desc: "USB 허브·컨트롤러 포함 전체 USB 이력", threat: false },
              { key: "SOFTWARE\\Microsoft\\Windows Portable Devices", desc: "이동식 장치 친숙한 이름", threat: false },
              { key: "SYSTEM\\MountedDevices", desc: "마운트된 볼륨과 드라이브 문자 매핑", threat: false },
              { key: "SOFTWARE\\Microsoft\\Windows Search\\VolumeInfoCache", desc: "USB 볼륨 레이블 캐시", threat: false },
            ],
          },
        ],
        tips: [
          "USBSTOR의 SerialNumber는 특정 USB 장치를 법적으로 특정하는 핵심 증거",
          "LastWrite 시간 = 해당 USB가 마지막으로 연결된 시간",
          "이벤트 로그 20001 (드라이버 설치)와 교차 검증하면 최초 연결 시간도 파악 가능",
        ],
        xways_tip: "XWF 레지스트리 뷰어에서 USBSTOR 키를 우클릭 → Export하면 전체 USB 이력을 텍스트로 저장 가능.",
      },
      {
        id: "s2_lnk",
        phase: "STEP 2",
        phaseColor: "#ffa657",
        title: "LNK & 쉘백으로 파일 접근 추적",
        icon: "🔗",
        xways_menu: "경로: Users\\park_research\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\",
        objective: "LNK 파일과 쉘백으로 연구원이 어떤 파일을 열었는지, USB를 통해 무엇을 접근했는지 추적한다.",
        actions: [
          {
            type: "action",
            label: "LNK 파일 분석",
            steps: [
              "C:\\Users\\park_research\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\ 이동",
              "*.lnk 파일 목록 확인 → Created 시간 기준 정렬",
              "LNK 파일 선택 → 미리보기 → Parsed 탭",
              "원본 파일 경로, 볼륨 시리얼, 호스트명 확인",
              "드라이브 문자 E:\\ 또는 F:\\ 로 시작하는 경로 = USB 접근",
            ],
          },
          {
            type: "action",
            label: "쉘백으로 폴더 탐색 이력 확인",
            steps: [
              "NTUSER.DAT, USRCLASS.DAT 로드",
              "SOFTWARE\\Microsoft\\Windows\\Shell\\BagMRU 키 탐색",
              "USB 드라이브 경로가 포함된 쉘백 엔트리 확인",
              "접근 시간 확인 → USB 연결 시간과 비교",
            ],
          },
          {
            type: "finding",
            label: "💡 여기서 찾아야 할 것",
            findings: [
              { icon: "💾", text: "LNK 경로가 E:\\ 또는 F:\\ → USB에서 파일 열거나 복사" },
              { icon: "📄", text: "기술 문서 파일명이 포함된 LNK → 어떤 문서를 접근했는지 특정" },
              { icon: "🖥", text: "LNK의 MachineName이 다른 PC → 다른 컴퓨터에서도 접근" },
              { icon: "⏰", text: "LNK 생성 시간 = 원본 파일 최초 접근 시간" },
            ],
          },
        ],
        tips: [
          "LNK 파일은 원본 파일이 삭제되어도 남아있어 접근 사실 증명 가능",
          "USB 드라이브의 볼륨 시리얼이 USBSTOR 레지스트리와 일치하면 동일 USB 장치 증명",
          "쉘백은 탐색기로 폴더를 '열어본' 행위만 기록 — 파일 복사는 LNK로 별도 확인",
        ],
        xways_tip: "LNK 파일 선택 후 Parsed 뷰에서 볼 수 있는 MAC 주소가 레지스트리 MountedDevices와 일치하면 완벽한 증거 체인.",
      },
      {
        id: "s2_browser",
        phase: "STEP 3",
        phaseColor: "#4ecdc4",
        title: "브라우저로 클라우드 유출 경로 추적",
        icon: "🌐",
        xways_menu: "경로: Users\\park_research\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\",
        objective: "이메일·클라우드 스토리지를 통한 외부 전송 여부를 브라우저 히스토리에서 확인한다.",
        actions: [
          {
            type: "action",
            label: "Chrome 히스토리 분석",
            steps: [
              "AppData\\Local\\Google\\Chrome\\User Data\\Default\\ 이동",
              "History 파일 선택 → SQLite 뷰어로 열기",
              "urls 테이블 → visit_time 컬럼 기준 정렬",
              "침해 시간대 방문 URL 목록 확인",
              "downloads 테이블 → referrer 컬럼 확인 (업로드 페이지 URL)",
            ],
          },
          {
            type: "action",
            label: "클라우드 스토리지 접속 확인",
            steps: [
              "URL에서 drive.google.com, dropbox.com, onedrive.live.com 검색",
              "웹메일 접속 (mail.google.com, outlook.com 등) 확인",
              "파일 업로드 관련 POST 요청 URL 패턴 검색",
              "시크릿 모드 사용 시 브라우저 히스토리 없음 → SRUM으로 보완",
            ],
          },
          {
            type: "finding",
            label: "💡 여기서 찾아야 할 것",
            findings: [
              { icon: "☁️", text: "클라우드 스토리지 접속 이력 + 접속 시간" },
              { icon: "📧", text: "웹메일 대용량 첨부파일 전송 패턴" },
              { icon: "🔍", text: "검색어에 '삭제 방법', '증거 인멸' 등 관련 키워드" },
              { icon: "📊", text: "SRUM에서 브라우저의 대용량 송신 바이트 → 유출 규모 추정" },
            ],
          },
        ],
        tips: [
          "Chrome History의 visit_time은 WebKit 타임스탬프 (1601-01-01 기준 마이크로초) → XWF가 자동 변환",
          "시크릿 모드 사용 시 히스토리 없음 → SRUM 네트워크 사용량, DNS 캐시로 보완",
          "Cached 이미지에서 업로드했던 페이지 일부를 복원할 수 있는 경우도 있음",
        ],
        xways_tip: "XWF에서 SQLite 파일(History, Downloads)을 선택하면 내장 뷰어로 테이블 구조를 바로 볼 수 있음.",
      },
    ],
  },
];

// ═══════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════
const TYPE_COLOR = { critical: "#ff4d6d", warning: "#ffd166", info: "#4cc9f0", normal: "#8b949e" };

function EventIdTable({ events }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ background: "#161b22" }}>
            {["Event ID", "소스", "설명", ""].map((h, i) => (
              <th key={i} style={{ padding: "7px 12px", color: "#8b949e", textAlign: "left", fontSize: 10, letterSpacing: ".05em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((ev, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #21262d", background: ev.threat ? "#ff4d6d08" : (i % 2 === 0 ? "transparent" : "#161b22") }}>
              <td style={{ padding: "7px 12px", color: "#58a6ff", fontFamily: "monospace", fontWeight: 700 }}>{ev.id}</td>
              <td style={{ padding: "7px 12px", color: "#8b949e", fontSize: 10 }}>{ev.src}</td>
              <td style={{ padding: "7px 12px", color: ev.threat ? "#ffaaaa" : "#e6edf3" }}>{ev.desc}</td>
              <td style={{ padding: "7px 12px" }}>
                {ev.threat && <span style={{ background: "#ff4d6d22", color: "#ff4d6d", border: "1px solid #ff4d6d44", borderRadius: 4, padding: "1px 7px", fontSize: 9, fontWeight: 700 }}>⚠ 위협</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegistryTable({ regs }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {regs.map((r, i) => (
        <div key={i} style={{
          background: r.threat ? "#ff4d6d08" : "#161b22",
          border: `1px solid ${r.threat ? "#ff4d6d33" : "#21262d"}`,
          borderLeft: `3px solid ${r.threat ? "#ff4d6d" : "#30363d"}`,
          borderRadius: 7, padding: "9px 13px",
        }}>
          <code style={{ color: "#58a6ff", fontSize: 10, fontFamily: "monospace", wordBreak: "break-all", display: "block", marginBottom: 4 }}>{r.key}</code>
          <span style={{ color: "#8b949e", fontSize: 11 }}>{r.desc}</span>
        </div>
      ))}
    </div>
  );
}

function TimelineExample({ events }) {
  return (
    <div style={{ position: "relative", paddingLeft: 20 }}>
      <div style={{ position: "absolute", left: 7, top: 0, bottom: 0, width: 2, background: "linear-gradient(#ff4d6d44, #ffd16644, #4cc9f044)" }} />
      {events.map((ev, i) => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8, position: "relative" }}>
          <div style={{
            position: "absolute", left: -17, top: 4, width: 10, height: 10,
            borderRadius: "50%", background: TYPE_COLOR[ev.type],
            border: "2px solid #010409", flexShrink: 0,
            boxShadow: `0 0 6px ${TYPE_COLOR[ev.type]}`,
          }} />
          <div style={{
            background: "#161b22",
            border: `1px solid ${TYPE_COLOR[ev.type]}33`,
            borderLeft: `3px solid ${TYPE_COLOR[ev.type]}`,
            borderRadius: 7, padding: "8px 12px", flex: 1,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <span style={{ color: "#8b949e", fontSize: 9, marginRight: 8, background: "#21262d", padding: "1px 6px", borderRadius: 3 }}>{ev.src}</span>
                <span style={{ color: "#e6edf3", fontSize: 11 }}>{ev.event}</span>
              </div>
              <span style={{ color: TYPE_COLOR[ev.type], fontFamily: "monospace", fontSize: 11, flexShrink: 0, fontWeight: 700 }}>{ev.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionBlock({ action }) {
  if (action.type === "action") {
    return (
      <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 9, padding: "14px 16px", marginBottom: 10 }}>
        <div style={{ color: "#4cc9f0", fontWeight: 700, fontSize: 12, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ background: "#4cc9f022", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>실습</span>
          {action.label}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {action.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: "#238636", fontSize: 10, fontWeight: 800, minWidth: 18, marginTop: 1 }}>{i + 1}.</span>
              <span style={{ color: step.startsWith("⚠️") || step.startsWith("📌") || step.startsWith("✅") ? "#ffd166" : "#e6edf3", fontSize: 11, lineHeight: 1.6 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (action.type === "finding") {
    return (
      <div style={{ background: "#06d6a010", border: "1px solid #06d6a033", borderRadius: 9, padding: "14px 16px", marginBottom: 10 }}>
        <div style={{ color: "#06d6a0", fontWeight: 700, fontSize: 12, marginBottom: 10 }}>{action.label}</div>
        {action.findings.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 14 }}>{f.icon}</span>
            <span style={{ color: "#e6edf3", fontSize: 11, lineHeight: 1.6 }}>{f.text}</span>
          </div>
        ))}
      </div>
    );
  }
  if (action.type === "eventid_table") return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: "#d2a8ff", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>{action.label}</div>
      <EventIdTable events={action.events} />
    </div>
  );
  if (action.type === "registry_table") return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: "#ffa657", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>{action.label}</div>
      <RegistryTable regs={action.regs} />
    </div>
  );
  if (action.type === "timeline_example") return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: "#06d6a0", fontWeight: 700, fontSize: 12, marginBottom: 10 }}>{action.label}</div>
      <TimelineExample events={action.events} />
    </div>
  );
  return null;
}

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function XWaysScenarioGuide() {
  const [activeScenario, setActiveScenario] = useState("ransomware");
  const [activeStep, setActiveStep] = useState(null);
  const [showBriefing, setShowBriefing] = useState(true);

  const scenario = SCENARIOS.find(s => s.id === activeScenario);

  const selectScenario = (id) => {
    setActiveScenario(id);
    setActiveStep(null);
    setShowBriefing(true);
  };

  const selectStep = (id) => {
    setActiveStep(id);
    setShowBriefing(false);
  };

  const step = scenario.steps.find(s => s.id === activeStep);

  return (
    <div style={{
      minHeight: "100vh", background: "#010409",
      fontFamily: "'Segoe UI', 'Noto Sans KR', sans-serif",
      color: "#e6edf3", display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #21262d", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 22 }}>🔬</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>X-Ways Forensics 실습 시나리오</div>
          <div style={{ color: "#8b949e", fontSize: 11 }}>실제 침해사고 시나리오 기반 · 단계별 실습 가이드</div>
        </div>
      </div>

      {/* Scenario Tabs */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #21262d", padding: "10px 20px", display: "flex", gap: 10 }}>
        {SCENARIOS.map(sc => (
          <button key={sc.id} onClick={() => selectScenario(sc.id)} style={{
            padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
            background: activeScenario === sc.id ? sc.bgColor + "22" : "#161b22",
            color: activeScenario === sc.id ? sc.bgColor : "#8b949e",
            border: `1px solid ${activeScenario === sc.id ? sc.bgColor + "55" : "#30363d"}`,
            fontWeight: activeScenario === sc.id ? 700 : 400, fontSize: 12,
            display: "flex", alignItems: "center", gap: 8, transition: "all .15s",
          }}>
            {sc.icon} {sc.title}
            <span style={{ background: sc.diffColor + "22", color: sc.diffColor, border: `1px solid ${sc.diffColor}44`, borderRadius: 10, padding: "1px 7px", fontSize: 10 }}>{sc.difficulty}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* Step Sidebar */}
        <div style={{ width: 220, background: "#0d1117", borderRight: "1px solid #21262d", overflowY: "auto", flexShrink: 0, padding: "12px 8px" }}>
          <button onClick={() => { setShowBriefing(true); setActiveStep(null); }} style={{
            width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 7,
            border: "none", cursor: "pointer", marginBottom: 6,
            background: showBriefing ? "#23863633" : "transparent",
            borderLeft: `3px solid ${showBriefing ? "#238636" : "transparent"}`,
            color: showBriefing ? "#06d6a0" : "#8b949e", fontSize: 12, fontWeight: showBriefing ? 700 : 400,
          }}>📋 사건 브리핑</button>

          <div style={{ color: "#8b949e", fontSize: 10, padding: "4px 12px", letterSpacing: ".06em", marginBottom: 4 }}>분석 단계</div>

          {scenario.steps.map((s, i) => (
            <button key={s.id} onClick={() => selectStep(s.id)} style={{
              width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 7,
              border: "none", cursor: "pointer", marginBottom: 3, transition: "all .15s",
              background: activeStep === s.id ? s.phaseColor + "22" : "transparent",
              borderLeft: `3px solid ${activeStep === s.id ? s.phaseColor : "transparent"}`,
            }}>
              <div style={{ color: s.phaseColor, fontSize: 9, fontWeight: 800, marginBottom: 2 }}>{s.phase}</div>
              <div style={{ color: activeStep === s.id ? "#e6edf3" : "#8b949e", fontSize: 11, fontWeight: activeStep === s.id ? 700 : 400, display: "flex", gap: 5, alignItems: "center" }}>
                {s.icon} {s.title}
              </div>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {/* Briefing */}
          {showBriefing && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 36, background: scenario.bgColor + "22", borderRadius: 14, padding: "10px 14px", border: `1px solid ${scenario.bgColor}44` }}>{scenario.icon}</div>
                <div>
                  <div style={{ color: "#8b949e", fontSize: 11, marginBottom: 4 }}>{scenario.subtitle} · {scenario.difficulty}</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{scenario.title}</div>
                  <div style={{ color: "#8b949e", fontSize: 13, marginTop: 4 }}>{scenario.desc}</div>
                </div>
              </div>

              {/* Incident Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  ["🗓 발생 일시", scenario.briefing.date],
                  ["🖥 호스트명", scenario.briefing.hostname],
                  ["💻 OS", scenario.briefing.os],
                  ["👤 사용자", scenario.briefing.user],
                  ["💾 증거 이미지", scenario.briefing.image],
                  ["🔐 해시", scenario.briefing.hash],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ color: "#8b949e", fontSize: 10, marginBottom: 4 }}>{k}</div>
                    <div style={{ color: "#e6edf3", fontSize: 12, fontFamily: "monospace" }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Report */}
              <div style={{ background: "#ff4d6d10", border: "1px solid #ff4d6d33", borderRadius: 10, padding: "16px 18px", marginBottom: 20 }}>
                <div style={{ color: "#ff4d6d", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>🚨 신고 내용</div>
                <div style={{ color: "#e6edf3", fontSize: 13, lineHeight: 1.7 }}>{scenario.briefing.report}</div>
              </div>

              {/* Mission */}
              <div style={{ background: "#238636" + "10", border: "1px solid #238636" + "33", borderRadius: 10, padding: "16px 18px", marginBottom: 24 }}>
                <div style={{ color: "#06d6a0", fontWeight: 700, fontSize: 12, marginBottom: 10 }}>🎯 분석 미션</div>
                {scenario.briefing.mission.map((m, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 7 }}>
                    <span style={{ color: "#06d6a0", fontWeight: 800, minWidth: 20 }}>{i + 1}.</span>
                    <span style={{ color: "#e6edf3", fontSize: 12 }}>{m}</span>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                <span style={{ color: "#8b949e", fontSize: 12 }}>주요 아티팩트:</span>
                {scenario.tags.map(tag => (
                  <span key={tag} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#e6edf3" }}>{tag}</span>
                ))}
              </div>

              <button onClick={() => selectStep(scenario.steps[0].id)} style={{
                background: "#238636", border: "none", borderRadius: 8,
                padding: "12px 24px", cursor: "pointer", color: "#fff",
                fontSize: 14, fontWeight: 700,
              }}>
                🚀 분석 시작 → STEP 1
              </button>
            </div>
          )}

          {/* Step Content */}
          {step && (
            <div>
              {/* Step Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 28, background: step.phaseColor + "22", borderRadius: 12, padding: "8px 12px", border: `1px solid ${step.phaseColor}44` }}>{step.icon}</div>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ background: step.phaseColor + "22", color: step.phaseColor, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 800 }}>{step.phase}</span>
                    <code style={{ color: "#8b949e", fontSize: 10, background: "#161b22", padding: "2px 8px", borderRadius: 4 }}>{step.xways_menu}</code>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{step.title}</div>
                </div>
              </div>

              {/* Objective */}
              <div style={{ background: step.phaseColor + "0d", border: `1px solid ${step.phaseColor}33`, borderLeft: `4px solid ${step.phaseColor}`, borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#e6edf3", fontSize: 13, lineHeight: 1.7 }}>
                🎯 {step.objective}
              </div>

              {/* Actions */}
              {step.actions.map((action, i) => (
                <ActionBlock key={i} action={action} />
              ))}

              {/* Tips */}
              {step.tips && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                  {step.tips.map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, background: "#ffd16610", border: "1px solid #ffd16630", borderLeft: "3px solid #ffd166", borderRadius: 7, padding: "9px 12px" }}>
                      <span style={{ color: "#ffd166" }}>💡</span>
                      <span style={{ color: "#e6edf3", fontSize: 11, lineHeight: 1.6 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* XWF Tip */}
              {step.xways_tip && (
                <div style={{ marginTop: 10, background: "#4cc9f010", border: "1px solid #4cc9f033", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>🔬</span>
                  <div>
                    <span style={{ color: "#4cc9f0", fontWeight: 700, fontSize: 11 }}>X-Ways 팁: </span>
                    <span style={{ color: "#8b949e", fontSize: 11 }}>{step.xways_tip}</span>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: "1px solid #21262d" }}>
                {(() => {
                  const idx = scenario.steps.findIndex(s => s.id === activeStep);
                  const prev = idx > 0 ? scenario.steps[idx - 1] : null;
                  const next = idx < scenario.steps.length - 1 ? scenario.steps[idx + 1] : null;
                  return (
                    <>
                      {prev ? (
                        <button onClick={() => setActiveStep(prev.id)} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "10px 16px", cursor: "pointer", color: "#e6edf3", fontSize: 12 }}>
                          ← {prev.title}
                        </button>
                      ) : (
                        <button onClick={() => setShowBriefing(true)} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "10px 16px", cursor: "pointer", color: "#8b949e", fontSize: 12 }}>
                          ← 브리핑으로
                        </button>
                      )}
                      {next ? (
                        <button onClick={() => setActiveStep(next.id)} style={{ background: "#238636", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                          다음: {next.title} →
                        </button>
                      ) : (
                        <div style={{ background: "#06d6a022", border: "1px solid #06d6a044", borderRadius: 8, padding: "10px 16px", color: "#06d6a0", fontSize: 12, fontWeight: 700 }}>
                          ✅ 시나리오 완료!
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
