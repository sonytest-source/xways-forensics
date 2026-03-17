import { useState } from "react";

const ARTIFACTS = [
  {
    id: "eventlog", icon: "📋", name: "이벤트 로그", subtitle: "Event Log",
    color: "#4cc9f0", category: "로그",
    location: "C:\\Windows\\System32\\winevt\\Logs\\",
    files: ["Security.evtx", "System.evtx", "Application.evtx"],
    tools: ["Event Viewer", "EvtxECmd", "Chainsaw", "Hayabusa"],
    summary: "침해사고에서 가장 먼저 확인하는 아티팩트. Windows가 기록하는 시스템·보안·응용 프로그램 로그.",
    whatYouCanFind: "로그온/로그오프 이력, 계정 생성·삭제, 프로세스 실행, 서비스 설치, 로그 삭제 여부",
    keyEvents: [
      { id: "4624", desc: "로그온 성공", threat: false },
      { id: "4625", desc: "로그온 실패 → 브루트포스 의심", threat: true },
      { id: "4648", desc: "명시적 자격증명 로그온 (Pass-the-Hash)", threat: true },
      { id: "4688", desc: "프로세스 생성 — 부모 프로세스 확인", threat: false },
      { id: "4698", desc: "예약 작업 생성 → 지속성 확보", threat: true },
      { id: "4720", desc: "사용자 계정 생성 → 백도어", threat: true },
      { id: "4732", desc: "관리자 그룹 멤버 추가", threat: true },
      { id: "7045", desc: "새 서비스 설치 → 악성 서비스", threat: true },
      { id: "1102", desc: "보안 로그 삭제 → 증거 인멸", threat: true },
    ],
    tips: [
      "4625 반복 → 브루트포스 공격 즉시 의심",
      "1102 이벤트 = 공격자가 흔적 삭제 시도",
      "4688에서 cmd.exe·powershell.exe 부모 프로세스 확인",
      "로그가 비어있거나 시간 비연속적 → 로그 변조 의심",
    ],
  },
  {
    id: "registry", icon: "🗝", name: "레지스트리", subtitle: "Registry",
    color: "#d2a8ff", category: "설정",
    location: "C:\\Windows\\System32\\config\\\nC:\\Users\\<user>\\NTUSER.DAT",
    files: ["SAM", "SYSTEM", "SOFTWARE", "SECURITY", "NTUSER.DAT"],
    tools: ["Registry Explorer", "RegRipper", "regedit"],
    summary: "공격자의 지속성 확보·설정 변조 흔적이 남는 Windows 설정 데이터베이스.",
    whatYouCanFind: "자동 실행 프로그램, 최근 접근 파일, USB 연결 이력, 설치된 서비스, 사용자 계정 정보",
    keyEvents: [
      { id: "Run / RunOnce", desc: "시작 시 자동 실행 → 악성코드 지속성", threat: true },
      { id: "Services", desc: "설치된 서비스 목록 → 악성 서비스 탐지", threat: true },
      { id: "SAM", desc: "로컬 사용자 계정 및 패스워드 해시", threat: true },
      { id: "UserAssist", desc: "사용자가 실행한 프로그램 이력", threat: false },
      { id: "RecentDocs", desc: "최근 열어본 파일 목록", threat: false },
      { id: "MountedDevices", desc: "USB·외장드라이브 연결 이력", threat: false },
      { id: "Shimcache", desc: "실행 가능 파일 캐시 (삭제 후에도 흔적)", threat: false },
      { id: "Amcache.hve", desc: "실행된 파일의 해시·경로·시간", threat: false },
    ],
    tips: [
      "HKLM\\...\\CurrentVersion\\Run 최우선 확인",
      "Shimcache·Amcache로 삭제된 악성 파일 증명",
      "SAM으로 로컬 계정 목록과 마지막 로그온 시간 확인",
      "SYSTEM 하이브 타임존을 먼저 파악해야 시간 분석 정확",
    ],
  },
  {
    id: "prefetch", icon: "⚡", name: "프리패치", subtitle: "Prefetch",
    color: "#ffd166", category: "실행흔적",
    location: "C:\\Windows\\Prefetch\\",
    files: ["*.pf (예: POWERSHELL.EXE-XXXXXXXX.pf)"],
    tools: ["PECmd", "WinPrefetchView", "Autopsy"],
    summary: "실행 흔적 분석의 핵심. 삭제된 악성 파일도 실행 사실을 증명할 수 있다.",
    whatYouCanFind: "실행된 프로그램 이름, 실행 횟수, 최근 8회 실행 시간, 접근한 파일 목록",
    keyEvents: [
      { id: "실행 횟수", desc: "비정상적으로 높으면 → 자동화 공격", threat: true },
      { id: "실행 경로", desc: "Temp, AppData 비정상 경로 → 즉시 의심", threat: true },
      { id: "접근 파일 목록", desc: "악성코드가 읽은 파일 목록 재구성", threat: false },
      { id: "타임스탬프", desc: "최근 8회 실행 시간 → 타임라인 구성", threat: false },
      { id: "삭제된 파일", desc: "PF 파일 존재 시 실행 사실 증명 가능", threat: false },
    ],
    tips: [
      "C:\\Temp, AppData\\Local\\Temp .exe → 즉시 의심",
      "mimikatz, procdump, meterpreter 이름 직접 검색",
      "삭제됐어도 PF 파일 있으면 실행 증명 가능",
      "Windows Server는 기본 Prefetch 비활성화 → 없어도 정상",
    ],
  },
  {
    id: "mft", icon: "📁", name: "MFT", subtitle: "Master File Table",
    color: "#06d6a0", category: "파일시스템",
    location: "C:\\$MFT  (숨김 시스템 파일)",
    files: ["$MFT", "$LogFile", "$UsnJrnl"],
    tools: ["MFTECmd", "Autopsy", "Velociraptor"],
    summary: "NTFS의 핵심. 모든 파일의 MACE 시간 기록. 삭제된 파일도 복구 가능.",
    whatYouCanFind: "파일 생성/수정/접근/MFT변경 시간(MACE), 삭제된 파일 흔적, 이름·크기·경로 이력",
    keyEvents: [
      { id: "Created", desc: "파일이 처음 만들어진 시간", threat: false },
      { id: "Modified", desc: "파일 내용이 마지막으로 바뀐 시간", threat: false },
      { id: "Accessed", desc: "파일을 마지막으로 열어본 시간", threat: false },
      { id: "MFT Changed", desc: "MFT 레코드 자체가 변경된 시간", threat: false },
      { id: "Timestomping", desc: "Created > Modified → 시간 조작 의심", threat: true },
      { id: "$UsnJrnl", desc: "파일 변경 저널 → 삭제 파일도 기록", threat: false },
    ],
    tips: [
      "MACE 4개 시간 비교 → 이상하면 Timestomping 의심",
      "$UsnJrnl에서 삭제 파일 생성·삭제 이벤트 확인",
      "공격 시간대 C:\\Temp 생성 파일 집중 확인",
      "파일 크기 0이지만 MFT 존재 → 내용 삭제 후 껍데기",
    ],
  },
  {
    id: "lnk", icon: "🔗", name: "LNK / 점프리스트", subtitle: "Shortcut & JumpList",
    color: "#ffa657", category: "사용자행위",
    location: "C:\\Users\\<user>\\AppData\\Roaming\\\nMicrosoft\\Windows\\Recent\\",
    files: ["*.lnk", "*.automaticDestinations-ms"],
    tools: ["LECmd", "JLECmd", "Autopsy"],
    summary: "원본 파일이 삭제되어도 경로·시간·MAC주소·볼륨 정보가 LNK에 남는다.",
    whatYouCanFind: "원본 파일 경로, 접근 시간, 파일 크기, 호스트명, MAC 주소, 볼륨 시리얼 번호",
    keyEvents: [
      { id: "원본 경로", desc: "USB·네트워크 드라이브 파일 접근 흔적", threat: false },
      { id: "호스트 정보", desc: "다른 PC의 LNK → 원본 컴퓨터명 노출", threat: false },
      { id: "MAC 주소", desc: "LNK 생성 당시 네트워크 어댑터 MAC", threat: false },
      { id: "볼륨 시리얼", desc: "USB 기기 특정에 활용 가능", threat: false },
    ],
    tips: [
      "네트워크 공유 파일 열면 LNK에 서버 경로가 남음",
      "USB 악성 파일 실행 시 LNK에 USB 경로 포함",
      "원본 파일 삭제해도 LNK로 접근 사실 증명",
      "JumpList는 앱별 최근 파일 → 더 세밀한 행동 추적",
    ],
  },
  {
    id: "shellbag", icon: "🗂", name: "쉘백", subtitle: "Shellbag",
    color: "#ff9f43", category: "사용자행위",
    location: "NTUSER.DAT / USRCLASS.DAT\n(레지스트리 내부)",
    files: ["NTUSER.DAT", "USRCLASS.DAT"],
    tools: ["ShellBagsExplorer", "RegRipper"],
    summary: "탐색기에서 열어본 폴더 이력. 삭제된 폴더, 외부 드라이브 탐색 흔적까지 남는다.",
    whatYouCanFind: "열어본 폴더 경로, 접근 시간, USB·네트워크 드라이브 탐색 이력, 삭제된 폴더 접근 흔적",
    keyEvents: [
      { id: "폴더 접근 이력", desc: "탐색기로 연 모든 폴더 (삭제된 것도)", threat: false },
      { id: "외부 저장소", desc: "USB, 네트워크 드라이브 탐색 이력", threat: false },
      { id: "숨김 폴더", desc: "숨김 처리된 악성 폴더 접근 흔적", threat: true },
    ],
    tips: [
      "공격자 내부 정찰 경로를 역추적 가능",
      "삭제된 폴더도 쉘백에 기록 남아 존재 증명",
      "USB 연결 + 쉘백 = 'USB로 어느 폴더 봤는가' 증명",
    ],
  },
  {
    id: "browser", icon: "🌐", name: "브라우저 히스토리", subtitle: "Browser Artifacts",
    color: "#4ecdc4", category: "네트워크",
    location: "C:\\Users\\<user>\\AppData\\Local\\\nGoogle\\Chrome\\User Data\\Default\\",
    files: ["History (SQLite)", "Downloads", "Cookies", "Login Data"],
    tools: ["DB Browser for SQLite", "Hindsight", "BrowsingHistoryView"],
    summary: "C2 통신·악성 파일 다운로드 경로 추적의 핵심. 방문 기록·다운로드·검색어가 남는다.",
    whatYouCanFind: "방문 URL·시간, 다운로드 파일·출처 URL, 검색어, 로그인 정보(암호화), 캐시 데이터",
    keyEvents: [
      { id: "다운로드 기록", desc: "악성 파일 다운로드 출처 URL 확인 가능", threat: true },
      { id: "방문 기록", desc: "C2 서버·피싱 사이트 접속 이력", threat: true },
      { id: "검색어", desc: "공격자가 시스템 내부에서 검색한 내용", threat: false },
    ],
    tips: [
      "Downloads 테이블 referrer 컬럼 → 악성 파일 출처",
      "히스토리는 SQLite DB → DB Browser로 바로 열기",
      "시크릿 모드 사용 시 기록 없음 → SRUM으로 보완",
      "Chrome·Edge 모두 동일한 SQLite 구조 사용",
    ],
  },
  {
    id: "srum", icon: "📊", name: "SRUM", subtitle: "System Resource Usage Monitor",
    color: "#a29bfe", category: "네트워크",
    location: "C:\\Windows\\System32\\sru\\SRUDB.dat",
    files: ["SRUDB.dat (ESE Database)"],
    tools: ["SrumECmd", "srum-dump"],
    summary: "프로세스별 네트워크 사용량을 30일간 기록. 삭제된 악성코드 통신도 추적 가능.",
    whatYouCanFind: "프로세스별 송수신 바이트, 실행 시간, 에너지 사용량, 앱별 네트워크 연결 이력",
    keyEvents: [
      { id: "네트워크 사용량", desc: "데이터 유출 규모 추정 가능", threat: true },
      { id: "프로세스 이름", desc: "삭제된 악성 파일도 30일간 기록 유지", threat: true },
      { id: "실행 시간대", desc: "프로세스가 언제 얼마나 실행됐는지", threat: false },
    ],
    tips: [
      "대용량 유출 의심 시 SRUM에서 프로세스 송신량 확인",
      "악성 파일 삭제 후에도 30일치 실행 기록 남음",
      "SrumECmd로 CSV 추출 → Excel 분석 편리",
    ],
  },
];

const CAT_COLOR = {
  로그: "#4cc9f0", 설정: "#d2a8ff", 실행흔적: "#ffd166",
  파일시스템: "#06d6a0", 사용자행위: "#ffa657", 네트워크: "#a29bfe",
};

const TABS = [
  { id: "overview", label: "개요",    icon: "📌" },
  { id: "events",   label: "핵심항목", icon: "🔑" },
  { id: "tips",     label: "조사팁",  icon: "💡" },
  { id: "tools",    label: "도구",    icon: "🛠" },
];

export default function ArtifactGuide() {
  const [selected, setSelected]   = useState(ARTIFACTS[0]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showList, setShowList]   = useState(false);
  const [filterCat, setFilterCat] = useState("전체");

  const categories = ["전체", ...new Set(ARTIFACTS.map(a => a.category))];
  const filtered = filterCat === "전체" ? ARTIFACTS : ARTIFACTS.filter(a => a.category === filterCat);
  const currentIdx = ARTIFACTS.findIndex(a => a.id === selected.id);
  const prev = ARTIFACTS[currentIdx - 1];
  const next = ARTIFACTS[currentIdx + 1];

  const selectArtifact = (a) => { setSelected(a); setActiveTab("overview"); setShowList(false); };

  return (
    <div style={{
      minHeight: "100vh", maxWidth: 480, margin: "0 auto",
      background: "#0a0c10", fontFamily: "'Noto Sans KR','Segoe UI',sans-serif",
      color: "#e6edf3", display: "flex", flexDirection: "column",
    }}>

      {/* 상단 헤더 */}
      <div style={{
        background: "#0d1117", borderBottom: "1px solid #21262d",
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <button onClick={() => setShowList(v => !v)} style={{
          background: showList ? selected.color + "33" : "#21262d",
          border: `1px solid ${showList ? selected.color + "55" : "#30363d"}`,
          borderRadius: 8, padding: "7px 11px",
          color: showList ? selected.color : "#8b949e",
          cursor: "pointer", fontSize: 16, lineHeight: 1, flexShrink: 0,
        }}>☰</button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 18 }}>{selected.icon}</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{selected.name}</span>
            <span style={{
              background: CAT_COLOR[selected.category] + "22",
              color: CAT_COLOR[selected.category],
              border: `1px solid ${CAT_COLOR[selected.category]}44`,
              borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700,
            }}>{selected.category}</span>
          </div>
          <div style={{ color: "#8b949e", fontSize: 11, marginTop: 1 }}>{selected.subtitle}</div>
        </div>

        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button onClick={() => prev && selectArtifact(prev)} style={{
            background: prev ? "#21262d" : "transparent",
            border: `1px solid ${prev ? "#30363d" : "#21262d"}`,
            borderRadius: 6, padding: "6px 10px",
            color: prev ? "#e6edf3" : "#30363d",
            cursor: prev ? "pointer" : "default", fontSize: 14,
          }}>‹</button>
          <button onClick={() => next && selectArtifact(next)} style={{
            background: next ? "#21262d" : "transparent",
            border: `1px solid ${next ? "#30363d" : "#21262d"}`,
            borderRadius: 6, padding: "6px 10px",
            color: next ? "#e6edf3" : "#30363d",
            cursor: next ? "pointer" : "default", fontSize: 14,
          }}>›</button>
        </div>
      </div>

      {/* 드로어 오버레이 */}
      {showList && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}>
          <div onClick={() => setShowList(false)} style={{ position: "absolute", inset: 0, background: "#00000088" }} />
          <div style={{
            position: "relative", width: "80%", maxWidth: 320,
            background: "#0d1117", height: "100%", overflowY: "auto",
            padding: "16px 12px", borderRight: "1px solid #21262d",
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, padding: "4px 8px 12px", borderBottom: "1px solid #21262d", marginBottom: 10 }}>
              🔍 아티팩트 선택
            </div>
            {/* 카테고리 필터 */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
              {categories.map(c => (
                <button key={c} onClick={() => setFilterCat(c)} style={{
                  padding: "4px 10px", borderRadius: 20, border: "none", cursor: "pointer",
                  background: filterCat === c ? (CAT_COLOR[c] || "#238636") + "33" : "#21262d",
                  color: filterCat === c ? (CAT_COLOR[c] || "#06d6a0") : "#8b949e",
                  border: `1px solid ${filterCat === c ? (CAT_COLOR[c] || "#238636") + "66" : "#30363d"}`,
                  fontSize: 11, fontWeight: 700,
                }}>{c}</button>
              ))}
            </div>
            {/* 목록 */}
            {filtered.map(a => (
              <button key={a.id} onClick={() => selectArtifact(a)} style={{
                width: "100%", textAlign: "left",
                padding: "11px 12px", borderRadius: 9, border: "none", cursor: "pointer",
                background: selected.id === a.id ? a.color + "22" : "transparent",
                borderLeft: `3px solid ${selected.id === a.id ? a.color : "transparent"}`,
                marginBottom: 3, display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                <div>
                  <div style={{ color: selected.id === a.id ? a.color : "#e6edf3", fontSize: 13, fontWeight: selected.id === a.id ? 700 : 400 }}>{a.name}</div>
                  <div style={{ color: "#8b949e", fontSize: 10 }}>{a.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 탭 바 */}
      <div style={{
        display: "flex", background: "#0d1117",
        borderBottom: "1px solid #21262d",
        position: "sticky", top: 57, zIndex: 40,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, padding: "10px 4px", border: "none", cursor: "pointer",
            background: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            color: activeTab === t.id ? selected.color : "#8b949e",
            borderBottom: `2px solid ${activeTab === t.id ? selected.color : "transparent"}`,
            fontSize: 10, fontWeight: activeTab === t.id ? 700 : 400,
          }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* 콘텐츠 영역 */}
      <div style={{ flex: 1, padding: 16, paddingBottom: 90 }}>

        {/* 개요 */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              background: selected.color + "12", border: `1px solid ${selected.color}33`,
              borderLeft: `4px solid ${selected.color}`,
              borderRadius: 10, padding: "14px 16px", display: "flex", gap: 10,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>⭐</span>
              <div style={{ color: "#e6edf3", fontSize: 13, lineHeight: 1.7 }}>{selected.summary}</div>
            </div>

            <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ color: "#8b949e", fontSize: 11, marginBottom: 8 }}>📍 파일 위치</div>
              <div style={{ color: selected.color, fontFamily: "monospace", fontSize: 12, wordBreak: "break-all", whiteSpace: "pre-line", lineHeight: 1.7 }}>
                {selected.location}
              </div>
            </div>

            <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ color: "#8b949e", fontSize: 11, marginBottom: 10 }}>📄 주요 파일</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {selected.files.map((f, i) => (
                  <span key={i} style={{
                    background: "#21262d", border: "1px solid #30363d",
                    borderRadius: 6, padding: "5px 10px",
                    fontFamily: "monospace", color: "#e6edf3", fontSize: 11,
                  }}>{f}</span>
                ))}
              </div>
            </div>

            <div style={{ background: selected.color + "0d", border: `1px solid ${selected.color}33`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ color: selected.color, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>🔎 알 수 있는 것</div>
              <div style={{ color: "#e6edf3", fontSize: 13, lineHeight: 1.8 }}>{selected.whatYouCanFind}</div>
            </div>

            {/* 페이지 인디케이터 */}
            <div style={{ display: "flex", justifyContent: "center", gap: 5, paddingTop: 4 }}>
              {ARTIFACTS.map(a => (
                <div key={a.id} onClick={() => selectArtifact(a)} style={{
                  width: selected.id === a.id ? 22 : 6, height: 6, borderRadius: 3,
                  background: selected.id === a.id ? selected.color : "#30363d",
                  cursor: "pointer", transition: "all .2s",
                }} />
              ))}
            </div>
          </div>
        )}

        {/* 핵심 항목 */}
        {activeTab === "events" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ background: "#ff4d6d10", border: "1px solid #ff4d6d30", borderRadius: 8, padding: "10px 12px", marginBottom: 4, color: "#ff7b7b", fontSize: 12 }}>
              ⚠ 빨간 항목은 침해사고 시 특히 주목할 지표입니다.
            </div>
            {selected.keyEvents.map((e, i) => (
              <div key={i} style={{
                background: e.threat ? "#ff4d6d0d" : "#161b22",
                border: `1px solid ${e.threat ? "#ff4d6d33" : "#21262d"}`,
                borderLeft: `4px solid ${e.threat ? "#ff4d6d" : selected.color}`,
                borderRadius: 8, padding: "12px 14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{
                    background: e.threat ? "#ff4d6d22" : selected.color + "22",
                    color: e.threat ? "#ff4d6d" : selected.color,
                    borderRadius: 5, padding: "2px 8px",
                    fontFamily: "monospace", fontSize: 11, fontWeight: 700,
                  }}>{e.id}</span>
                  {e.threat && (
                    <span style={{
                      background: "#ff4d6d22", color: "#ff4d6d",
                      border: "1px solid #ff4d6d44", borderRadius: 4,
                      padding: "2px 6px", fontSize: 10, fontWeight: 700,
                    }}>⚠ 위협</span>
                  )}
                </div>
                <div style={{ color: e.threat ? "#ffaaaa" : "#e6edf3", fontSize: 13, lineHeight: 1.6 }}>{e.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* 조사 팁 */}
        {activeTab === "tips" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>실제 침해사고에서 나온 실전 팁입니다.</div>
            {selected.tips.map((tip, i) => (
              <div key={i} style={{
                background: "#161b22", border: "1px solid #21262d",
                borderRadius: 10, padding: "14px 16px",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <div style={{
                  background: selected.color + "22", color: selected.color,
                  borderRadius: "50%", width: 28, height: 28, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800,
                }}>{i + 1}</div>
                <div style={{ color: "#e6edf3", fontSize: 13, lineHeight: 1.7, paddingTop: 3 }}>{tip}</div>
              </div>
            ))}
          </div>
        )}

        {/* 도구 */}
        {activeTab === "tools" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selected.tools.map((tool, i) => (
              <div key={i} style={{
                background: "#161b22", border: "1px solid #21262d",
                borderRadius: 10, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  background: selected.color + "22", borderRadius: 8,
                  width: 42, height: 42, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>🛠</div>
                <div>
                  <div style={{ color: selected.color, fontWeight: 700, fontSize: 14 }}>{tool}</div>
                  <div style={{ color: "#8b949e", fontSize: 11, marginTop: 2 }}>
                    {tool.includes("ECmd") || tool.includes("Explorer") ? "Eric Zimmerman Tools (무료)" :
                     tool.includes("Autopsy") ? "오픈소스 포렌식 플랫폼" :
                     tool.includes("Viewer") ? "Windows 내장 도구" :
                     tool.includes("SQLite") ? "DB Browser (무료)" : "무료 / 오픈소스"}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ background: "#06d6a010", border: "1px solid #06d6a033", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⭐</span>
              <div style={{ color: "#7ee787", fontSize: 12, lineHeight: 1.7 }}>
                <strong>Eric Zimmerman Tools</strong> (KAPE, EZTools)는 Windows 포렌식 필수 도구 모음. Prefetch, Registry, MFT, LNK 등 대부분의 아티팩트를 한 번에 처리할 수 있습니다.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 하단 이전/다음 고정 바 */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "#0d1117", borderTop: "1px solid #21262d",
        padding: "10px 16px", display: "flex", gap: 10,
      }}>
        <button onClick={() => prev && selectArtifact(prev)} style={{
          flex: 1, padding: "11px 8px", borderRadius: 10, border: "none",
          background: prev ? "#161b22" : "transparent",
          border: `1px solid ${prev ? "#30363d" : "#21262d"}`,
          color: prev ? "#e6edf3" : "#30363d",
          cursor: prev ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          fontSize: 13,
        }}>
          {prev ? <><span>‹</span><span>{prev.icon}</span><span style={{ fontSize: 12 }}>{prev.name}</span></> : <span>처음</span>}
        </button>
        <button onClick={() => next && selectArtifact(next)} style={{
          flex: 1, padding: "11px 8px", borderRadius: 10, border: "none",
          background: next ? selected.color + "22" : "transparent",
          border: `1px solid ${next ? selected.color + "55" : "#21262d"}`,
          color: next ? selected.color : "#30363d",
          cursor: next ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          fontSize: 13,
        }}>
          {next ? <><span style={{ fontSize: 12 }}>{next.name}</span><span>{next.icon}</span><span>›</span></> : <span>마지막</span>}
        </button>
      </div>
    </div>
  );
}
