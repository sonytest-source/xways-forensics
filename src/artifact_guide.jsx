import { useState } from "react";

const ARTIFACTS = [
  {
    id: "eventlog",
    icon: "📋",
    name: "이벤트 로그",
    subtitle: "Event Log",
    color: "#4cc9f0",
    category: "로그",
    location: "C:\\Windows\\System32\\winevt\\Logs\\",
    files: ["Security.evtx", "System.evtx", "Application.evtx"],
    tools: ["Event Viewer", "EvtxECmd", "Chainsaw", "Hayabusa"],
    summary: "Windows가 기록하는 시스템/보안/응용 프로그램 로그. 침해사고에서 가장 먼저 확인하는 아티팩트.",
    whatYouCanFind: "로그온/로그오프 이력, 계정 생성·삭제, 프로세스 실행, 서비스 설치, 로그 삭제 여부",
    keyEvents: [
      { id: "4624", desc: "로그온 성공", threat: false },
      { id: "4625", desc: "로그온 실패 (브루트포스 의심)", threat: true },
      { id: "4648", desc: "명시적 자격증명 로그온 (Pass-the-Hash)", threat: true },
      { id: "4688", desc: "프로세스 생성 (명령 실행 추적)", threat: false },
      { id: "4698", desc: "예약 작업 생성 (지속성)", threat: true },
      { id: "4720", desc: "사용자 계정 생성 (백도어 계정)", threat: true },
      { id: "4732", desc: "관리자 그룹 멤버 추가", threat: true },
      { id: "7045", desc: "새 서비스 설치 (악성 서비스)", threat: true },
      { id: "1102", desc: "보안 로그 삭제 (증거 인멸)", threat: true },
    ],
    tips: [
      "로그온 실패(4625)가 짧은 시간에 반복되면 → 브루트포스 공격",
      "1102 이벤트가 있다면 공격자가 흔적을 지우려 한 것",
      "4688에서 cmd.exe나 powershell.exe의 부모 프로세스를 확인",
      "로그가 비어있거나 시간이 비연속적이면 → 로그 변조 의심",
    ],
  },
  {
    id: "registry",
    icon: "🗝",
    name: "레지스트리",
    subtitle: "Registry",
    color: "#d2a8ff",
    category: "설정",
    location: "C:\\Windows\\System32\\config\\  /  C:\\Users\\<user>\\NTUSER.DAT",
    files: ["SAM", "SYSTEM", "SOFTWARE", "SECURITY", "NTUSER.DAT"],
    tools: ["Registry Explorer", "RegRipper", "regedit"],
    summary: "Windows의 모든 설정이 저장된 계층형 데이터베이스. 공격자의 지속성 확보·설정 변조 흔적이 남는다.",
    whatYouCanFind: "자동 실행 프로그램, 최근 접근 파일, USB 연결 이력, 설치된 서비스, 사용자 계정 정보",
    keyEvents: [
      { id: "Run / RunOnce", desc: "시스템 시작 시 자동 실행 → 악성코드 지속성", threat: true },
      { id: "Services", desc: "설치된 서비스 목록 (악성 서비스 탐지)", threat: true },
      { id: "SAM", desc: "로컬 사용자 계정 및 패스워드 해시", threat: true },
      { id: "UserAssist", desc: "사용자가 실행한 프로그램 이력", threat: false },
      { id: "RecentDocs", desc: "최근 열어본 파일 목록", threat: false },
      { id: "MountedDevices", desc: "USB·외장드라이브 연결 이력", threat: false },
      { id: "Shimcache", desc: "실행 가능한 파일 캐시 (삭제된 파일도 흔적 남음)", threat: false },
      { id: "Amcache.hve", desc: "실행된 파일의 해시·경로·시간 기록", threat: false },
    ],
    tips: [
      "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run 은 제일 먼저 확인",
      "Shimcache·Amcache는 삭제된 악성 파일의 존재도 증명 가능",
      "SAM 하이브로 로컬 계정 목록과 마지막 로그온 시간 확인 가능",
      "SYSTEM 하이브의 타임존 정보를 먼저 파악해야 시간 분석이 정확",
    ],
  },
  {
    id: "prefetch",
    icon: "⚡",
    name: "프리패치",
    subtitle: "Prefetch",
    color: "#ffd166",
    category: "실행흔적",
    location: "C:\\Windows\\Prefetch\\",
    files: ["*.pf (예: POWERSHELL.EXE-XXXXXXXX.pf)"],
    tools: ["PECmd", "WinPrefetchView", "Autopsy"],
    summary: "프로그램 로딩 속도 향상을 위해 Windows가 자동 생성하는 파일. 실행 흔적 분석의 핵심 아티팩트.",
    whatYouCanFind: "실행된 프로그램 이름, 실행 횟수, 최근 실행 시간(최대 8개), 프로그램이 접근한 파일 목록",
    keyEvents: [
      { id: "실행 횟수", desc: "비정상적으로 높으면 → 자동화 공격·반복 실행", threat: true },
      { id: "실행 경로", desc: "Temp, AppData 등 비정상 경로 실행 의심", threat: true },
      { id: "접근 파일 목록", desc: "악성코드가 읽은 파일 목록 재구성 가능", threat: false },
      { id: "시간 타임스탬프", desc: "최근 8회 실행 시간 → 공격 타임라인 구성", threat: false },
      { id: "삭제된 파일", desc: "파일 삭제 후에도 PF 파일로 실행 증명 가능", threat: false },
    ],
    tips: [
      "C:\\Temp, C:\\Users\\...\\AppData 경로에서 실행된 .exe 는 즉시 의심",
      "mimikatz, procdump, meterpreter 등 공격 도구 이름 직접 검색",
      "삭제된 악성 파일도 PF 파일이 남아있으면 실행 사실을 증명 가능",
      "Windows Server는 기본적으로 Prefetch 비활성화 → 없어도 정상",
    ],
  },
  {
    id: "mft",
    icon: "📁",
    name: "MFT · 파일시스템",
    subtitle: "Master File Table",
    color: "#06d6a0",
    category: "파일시스템",
    location: "C:\\$MFT  (숨김 시스템 파일)",
    files: ["$MFT", "$LogFile", "$UsnJrnl"],
    tools: ["MFTECmd", "Autopsy", "Velociraptor"],
    summary: "NTFS 파일시스템의 핵심. 모든 파일의 생성·수정·접근·삭제 시간이 기록된다. 삭제된 파일도 복구 가능.",
    whatYouCanFind: "파일 생성/수정/접근/MFT변경 시간(MACE), 삭제된 파일 흔적, 파일 이름·크기·경로 이력",
    keyEvents: [
      { id: "생성 시간 (Created)", desc: "파일이 처음 만들어진 시간", threat: false },
      { id: "수정 시간 (Modified)", desc: "파일 내용이 마지막으로 바뀐 시간", threat: false },
      { id: "접근 시간 (Accessed)", desc: "파일을 마지막으로 열어본 시간", threat: false },
      { id: "MFT 변경 ($MFT Entry)", desc: "MFT 레코드 자체가 변경된 시간", threat: false },
      { id: "타임스탬프 위조", desc: "Created > Modified 이면 → 시간 조작 의심(Timestomping)", threat: true },
      { id: "$UsnJrnl", desc: "파일 변경 저널 → 삭제된 파일도 기록 남음", threat: false },
    ],
    tips: [
      "MACE 4개 시간을 모두 비교 → 하나라도 이상하면 Timestomping 의심",
      "$UsnJrnl을 보면 지워진 파일도 생성·삭제 이벤트가 남아있음",
      "공격 시간대에 C:\\Temp, C:\\Windows\\Temp 에 생성된 파일 집중 확인",
      "파일 크기가 0 이지만 MFT에 존재 → 내용 삭제 후 껍데기만 남은 것",
    ],
  },
  {
    id: "lnk",
    icon: "🔗",
    name: "LNK / 점프리스트",
    subtitle: "Shortcut & JumpList",
    color: "#ffa657",
    category: "사용자행위",
    location: "C:\\Users\\<user>\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\",
    files: ["*.lnk", "*.automaticDestinations-ms"],
    tools: ["LECmd", "JLECmd", "Autopsy"],
    summary: "사용자가 최근 열어본 파일·폴더의 바로가기. 원본 파일이 삭제되어도 경로·시간·볼륨 정보가 남는다.",
    whatYouCanFind: "원본 파일 경로, 접근 시간, 파일 크기, 호스트명, MAC 주소, 볼륨 시리얼 번호",
    keyEvents: [
      { id: "원본 경로", desc: "USB·네트워크 드라이브의 파일 접근 흔적", threat: false },
      { id: "호스트 정보", desc: "다른 PC에서 가져온 LNK → 원본 컴퓨터명 노출", threat: false },
      { id: "MAC 주소", desc: "LNK 생성 당시 네트워크 어댑터 MAC 주소 포함", threat: false },
      { id: "볼륨 시리얼", desc: "USB 기기를 특정하는 데 활용 가능", threat: false },
    ],
    tips: [
      "공격자가 네트워크 공유를 통해 파일을 열었다면 LNK에 서버 경로가 남음",
      "USB로 악성 파일을 실행했다면 LNK에 USB 드라이브 경로 포함",
      "원본 파일을 지워도 LNK는 남아있어 접근 사실 증명 가능",
      "JumpList는 앱별로 최근 파일 목록을 보관 → 더 세밀한 행동 추적",
    ],
  },
  {
    id: "shellbag",
    icon: "🗂",
    name: "쉘백",
    subtitle: "Shellbag",
    color: "#ff9f43",
    category: "사용자행위",
    location: "NTUSER.DAT \\ USRCLASS.DAT (레지스트리 내부)",
    files: ["NTUSER.DAT", "USRCLASS.DAT"],
    tools: ["ShellBagsExplorer", "RegRipper"],
    summary: "탐색기에서 열어본 폴더의 크기·위치·정렬 방식을 저장하는 레지스트리 키. 탐색 흔적 추적에 강력.",
    whatYouCanFind: "열어본 폴더 경로, 접근 시간, USB·네트워크 드라이브 탐색 이력, 삭제된 폴더 접근 흔적",
    keyEvents: [
      { id: "폴더 접근 이력", desc: "탐색기로 연 모든 폴더 목록 (삭제된 것도 포함)", threat: false },
      { id: "외부 저장소", desc: "USB, 네트워크 드라이브 탐색 이력", threat: false },
      { id: "숨김 폴더", desc: "숨김 처리된 악성 폴더 접근 흔적", threat: true },
    ],
    tips: [
      "공격자가 내부 파일 시스템을 정찰한 경로를 역추적 가능",
      "삭제된 폴더도 쉘백에 기록이 남아 존재 사실 증명 가능",
      "USB 연결 + 쉘백 조합으로 'USB로 어느 폴더를 봤는가' 증명 가능",
    ],
  },
  {
    id: "browser",
    icon: "🌐",
    name: "브라우저 히스토리",
    subtitle: "Browser Artifacts",
    color: "#4ecdc4",
    category: "네트워크",
    location: "C:\\Users\\<user>\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\",
    files: ["History (SQLite)", "Cache", "Cookies", "Downloads", "Login Data"],
    tools: ["DB Browser for SQLite", "Hindsight", "BrowsingHistoryView"],
    summary: "크롬·엣지·파이어폭스 등의 방문 기록, 다운로드, 쿠키 등. 공격자의 외부 C2 통신·악성 파일 다운로드 증거.",
    whatYouCanFind: "방문 URL·시간, 다운로드 파일·출처 URL, 검색어, 로그인 정보(암호화), 캐시 데이터",
    keyEvents: [
      { id: "다운로드 기록", desc: "악성 파일 다운로드 출처 URL 확인 가능", threat: true },
      { id: "방문 기록", desc: "C2 서버·피싱 사이트 접속 이력", threat: true },
      { id: "검색어", desc: "공격자가 시스템 내부에서 검색한 내용", threat: false },
    ],
    tips: [
      "Downloads 테이블에서 referrer 컬럼 → 악성 파일을 어디서 받았는지 추적",
      "브라우저 히스토리는 SQLite DB → DB Browser로 바로 열 수 있음",
      "InPrivate/시크릿 모드 사용 시 기록 없음 → 다른 아티팩트로 보완",
      "Chrome은 History, Edge도 동일한 SQLite 구조 사용",
    ],
  },
  {
    id: "srum",
    icon: "📊",
    name: "SRUM",
    subtitle: "System Resource Usage Monitor",
    color: "#a29bfe",
    category: "네트워크",
    location: "C:\\Windows\\System32\\sru\\SRUDB.dat",
    files: ["SRUDB.dat (ESE Database)"],
    tools: ["SrumECmd", "srum-dump"],
    summary: "Windows 8 이후 도입. 각 프로세스별 네트워크 사용량·CPU·메모리를 30일간 기록. 삭제된 악성코드 통신도 추적 가능.",
    whatYouCanFind: "프로세스별 송수신 바이트, 실행 시간, 에너지 사용량, 앱별 네트워크 연결 이력",
    keyEvents: [
      { id: "네트워크 사용량", desc: "데이터 유출(exfiltration) 규모 추정 가능", threat: true },
      { id: "프로세스 이름", desc: "삭제된 악성 파일도 30일간 기록 유지", threat: true },
      { id: "실행 시간대", desc: "프로세스가 언제 얼마나 실행됐는지 파악", threat: false },
    ],
    tips: [
      "대용량 데이터 유출 의심 시 SRUM에서 해당 프로세스 송신량 확인",
      "악성 파일 삭제 후에도 30일치 실행 기록이 남아있음",
      "SrumECmd 로 CSV 추출 → Excel에서 분석하면 편리",
    ],
  },
];

const CATEGORIES = ["전체", "로그", "설정", "실행흔적", "파일시스템", "사용자행위", "네트워크"];

export default function ArtifactGuide() {
  const [selected, setSelected] = useState(ARTIFACTS[0]);
  const [category, setCategory] = useState("전체");
  const [activeTab, setActiveTab] = useState("overview");

  const filtered = category === "전체" ? ARTIFACTS : ARTIFACTS.filter(a => a.category === category);

  const CAT_COLOR = {
    로그: "#4cc9f0", 설정: "#d2a8ff", 실행흔적: "#ffd166",
    파일시스템: "#06d6a0", 사용자행위: "#ffa657", 네트워크: "#a29bfe"
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0c10",
      fontFamily: "'Noto Sans KR', 'Malgun Gothic', 'Segoe UI', sans-serif",
      color: "#e6edf3",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top Header */}
      <div style={{
        background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)",
        borderBottom: "1px solid #21262d",
        padding: "20px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            fontSize: 28,
            background: "linear-gradient(135deg,#4cc9f0,#06d6a0)",
            borderRadius: 12, padding: "6px 12px",
          }}>🔍</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>Windows 아티팩트 가이드</div>
            <div style={{ color: "#8b949e", fontSize: 12, marginTop: 2 }}>
              침해사고 조사관을 위한 핵심 아티팩트 학습 가이드 · {ARTIFACTS.length}개 아티팩트
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{
          width: 230, background: "#0d1117",
          borderRight: "1px solid #21262d",
          padding: "16px 12px",
          overflowY: "auto",
          flexShrink: 0,
        }}>
          {/* Category filter */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: "#8b949e", fontSize: 10, letterSpacing: ".08em", marginBottom: 8, paddingLeft: 4 }}>카테고리</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{
                  padding: "4px 10px", borderRadius: 20, border: "none",
                  cursor: "pointer", fontSize: 11, fontWeight: 600,
                  background: category === c ? (CAT_COLOR[c] || "#238636") + "33" : "#161b22",
                  color: category === c ? (CAT_COLOR[c] || "#06d6a0") : "#8b949e",
                  border: `1px solid ${category === c ? (CAT_COLOR[c] || "#238636") + "66" : "#21262d"}`,
                  transition: "all .15s",
                }}>{c}</button>
              ))}
            </div>
          </div>

          {/* Artifact List */}
          {filtered.map(a => (
            <button key={a.id} onClick={() => { setSelected(a); setActiveTab("overview"); }}
              style={{
                width: "100%", textAlign: "left", padding: "10px 12px",
                borderRadius: 9, border: "none", cursor: "pointer",
                background: selected?.id === a.id ? a.color + "22" : "transparent",
                borderLeft: `3px solid ${selected?.id === a.id ? a.color : "transparent"}`,
                marginBottom: 3, transition: "all .15s",
                display: "flex", alignItems: "center", gap: 10,
              }}>
              <span style={{ fontSize: 18 }}>{a.icon}</span>
              <div>
                <div style={{
                  color: selected?.id === a.id ? a.color : "#e6edf3",
                  fontSize: 13, fontWeight: selected?.id === a.id ? 700 : 400,
                }}>{a.name}</div>
                <div style={{ color: "#8b949e", fontSize: 10 }}>{a.subtitle}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Main Content */}
        {selected && (
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

            {/* Title */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24,
            }}>
              <div style={{
                fontSize: 36, background: selected.color + "22",
                borderRadius: 14, padding: "10px 14px",
                border: `1px solid ${selected.color}44`,
              }}>{selected.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 22, fontWeight: 800 }}>{selected.name}</span>
                  <span style={{
                    background: selected.color + "22", color: selected.color,
                    border: `1px solid ${selected.color}44`,
                    borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 700,
                  }}>{selected.subtitle}</span>
                  <span style={{
                    background: (CAT_COLOR[selected.category] || "#8b949e") + "22",
                    color: CAT_COLOR[selected.category] || "#8b949e",
                    border: `1px solid ${(CAT_COLOR[selected.category] || "#8b949e")}44`,
                    borderRadius: 6, padding: "2px 10px", fontSize: 11,
                  }}>{selected.category}</span>
                </div>
                <div style={{ color: "#8b949e", fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
                  {selected.summary}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #21262d" }}>
              {[
                { id: "overview", label: "📌 개요" },
                { id: "events",   label: "🔑 핵심 항목" },
                { id: "tips",     label: "💡 조사 팁" },
                { id: "tools",    label: "🛠 도구" },
              ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding: "8px 16px", background: "none", border: "none",
                  cursor: "pointer", fontSize: 12, fontWeight: 600,
                  color: activeTab === t.id ? selected.color : "#8b949e",
                  borderBottom: `2px solid ${activeTab === t.id ? selected.color : "transparent"}`,
                  marginBottom: -1, transition: "all .15s",
                }}>{t.label}</button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Location */}
                <div style={{
                  background: "#161b22", border: "1px solid #21262d",
                  borderRadius: 10, padding: "16px 20px",
                }}>
                  <div style={{ color: "#8b949e", fontSize: 11, letterSpacing: ".06em", marginBottom: 8 }}>📍 파일 위치</div>
                  <div style={{ color: selected.color, fontFamily: "'Courier New', monospace", fontSize: 13, wordBreak: "break-all" }}>
                    {selected.location}
                  </div>
                </div>

                {/* Files */}
                <div style={{
                  background: "#161b22", border: "1px solid #21262d",
                  borderRadius: 10, padding: "16px 20px",
                }}>
                  <div style={{ color: "#8b949e", fontSize: 11, letterSpacing: ".06em", marginBottom: 10 }}>📄 주요 파일</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selected.files.map((f, i) => (
                      <span key={i} style={{
                        background: "#21262d", border: "1px solid #30363d",
                        borderRadius: 6, padding: "4px 12px",
                        fontFamily: "'Courier New', monospace",
                        color: "#e6edf3", fontSize: 12,
                      }}>{f}</span>
                    ))}
                  </div>
                </div>

                {/* What You Can Find */}
                <div style={{
                  background: selected.color + "0d",
                  border: `1px solid ${selected.color}33`,
                  borderRadius: 10, padding: "16px 20px",
                }}>
                  <div style={{ color: selected.color, fontSize: 11, letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>
                    🔎 이 아티팩트로 알 수 있는 것
                  </div>
                  <div style={{ color: "#e6edf3", fontSize: 13, lineHeight: 1.8 }}>
                    {selected.whatYouCanFind}
                  </div>
                </div>

                {/* Quick Tip */}
                <div style={{
                  background: "#ffd16611",
                  border: "1px solid #ffd16633",
                  borderRadius: 10, padding: "14px 20px",
                  display: "flex", gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>⭐</span>
                  <div>
                    <div style={{ color: "#ffd166", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>한 줄 요약</div>
                    <div style={{ color: "#e6edf3", fontSize: 13 }}>{selected.summary}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "events" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 8 }}>
                  ⚠ 빨간 항목은 침해사고 시 특히 주목해야 할 지표입니다.
                </div>
                {selected.keyEvents.map((e, i) => (
                  <div key={i} style={{
                    background: e.threat ? "#ff4d6d0d" : "#161b22",
                    border: `1px solid ${e.threat ? "#ff4d6d33" : "#21262d"}`,
                    borderLeft: `4px solid ${e.threat ? "#ff4d6d" : selected.color}`,
                    borderRadius: 8, padding: "12px 16px",
                    display: "flex", gap: 14, alignItems: "flex-start",
                  }}>
                    <div style={{
                      background: e.threat ? "#ff4d6d22" : selected.color + "22",
                      color: e.threat ? "#ff4d6d" : selected.color,
                      borderRadius: 6, padding: "3px 10px",
                      fontFamily: "'Courier New', monospace",
                      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
                    }}>{e.id}</div>
                    <div style={{ color: "#e6edf3", fontSize: 13 }}>{e.desc}</div>
                    {e.threat && (
                      <span style={{
                        marginLeft: "auto", background: "#ff4d6d22", color: "#ff4d6d",
                        border: "1px solid #ff4d6d44", borderRadius: 4,
                        padding: "2px 8px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
                      }}>⚠ 위협 지표</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "tips" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>
                  실제 침해사고 조사 시 경험에서 나온 실전 팁입니다.
                </div>
                {selected.tips.map((tip, i) => (
                  <div key={i} style={{
                    background: "#161b22", border: "1px solid #21262d",
                    borderRadius: 10, padding: "14px 18px",
                    display: "flex", gap: 14, alignItems: "flex-start",
                  }}>
                    <div style={{
                      background: selected.color + "22", color: selected.color,
                      borderRadius: "50%", width: 26, height: 26,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800, flexShrink: 0,
                    }}>{i + 1}</div>
                    <div style={{ color: "#e6edf3", fontSize: 13, lineHeight: 1.7 }}>{tip}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "tools" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>
                  이 아티팩트를 분석할 때 사용하는 도구 목록입니다.
                </div>
                {selected.tools.map((tool, i) => (
                  <div key={i} style={{
                    background: "#161b22", border: "1px solid #21262d",
                    borderRadius: 10, padding: "14px 18px",
                    display: "flex", gap: 14, alignItems: "center",
                  }}>
                    <span style={{ fontSize: 20 }}>🛠</span>
                    <div>
                      <div style={{ color: selected.color, fontWeight: 700, fontSize: 14 }}>{tool}</div>
                      <div style={{ color: "#8b949e", fontSize: 11, marginTop: 2 }}>
                        {tool.includes("Explorer") || tool.includes("ECmd") ? "Eric Zimmerman Tools (무료)" :
                         tool.includes("Autopsy") ? "오픈소스 디지털 포렌식 플랫폼" :
                         tool.includes("Viewer") ? "Windows 내장 도구" :
                         tool.includes("SQLite") ? "DB Browser (무료)" :
                         "무료 / 오픈소스"}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{
                  background: "#238636" + "18", border: "1px solid #238636" + "44",
                  borderRadius: 10, padding: "14px 18px", marginTop: 4,
                  display: "flex", gap: 12,
                }}>
                  <span style={{ fontSize: 18 }}>💡</span>
                  <div style={{ color: "#7ee787", fontSize: 12, lineHeight: 1.7 }}>
                    <strong>Eric Zimmerman Tools</strong> (KAPE, EZTools)는 Windows 포렌식 필수 도구 모음입니다.<br />
                    Prefetch, Registry, MFT, LNK 등 대부분의 아티팩트를 한 번에 처리할 수 있습니다.
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
