import { useState } from "react";

// ══════════════════════════════════════════════
// SCENARIO METADATA
// ══════════════════════════════════════════════
const META = {
  title:"Operation SilentDragon",
  subtitle:"APT 국가 지원 해킹 그룹 침투 사고",
  threat_actor:"APT-K (가상)",
  date:"2024-09-02 ~ 2024-09-15",
  target:"방위산업체 A사 연구개발 네트워크",
  hostname:"RD-WS-009", os:"Windows 10 Pro 22H2",
  user:"choi_researcher", image:"RD-WS-009_full.E01 (2TB)",
  md5:"3f7a1b9c2e4d6f8a0b5c7e9d1f3a5b7c",
  attacker_ip:"45.142.212.xx (Netherlands VPS)",
  c2:"update-ms-cdn[.]com",
  mitre:["T1566.001","T1059.001","T1547.001","T1055","T1003.001","T1021.001","T1041","T1070.001"],
};

const TIMELINE = [
  { time:"09-02 09:14", type:"initial",   label:"초기 침투", event:"피싱 메일 수신 — '방산청_협력사_공문_2024.docx'", artifact:"브라우저/LNK", mitre:"T1566.001" },
  { time:"09-02 09:31", type:"initial",   label:"초기 침투", event:"Word 매크로 실행 → PowerShell Dropper", artifact:"프리패치/이벤트로그", mitre:"T1059.001" },
  { time:"09-02 09:32", type:"execution", label:"실행",      event:"C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe 드롭 & 실행", artifact:"MFT/프리패치", mitre:"T1059.001" },
  { time:"09-02 09:33", type:"persistence",label:"지속성",   event:"HKLM Run 키 등록 — svcupd.exe 자동실행", artifact:"레지스트리", mitre:"T1547.001" },
  { time:"09-02 09:34", type:"evasion",   label:"방어 우회", event:"Windows Defender 비활성화 레지스트리 변조", artifact:"레지스트리", mitre:"T1562.001" },
  { time:"09-02 09:35", type:"c2",        label:"C2 통신",   event:"svcupd.exe → update-ms-cdn[.]com:443 첫 비콘", artifact:"SRUM", mitre:"T1071.001" },
  { time:"09-02 10:02", type:"discovery", label:"정찰",      event:"whoami /all, ipconfig /all, net user 실행", artifact:"프리패치/이벤트로그", mitre:"T1083" },
  { time:"09-02 10:18", type:"privilege", label:"권한상승",  event:"svcupd.exe → explorer.exe DLL Injection", artifact:"이벤트로그(4688)", mitre:"T1055" },
  { time:"09-02 10:44", type:"credential",label:"자격증명탈취",event:"lsass.exe 메모리 덤프 (C:\\Windows\\Temp\\lss.dmp)", artifact:"MFT/프리패치", mitre:"T1003.001" },
  { time:"09-02 11:15", type:"lateral",   label:"측면이동",  event:"RDP로 내부 서버 RD-SRV-002 (192.168.10.20) 접속", artifact:"이벤트로그(4624)", mitre:"T1021.001" },
  { time:"09-03~09-10", type:"collection",label:"수집",      event:"연구 문서 C:\\Staging\\ 폴더에 수집", artifact:"MFT/쉘백/LNK", mitre:"T1560" },
  { time:"09-10 22:30", type:"exfil",     label:"유출",      event:"7z 압축 → C2 서버 HTTPS 전송 (487MB)", artifact:"프리패치/SRUM/MFT", mitre:"T1041" },
  { time:"09-15 03:12", type:"cleanup",   label:"흔적 삭제", event:"악성 파일 삭제 + 이벤트 로그 삭제(1102)", artifact:"MFT($UsnJrnl)/이벤트로그", mitre:"T1070.001" },
];

const TL_C = {
  initial:"#ff4d6d", execution:"#ffa657", persistence:"#ffd166", evasion:"#a29bfe",
  c2:"#4cc9f0", discovery:"#8b949e", privilege:"#d2a8ff", credential:"#ff6b6b",
  lateral:"#06d6a0", collection:"#4ecdc4", exfil:"#f77f00", cleanup:"#495057",
};

// ══════════════════════════════════════════════
// MISSIONS
// ══════════════════════════════════════════════
const MISSIONS = [
  {
    id:"m1", no:"01", color:"#4cc9f0", icon:"📧", title:"최초 침투 경로 규명",
    artifact:"이벤트 로그 + 브라우저 히스토리 + LNK", difficulty:"★★☆☆☆", mitre:"T1566.001",
    question:`침해 분석 결과 공격자의 최초 침투 방법을 규명하시오.

1) 침투 벡터 (피싱? RDP? 취약점?)
2) 악성 파일명과 최초 실행 시간
3) 악성 파일이 실행된 경위`,
    xways_path:[
      { step:"이벤트 로그 확인", menu:"C:\\Windows\\System32\\winevt\\Logs\\Security.evtx", actions:["Security.evtx 더블클릭 → 내장 뷰어","시간 범위: 2024-09-02 09:00 ~ 10:00","Event ID 4688 → WINWORD.EXE가 부모인 powershell.exe 찾기","CommandLine에서 -enc (Base64) 패턴 확인"] },
      { step:"LNK 파일 분석", menu:"C:\\Users\\choi_researcher\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\", actions:["*.lnk → 09-02 09:14~09:31 사이 생성 LNK 확인","Parsed 탭 → 원본 경로: Downloads\\방산청_협력사_공문_2024.docx","LNK Created = 파일 최초 접근 시간"] },
      { step:"프리패치 실행 확인", menu:"C:\\Windows\\Prefetch\\", actions:["WINWORD.EXE-XXXXXXXX.pf → 최근 실행 시간: 09-02 09:31","POWERSHELL.EXE-XXXXXXXX.pf → 09-02 09:31 실행 확인","접근 파일 목록에서 .docx 경로 확인"] },
    ],
    answer:{
      summary:"침투 벡터: 스피어 피싱 이메일 첨부파일 — Word 문서 악성 매크로 (T1566.001)",
      details:[
        { label:"침투 벡터", value:"스피어 피싱 이메일 — Word 문서 악성 매크로", highlight:true },
        { label:"악성 파일명", value:"방산청_협력사_공문_2024.docx (매크로 포함)", highlight:true },
        { label:"최초 실행 시간", value:"2024-09-02 09:31:44 (KST)", highlight:true },
        { label:"실행 경위", value:"WINWORD.EXE → PowerShell -enc [Base64] → svcupd.exe 드롭", highlight:false },
        { label:"증거 아티팩트", value:"LNK(09:14 접근), Event 4688(09:31 WINWORD→POWERSHELL), Prefetch", highlight:false },
      ],
      evidence_chain:"이메일 수신(09:14) → LNK 생성(09:14) → Word 열기(09:31) → 4688 PowerShell → Prefetch POWERSHELL.EXE",
      ioc:["방산청_협력사_공문_2024.docx","powershell.exe -enc JABzAHYAYwB..."],
    },
  },
  {
    id:"m2", no:"02", color:"#ff4d6d", icon:"🔴", title:"악성코드 드롭 & 실행 경로 분석",
    artifact:"MFT + 프리패치 + 이벤트 로그(4688)", difficulty:"★★★☆☆", mitre:"T1059.001",
    question:`PowerShell Dropper가 시스템에 심은 악성 파일을 모두 찾아라.

1) 드롭된 악성 파일 경로와 이름 (전체)
2) 각 파일의 생성 시간 (MFT 기준)
3) 악성 파일의 MD5/SHA-1 해시
4) 확장자 위조 여부 확인`,
    xways_path:[
      { step:"MFT 시간 기반 탐지", menu:"View → Filter → Date Range", actions:["Created: 2024-09-02 09:31 ~ 09:35 설정","C:\\ProgramData\\, C:\\Windows\\Temp\\ 우선 확인","결과: svcupd.exe, svcupd.cfg 발견 (09:32)"] },
      { step:"확장자 위조 탐지", menu:"RVS → Identify File Types", actions:["F2 → Identify file types 체크 후 실행","View → Filter → Type Mismatch 선택","발견: svcupd.cfg → 실제 Magic Bytes: 4D 5A (PE32)","헥스 뷰어에서 MZ 헤더 직접 확인"] },
      { step:"해시 값 확인", menu:"파일 선택 → Alt+Enter → Properties", actions:["svcupd.exe MD5/SHA-1 확인","우클릭 → Search Online (VirusTotal) 해시 검색","svcupd.cfg 도 동일하게 해시 확인"] },
    ],
    answer:{
      summary:"2개 파일 드롭. svcupd.cfg는 PE32 실행파일로 .cfg 확장자 위장.",
      details:[
        { label:"드롭 파일 1", value:"C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe (09-02 09:32:11)", highlight:true },
        { label:"드롭 파일 2", value:"C:\\ProgramData\\MicrosoftUpdate\\svcupd.cfg (09-02 09:32:11)", highlight:true },
        { label:"확장자 위조", value:"svcupd.cfg → Magic Bytes: 4D 5A (PE32 실행파일)", highlight:true },
        { label:"XWF 탐지", value:"RVS → Identify File Types → Filter: Type Mismatch", highlight:false },
      ],
      evidence_chain:"Event 4688 (PowerShell 실행) → MFT 생성 09:32 → Type Mismatch: svcupd.cfg=PE32",
      ioc:["C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe","svcupd.cfg → PE32 위장"],
    },
  },
  {
    id:"m3", no:"03", color:"#ffd166", icon:"🗝", title:"지속성 메커니즘 분석",
    artifact:"레지스트리 + 이벤트 로그(7045/4698) + MFT", difficulty:"★★★☆☆", mitre:"T1547.001",
    question:`공격자가 재부팅 후에도 악성코드가 실행되도록 심어둔 지속성 메커니즘을 모두 찾아라.

1) 지속성 유형 (Run키? 서비스? 예약작업?)
2) 등록된 키/값 경로와 데이터
3) 등록 시간
4) Windows Defender 비활성화 여부`,
    xways_path:[
      { step:"레지스트리 Run 키 확인", menu:"SOFTWARE 하이브 → ...\\CurrentVersion\\Run", actions:["SOFTWARE 하이브 로드 → 레지스트리 뷰어","Microsoft\\Windows\\CurrentVersion\\Run 이동","발견: 'WindowsUpdate' = 'C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe /silent'","LastWrite 시간: 09-02 09:33 확인"] },
      { step:"예약 작업 확인", menu:"C:\\Windows\\System32\\Tasks\\", actions:["Tasks\\ 폴더 → 침해 시간대 XML 파일 확인","발견: 'MicrosoftEdgeUpdateCore' (09-02 09:33)","텍스트 뷰 → <Command> 태그에서 실행 경로 확인","이벤트 4698 교차 확인"] },
      { step:"Defender 비활성화 확인", menu:"SOFTWARE\\Policies\\Microsoft\\Windows Defender", actions:["DisableAntiSpyware = 1 값 확인","DisableRealtimeMonitoring = 1 값 확인","LastWrite: 09-02 09:34 — 악성코드 실행 직후"] },
    ],
    answer:{
      summary:"Run 키 + 예약 작업 2중 지속성. Windows Defender 비활성화.",
      details:[
        { label:"지속성 1: Run 키", value:"HKLM\\...\\Run\\WindowsUpdate → svcupd.exe /silent (09:33)", highlight:true },
        { label:"지속성 2: 예약 작업", value:"Tasks\\MicrosoftEdgeUpdateCore → svcupd.exe (09:33)", highlight:true },
        { label:"방어 우회", value:"DisableAntiSpyware=1, DisableRealtimeMonitoring=1 (09:34)", highlight:true },
        { label:"XWF 확인", value:"Registry Explorer LastWrite 시간, Tasks 폴더 XML", highlight:false },
      ],
      evidence_chain:"Event 4698 (09:33) → Registry Run LastWrite 09:33 → Defender 비활성화 09:34",
      ioc:["HKLM\\...\\Run\\WindowsUpdate","Tasks\\MicrosoftEdgeUpdateCore","DisableAntiSpyware=1"],
    },
  },
  {
    id:"m4", no:"04", color:"#a29bfe", icon:"💉", title:"프로세스 인젝션 탐지",
    artifact:"이벤트 로그(4688) + 프리패치 + MFT", difficulty:"★★★★☆", mitre:"T1055",
    question:`악성코드가 정상 프로세스에 자신을 숨기는 프로세스 인젝션을 수행했다.

1) 인젝션 소스 프로세스
2) 인젝션 대상 프로세스
3) 인젝션 시점
4) X-Ways에서 인젝션 흔적 확인 방법`,
    xways_path:[
      { step:"이벤트 로그 4688 체인 분석", menu:"Security.evtx → Event ID 4688", actions:["시간: 09-02 10:00 ~ 10:30","svcupd.exe가 부모 프로세스인 항목 찾기","explorer.exe 내 스레드 생성 패턴 확인"] },
      { step:"Sysmon 로그 확인", menu:"Microsoft-Windows-Sysmon%4Operational.evtx", actions:["Event ID 8 (CreateRemoteThread) 검색","SourceImage: svcupd.exe / TargetImage: explorer.exe","09-02 10:18 에 CreateRemoteThread 이벤트 확인"] },
      { step:"프리패치 비정상 DLL 확인", menu:"EXPLORER.EXE-XXXXXXXX.pf", actions:["EXPLORER.EXE PF → Parsed 탭","접근 파일 목록에서 C:\\ProgramData\\MicrosoftUpdate\\ DLL 확인","정상 explorer.exe는 ProgramData DLL 로드 안 함"] },
    ],
    answer:{
      summary:"svcupd.exe → explorer.exe DLL Injection (T1055). Sysmon Event ID 8로 직접 증명.",
      details:[
        { label:"인젝션 소스", value:"C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe (PID: 4392)", highlight:true },
        { label:"인젝션 대상", value:"C:\\Windows\\explorer.exe (PID: 1204)", highlight:true },
        { label:"인젝션 시점", value:"2024-09-02 10:18:33 (Sysmon Event ID 8 기준)", highlight:true },
        { label:"Prefetch 증거", value:"EXPLORER.EXE PF → 접근 파일에 ProgramData\\...\\inject.dll 포함", highlight:false },
      ],
      evidence_chain:"Event 4688 svcupd.exe(10:18) → Sysmon ID8 CreateRemoteThread → EXPLORER.EXE PF 비정상 DLL",
      ioc:["CreateRemoteThread: svcupd.exe→explorer.exe","inject.dll in ProgramData"],
    },
  },
  {
    id:"m5", no:"05", color:"#ff6b6b", icon:"🔑", title:"자격증명 탈취 분석",
    artifact:"MFT + 프리패치 + 이벤트 로그(4656)", difficulty:"★★★★☆", mitre:"T1003.001",
    question:`공격자가 LSASS 메모리 덤프 방식으로 자격증명을 탈취했다.

1) 자격증명 탈취 도구/방법 특정
2) 덤프 파일 생성 경로와 시간
3) 탈취 후 덤프 파일 처리 방법
4) 탈취된 계정 정보 추정`,
    xways_path:[
      { step:"MFT에서 덤프 파일 탐지", menu:"View → Filter → Extension: .dmp + 생성 시간", actions:["확장자 필터: .dmp, .tmp / 생성: 09-02 10:40~10:50","발견: C:\\Windows\\Temp\\lss.dmp (09-02 10:44, 41MB)","파일 크기 40~50MB → lsass 메모리 덤프 일치","Alt+Enter → MACE 4개 시간 확인"] },
      { step:"프리패치로 덤핑 도구 확인", menu:"C:\\Windows\\Prefetch\\", actions:["10:40~10:50 생성 PF 파일 확인","RUNDLL32.EXE PF → 접근 파일에 comsvcs.dll 포함","= 'rundll32.exe comsvcs.dll MiniDump' LOLBins 기법"] },
      { step:"이벤트 로그 4656 확인", menu:"Security.evtx → Event ID 4656", actions:["ObjectName: lsass.exe 검색","AccessMask: 0x1FFFFF (PROCESS_ALL_ACCESS) 확인","이 이벤트 = lsass.exe 프로세스 전체 접근 시도"] },
    ],
    answer:{
      summary:"LOLBins: rundll32.exe + comsvcs.dll로 LSASS 덤프. 흔적 삭제 확인.",
      details:[
        { label:"탈취 방법", value:"LOLBins — rundll32.exe comsvcs.dll MiniDump lsass.exe lss.dmp full", highlight:true },
        { label:"덤프 파일", value:"C:\\Windows\\Temp\\lss.dmp (09-02 10:44:17, 41.3MB)", highlight:true },
        { label:"이벤트 증거", value:"Event 4656: lsass.exe AccessMask=0x1FFFFF (10:44)", highlight:true },
        { label:"Prefetch 증거", value:"RUNDLL32.EXE PF → comsvcs.dll, lss.dmp 접근 목록 포함", highlight:false },
        { label:"덤프 처리", value:"09-02 10:44 생성 → 09-15 03:12 삭제 ($UsnJrnl 확인)", highlight:false },
      ],
      evidence_chain:"Event 4656 lsass.exe(10:44) → Prefetch RUNDLL32+comsvcs.dll → MFT lss.dmp → $UsnJrnl 삭제(09-15)",
      ioc:["rundll32.exe comsvcs.dll MiniDump","C:\\Windows\\Temp\\lss.dmp"],
    },
  },
  {
    id:"m6", no:"06", color:"#06d6a0", icon:"🌐", title:"C2 통신 & 측면 이동 분석",
    artifact:"SRUM + 이벤트 로그(4624) + 레지스트리(RDP MRU)", difficulty:"★★★★☆", mitre:"T1021.001",
    question:`악성코드의 C2 통신 패턴과 내부 네트워크 측면 이동을 분석하라.

1) C2 서버 주소와 통신 시작 시간
2) C2 통신에 사용된 프로세스
3) 내부 측면 이동 대상 시스템과 시간
4) 측면 이동에 사용된 자격증명`,
    xways_path:[
      { step:"SRUM으로 C2 통신 탐지", menu:"C:\\Windows\\System32\\sru\\SRUDB.dat", actions:["SRUDB.dat → XWF 내장 ESE DB 뷰어","네트워크 사용량 테이블에서 svcupd.exe 행 찾기","BytesSent 컬럼 → 대용량 송신 = 유출 의심","ConnectStartTime → C2 첫 통신 시간"] },
      { step:"RDP 측면 이동 이벤트", menu:"Security.evtx → Event ID 4624", actions:["Logon Type=10 (RDP) 검색","대상 IP: 192.168.10.20 (RD-SRV-002)","시간: 09-02 11:15 확인"] },
      { step:"레지스트리 RDP MRU", menu:"NTUSER.DAT → Terminal Server Client", actions:["Software\\Microsoft\\Terminal Server Client\\Default","MRU0 값에서 192.168.10.20 확인","LastWrite = 마지막 RDP 접속 시간"] },
    ],
    answer:{
      summary:"C2: update-ms-cdn[.]com:443 (HTTPS 위장). lsass 해시로 RDP 측면 이동.",
      details:[
        { label:"C2 서버", value:"update-ms-cdn[.]com (45.142.212.xx:443) HTTPS 위장", highlight:true },
        { label:"C2 첫 통신", value:"2024-09-02 09:35:02 (SRUM svcupd.exe 누적 487MB)", highlight:true },
        { label:"측면 이동 대상", value:"192.168.10.20 (RD-SRV-002) — 09-02 11:15 RDP", highlight:true },
        { label:"SRUM 증거", value:"svcupd.exe BytesSent: 487,302,144 bytes (10일간)", highlight:false },
      ],
      evidence_chain:"SRUM svcupd.exe C2(09:35~) → lsass 탈취(10:44) → RDP 4624 Type10(11:15) → MRU 192.168.10.20",
      ioc:["update-ms-cdn[.]com","45.142.212.xx","RDP to 192.168.10.20"],
    },
  },
  {
    id:"m7", no:"07", color:"#ffa657", icon:"📦", title:"데이터 수집 & 유출 분석",
    artifact:"MFT + 쉘백 + LNK + SRUM + 프리패치", difficulty:"★★★★★", mitre:"T1560+T1041",
    question:`공격자가 10일에 걸쳐 연구 문서를 수집하고 최종 유출했다.

1) 문서 수집에 사용된 스테이징 경로
2) 수집된 파일의 종류와 범위
3) 압축 도구와 압축 파일 경로
4) 유출 시간과 유출량 (바이트)
5) 삭제된 증거의 복구 가능 여부`,
    xways_path:[
      { step:"스테이징 폴더 탐지", menu:"쉘백 USRCLASS.DAT + MFT 경로 필터", actions:["USRCLASS.DAT → 쉘백 뷰어","09-03 ~ 09-10 생성 폴더 확인","발견: C:\\Staging\\ (09-03 14:22 탐색기 접근)","$UsnJrnl에서 생성/삭제 이벤트 확인"] },
      { step:"수집 파일 범위 파악", menu:"LNK + MFT Accessed 시간", actions:["Recent\\ LNK → 09-03~09-10 생성분 필터","원본 경로 D:\\Research\\ 인 LNK 수집","MFT D:\\Research\\ 파일 Accessed 시간 확인","09-03~09-10 접근 파일 = 공격자 접근 파일"] },
      { step:"압축·유출 탐지", menu:"Prefetch 7Z.EXE + SRUM", actions:["7Z.EXE PF → 실행 시간: 09-10 22:28~22:30","MFT .7z 필터 → C:\\ProgramData\\tmp_arch.7z (487MB)","SRUM svcupd.exe BytesSent: 09-10 22:30~09-11 02:00","SRUM 송신량 = 압축 파일 크기와 일치"] },
    ],
    answer:{
      summary:"C:\\Staging\\ 스테이징 → 7z 압축(487MB) → C2 HTTPS 전송. $UsnJrnl로 삭제 증거.",
      details:[
        { label:"스테이징 경로", value:"C:\\Staging\\ (09-03 14:22 생성, 09-15 03:14 삭제)", highlight:true },
        { label:"수집 파일 범위", value:"D:\\Research\\ .docx .xlsx .pdf .dwg 총 143개", highlight:true },
        { label:"압축 도구", value:"7z.exe — 09-10 22:28~22:30 3회 실행", highlight:true },
        { label:"압축 파일", value:"C:\\ProgramData\\tmp_arch.7z (487,221,843 bytes) → 삭제됨", highlight:true },
        { label:"유출 시간/량", value:"09-10 22:30~09-11 01:47 / 487,302,144 bytes (SRUM)", highlight:true },
      ],
      evidence_chain:"쉘백 C:\\Staging\\(09-03) → LNK 143개 → Prefetch 7Z.EXE(09-10) → MFT tmp_arch.7z → SRUM 487MB",
      ioc:["C:\\Staging\\","C:\\ProgramData\\tmp_arch.7z","7Z.EXE BytesSent 487MB"],
    },
  },
  {
    id:"m8", no:"08", color:"#d2a8ff", icon:"🧹", title:"흔적 삭제 & 최종 타임라인",
    artifact:"MFT($UsnJrnl) + 이벤트 로그(1102) + 전체 타임라인", difficulty:"★★★★★", mitre:"T1070.001",
    question:`공격자가 철수하면서 흔적을 삭제했다. 삭제된 증거를 복구하고 전체 공격 타임라인을 재구성하라.

1) 삭제된 파일/폴더 목록과 삭제 시간
2) 로그 삭제 여부 및 삭제된 로그 범위
3) X-Ways로 삭제 증거를 복구하는 방법
4) 전체 공격 MITRE ATT&CK 매핑`,
    xways_path:[
      { step:"이벤트 로그 삭제 탐지", menu:"Security.evtx → Event ID 1102", actions:["Event ID 1102 (감사 로그 삭제) 검색","발견: 09-15 03:12 — 'audit log was cleared'","System.evtx → Event ID 104 (System 로그 삭제)","1102 이후 Security 로그 공백 = 삭제된 구간"] },
      { step:"$UsnJrnl로 삭제 파일 복구", menu:"Specialist → File System Data Structure → $UsnJrnl", actions:["$UsnJrnl 파싱 → FILE_DELETE 필터","시간: 09-15 03:00~03:30","삭제 목록: svcupd.exe, svcupd.cfg, lss.dmp, tmp_arch.7z, C:\\Staging\\"] },
      { step:"카빙으로 파일 복구 시도", menu:"RVS → Carve from unallocated", actions:["F2 → Carve files from unallocated 체크","대상: .exe, .dmp, .7z","[Carved] 태그 파일 확인","svcupd.exe 복구 성공 시 해시로 악성코드 확인"] },
    ],
    answer:{
      summary:"09-15 03:12~03:30 전체 증거 삭제. $UsnJrnl로 삭제 목록 복구. 8개 MITRE 기술 매핑.",
      details:[
        { label:"로그 삭제", value:"Event 1102 (09-15 03:12): Security 로그 전체 삭제", highlight:true },
        { label:"삭제된 파일", value:"svcupd.exe, svcupd.cfg, lss.dmp, tmp_arch.7z, C:\\Staging\\ — $UsnJrnl 확인", highlight:true },
        { label:"복구 방법", value:"RVS 카빙으로 svcupd.exe 부분 복구 가능", highlight:false },
        { label:"전체 체류 기간", value:"2024-09-02 09:14 ~ 09-15 03:30 (약 13일)", highlight:true },
        { label:"MITRE 매핑", value:"T1566→T1059→T1547→T1055→T1003→T1021→T1560→T1041→T1070", highlight:false },
      ],
      evidence_chain:"전체: 피싱→드롭→지속성→인젝션→자격증명→이동→수집→유출→삭제",
      ioc:["Event 1102 (03:12)","$UsnJrnl 삭제 레코드","카빙 복구 svcupd.exe"],
    },
  },
];

// ══════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════
export default function APTScenario() {
  const [view, setView]               = useState("briefing");
  const [missionId, setMissionId]     = useState(null);
  const [showAnswer, setShowAnswer]   = useState({});
  const [showXways, setShowXways]     = useState({});
  const [completed, setCompleted]     = useState({});

  const mission = MISSIONS.find(m => m.id === missionId);
  const mIdx = MISSIONS.findIndex(m => m.id === missionId);
  const prevM = mIdx > 0 ? MISSIONS[mIdx-1] : null;
  const nextM = mIdx < MISSIONS.length-1 ? MISSIONS[mIdx+1] : null;
  const doneCount = Object.values(completed).filter(Boolean).length;

  const goMission = (id) => { setMissionId(id); setView("mission"); window.scrollTo(0,0); };
  const toggleA = (id) => setShowAnswer(p => ({ ...p, [id]:!p[id] }));
  const toggleX = (id) => setShowXways(p =>  ({ ...p, [id]:!p[id] }));
  const markDone = (id) => setCompleted(p => ({ ...p, [id]:true }));

  return (
    <div style={{ minHeight:"100vh", maxWidth:480, margin:"0 auto", background:"#010409", fontFamily:"'Noto Sans KR','Segoe UI',sans-serif", color:"#e6edf3", display:"flex", flexDirection:"column" }}>

      {/* 헤더 */}
      <div style={{ background:"#0d1117", borderBottom:"1px solid #21262d", padding:"12px 16px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <span style={{ fontSize:18 }}>🎯</span>
          <div>
            <div style={{ fontWeight:700, fontSize:14 }}>Operation SilentDragon</div>
            <div style={{ color:"#8b949e", fontSize:10 }}>APT 침해분석 훈련 · 8개 미션</div>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
            <button onClick={() => setView("briefing")} style={{ padding:"5px 10px", borderRadius:6, border:"none", cursor:"pointer", background:view==="briefing"?"#238636":"#21262d", color:view==="briefing"?"#fff":"#8b949e", fontSize:10, fontWeight:700 }}>📋 브리핑</button>
            <button onClick={() => setView("timeline")} style={{ padding:"5px 10px", borderRadius:6, border:"none", cursor:"pointer", background:view==="timeline"?"#238636":"#21262d", color:view==="timeline"?"#fff":"#8b949e", fontSize:10, fontWeight:700 }}>📊 타임라인</button>
          </div>
        </div>
        {/* 미션 빠른 이동 */}
        <div style={{ display:"flex", overflowX:"auto", gap:5 }}>
          {MISSIONS.map(m => (
            <button key={m.id} onClick={() => goMission(m.id)} style={{
              padding:"4px 9px", borderRadius:6, border:"none", cursor:"pointer", flexShrink:0,
              background:missionId===m.id&&view==="mission"?m.color+"33":(completed[m.id]?"#06d6a015":"#161b22"),
              color:missionId===m.id&&view==="mission"?m.color:(completed[m.id]?"#06d6a0":"#8b949e"),
              border:`1px solid ${missionId===m.id&&view==="mission"?m.color+"55":"#21262d"}`,
              fontSize:10, fontWeight:700,
            }}>{completed[m.id]?"✅":m.icon} M{m.no}</button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex:1, padding:16, paddingBottom:90 }}>

        {/* 브리핑 */}
        {view==="briefing" && (
          <div>
            {/* 사건 헤더 */}
            <div style={{ background:"linear-gradient(135deg,#1a0a0a,#0d1117)", border:"1px solid #ff4d6d33", borderRadius:14, padding:"20px", marginBottom:16, boxShadow:"0 0 30px #ff4d6d10" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <span style={{ fontSize:32 }}>🔴</span>
                <div>
                  <div style={{ color:"#ff4d6d", fontSize:10, fontWeight:800, letterSpacing:".08em" }}>APT SIMULATION</div>
                  <div style={{ fontSize:18, fontWeight:800 }}>{META.title}</div>
                  <div style={{ color:"#8b949e", fontSize:11, marginTop:2 }}>{META.subtitle}</div>
                </div>
              </div>
              {[["🗓 사고 기간",META.date],["🏢 피해 대상",META.target],["🖥 호스트명",META.hostname],["💻 OS",META.os],["👤 사용자",META.user],["🌐 공격자 IP",META.attacker_ip],["📡 C2 도메인",META.c2]].map(([k,v]) => (
                <div key={k} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom:"1px solid #21262d20" }}>
                  <span style={{ color:"#8b949e", fontSize:10, minWidth:80, flexShrink:0 }}>{k}</span>
                  <span style={{ color:"#e6edf3", fontSize:10, fontFamily:"monospace", wordBreak:"break-all" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* MITRE 태그 */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:16 }}>
              {META.mitre.map(t => (
                <span key={t} style={{ background:"#21262d", border:"1px solid #30363d", borderRadius:4, padding:"3px 8px", fontSize:10, color:"#d2a8ff", fontFamily:"monospace" }}>{t}</span>
              ))}
            </div>

            {/* 미션 진행 현황 */}
            <div style={{ background:"#161b22", border:"1px solid #21262d", borderRadius:12, padding:"16px", marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontWeight:700, fontSize:13 }}>🎯 분석 미션</div>
                <div style={{ color:doneCount===MISSIONS.length?"#06d6a0":"#ffd166", fontSize:12, fontWeight:700 }}>{doneCount}/{MISSIONS.length} 완료</div>
              </div>
              <div style={{ background:"#21262d", borderRadius:4, height:5, marginBottom:12 }}>
                <div style={{ width:`${(doneCount/MISSIONS.length)*100}%`, height:"100%", background:"linear-gradient(90deg,#4cc9f0,#06d6a0)", borderRadius:4, transition:"width .4s" }}/>
              </div>
              {MISSIONS.map(m => (
                <button key={m.id} onClick={() => goMission(m.id)} style={{
                  width:"100%", textAlign:"left", padding:"10px 12px", borderRadius:8, border:"none", cursor:"pointer", marginBottom:5,
                  background:completed[m.id]?"#06d6a010":"#0d1117",
                  border:`1px solid ${completed[m.id]?"#06d6a033":"#21262d"}`,
                  display:"flex", alignItems:"center", gap:10,
                }}>
                  <span style={{ background:m.color+"22", color:m.color, border:`1px solid ${m.color}44`, borderRadius:5, padding:"2px 7px", fontSize:10, fontWeight:800, flexShrink:0 }}>M{m.no}</span>
                  <span style={{ fontSize:14, flexShrink:0 }}>{m.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ color:"#e6edf3", fontSize:12, fontWeight:700 }}>{m.title}</div>
                    <div style={{ color:"#8b949e", fontSize:10, marginTop:1 }}>{m.artifact} · {m.difficulty}</div>
                  </div>
                  <span style={{ fontSize:14 }}>{completed[m.id]?"✅":"○"}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 타임라인 */}
        {view==="timeline" && (
          <div>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>📊 전체 공격 타임라인</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
              {Object.entries(TL_C).map(([k,v]) => (
                <span key={k} style={{ fontSize:9, color:v, background:v+"22", border:`1px solid ${v}44`, borderRadius:10, padding:"2px 7px" }}>● {k}</span>
              ))}
            </div>
            <div style={{ position:"relative", paddingLeft:20 }}>
              <div style={{ position:"absolute", left:9, top:0, bottom:0, width:2, background:"linear-gradient(#ff4d6d44,#06d6a044)" }}/>
              {TIMELINE.map((ev,i) => {
                const c = TL_C[ev.type]||"#8b949e";
                return (
                  <div key={i} style={{ display:"flex", gap:12, marginBottom:10, position:"relative" }}>
                    <div style={{ position:"absolute", left:-15, top:5, width:10, height:10, borderRadius:"50%", background:c, border:"2px solid #010409", boxShadow:`0 0 6px ${c}` }}/>
                    <div style={{ flex:1, background:"#161b22", border:`1px solid ${c}33`, borderLeft:`2px solid ${c}`, borderRadius:8, padding:"9px 12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4, marginBottom:5 }}>
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                          <span style={{ background:c+"22", color:c, borderRadius:4, padding:"1px 6px", fontSize:9, fontWeight:800 }}>{ev.label}</span>
                          <span style={{ background:"#21262d", color:"#8b949e", borderRadius:4, padding:"1px 6px", fontSize:9 }}>{ev.artifact}</span>
                          <span style={{ color:"#d2a8ff", fontSize:9, fontFamily:"monospace" }}>{ev.mitre}</span>
                        </div>
                        <span style={{ color:c, fontSize:10, fontFamily:"monospace", fontWeight:700 }}>{ev.time}</span>
                      </div>
                      <div style={{ color:"#e6edf3", fontSize:12, lineHeight:1.5 }}>{ev.event}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 미션 */}
        {view==="mission" && mission && (
          <div>
            {/* 미션 헤더 */}
            <div style={{ background:mission.color+"0d", border:`1px solid ${mission.color}33`, borderRadius:12, padding:"16px", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <span style={{ fontSize:28 }}>{mission.icon}</span>
                <div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center", marginBottom:4 }}>
                    <span style={{ background:mission.color+"22", color:mission.color, borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:800 }}>MISSION {mission.no}</span>
                    <span style={{ color:"#8b949e", fontSize:11 }}>{mission.difficulty}</span>
                    <span style={{ color:"#d2a8ff", fontSize:10, fontFamily:"monospace", background:"#21262d", padding:"1px 6px", borderRadius:3 }}>{mission.mitre}</span>
                  </div>
                  <div style={{ fontSize:16, fontWeight:800 }}>{mission.title}</div>
                  <div style={{ color:"#8b949e", fontSize:11, marginTop:2 }}>{mission.artifact}</div>
                </div>
              </div>
            </div>

            {/* 문제 */}
            <div style={{ background:"#0d1117", border:"1px solid #30363d", borderRadius:10, padding:"16px", marginBottom:12 }}>
              <div style={{ color:"#ffd166", fontWeight:700, fontSize:12, marginBottom:10 }}>📋 분석 문제</div>
              <pre style={{ color:"#e6edf3", fontSize:12, lineHeight:1.8, whiteSpace:"pre-wrap", margin:0, fontFamily:"inherit" }}>{mission.question}</pre>
            </div>

            {/* X-Ways 분석 방법 (접이식) */}
            <div style={{ border:`1px solid ${mission.color}44`, borderRadius:10, marginBottom:12, overflow:"hidden" }}>
              <button onClick={() => toggleX(mission.id)} style={{
                width:"100%", background:mission.color+"15", border:"none",
                padding:"13px 16px", cursor:"pointer", textAlign:"left",
                display:"flex", alignItems:"center", gap:8,
              }}>
                <span style={{ fontSize:18 }}>🔬</span>
                <span style={{ color:mission.color, fontWeight:700, fontSize:13, flex:1 }}>X-Ways 분석 방법 (힌트)</span>
                <span style={{ color:mission.color, fontSize:14 }}>{showXways[mission.id]?"▲":"▼"}</span>
              </button>
              {showXways[mission.id] && (
                <div style={{ padding:"14px 16px", background:"#0d1117" }}>
                  {mission.xways_path.map((p,pi) => (
                    <div key={pi} style={{ marginBottom:16 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:8 }}>
                        <span style={{ background:mission.color+"22", color:mission.color, borderRadius:5, padding:"2px 7px", fontSize:10, fontWeight:800, flexShrink:0 }}>STEP {pi+1}</span>
                        <div>
                          <div style={{ color:"#e6edf3", fontWeight:700, fontSize:12 }}>{p.step}</div>
                          <code style={{ color:"#8b949e", fontSize:10 }}>{p.menu}</code>
                        </div>
                      </div>
                      {p.actions.map((a,ai) => (
                        <div key={ai} style={{ display:"flex", gap:8, marginBottom:6, paddingLeft:8 }}>
                          <span style={{ color:mission.color, fontSize:10, fontWeight:800, minWidth:16 }}>{ai+1}.</span>
                          <span style={{ color:a.startsWith("발견:")?"#06d6a0":a.startsWith("※")?"#ffd166":"#e6edf3", fontSize:12, lineHeight:1.6 }}>{a}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 정답 (접이식) */}
            <div style={{ border:"1px solid #06d6a044", borderRadius:10, marginBottom:16, overflow:"hidden" }}>
              <button onClick={() => toggleA(mission.id)} style={{
                width:"100%", background:"#06d6a015", border:"none",
                padding:"13px 16px", cursor:"pointer", textAlign:"left",
                display:"flex", alignItems:"center", gap:8,
              }}>
                <span style={{ fontSize:18 }}>✅</span>
                <span style={{ color:"#06d6a0", fontWeight:700, fontSize:13, flex:1 }}>모범 정답 보기</span>
                <span style={{ color:"#06d6a0", fontSize:14 }}>{showAnswer[mission.id]?"▲":"▼"}</span>
              </button>
              {showAnswer[mission.id] && (
                <div style={{ padding:"14px 16px", background:"#0d1117" }}>
                  <div style={{ background:"#06d6a015", border:"1px solid #06d6a033", borderRadius:8, padding:"12px", marginBottom:12 }}>
                    <div style={{ color:"#06d6a0", fontWeight:700, fontSize:11, marginBottom:4 }}>📌 핵심 요약</div>
                    <div style={{ color:"#e6edf3", fontSize:12, lineHeight:1.7 }}>{mission.answer.summary}</div>
                  </div>
                  {mission.answer.details.map((d,i) => (
                    <div key={i} style={{
                      background:d.highlight?"#06d6a008":"transparent",
                      border:`1px solid ${d.highlight?"#06d6a033":"#21262d"}`,
                      borderLeft:`3px solid ${d.highlight?"#06d6a0":"#30363d"}`,
                      borderRadius:7, padding:"9px 12px", marginBottom:6,
                    }}>
                      <div style={{ color:"#8b949e", fontSize:10, marginBottom:3 }}>{d.label}</div>
                      <div style={{ color:d.highlight?"#e6edf3":"#8b949e", fontSize:11, fontFamily:"monospace", wordBreak:"break-all" }}>{d.value}</div>
                    </div>
                  ))}
                  <div style={{ background:"#ffd16610", border:"1px solid #ffd16630", borderRadius:8, padding:"12px", marginTop:10, marginBottom:10 }}>
                    <div style={{ color:"#ffd166", fontWeight:700, fontSize:11, marginBottom:5 }}>🔗 증거 체인</div>
                    <div style={{ color:"#e6edf3", fontSize:11, fontFamily:"monospace", lineHeight:1.8 }}>{mission.answer.evidence_chain}</div>
                  </div>
                  <div style={{ marginTop:4 }}>
                    <div style={{ color:"#8b949e", fontSize:11, marginBottom:6 }}>🚨 IOC</div>
                    {mission.answer.ioc.map((ioc,i) => (
                      <code key={i} style={{ display:"block", background:"#ff4d6d0d", border:"1px solid #ff4d6d22", borderRadius:5, padding:"5px 10px", color:"#ff7b7b", fontSize:11, marginBottom:4, wordBreak:"break-all" }}>{ioc}</code>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 완료 버튼 */}
            {!completed[mission.id] ? (
              <button onClick={() => markDone(mission.id)} style={{ width:"100%", background:"#238636", border:"none", borderRadius:8, padding:"12px", cursor:"pointer", color:"#fff", fontSize:13, fontWeight:700, marginBottom:8 }}>
                ✅ 이 미션 완료 표시
              </button>
            ) : (
              <div style={{ background:"#06d6a020", border:"1px solid #06d6a044", borderRadius:8, padding:"10px", textAlign:"center", color:"#06d6a0", fontSize:12, fontWeight:700, marginBottom:8 }}>✅ 완료됨</div>
            )}
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      {view==="mission" && (
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#0d1117", borderTop:"1px solid #21262d", padding:"10px 16px", display:"flex", gap:10 }}>
          <button onClick={() => prevM?goMission(prevM.id):(setView("briefing"),setMissionId(null))} style={{
            flex:1, padding:"11px 8px", borderRadius:10, border:"1px solid #30363d",
            background:"#161b22", color:"#e6edf3", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:12,
          }}>‹ {prevM?`M${prevM.no}`:"브리핑"}</button>
          {nextM ? (
            <button onClick={() => goMission(nextM.id)} style={{
              flex:1, padding:"11px 8px", borderRadius:10, border:"none",
              background:mission?mission.color+"22":"#21262d",
              border:`1px solid ${mission?mission.color+"55":"#30363d"}`,
              color:mission?mission.color:"#8b949e", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700,
            }}>M{nextM.no} ›</button>
          ) : (
            <button onClick={() => setView("briefing")} style={{
              flex:1, padding:"11px 8px", borderRadius:10, border:"1px solid #06d6a044",
              background:"#06d6a022", color:"#06d6a0", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700,
            }}>🏆 완료 확인</button>
          )}
        </div>
      )}
    </div>
  );
}
