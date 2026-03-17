import { useState } from "react";

// ═══════════════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════════════
const CURRICULUM = [
  {
    id: "intro",
    phase: "PHASE 1",
    phaseColor: "#4cc9f0",
    icon: "🧭",
    title: "X-Ways 기초 이해",
    subtitle: "도구 철학과 인터페이스",
    duration: "1~2일",
    lessons: [
      {
        id: "what",
        title: "X-Ways Forensics란?",
        tag: "개념",
        tagColor: "#4cc9f0",
        content: {
          summary: "X-Ways Forensics(XWF)는 독일 X-Ways Software Technology AG가 개발한 전문 디지털 포렌식 도구입니다. 가볍고 빠르며, 법적 증거 능력을 갖춘 분석이 가능합니다.",
          sections: [
            {
              title: "🔍 왜 X-Ways인가?",
              type: "cards",
              items: [
                { label: "초경량 설계", desc: "설치 불필요. USB 하나로 어디서든 실행 가능", icon: "⚡" },
                { label: "법적 무결성", desc: "쓰기 방지, 해시 검증으로 증거 훼손 방지", icon: "⚖️" },
                { label: "원시 데이터 접근", desc: "삭제된 파일, 숨겨진 영역까지 직접 접근", icon: "🔬" },
                { label: "강력한 검색", desc: "키워드·정규식·바이너리 패턴 동시 검색", icon: "🔎" },
                { label: "자동화 기능", desc: "스크립트로 반복 작업 자동화 가능", icon: "🤖" },
                { label: "업계 표준", desc: "전 세계 수사기관·포렌식 팀 표준 도구", icon: "🌐" },
              ],
            },
            {
              title: "📦 제품 라인업",
              type: "table",
              headers: ["제품명", "용도", "특징"],
              rows: [
                ["X-Ways Forensics", "풀 포렌식 분석", "가장 강력, 라이선스 필요"],
                ["X-Ways Investigator", "분석 전용 (쓰기 불가)", "제한된 기능, 저렴"],
                ["WinHex", "헥스 에디터 기반", "디스크 편집 가능"],
                ["X-Ways Security", "데이터 말소·복구", "보안 업무용"],
              ],
            },
            {
              title: "💡 핵심 개념",
              type: "tips",
              items: [
                "XWF는 EnCase, FTK와 달리 케이스를 별도 DB에 저장하지 않고 .xfc 파일 하나로 관리",
                "모든 작업은 원본 이미지에 직접 접근 — 원본 절대 수정 불가 원칙",
                "라이선스 동글(USB) 없이는 실행 불가 — 분실 주의",
              ],
            },
          ],
        },
      },
      {
        id: "ui",
        title: "인터페이스 완전 해부",
        tag: "UI",
        tagColor: "#06d6a0",
        content: {
          summary: "XWF는 처음 보면 굉장히 복잡해 보입니다. 하지만 구조를 이해하면 논리적으로 설계된 도구입니다.",
          sections: [
            {
              title: "🖥 메인 화면 구조",
              type: "ui_map",
              areas: [
                { name: "메뉴바", position: "top", color: "#4cc9f0", desc: "Case / Evidence / View / Tools / Options — 모든 기능의 시작점" },
                { name: "디렉토리 브라우저", position: "left", color: "#d2a8ff", desc: "파일 트리 구조. 증거 파일의 폴더·파일 계층을 탐색" },
                { name: "파일 목록", position: "center", color: "#ffd166", desc: "선택한 폴더의 파일 목록. 정렬·필터링·태깅 모두 여기서" },
                { name: "프리뷰 패널", position: "right", color: "#06d6a0", desc: "선택한 파일 미리보기. 텍스트·이미지·헥스 뷰 전환 가능" },
                { name: "상태바", position: "bottom", color: "#ffa657", desc: "현재 작업 진행 상황, 선택된 파일 수, 디스크 용량 등" },
              ],
            },
            {
              title: "🗂 핵심 윈도우",
              type: "cards",
              items: [
                { label: "Case Root", desc: "케이스 최상위. 추가된 모든 증거 이미지가 여기에 표시", icon: "📁" },
                { label: "Evidence Object", desc: "개별 증거 이미지. 더블클릭 → 내부 파일 시스템 진입", icon: "💾" },
                { label: "Directory Browser", desc: "Ctrl+F9로 토글. 폴더 구조 탐색의 핵심", icon: "🌳" },
                { label: "Details Window", desc: "선택한 파일의 메타데이터·속성 표시", icon: "📋" },
                { label: "Log Window", desc: "모든 작업 이력 자동 기록 (법적 감사 추적)", icon: "📝" },
                { label: "Hex Editor", desc: "파일·디스크의 원시 바이트 직접 확인", icon: "🔡" },
              ],
            },
            {
              title: "⌨️ 필수 단축키",
              type: "shortcuts",
              items: [
                { key: "F6", desc: "파일 열기 / 증거 추가" },
                { key: "Ctrl+F2", desc: "새 케이스 생성" },
                { key: "Ctrl+F3", desc: "케이스 열기" },
                { key: "F9", desc: "디렉토리 브라우저 토글" },
                { key: "Ctrl+F9", desc: "파일 목록 열기" },
                { key: "F10", desc: "프리뷰 패널 토글" },
                { key: "Alt+Enter", desc: "파일 속성/메타데이터 상세 보기" },
                { key: "Ctrl+A", desc: "전체 파일 선택" },
                { key: "Ctrl+F", desc: "검색 시작" },
                { key: "F2", desc: "볼륨 스냅샷 새로고침 (Refine Volume Snapshot)" },
                { key: "Ctrl+Z", desc: "마지막 작업 취소" },
                { key: "Tab", desc: "프리뷰 창과 파일 목록 간 전환" },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    id: "case",
    phase: "PHASE 2",
    phaseColor: "#ffd166",
    icon: "📂",
    title: "케이스 생성 & 증거 추가",
    subtitle: "수사의 시작",
    duration: "1일",
    lessons: [
      {
        id: "new_case",
        title: "케이스 생성 & 구성",
        tag: "실습",
        tagColor: "#ffd166",
        content: {
          summary: "모든 분석은 케이스(Case)에서 시작합니다. 케이스는 수사 단위로, 하나의 .xfc 파일로 관리됩니다.",
          sections: [
            {
              title: "📋 케이스 생성 절차",
              type: "steps",
              items: [
                { step: "01", title: "Case → New Case", desc: "메뉴에서 새 케이스 생성 시작. 단축키 Ctrl+F2" },
                { step: "02", title: "케이스 정보 입력", desc: "사건번호, 조사관명, 날짜, 설명 입력 — 법적 문서에 직접 반영되므로 정확하게 작성" },
                { step: "03", title: "저장 경로 설정", desc: "케이스 파일(.xfc) 저장 위치 지정. 원본 증거와 다른 드라이브 권장" },
                { step: "04", title: "케이스 설정 구성", desc: "시간대(Timezone), 코드페이지, 해시 알고리즘 선택 (MD5+SHA1 권장)" },
                { step: "05", title: "증거 추가", desc: "Evidence → Add Evidence Object로 분석할 이미지·드라이브 추가" },
              ],
            },
            {
              title: "⚙️ 케이스 설정 — 꼭 확인해야 할 것",
              type: "warnings",
              items: [
                { level: "critical", title: "타임존 설정 필수", desc: "증거 시스템의 타임존을 반드시 정확히 설정. 잘못 설정 시 타임라인 전체가 틀어짐" },
                { level: "critical", title: "코드페이지 확인", desc: "한국 시스템 → CP949 또는 EUC-KR. 잘못 설정 시 파일명이 깨짐" },
                { level: "warning", title: "해시 알고리즘 선택", desc: "MD5 단독보다 MD5+SHA-1 또는 SHA-256 조합 권장 (법적 요구사항 확인)" },
                { level: "info", title: "케이스 로그 자동 기록", desc: "모든 작업이 자동 로그에 기록됨. 경로·시간 변경 금지" },
              ],
            },
            {
              title: "📁 케이스 파일 구조",
              type: "tree",
              items: [
                { indent: 0, name: "MyCase.xfc", type: "file", desc: "케이스 메인 파일 (열기 파일)" },
                { indent: 0, name: "MyCase.xfc.txt", type: "file", desc: "케이스 로그 (모든 작업 이력)" },
                { indent: 0, name: "MyCase.xfc_store/", type: "folder", desc: "케이스 데이터 폴더" },
                { indent: 1, name: "Report/", type: "folder", desc: "보고서 생성 시 저장 위치" },
                { indent: 1, name: "Bookmarks/", type: "folder", desc: "북마크한 파일·증거" },
                { indent: 1, name: "Hash DB/", type: "folder", desc: "해시 데이터베이스" },
              ],
            },
          ],
        },
      },
      {
        id: "evidence",
        title: "증거 이미지 추가 & 종류",
        tag: "실습",
        tagColor: "#ffd166",
        content: {
          summary: "XWF는 다양한 형식의 증거를 지원합니다. 증거를 추가할 때 쓰기 방지 여부가 가장 중요합니다.",
          sections: [
            {
              title: "💾 지원하는 증거 형식",
              type: "table",
              headers: ["형식", "확장자", "설명"],
              rows: [
                ["Raw 이미지", ".dd, .img, .raw, .bin", "비트 단위 복사본. 가장 일반적"],
                ["E01 (EnCase)", ".e01, .ex01", "EnCase 포맷. 압축·해시 내장"],
                ["AFF", ".aff", "Advanced Forensics Format"],
                ["VMDK/VHD", ".vmdk, .vhd, .vhdx", "가상머신 디스크 이미지"],
                ["물리 드라이브", "\\\\.\\PhysicalDrive0", "실물 디스크 직접 연결"],
                ["메모리 덤프", ".mem, .dmp", "RAM 덤프 분석"],
                ["파티션 이미지", ".img", "개별 파티션 이미지"],
              ],
            },
            {
              title: "🔐 증거 추가 시 쓰기 방지 원칙",
              type: "steps",
              items: [
                { step: "01", title: "물리 장치 연결 시", desc: "반드시 하드웨어 쓰기 방지 장치(Write Blocker) 사용 후 연결. XWF의 소프트웨어 쓰기 방지만으로는 부족할 수 있음" },
                { step: "02", title: "이미지 파일 추가", desc: "Evidence → Add Evidence Object → Image File 선택. XWF가 자동으로 읽기 전용으로 마운트" },
                { step: "03", title: "해시 검증", desc: "추가 후 반드시 Evidence → Verify 실행. 이미지 해시가 원본과 일치하는지 확인" },
                { step: "04", title: "결과 기록", desc: "해시 값 케이스 문서에 기록. 법정 증거 제출 시 필수" },
              ],
            },
            {
              title: "🧩 Volume Snapshot (VS) 이해",
              type: "tips",
              items: [
                "증거를 추가하면 XWF가 자동으로 Volume Snapshot을 생성 — 파일 시스템 전체를 인덱싱한 데이터베이스",
                "Refine Volume Snapshot(F2)으로 삭제된 파일 복구, 해시 계산, 메타데이터 추출 등 심층 분석 수행",
                "VS는 원본을 수정하지 않음 — 분석 결과를 케이스 파일에만 저장",
                "VS 새로고침 시 이전 분석 결과는 유지되며 새로운 항목만 추가됨",
              ],
            },
          ],
        },
      },
    ],
  },
  {
    id: "analysis",
    phase: "PHASE 3",
    phaseColor: "#ff4d6d",
    icon: "🔬",
    title: "핵심 분석 기능",
    subtitle: "실제 수사에서 쓰는 기능들",
    duration: "3~5일",
    lessons: [
      {
        id: "rvs",
        title: "Volume Snapshot 정제 (핵심!)",
        tag: "핵심",
        tagColor: "#ff4d6d",
        content: {
          summary: "Refine Volume Snapshot(RVS)은 XWF에서 가장 중요한 기능입니다. 증거 추가 후 반드시 실행해야 삭제 파일 복구·해시 계산·메타데이터 추출이 됩니다.",
          sections: [
            {
              title: "🚀 RVS 실행 방법",
              type: "steps",
              items: [
                { step: "01", title: "F2 키 또는 메뉴", desc: "Specialist → Refine Volume Snapshot (F2). 증거 선택 후 실행" },
                { step: "02", title: "분석 옵션 선택", desc: "어떤 작업을 수행할지 체크박스로 선택. 처음에는 권장 옵션 사용" },
                { step: "03", title: "처리 실행", desc: "OK 클릭 후 자동 처리. 디스크 크기에 따라 수십 분~수 시간 소요" },
                { step: "04", title: "결과 확인", desc: "완료 후 삭제된 파일, 카빙된 파일이 목록에 추가됨" },
              ],
            },
            {
              title: "✅ 주요 RVS 옵션 설명",
              type: "table",
              headers: ["옵션", "기능", "권장 여부"],
              rows: [
                ["Recover deleted files", "삭제된 파일 복구 및 표시", "✅ 항상"],
                ["Identify file types", "확장자 위조 탐지 (내부 시그니처로 검증)", "✅ 항상"],
                ["Compute hash values", "모든 파일 MD5/SHA-1 해시 계산", "✅ 항상"],
                ["Extract metadata", "EXIF, Office 메타데이터 추출", "✅ 권장"],
                ["Find embedded data", "파일 내 숨겨진 데이터 탐지", "✅ 권장"],
                ["Carve files from unallocated", "미할당 영역에서 파일 카빙", "⚠️ 시간 오래 걸림"],
                ["Index text content", "텍스트 내용 전체 인덱싱", "⚠️ 저장 공간 필요"],
                ["Skin color analysis", "이미지의 피부색 비율 분석", "🔍 특수한 경우"],
              ],
            },
          ],
        },
      },
      {
        id: "search",
        title: "검색 기능 완전 정복",
        tag: "핵심",
        tagColor: "#ff4d6d",
        content: {
          summary: "XWF의 검색은 단순 키워드 검색을 넘어 정규식, 바이너리 패턴, 동시 다중 검색까지 지원합니다.",
          sections: [
            {
              title: "🔎 검색 종류",
              type: "cards",
              items: [
                { label: "Simultaneous Search", desc: "Ctrl+F → 수백 개 키워드를 동시에 검색. 가장 자주 사용", icon: "🔍" },
                { label: "정규식 검색", desc: "RegEx 패턴으로 이메일·IP·전화번호 등 패턴 매칭", icon: "🎯" },
                { label: "16진수 검색", desc: "바이너리 패턴 직접 검색. 악성코드 시그니처 탐지", icon: "🔡" },
                { label: "GREP 검색", desc: "Unix GREP 방식의 강력한 패턴 검색", icon: "📜" },
                { label: "해시 검색", desc: "알려진 악성 파일 해시로 즉시 식별", icon: "🔐" },
                { label: "파일명 검색", desc: "와일드카드 포함 파일명·확장자 검색", icon: "📁" },
              ],
            },
            {
              title: "💻 실전 검색 예시",
              type: "code_examples",
              items: [
                {
                  title: "이메일 주소 검색 (정규식)",
                  code: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
                  desc: "모든 이메일 주소 패턴 탐지",
                },
                {
                  title: "한국 전화번호 검색",
                  code: "01[016789]-?[0-9]{3,4}-?[0-9]{4}",
                  desc: "휴대폰 번호 패턴",
                },
                {
                  title: "IPv4 주소 검색",
                  code: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b",
                  desc: "IP 주소 전체 탐지",
                },
                {
                  title: "악성코드 C2 URL 패턴",
                  code: "https?://[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}",
                  desc: "IP 직접 참조 URL (C2 의심)",
                },
              ],
            },
            {
              title: "💡 검색 실전 팁",
              type: "tips",
              items: [
                "Simultaneous Search에 키워드 목록을 파일로 로드 가능 — 수백 개 키워드를 한 번에",
                "검색 결과는 자동으로 태그되어 나중에 필터링 가능",
                "미할당 영역(Unallocated)까지 포함 검색 옵션 반드시 체크",
                "유니코드/CP949/UTF-8 등 다중 인코딩 동시 검색 설정 필요 (한국어 포함 시)",
                "검색 전 Index가 생성되어 있으면 훨씬 빠름 — RVS에서 인덱싱 미리 실행",
              ],
            },
          ],
        },
      },
      {
        id: "artifacts",
        title: "Windows 아티팩트 분석",
        tag: "핵심",
        tagColor: "#ff4d6d",
        content: {
          summary: "XWF에서 각 Windows 아티팩트에 접근하는 방법과 분석 포인트를 정리했습니다.",
          sections: [
            {
              title: "📋 아티팩트별 XWF 접근 경로",
              type: "table",
              headers: ["아티팩트", "XWF에서 접근 방법", "핵심 분석 포인트"],
              rows: [
                ["이벤트 로그", "파일 목록 → winevt\\Logs → *.evtx 파일 더블클릭", "Event ID 필터링, 타임스탬프 정렬"],
                ["레지스트리", "System32\\config → SYSTEM/SAM/SOFTWARE 파일 선택", "내장 레지스트리 뷰어로 키 탐색"],
                ["프리패치", "Windows\\Prefetch → *.pf 파일", "실행 시간·횟수 자동 파싱"],
                ["MFT", "Specialist → File System Data Structure", "$MFT 직접 파싱"],
                ["LNK 파일", "파일 목록 → .lnk 확장자 필터", "원본 경로·MAC 주소 자동 추출"],
                ["브라우저", "AppData → Chrome\\Default\\History", "SQLite 내장 뷰어로 테이블 확인"],
                ["SRUM", "System32\\sru\\SRUDB.dat", "ESE DB 내장 파서 사용"],
                ["이벤트 타임라인", "View → Timeline", "모든 아티팩트 통합 타임라인"],
              ],
            },
            {
              title: "🔍 확장자 위조 탐지",
              type: "steps",
              items: [
                { step: "01", title: "RVS에서 Identify File Types 실행", desc: "파일 내부 시그니처(Magic Bytes)와 확장자를 비교" },
                { step: "02", title: "파일 목록 필터링", desc: "View → Filter → 'Type Status: Mismatch' 선택" },
                { step: "03", title: "불일치 파일 확인", desc: "예: 확장자는 .jpg인데 실제는 .exe인 파일 → 즉시 의심" },
                { step: "04", title: "실제 파일 시그니처 확인", desc: "헥스 뷰어에서 파일 첫 4바이트(Magic Bytes) 직접 확인" },
              ],
            },
            {
              title: "🔑 Magic Bytes 주요 시그니처",
              type: "table",
              headers: ["파일 유형", "Magic Bytes (Hex)", "ASCII"],
              rows: [
                ["EXE / DLL", "4D 5A", "MZ"],
                ["PDF", "25 50 44 46", "%PDF"],
                ["ZIP / DOCX / XLSX", "50 4B 03 04", "PK.."],
                ["JPEG", "FF D8 FF", "..."],
                ["PNG", "89 50 4E 47", ".PNG"],
                ["RAR", "52 61 72 21", "Rar!"],
                ["7-Zip", "37 7A BC AF", "7z.."],
              ],
            },
          ],
        },
      },
      {
        id: "timeline",
        title: "타임라인 분석",
        tag: "핵심",
        tagColor: "#ff4d6d",
        content: {
          summary: "XWF의 타임라인 기능은 여러 아티팩트의 시간 정보를 하나의 뷰로 통합합니다. 공격 흐름 재구성의 핵심입니다.",
          sections: [
            {
              title: "🕐 타임라인 생성 방법",
              type: "steps",
              items: [
                { step: "01", title: "View → Timeline 열기", desc: "상단 메뉴 View → Timeline 또는 Ctrl+T" },
                { step: "02", title: "시간 범위 설정", desc: "분석할 시간대 지정. 침해 의심 시간 전후 넉넉하게 설정" },
                { step: "03", title: "포함할 소스 선택", desc: "파일 시스템 타임스탬프, 레지스트리, 이벤트 로그 등 체크" },
                { step: "04", title: "타임라인 생성", desc: "Generate 클릭 → 통합 타임라인 자동 생성" },
                { step: "05", title: "이상 구간 식별", desc: "특정 시간대 이벤트 밀집 구간, 시간 역전 현상 탐지" },
              ],
            },
            {
              title: "⚠️ 타임라인 분석 시 주의사항",
              type: "warnings",
              items: [
                { level: "critical", title: "타임존 다시 확인", desc: "타임라인 생성 전 증거 시스템의 타임존 100% 확인. 1시간 차이로 전혀 다른 결론 도출 가능" },
                { level: "critical", title: "Timestomping 의심", desc: "파일의 MACE 4개 시간 중 이상한 것 발견 시 Timestomping(시간 조작) 가능성 검토" },
                { level: "warning", title: "FAT vs NTFS 시간 해상도", desc: "FAT 파일시스템은 2초 단위 → 정밀도 낮음. NTFS는 100나노초 단위" },
                { level: "info", title: "$STANDARD_INFORMATION vs $FILE_NAME", desc: "MFT에는 두 개의 타임스탬프 세트가 있음. 위조는 $SI만 변경하는 경우가 많아 $FN과 비교 필수" },
              ],
            },
          ],
        },
      },
      {
        id: "carving",
        title: "파일 카빙 & 삭제 파일 복구",
        tag: "심화",
        tagColor: "#a29bfe",
        content: {
          summary: "삭제된 파일 복구와 파일 카빙은 침해사고 분석에서 결정적 증거를 찾는 핵심 기법입니다.",
          sections: [
            {
              title: "📂 삭제 파일 복구",
              type: "cards",
              items: [
                { label: "MFT Entry 복구", desc: "NTFS에서 파일 삭제 시 MFT 엔트리가 남아있으면 메타데이터 포함 복구", icon: "♻️" },
                { label: "미할당 영역 카빙", desc: "파일 시그니처(Magic Bytes)로 미할당 영역에서 파일 조각 추출", icon: "⛏️" },
                { label: "파티션 복구", desc: "삭제된 파티션도 파티션 테이블 분석으로 복구 가능", icon: "💿" },
                { label: "파일 조각 복원", desc: "단편화된 파일을 파일 시스템 메타데이터로 재조합", icon: "🧩" },
              ],
            },
            {
              title: "⛏️ 카빙 실행 방법",
              type: "steps",
              items: [
                { step: "01", title: "RVS → Carving 옵션 체크", desc: "Refine Volume Snapshot에서 'Carve files from unallocated space' 체크" },
                { step: "02", title: "카빙 대상 파일 유형 선택", desc: "JPG, PDF, ZIP, EXE 등 찾을 파일 유형 선택. 많을수록 시간 증가" },
                { step: "03", title: "결과 확인", desc: "완료 후 파일 목록에 [Carved] 태그와 함께 복구된 파일 표시" },
                { step: "04", title: "무결성 확인", desc: "카빙된 파일이 정상인지 미리보기로 확인. 조각난 파일은 일부 손상 가능" },
              ],
            },
            {
              title: "💡 카빙 팁",
              type: "tips",
              items: [
                "카빙은 시간이 매우 오래 걸림 → 가능하면 야간이나 주말에 실행",
                "SSD 드라이브는 TRIM 기능으로 삭제 즉시 데이터 소거 → 카빙 성공률 낮음",
                "HDD는 덮어쓰기 전까지 복구 가능성 높음",
                "카빙 결과물은 원본 파일 시스템 구조 없이 추출되므로 파일명 없이 저장됨",
              ],
            },
          ],
        },
      },
    ],
  },
  {
    id: "reporting",
    phase: "PHASE 4",
    phaseColor: "#06d6a0",
    icon: "📄",
    title: "북마크 & 보고서 작성",
    subtitle: "증거 정리와 보고",
    duration: "1~2일",
    lessons: [
      {
        id: "bookmarks",
        title: "북마크 & 태깅",
        tag: "실습",
        tagColor: "#06d6a0",
        content: {
          summary: "증거 파일을 발견할 때마다 북마크로 표시해두는 습관이 중요합니다. 나중에 보고서 자동 생성에 직결됩니다.",
          sections: [
            {
              title: "🔖 북마크 시스템",
              type: "cards",
              items: [
                { label: "북마크 추가", desc: "파일 우클릭 → Add to Bookmarks 또는 Ctrl+B. 설명 메모 필수", icon: "🔖" },
                { label: "카테고리 분류", desc: "북마크를 폴더별로 분류 가능. 예: 악성파일, 통신기록, 삭제흔적", icon: "📁" },
                { label: "색상 태그", desc: "파일에 색상 코드 지정. 빨강=중요 증거, 노랑=검토 필요 등 팀 약속", icon: "🎨" },
                { label: "주석 추가", desc: "각 북마크에 수사 내용·결론 메모. 보고서에 자동 포함", icon: "📝" },
              ],
            },
            {
              title: "🏷️ 태그 활용법",
              type: "steps",
              items: [
                { step: "01", title: "태그 색상 약속 정하기", desc: "팀 내 태그 색상 규칙 통일. 예: 빨강=악성/위협, 노랑=검토중, 녹색=무관, 파랑=관련있음" },
                { step: "02", title: "파일 필터링 활용", desc: "View → Filter → Tag Color로 원하는 태그만 필터링하여 집중 분석" },
                { step: "03", title: "북마크 내보내기", desc: "Bookmarks → Export로 북마크 목록을 CSV·HTML로 내보내기 가능" },
              ],
            },
          ],
        },
      },
      {
        id: "report",
        title: "보고서 생성",
        tag: "실습",
        tagColor: "#06d6a0",
        content: {
          summary: "XWF는 북마크된 증거들을 바탕으로 HTML·RTF 형식의 보고서를 자동 생성합니다.",
          sections: [
            {
              title: "📄 보고서 생성 절차",
              type: "steps",
              items: [
                { step: "01", title: "Case → Report 메뉴", desc: "상단 Case → Report 또는 F12" },
                { step: "02", title: "보고서 형식 선택", desc: "HTML (웹 브라우저 뷰) 또는 RTF (Word 호환) 선택" },
                { step: "03", title: "포함 내용 선택", desc: "북마크, 검색 결과, 해시 목록, 케이스 로그 등 포함 항목 체크" },
                { step: "04", title: "로고·헤더 설정", desc: "기관 로고·수사관 서명 정보 삽입 가능" },
                { step: "05", title: "생성 및 검토", desc: "Generate 클릭 → 생성된 보고서 반드시 내용 검토 후 제출" },
              ],
            },
            {
              title: "💡 보고서 작성 팁",
              type: "tips",
              items: [
                "보고서 생성 전 모든 북마크에 설명 메모가 있는지 확인",
                "해시 값 목록 반드시 포함 — 증거 무결성 증명",
                "스크린샷은 XWF 내부 캡처 기능 사용 (외부 캡처보다 법적 신뢰도 높음)",
                "케이스 로그(모든 분석 작업 이력)를 보고서에 첨부하면 수사 과정 투명성 확보",
                "최종 보고서는 항상 수사팀장 검토 후 제출",
              ],
            },
          ],
        },
      },
    ],
  },
  {
    id: "advanced",
    phase: "PHASE 5",
    phaseColor: "#d2a8ff",
    icon: "🚀",
    title: "심화 & 실전 워크플로우",
    subtitle: "침해사고 대응 실전",
    duration: "지속 학습",
    lessons: [
      {
        id: "workflow",
        title: "침해사고 대응 표준 워크플로우",
        tag: "실전",
        tagColor: "#d2a8ff",
        content: {
          summary: "실제 침해사고 현장에서 XWF로 분석하는 표준 절차입니다. 이 순서를 몸에 익히는 것이 목표입니다.",
          sections: [
            {
              title: "🚨 침해사고 분석 표준 절차 (XWF 기반)",
              type: "steps",
              items: [
                { step: "01", title: "현장 보존 & 이미징", desc: "원본 디스크 쓰기 방지 후 dd/FTK Imager 등으로 이미지 생성. 해시 기록" },
                { step: "02", title: "XWF 케이스 생성", desc: "사건번호·타임존·해시 알고리즘 설정 후 이미지 추가. 해시 검증 실행" },
                { step: "03", title: "Volume Snapshot 생성 (RVS)", desc: "F2 → 삭제 파일 복구, 파일 유형 식별, 해시 계산, 메타데이터 추출 체크" },
                { step: "04", title: "악성 파일 탐지", desc: "확장자 위조 필터 → 비정상 경로 실행파일 → NSRL 해시 DB로 알려진 파일 제외" },
                { step: "05", title: "아티팩트 분석", desc: "이벤트 로그 → 레지스트리 Run키 → 프리패치 → MFT 타임스탬프 순으로 분석" },
                { step: "06", title: "키워드 검색", desc: "C2 서버 IP, 악성코드명, 공격자 계정 등 알려진 IOC로 전체 검색" },
                { step: "07", title: "타임라인 재구성", desc: "View → Timeline으로 공격 시작~종료 타임라인 생성. 공격 흐름 시각화" },
                { step: "08", title: "증거 북마크 & 문서화", desc: "모든 핵심 증거 북마크+메모. 색상 태그로 분류" },
                { step: "09", title: "보고서 생성", desc: "Case → Report로 최종 보고서 생성. 해시 목록·케이스 로그 포함" },
              ],
            },
            {
              title: "⚡ 빠른 트리아지(초동 분석) 체크리스트",
              type: "checklist",
              items: [
                "□ 이미지 해시 검증 완료",
                "□ 타임존 설정 확인",
                "□ RVS 실행 (기본 옵션)",
                "□ 최근 생성·수정 파일 확인 (침해 시간대 ±2시간)",
                "□ 비정상 경로 실행파일 탐지 (Temp, AppData)",
                "□ 확장자 위조 파일 확인",
                "□ 이벤트 로그 핵심 ID 확인 (4625, 7045, 1102)",
                "□ 레지스트리 Run 키 확인",
                "□ 프리패치 의심 파일 확인",
                "□ 핵심 증거 북마크 완료",
              ],
            },
          ],
        },
      },
      {
        id: "tips",
        title: "고수들의 실전 팁",
        tag: "실전",
        tagColor: "#d2a8ff",
        content: {
          summary: "X-Ways를 오래 사용한 포렌식 전문가들이 공유하는 실전 팁 모음입니다.",
          sections: [
            {
              title: "💎 성능 최적화 팁",
              type: "tips",
              items: [
                "케이스 파일과 증거 이미지는 반드시 다른 드라이브에 저장 — I/O 병목 방지",
                "RAM을 많이 사용하는 작업(카빙, 인덱싱) 시 다른 프로그램 모두 종료",
                "SSD에 케이스 파일 저장 시 처리 속도 2~3배 향상",
                "대용량 이미지는 청크(chunk)로 나누어 병렬 처리 가능",
              ],
            },
            {
              title: "🎯 분석 정확도 향상 팁",
              type: "tips",
              items: [
                "NSRL 해시 DB를 로드하면 알려진 정상 OS 파일을 자동 제외 → 분석 대상 대폭 감소",
                "알려진 악성코드 해시 DB(VirusTotal 등에서 수집)를 XWF에 로드하여 자동 탐지",
                "Column Filter 기능으로 특정 크기·날짜·경로 파일만 표시 → 집중 분석",
                "분석 중 의심 파일은 즉시 VirusTotal에 해시로 조회 (XWF에서 우클릭 가능)",
              ],
            },
            {
              title: "⚖️ 법적 증거 능력 유지 팁",
              type: "warnings",
              items: [
                { level: "critical", title: "원본 절대 수정 금지", desc: "XWF는 읽기 전용이지만 물리 장치 직접 연결 시 쓰기 방지 장치 필수" },
                { level: "critical", title: "모든 작업 로그 보존", desc: "XWF 케이스 로그(.xfc.txt)를 보고서에 첨부하여 분석 과정 투명성 증명" },
                { level: "warning", title: "해시 값 정기 검증", desc: "분석 중간중간 이미지 해시 재검증으로 무결성 유지 확인" },
                { level: "info", title: "스크린샷은 XWF 내부 기능으로", desc: "외부 캡처 도구보다 XWF 내장 스크린샷이 법적 신뢰도 높음" },
              ],
            },
          ],
        },
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
//  RENDER HELPERS
// ═══════════════════════════════════════════════════════════
function Cards({ items }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          background: "#161b22", border: "1px solid #30363d",
          borderRadius: 10, padding: "12px 14px", flex: "1 1 160px", minWidth: 140,
        }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
          <div style={{ color: "#e6edf3", fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{item.label}</div>
          <div style={{ color: "#8b949e", fontSize: 11, lineHeight: 1.5 }}>{item.desc}</div>
        </div>
      ))}
    </div>
  );
}

function StepsComponent({ items }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: "flex", gap: 14,
          background: "#161b22", border: "1px solid #21262d",
          borderRadius: 8, padding: "12px 14px", alignItems: "flex-start",
        }}>
          <div style={{
            background: "#238636", color: "#fff", borderRadius: 6,
            padding: "3px 8px", fontSize: 11, fontWeight: 800,
            fontFamily: "monospace", flexShrink: 0,
          }}>{item.step}</div>
          <div>
            <div style={{ color: "#e6edf3", fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{item.title}</div>
            <div style={{ color: "#8b949e", fontSize: 11, lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TableComponent({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #30363d" }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: "7px 12px", color: "#8b949e", textAlign: "left",
                fontWeight: 700, fontSize: 10, letterSpacing: ".05em", whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: "1px solid #21262d", background: ri % 2 === 0 ? "transparent" : "#161b22" }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: "7px 12px",
                  color: ci === 0 ? "#58a6ff" : ci === row.length - 1 && (cell.includes("✅") || cell.includes("⚠️") || cell.includes("🔍")) ? "#e6edf3" : "#e6edf3",
                  fontFamily: ci === 0 ? "monospace" : "inherit",
                  fontSize: 11, lineHeight: 1.5,
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tips({ items }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((tip, i) => (
        <div key={i} style={{
          display: "flex", gap: 10,
          background: "#ffd16610", border: "1px solid #ffd16630",
          borderLeft: "3px solid #ffd166", borderRadius: 7,
          padding: "9px 12px",
        }}>
          <span style={{ color: "#ffd166", fontSize: 13, flexShrink: 0 }}>💡</span>
          <span style={{ color: "#e6edf3", fontSize: 11, lineHeight: 1.6 }}>{tip}</span>
        </div>
      ))}
    </div>
  );
}

function Warnings({ items }) {
  const COLORS = { critical: "#ff4d6d", warning: "#ffd166", info: "#4cc9f0" };
  const ICONS = { critical: "🚨", warning: "⚠️", info: "ℹ️" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => {
        const c = COLORS[item.level] || "#8b949e";
        return (
          <div key={i} style={{
            background: c + "0d", border: `1px solid ${c}33`,
            borderLeft: `3px solid ${c}`, borderRadius: 8, padding: "10px 14px",
          }}>
            <div style={{ color: c, fontWeight: 700, fontSize: 12, marginBottom: 3 }}>
              {ICONS[item.level]} {item.title}
            </div>
            <div style={{ color: "#8b949e", fontSize: 11, lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

function Shortcuts({ items }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((s, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#161b22", border: "1px solid #30363d",
          borderRadius: 7, padding: "7px 11px", minWidth: 180,
        }}>
          <kbd style={{
            background: "#21262d", border: "1px solid #444c56",
            borderRadius: 4, padding: "2px 7px", fontSize: 10,
            fontFamily: "monospace", color: "#4cc9f0", flexShrink: 0,
          }}>{s.key}</kbd>
          <span style={{ color: "#e6edf3", fontSize: 11 }}>{s.desc}</span>
        </div>
      ))}
    </div>
  );
}

function CodeExamples({ items }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((ex, i) => (
        <div key={i} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 9, padding: "12px 14px" }}>
          <div style={{ color: "#8b949e", fontSize: 10, marginBottom: 6 }}>{ex.title}</div>
          <code style={{
            display: "block", background: "#0d1117", border: "1px solid #30363d",
            borderRadius: 6, padding: "8px 12px",
            color: "#06d6a0", fontFamily: "monospace", fontSize: 11, marginBottom: 6,
            wordBreak: "break-all",
          }}>{ex.code}</code>
          <div style={{ color: "#8b949e", fontSize: 11 }}>{ex.desc}</div>
        </div>
      ))}
    </div>
  );
}

function UiMap({ areas }) {
  const POS_STYLE = {
    top:    { background: "#4cc9f033", border: "1px solid #4cc9f066" },
    left:   { background: "#d2a8ff33", border: "1px solid #d2a8ff66" },
    center: { background: "#ffd16633", border: "1px solid #ffd16666" },
    right:  { background: "#06d6a033", border: "1px solid #06d6a066" },
    bottom: { background: "#ffa65733", border: "1px solid #ffa65766" },
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {areas.map((a, i) => (
        <div key={i} style={{
          ...POS_STYLE[a.position],
          borderRadius: 8, padding: "10px 14px",
          display: "flex", gap: 12, alignItems: "center",
        }}>
          <div style={{
            color: a.color, fontWeight: 800, fontSize: 12,
            minWidth: 120, flexShrink: 0,
          }}>{a.name}</div>
          <div style={{ color: "#8b949e", fontSize: 11, lineHeight: 1.5 }}>{a.desc}</div>
        </div>
      ))}
    </div>
  );
}

function Tree({ items }) {
  return (
    <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 8, padding: "12px 16px" }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 8,
          paddingLeft: item.indent * 20, paddingTop: 5, paddingBottom: 5,
          borderBottom: i < items.length - 1 ? "1px solid #21262d" : "none",
        }}>
          <span style={{ fontSize: 14 }}>{item.type === "folder" ? "📁" : "📄"}</span>
          <span style={{
            fontFamily: "monospace", fontSize: 11,
            color: item.type === "folder" ? "#ffd166" : "#58a6ff",
          }}>{item.name}</span>
          <span style={{ color: "#8b949e", fontSize: 11 }}>— {item.desc}</span>
        </div>
      ))}
    </div>
  );
}

function Checklist({ items }) {
  const [checked, setChecked] = useState({});
  const toggle = (i) => setChecked(p => ({ ...p, [i]: !p[i] }));
  const done = Object.values(checked).filter(Boolean).length;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ color: "#8b949e", fontSize: 11 }}>트리아지 체크리스트</span>
        <span style={{ color: done === items.length ? "#06d6a0" : "#ffd166", fontSize: 11, fontWeight: 700 }}>
          {done}/{items.length} 완료
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {items.map((item, i) => (
          <div key={i} onClick={() => toggle(i)} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: checked[i] ? "#06d6a015" : "#161b22",
            border: `1px solid ${checked[i] ? "#06d6a044" : "#21262d"}`,
            borderRadius: 7, padding: "8px 12px", cursor: "pointer",
            transition: "all .15s",
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: 4,
              background: checked[i] ? "#06d6a0" : "transparent",
              border: `2px solid ${checked[i] ? "#06d6a0" : "#444c56"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, fontSize: 10, color: "#000",
            }}>{checked[i] ? "✓" : ""}</div>
            <span style={{
              color: checked[i] ? "#8b949e" : "#e6edf3",
              fontSize: 11, textDecoration: checked[i] ? "line-through" : "none",
            }}>{item.replace("□ ", "")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionRenderer({ section }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        color: "#e6edf3", fontWeight: 700, fontSize: 13,
        marginBottom: 10, paddingBottom: 6,
        borderBottom: "1px solid #21262d",
      }}>{section.title}</div>
      {section.type === "cards"        && <Cards items={section.items} />}
      {section.type === "steps"        && <StepsComponent items={section.items} />}
      {section.type === "table"        && <TableComponent headers={section.headers} rows={section.rows} />}
      {section.type === "tips"         && <Tips items={section.items} />}
      {section.type === "warnings"     && <Warnings items={section.items} />}
      {section.type === "shortcuts"    && <Shortcuts items={section.items} />}
      {section.type === "code_examples"&& <CodeExamples items={section.items} />}
      {section.type === "ui_map"       && <UiMap areas={section.areas} />}
      {section.type === "tree"         && <Tree items={section.items} />}
      {section.type === "checklist"    && <Checklist items={section.items} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════
export default function XWaysGuide() {
  const [selectedPhase, setSelectedPhase] = useState("intro");
  const [selectedLesson, setSelectedLesson] = useState("what");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentPhase = CURRICULUM.find(p => p.id === selectedPhase);
  const currentLesson = currentPhase?.lessons.find(l => l.id === selectedLesson);

  const allLessons = CURRICULUM.flatMap(p => p.lessons.map(l => ({ ...l, phaseId: p.id })));
  const currentIdx = allLessons.findIndex(l => l.id === selectedLesson);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const selectLesson = (phaseId, lessonId) => {
    setSelectedPhase(phaseId);
    setSelectedLesson(lessonId);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#010409",
      fontFamily: "'Segoe UI', 'Noto Sans KR', sans-serif",
      color: "#e6edf3",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        background: "#0d1117",
        borderBottom: "1px solid #21262d",
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 14,
        flexShrink: 0,
      }}>
        <button onClick={() => setSidebarOpen(v => !v)} style={{
          background: "#21262d", border: "none", color: "#8b949e",
          padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 14,
        }}>☰</button>
        <div style={{ fontSize: 20 }}>🔬</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>X-Ways Forensics 완전 학습 가이드</div>
          <div style={{ color: "#8b949e", fontSize: 11 }}>
            {CURRICULUM.length}개 Phase · {CURRICULUM.reduce((a, p) => a + p.lessons.length, 0)}개 레슨 · 침해사고 전문가 커리큘럼
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {CURRICULUM.map(p => (
            <button key={p.id} onClick={() => { setSelectedPhase(p.id); setSelectedLesson(p.lessons[0].id); }}
              style={{
                padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer",
                background: selectedPhase === p.id ? p.phaseColor + "33" : "#161b22",
                color: selectedPhase === p.id ? p.phaseColor : "#8b949e",
                fontSize: 11, fontWeight: 700,
                border: `1px solid ${selectedPhase === p.id ? p.phaseColor + "66" : "#30363d"}`,
                display: "flex", alignItems: "center", gap: 5,
              }}>
              {p.icon} {p.phase}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <div style={{
            width: 240, background: "#0d1117",
            borderRight: "1px solid #21262d",
            overflowY: "auto", flexShrink: 0,
            padding: "12px 8px",
          }}>
            {CURRICULUM.map(phase => (
              <div key={phase.id} style={{ marginBottom: 8 }}>
                <div style={{
                  padding: "6px 10px",
                  color: phase.phaseColor,
                  fontSize: 10, fontWeight: 800,
                  letterSpacing: ".08em",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  {phase.icon} {phase.phase} — {phase.title}
                  <span style={{ color: "#8b949e", marginLeft: "auto", fontSize: 9 }}>{phase.duration}</span>
                </div>
                {phase.lessons.map(lesson => (
                  <button key={lesson.id}
                    onClick={() => selectLesson(phase.id, lesson.id)}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "8px 12px", borderRadius: 7,
                      border: "none", cursor: "pointer",
                      background: selectedLesson === lesson.id ? phase.phaseColor + "22" : "transparent",
                      borderLeft: `3px solid ${selectedLesson === lesson.id ? phase.phaseColor : "transparent"}`,
                      marginBottom: 2, transition: "all .15s",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        color: selectedLesson === lesson.id ? phase.phaseColor : "#e6edf3",
                        fontSize: 12, fontWeight: selectedLesson === lesson.id ? 700 : 400,
                        lineHeight: 1.4,
                      }}>{lesson.title}</div>
                    </div>
                    <span style={{
                      background: lesson.tagColor + "22",
                      color: lesson.tagColor,
                      border: `1px solid ${lesson.tagColor}44`,
                      borderRadius: 4, padding: "1px 6px",
                      fontSize: 9, fontWeight: 700, flexShrink: 0,
                    }}>{lesson.tag}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {currentLesson && (
            <>
              {/* Lesson Header */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{
                    background: currentLesson.tagColor + "22",
                    color: currentLesson.tagColor,
                    border: `1px solid ${currentLesson.tagColor}44`,
                    borderRadius: 6, padding: "3px 10px",
                    fontSize: 11, fontWeight: 800,
                  }}>{currentLesson.tag}</span>
                  <span style={{ color: "#8b949e", fontSize: 11 }}>
                    {currentPhase.phase} · {currentPhase.title}
                  </span>
                </div>
                <h1 style={{
                  fontSize: 22, fontWeight: 800, margin: "0 0 10px",
                  color: "#e6edf3",
                }}>{currentLesson.title}</h1>
                <div style={{
                  background: currentLesson.tagColor + "0d",
                  border: `1px solid ${currentLesson.tagColor}33`,
                  borderLeft: `4px solid ${currentLesson.tagColor}`,
                  borderRadius: 8, padding: "12px 16px",
                  color: "#e6edf3", fontSize: 13, lineHeight: 1.7,
                }}>{currentLesson.content.summary}</div>
              </div>

              {/* Sections */}
              {currentLesson.content.sections.map((section, i) => (
                <SectionRenderer key={i} section={section} />
              ))}

              {/* Navigation */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                marginTop: 32, paddingTop: 20, borderTop: "1px solid #21262d",
              }}>
                {prevLesson ? (
                  <button onClick={() => selectLesson(prevLesson.phaseId, prevLesson.id)} style={{
                    background: "#161b22", border: "1px solid #30363d",
                    borderRadius: 8, padding: "10px 16px", cursor: "pointer",
                    color: "#e6edf3", fontSize: 12, display: "flex", alignItems: "center", gap: 8,
                  }}>
                    ← {prevLesson.title}
                  </button>
                ) : <div />}
                {nextLesson && (
                  <button onClick={() => selectLesson(nextLesson.phaseId, nextLesson.id)} style={{
                    background: "#238636", border: "none",
                    borderRadius: 8, padding: "10px 16px", cursor: "pointer",
                    color: "#fff", fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    다음: {nextLesson.title} →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
