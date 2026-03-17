import { useState } from "react";

// ══════════════════════════════════════════════
// DATA (동일)
// ══════════════════════════════════════════════
const CURRICULUM = [
  {
    id:"intro", phase:"PHASE 1", phaseColor:"#4cc9f0", icon:"🧭",
    title:"X-Ways 기초 이해", subtitle:"도구 철학과 인터페이스", duration:"1~2일",
    lessons:[
      {
        id:"what", title:"X-Ways Forensics란?", tag:"개념", tagColor:"#4cc9f0",
        content:{
          summary:"X-Ways Forensics(XWF)는 독일 X-Ways AG가 개발한 전문 디지털 포렌식 도구. 가볍고 빠르며 법적 증거 능력을 갖춘 분석이 가능합니다.",
          sections:[
            { title:"🔍 왜 X-Ways인가?", type:"cards", items:[
              { label:"초경량 설계", desc:"설치 불필요. USB 하나로 어디서든 실행", icon:"⚡" },
              { label:"법적 무결성", desc:"쓰기 방지·해시 검증으로 증거 훼손 방지", icon:"⚖️" },
              { label:"원시 데이터 접근", desc:"삭제된 파일·숨겨진 영역까지 직접 접근", icon:"🔬" },
              { label:"강력한 검색", desc:"키워드·정규식·바이너리 패턴 동시 검색", icon:"🔎" },
              { label:"자동화 기능", desc:"스크립트로 반복 작업 자동화 가능", icon:"🤖" },
              { label:"업계 표준", desc:"전 세계 수사기관·포렌식 팀 표준 도구", icon:"🌐" },
            ]},
            { title:"📦 제품 라인업", type:"cards", items:[
              { label:"X-Ways Forensics", desc:"풀 포렌식 분석 — 가장 강력, 라이선스 필요", icon:"🥇" },
              { label:"X-Ways Investigator", desc:"분석 전용(쓰기 불가) — 제한된 기능, 저렴", icon:"🔍" },
              { label:"WinHex", desc:"헥스 에디터 기반 — 디스크 편집 가능", icon:"🔡" },
              { label:"X-Ways Security", desc:"데이터 말소·복구 — 보안 업무용", icon:"🛡" },
            ]},
            { title:"💡 핵심 개념", type:"tips", items:[
              "XWF는 케이스를 .xfc 파일 하나로 관리 (별도 DB 없음)",
              "모든 작업은 원본 이미지에 직접 접근 — 원본 절대 수정 불가",
              "라이선스 동글(USB) 없이는 실행 불가 — 분실 주의",
            ]},
          ],
        },
      },
      {
        id:"ui", title:"인터페이스 완전 해부", tag:"UI", tagColor:"#06d6a0",
        content:{
          summary:"XWF는 처음 보면 복잡해 보이지만 구조를 이해하면 논리적으로 설계된 도구입니다.",
          sections:[
            { title:"🖥 메인 화면 구조", type:"ui_map", areas:[
              { name:"메뉴바", position:"top", color:"#4cc9f0", desc:"Case / Evidence / View / Tools / Options — 모든 기능의 시작점" },
              { name:"디렉토리 브라우저", position:"left", color:"#d2a8ff", desc:"파일 트리. 증거 파일의 폴더·파일 계층 탐색" },
              { name:"파일 목록", position:"center", color:"#ffd166", desc:"선택 폴더의 파일 목록. 정렬·필터링·태깅 모두 여기서" },
              { name:"프리뷰 패널", position:"right", color:"#06d6a0", desc:"선택한 파일 미리보기. 텍스트·이미지·헥스 뷰 전환 가능" },
              { name:"상태바", position:"bottom", color:"#ffa657", desc:"작업 진행 상황, 선택된 파일 수, 디스크 용량 등" },
            ]},
            { title:"⌨️ 필수 단축키", type:"shortcuts", items:[
              { key:"F2", desc:"Volume Snapshot 정제 (RVS)" },
              { key:"F6", desc:"파일 열기 / 증거 추가" },
              { key:"Ctrl+F2", desc:"새 케이스 생성" },
              { key:"Ctrl+F3", desc:"케이스 열기" },
              { key:"F9", desc:"디렉토리 브라우저 토글" },
              { key:"Ctrl+F9", desc:"파일 목록 열기" },
              { key:"F10", desc:"프리뷰 패널 토글" },
              { key:"Alt+Enter", desc:"파일 속성/메타데이터 상세 보기" },
              { key:"Ctrl+F", desc:"검색 시작" },
              { key:"Ctrl+A", desc:"전체 파일 선택" },
              { key:"Tab", desc:"프리뷰·파일 목록 간 전환" },
            ]},
          ],
        },
      },
    ],
  },
  {
    id:"case", phase:"PHASE 2", phaseColor:"#ffd166", icon:"📂",
    title:"케이스 생성 & 증거 추가", subtitle:"수사의 시작", duration:"1일",
    lessons:[
      {
        id:"new_case", title:"케이스 생성 & 구성", tag:"실습", tagColor:"#ffd166",
        content:{
          summary:"모든 분석은 케이스(Case)에서 시작합니다. 케이스는 수사 단위로 .xfc 파일 하나로 관리됩니다.",
          sections:[
            { title:"📋 케이스 생성 절차", type:"steps", items:[
              { step:"01", title:"Case → New Case", desc:"메뉴에서 새 케이스 생성 시작. 단축키 Ctrl+F2" },
              { step:"02", title:"케이스 정보 입력", desc:"사건번호, 조사관명, 날짜 입력 — 법적 문서에 반영되므로 정확하게" },
              { step:"03", title:"저장 경로 설정", desc:"케이스 파일(.xfc) 저장 위치 지정. 원본 증거와 다른 드라이브 권장" },
              { step:"04", title:"케이스 설정 구성", desc:"Timezone, 코드페이지, 해시 알고리즘 선택 (MD5+SHA1 권장)" },
              { step:"05", title:"증거 추가", desc:"Evidence → Add Evidence Object로 분석할 이미지·드라이브 추가" },
            ]},
            { title:"⚙️ 꼭 확인할 설정", type:"warnings", items:[
              { level:"critical", title:"타임존 설정 필수", desc:"증거 시스템의 타임존을 반드시 정확히 설정. 잘못 설정 시 타임라인 전체가 틀어짐" },
              { level:"critical", title:"코드페이지 확인", desc:"한국 시스템 → CP949 또는 EUC-KR. 잘못 설정 시 파일명이 깨짐" },
              { level:"warning", title:"해시 알고리즘", desc:"MD5+SHA-1 또는 SHA-256 조합 권장" },
              { level:"info", title:"케이스 로그 자동 기록", desc:"모든 작업이 자동 로그에 기록됨. 경로·시간 변경 금지" },
            ]},
          ],
        },
      },
      {
        id:"evidence", title:"증거 이미지 추가 & 종류", tag:"실습", tagColor:"#ffd166",
        content:{
          summary:"XWF는 다양한 형식의 증거를 지원합니다. 증거 추가 시 쓰기 방지 여부가 가장 중요합니다.",
          sections:[
            { title:"💾 지원하는 증거 형식", type:"cards", items:[
              { label:"Raw 이미지", desc:".dd .img .raw .bin — 비트 단위 복사본. 가장 일반적", icon:"💿" },
              { label:"E01 (EnCase)", desc:".e01 .ex01 — 압축·해시 내장", icon:"📦" },
              { label:"VMDK/VHD", desc:".vmdk .vhd .vhdx — 가상머신 디스크", icon:"🖥" },
              { label:"물리 드라이브", desc:"\\\\.\\PhysicalDrive0 — 실물 디스크 직접 연결", icon:"💾" },
              { label:"메모리 덤프", desc:".mem .dmp — RAM 덤프 분석", icon:"🧠" },
              { label:"AFF", desc:".aff — Advanced Forensics Format", icon:"📄" },
            ]},
            { title:"🧩 Volume Snapshot 이해", type:"tips", items:[
              "증거 추가 시 XWF가 자동으로 Volume Snapshot 생성 — 파일 시스템 전체 인덱싱",
              "Refine Volume Snapshot(F2)으로 삭제 파일 복구·해시 계산·메타데이터 추출",
              "VS는 원본 수정 없음 — 분석 결과를 케이스 파일에만 저장",
            ]},
          ],
        },
      },
    ],
  },
  {
    id:"analysis", phase:"PHASE 3", phaseColor:"#ff4d6d", icon:"🔬",
    title:"핵심 분석 기능", subtitle:"실제 수사에서 쓰는 기능들", duration:"3~5일",
    lessons:[
      {
        id:"rvs", title:"Volume Snapshot 정제 (핵심!)", tag:"핵심", tagColor:"#ff4d6d",
        content:{
          summary:"RVS는 XWF에서 가장 중요한 기능. 증거 추가 후 반드시 실행해야 삭제 파일 복구·해시 계산·메타데이터 추출이 됩니다.",
          sections:[
            { title:"🚀 RVS 실행 방법", type:"steps", items:[
              { step:"01", title:"F2 키 또는 메뉴", desc:"Specialist → Refine Volume Snapshot. 증거 선택 후 실행" },
              { step:"02", title:"분석 옵션 선택", desc:"체크박스로 수행할 작업 선택. 처음에는 권장 옵션 사용" },
              { step:"03", title:"처리 실행", desc:"OK 클릭 후 자동 처리. 디스크 크기에 따라 수십 분~수 시간 소요" },
              { step:"04", title:"결과 확인", desc:"완료 후 삭제된 파일·카빙된 파일이 목록에 추가됨" },
            ]},
            { title:"✅ 주요 RVS 옵션", type:"warnings", items:[
              { level:"critical", title:"Recover deleted files", desc:"삭제된 파일 복구 및 표시 — 항상 체크" },
              { level:"critical", title:"Identify file types", desc:"확장자 위조 탐지 (내부 시그니처 검증) — 항상 체크" },
              { level:"critical", title:"Compute hash values", desc:"모든 파일 MD5/SHA-1 해시 계산 — 항상 체크" },
              { level:"warning", title:"Extract metadata", desc:"EXIF, Office 메타데이터 추출 — 권장" },
              { level:"info", title:"Carve from unallocated", desc:"미할당 영역 파일 카빙 — 시간 오래 걸림" },
            ]},
          ],
        },
      },
      {
        id:"search", title:"검색 기능 완전 정복", tag:"핵심", tagColor:"#ff4d6d",
        content:{
          summary:"XWF 검색은 정규식·바이너리 패턴·동시 다중 검색까지 지원합니다.",
          sections:[
            { title:"🔎 검색 종류", type:"cards", items:[
              { label:"Simultaneous Search", desc:"Ctrl+F → 수백 개 키워드 동시 검색. 가장 자주 사용", icon:"🔍" },
              { label:"정규식 검색", desc:"RegEx로 이메일·IP·전화번호 패턴 매칭", icon:"🎯" },
              { label:"16진수 검색", desc:"바이너리 패턴 직접 검색. 악성코드 시그니처 탐지", icon:"🔡" },
              { label:"해시 검색", desc:"알려진 악성 파일 해시로 즉시 식별", icon:"🔐" },
            ]},
            { title:"💻 실전 정규식 예시", type:"code_examples", items:[
              { title:"이메일 주소 검색", code:"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", desc:"모든 이메일 패턴 탐지" },
              { title:"IPv4 주소 검색", code:"\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", desc:"IP 주소 전체 탐지" },
              { title:"한국 전화번호", code:"01[016789]-?[0-9]{3,4}-?[0-9]{4}", desc:"휴대폰 번호 패턴" },
              { title:"C2 IP 직접 참조 URL", code:"https?://[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}", desc:"IP 직접 참조 = C2 의심" },
            ]},
            { title:"💡 검색 팁", type:"tips", items:[
              "키워드 목록을 파일로 로드 가능 — 수백 개를 한 번에",
              "미할당 영역(Unallocated)까지 포함 검색 옵션 반드시 체크",
              "한국어 포함 시 CP949/UTF-8 등 다중 인코딩 동시 검색 설정",
              "Index 생성 후 검색하면 훨씬 빠름 — RVS에서 인덱싱 미리 실행",
            ]},
          ],
        },
      },
      {
        id:"artifacts", title:"Windows 아티팩트 분석", tag:"핵심", tagColor:"#ff4d6d",
        content:{
          summary:"XWF에서 각 Windows 아티팩트에 접근하는 방법과 분석 포인트를 정리했습니다.",
          sections:[
            { title:"📋 아티팩트별 XWF 접근 경로", type:"cards", items:[
              { label:"이벤트 로그", desc:"winevt\\Logs → *.evtx 더블클릭 → Event ID 필터링", icon:"📋" },
              { label:"레지스트리", desc:"System32\\config → SYSTEM/SAM 선택 → 내장 뷰어", icon:"🗝" },
              { label:"프리패치", desc:"Windows\\Prefetch → *.pf → 실행 시간·횟수 자동 파싱", icon:"⚡" },
              { label:"MFT", desc:"Specialist → File System Data Structure → $MFT 파싱", icon:"📁" },
              { label:"LNK 파일", desc:"파일 목록 → .lnk 필터 → 원본 경로·MAC 자동 추출", icon:"🔗" },
              { label:"브라우저", desc:"AppData → Chrome\\Default\\History → SQLite 뷰어", icon:"🌐" },
              { label:"SRUM", desc:"System32\\sru\\SRUDB.dat → ESE DB 파서", icon:"📊" },
              { label:"타임라인", desc:"View → Timeline → 모든 아티팩트 통합", icon:"📈" },
            ]},
            { title:"🔑 Magic Bytes 주요 시그니처", type:"cards", items:[
              { label:"EXE / DLL", desc:"4D 5A → MZ", icon:"⚙️" },
              { label:"PDF", desc:"25 50 44 46 → %PDF", icon:"📄" },
              { label:"ZIP / DOCX", desc:"50 4B 03 04 → PK..", icon:"📦" },
              { label:"JPEG", desc:"FF D8 FF", icon:"🖼" },
              { label:"PNG", desc:"89 50 4E 47 → .PNG", icon:"🖼" },
              { label:"RAR", desc:"52 61 72 21 → Rar!", icon:"📦" },
            ]},
          ],
        },
      },
      {
        id:"timeline", title:"타임라인 분석", tag:"핵심", tagColor:"#ff4d6d",
        content:{
          summary:"XWF 타임라인은 여러 아티팩트의 시간 정보를 하나의 뷰로 통합합니다. 공격 흐름 재구성의 핵심.",
          sections:[
            { title:"🕐 타임라인 생성 방법", type:"steps", items:[
              { step:"01", title:"View → Timeline 열기", desc:"상단 메뉴 View → Timeline 또는 Ctrl+T" },
              { step:"02", title:"시간 범위 설정", desc:"침해 의심 시간 전후 넉넉하게 설정" },
              { step:"03", title:"포함할 소스 선택", desc:"FS 타임스탬프·레지스트리·이벤트 로그 등 체크" },
              { step:"04", title:"타임라인 생성", desc:"Generate 클릭 → 통합 타임라인 자동 생성" },
              { step:"05", title:"이상 구간 식별", desc:"이벤트 밀집 구간·시간 역전 현상 탐지" },
            ]},
            { title:"⚠️ 타임라인 분석 주의사항", type:"warnings", items:[
              { level:"critical", title:"타임존 재확인", desc:"생성 전 증거 시스템 타임존 100% 확인. 1시간 차이로 전혀 다른 결론 나올 수 있음" },
              { level:"critical", title:"Timestomping 의심", desc:"MACE 4개 시간 중 이상한 것 발견 시 시간 조작 가능성 검토" },
              { level:"info", title:"$SI vs $FN 비교", desc:"MFT에는 두 개의 타임스탬프 세트 존재. 위조는 $SI만 변경하는 경우가 많음" },
            ]},
          ],
        },
      },
      {
        id:"carving", title:"파일 카빙 & 삭제 파일 복구", tag:"심화", tagColor:"#a29bfe",
        content:{
          summary:"삭제된 파일 복구와 파일 카빙은 침해사고에서 결정적 증거를 찾는 핵심 기법입니다.",
          sections:[
            { title:"⛏️ 카빙 실행 방법", type:"steps", items:[
              { step:"01", title:"RVS → Carving 옵션 체크", desc:"'Carve files from unallocated space' 체크" },
              { step:"02", title:"대상 파일 유형 선택", desc:"JPG, PDF, ZIP, EXE 등 찾을 파일 유형 선택" },
              { step:"03", title:"결과 확인", desc:"완료 후 [Carved] 태그와 함께 복구된 파일 표시" },
              { step:"04", title:"무결성 확인", desc:"카빙된 파일이 정상인지 미리보기로 확인" },
            ]},
            { title:"💡 카빙 팁", type:"tips", items:[
              "카빙은 시간이 매우 오래 걸림 → 야간·주말에 실행 권장",
              "SSD는 TRIM으로 삭제 즉시 소거 → 카빙 성공률 낮음",
              "HDD는 덮어쓰기 전까지 복구 가능성 높음",
              "카빙 결과물은 파일명 없이 저장됨 (파일 시스템 구조 없음)",
            ]},
          ],
        },
      },
    ],
  },
  {
    id:"reporting", phase:"PHASE 4", phaseColor:"#06d6a0", icon:"📄",
    title:"북마크 & 보고서 작성", subtitle:"증거 정리와 보고", duration:"1~2일",
    lessons:[
      {
        id:"bookmarks", title:"북마크 & 태깅", tag:"실습", tagColor:"#06d6a0",
        content:{
          summary:"증거 파일을 발견할 때마다 북마크로 표시해두는 습관이 중요합니다. 보고서 자동 생성에 직결됩니다.",
          sections:[
            { title:"🔖 북마크 시스템", type:"cards", items:[
              { label:"북마크 추가", desc:"파일 우클릭 → Add to Bookmarks 또는 Ctrl+B. 설명 메모 필수", icon:"🔖" },
              { label:"카테고리 분류", desc:"북마크를 폴더별로 분류. 악성파일·통신기록·삭제흔적 등", icon:"📁" },
              { label:"색상 태그", desc:"빨강=중요 증거, 노랑=검토 필요 등 팀 약속으로 통일", icon:"🎨" },
              { label:"주석 추가", desc:"각 북마크에 수사 내용·결론 메모. 보고서에 자동 포함", icon:"📝" },
            ]},
          ],
        },
      },
      {
        id:"report", title:"보고서 생성", tag:"실습", tagColor:"#06d6a0",
        content:{
          summary:"XWF는 북마크된 증거들을 바탕으로 HTML·RTF 보고서를 자동 생성합니다.",
          sections:[
            { title:"📄 보고서 생성 절차", type:"steps", items:[
              { step:"01", title:"Case → Report", desc:"상단 Case → Report 또는 F12" },
              { step:"02", title:"보고서 형식 선택", desc:"HTML (웹 브라우저) 또는 RTF (Word 호환) 선택" },
              { step:"03", title:"포함 내용 선택", desc:"북마크·검색 결과·해시 목록·케이스 로그 등 체크" },
              { step:"04", title:"로고·헤더 설정", desc:"기관 로고·수사관 서명 정보 삽입 가능" },
              { step:"05", title:"생성 및 검토", desc:"Generate 클릭 → 내용 검토 후 제출" },
            ]},
            { title:"💡 보고서 작성 팁", type:"tips", items:[
              "생성 전 모든 북마크에 설명 메모가 있는지 확인",
              "해시 값 목록 반드시 포함 — 증거 무결성 증명",
              "케이스 로그를 첨부하면 수사 과정 투명성 확보",
              "최종 보고서는 반드시 수사팀장 검토 후 제출",
            ]},
          ],
        },
      },
    ],
  },
  {
    id:"advanced", phase:"PHASE 5", phaseColor:"#d2a8ff", icon:"🚀",
    title:"심화 & 실전 워크플로우", subtitle:"침해사고 대응 실전", duration:"지속 학습",
    lessons:[
      {
        id:"workflow", title:"침해사고 대응 표준 워크플로우", tag:"실전", tagColor:"#d2a8ff",
        content:{
          summary:"실제 침해사고 현장에서 XWF로 분석하는 표준 절차입니다. 이 순서를 몸에 익히는 것이 목표.",
          sections:[
            { title:"🚨 침해사고 분석 표준 절차", type:"steps", items:[
              { step:"01", title:"현장 보존 & 이미징", desc:"원본 쓰기 방지 후 이미지 생성. 해시 기록" },
              { step:"02", title:"XWF 케이스 생성", desc:"사건번호·타임존·해시 알고리즘 설정 후 이미지 추가·검증" },
              { step:"03", title:"RVS 실행", desc:"F2 → 삭제 파일 복구·파일 유형 식별·해시 계산·메타데이터 추출" },
              { step:"04", title:"악성 파일 탐지", desc:"확장자 위조 필터 → 비정상 경로 실행 파일 → NSRL 해시로 정상 파일 제외" },
              { step:"05", title:"아티팩트 분석", desc:"이벤트 로그 → 레지스트리 Run키 → 프리패치 → MFT 순으로 분석" },
              { step:"06", title:"키워드 검색", desc:"C2 서버 IP, 악성코드명, 공격자 계정 등 알려진 IOC로 전체 검색" },
              { step:"07", title:"타임라인 재구성", desc:"View → Timeline으로 공격 시작~종료 타임라인 생성" },
              { step:"08", title:"증거 북마크 & 문서화", desc:"핵심 증거 북마크+메모. 색상 태그로 분류" },
              { step:"09", title:"보고서 생성", desc:"Case → Report. 해시 목록·케이스 로그 포함" },
            ]},
            { title:"⚡ 빠른 트리아지 체크리스트", type:"checklist", items:[
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
            ]},
          ],
        },
      },
      {
        id:"tips", title:"고수들의 실전 팁", tag:"실전", tagColor:"#d2a8ff",
        content:{
          summary:"X-Ways를 오래 사용한 포렌식 전문가들이 공유하는 실전 팁 모음입니다.",
          sections:[
            { title:"💎 성능 최적화 팁", type:"tips", items:[
              "케이스 파일과 증거 이미지는 반드시 다른 드라이브에 저장 — I/O 병목 방지",
              "RAM 많이 쓰는 작업(카빙·인덱싱) 시 다른 프로그램 모두 종료",
              "SSD에 케이스 파일 저장 시 처리 속도 2~3배 향상",
            ]},
            { title:"🎯 분석 정확도 향상 팁", type:"tips", items:[
              "NSRL 해시 DB 로드 → 알려진 정상 OS 파일 자동 제외 → 분석 대상 대폭 감소",
              "Column Filter로 특정 크기·날짜·경로 파일만 표시 → 집중 분석",
              "의심 파일은 즉시 VirusTotal에 해시로 조회 (XWF에서 우클릭 가능)",
            ]},
            { title:"⚖️ 법적 증거 능력 유지 팁", type:"warnings", items:[
              { level:"critical", title:"원본 절대 수정 금지", desc:"물리 장치 직접 연결 시 하드웨어 쓰기 방지 장치 필수" },
              { level:"critical", title:"모든 작업 로그 보존", desc:"케이스 로그(.xfc.txt)를 보고서에 첨부하여 분석 과정 투명성 증명" },
              { level:"warning", title:"해시 값 정기 검증", desc:"분석 중간중간 이미지 해시 재검증으로 무결성 확인" },
            ]},
          ],
        },
      },
    ],
  },
];

// ══════════════════════════════════════════════
// 서브 컴포넌트
// ══════════════════════════════════════════════
function Cards({ items }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {items.map((item,i) => (
        <div key={i} style={{
          background:"#161b22", border:"1px solid #21262d",
          borderRadius:10, padding:"12px 14px",
          display:"flex", gap:12, alignItems:"flex-start",
        }}>
          <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
          <div>
            <div style={{ color:"#e6edf3", fontWeight:700, fontSize:13, marginBottom:3 }}>{item.label}</div>
            <div style={{ color:"#8b949e", fontSize:12, lineHeight:1.6 }}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StepsComp({ items }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {items.map((item,i) => (
        <div key={i} style={{
          background:"#161b22", border:"1px solid #21262d",
          borderRadius:10, padding:"12px 14px",
          display:"flex", gap:12, alignItems:"flex-start",
        }}>
          <div style={{
            background:"#238636", color:"#fff", borderRadius:6,
            padding:"3px 8px", fontSize:11, fontWeight:800,
            fontFamily:"monospace", flexShrink:0, marginTop:1,
          }}>{item.step}</div>
          <div>
            <div style={{ color:"#e6edf3", fontWeight:700, fontSize:13, marginBottom:3 }}>{item.title}</div>
            <div style={{ color:"#8b949e", fontSize:12, lineHeight:1.6 }}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Tips({ items }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
      {items.map((tip,i) => (
        <div key={i} style={{
          display:"flex", gap:10,
          background:"#ffd16610", border:"1px solid #ffd16630",
          borderLeft:"3px solid #ffd166", borderRadius:8, padding:"10px 12px",
        }}>
          <span style={{ color:"#ffd166", flexShrink:0 }}>💡</span>
          <span style={{ color:"#e6edf3", fontSize:12, lineHeight:1.6 }}>{tip}</span>
        </div>
      ))}
    </div>
  );
}

function Warnings({ items }) {
  const C = { critical:"#ff4d6d", warning:"#ffd166", info:"#4cc9f0" };
  const IC = { critical:"🚨", warning:"⚠️", info:"ℹ️" };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {items.map((item,i) => {
        const c = C[item.level]||"#8b949e";
        return (
          <div key={i} style={{
            background:c+"0d", border:`1px solid ${c}33`,
            borderLeft:`3px solid ${c}`, borderRadius:8, padding:"10px 14px",
          }}>
            <div style={{ color:c, fontWeight:700, fontSize:12, marginBottom:4 }}>{IC[item.level]} {item.title}</div>
            <div style={{ color:"#8b949e", fontSize:12, lineHeight:1.5 }}>{item.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

function Shortcuts({ items }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {items.map((s,i) => (
        <div key={i} style={{
          display:"flex", alignItems:"center", gap:10,
          background:"#161b22", border:"1px solid #30363d",
          borderRadius:7, padding:"9px 12px",
        }}>
          <kbd style={{
            background:"#21262d", border:"1px solid #444c56",
            borderRadius:4, padding:"3px 8px", fontSize:11,
            fontFamily:"monospace", color:"#4cc9f0", flexShrink:0, minWidth:70, textAlign:"center",
          }}>{s.key}</kbd>
          <span style={{ color:"#e6edf3", fontSize:12 }}>{s.desc}</span>
        </div>
      ))}
    </div>
  );
}

function CodeExamples({ items }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {items.map((ex,i) => (
        <div key={i} style={{ background:"#161b22", border:"1px solid #21262d", borderRadius:9, padding:"12px 14px" }}>
          <div style={{ color:"#8b949e", fontSize:11, marginBottom:6 }}>{ex.title}</div>
          <code style={{
            display:"block", background:"#0d1117", border:"1px solid #30363d",
            borderRadius:6, padding:"8px 10px",
            color:"#06d6a0", fontFamily:"monospace", fontSize:11, marginBottom:6,
            wordBreak:"break-all", lineHeight:1.5,
          }}>{ex.code}</code>
          <div style={{ color:"#8b949e", fontSize:11 }}>{ex.desc}</div>
        </div>
      ))}
    </div>
  );
}

function UiMap({ areas }) {
  const PS = {
    top:    { background:"#4cc9f022", border:"1px solid #4cc9f044" },
    left:   { background:"#d2a8ff22", border:"1px solid #d2a8ff44" },
    center: { background:"#ffd16622", border:"1px solid #ffd16644" },
    right:  { background:"#06d6a022", border:"1px solid #06d6a044" },
    bottom: { background:"#ffa65722", border:"1px solid #ffa65744" },
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
      {areas.map((a,i) => (
        <div key={i} style={{ ...PS[a.position], borderRadius:8, padding:"10px 14px" }}>
          <div style={{ color:a.color, fontWeight:700, fontSize:12, marginBottom:3 }}>{a.name}</div>
          <div style={{ color:"#8b949e", fontSize:12, lineHeight:1.5 }}>{a.desc}</div>
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
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
        <span style={{ color:"#8b949e", fontSize:12 }}>트리아지 체크리스트</span>
        <span style={{ color:done===items.length?"#06d6a0":"#ffd166", fontSize:12, fontWeight:700 }}>{done}/{items.length} 완료</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {items.map((item,i) => (
          <div key={i} onClick={() => toggle(i)} style={{
            display:"flex", alignItems:"center", gap:10,
            background:checked[i]?"#06d6a015":"#161b22",
            border:`1px solid ${checked[i]?"#06d6a044":"#21262d"}`,
            borderRadius:8, padding:"11px 12px", cursor:"pointer",
          }}>
            <div style={{
              width:18, height:18, borderRadius:4, flexShrink:0,
              background:checked[i]?"#06d6a0":"transparent",
              border:`2px solid ${checked[i]?"#06d6a0":"#444c56"}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, color:"#000",
            }}>{checked[i]?"✓":""}</div>
            <span style={{ color:checked[i]?"#8b949e":"#e6edf3", fontSize:13, textDecoration:checked[i]?"line-through":"none" }}>
              {item.replace("□ ","")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionRenderer({ section }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ color:"#e6edf3", fontWeight:700, fontSize:13, marginBottom:10, paddingBottom:6, borderBottom:"1px solid #21262d" }}>
        {section.title}
      </div>
      {section.type==="cards"         && <Cards items={section.items}/>}
      {section.type==="steps"         && <StepsComp items={section.items}/>}
      {section.type==="tips"          && <Tips items={section.items}/>}
      {section.type==="warnings"      && <Warnings items={section.items}/>}
      {section.type==="shortcuts"     && <Shortcuts items={section.items}/>}
      {section.type==="code_examples" && <CodeExamples items={section.items}/>}
      {section.type==="ui_map"        && <UiMap areas={section.areas}/>}
      {section.type==="checklist"     && <Checklist items={section.items}/>}
    </div>
  );
}

// ══════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════
export default function XWaysGuide() {
  const allLessons = CURRICULUM.flatMap(p => p.lessons.map(l => ({ ...l, phaseId:p.id, phaseColor:p.phaseColor, phaseTitle:p.title })));
  const [lessonId, setLessonId] = useState(allLessons[0].id);
  const [showMenu, setShowMenu] = useState(false);

  const idx = allLessons.findIndex(l => l.id === lessonId);
  const lesson = allLessons[idx];
  const phase = CURRICULUM.find(p => p.id === lesson.phaseId);
  const prev = allLessons[idx-1];
  const next = allLessons[idx+1];

  const go = (id) => { setLessonId(id); setShowMenu(false); window.scrollTo(0,0); };

  return (
    <div style={{ minHeight:"100vh", maxWidth:480, margin:"0 auto", background:"#010409", fontFamily:"'Noto Sans KR','Segoe UI',sans-serif", color:"#e6edf3", display:"flex", flexDirection:"column" }}>

      {/* 헤더 */}
      <div style={{ background:"#0d1117", borderBottom:"1px solid #21262d", padding:"12px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0, zIndex:50 }}>
        <button onClick={() => setShowMenu(v=>!v)} style={{
          background:showMenu?lesson.phaseColor+"33":"#21262d",
          border:`1px solid ${showMenu?lesson.phaseColor+"55":"#30363d"}`,
          borderRadius:8, padding:"7px 11px", color:showMenu?lesson.phaseColor:"#8b949e",
          cursor:"pointer", fontSize:16, flexShrink:0,
        }}>☰</button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:lesson.phaseColor, fontSize:10, fontWeight:800, marginBottom:2 }}>{phase.phase} · {phase.title}</div>
          <div style={{ fontWeight:700, fontSize:14, color:"#e6edf3", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{lesson.title}</div>
        </div>
        <span style={{
          background:lesson.tagColor+"22", color:lesson.tagColor,
          border:`1px solid ${lesson.tagColor}44`,
          borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:800, flexShrink:0,
        }}>{lesson.tag}</span>
      </div>

      {/* Phase 빠른 이동 바 */}
      <div style={{ background:"#0d1117", borderBottom:"1px solid #21262d", display:"flex", overflowX:"auto", padding:"8px 12px", gap:6 }}>
        {CURRICULUM.map(p => (
          <button key={p.id} onClick={() => go(p.lessons[0].id)} style={{
            padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer", flexShrink:0,
            background:lesson.phaseId===p.id?p.phaseColor+"33":"#161b22",
            color:lesson.phaseId===p.id?p.phaseColor:"#8b949e",
            border:`1px solid ${lesson.phaseId===p.id?p.phaseColor+"55":"#30363d"}`,
            fontSize:11, fontWeight:700,
          }}>{p.icon} {p.phase}</button>
        ))}
      </div>

      {/* 드로어 메뉴 */}
      {showMenu && (
        <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex" }}>
          <div onClick={() => setShowMenu(false)} style={{ position:"absolute", inset:0, background:"#00000088" }}/>
          <div style={{ position:"relative", width:"82%", maxWidth:320, background:"#0d1117", height:"100%", overflowY:"auto", padding:"16px 12px", borderRight:"1px solid #21262d" }}>
            <div style={{ fontWeight:700, fontSize:14, padding:"4px 8px 12px", borderBottom:"1px solid #21262d", marginBottom:8 }}>🔬 학습 목차</div>
            {CURRICULUM.map(p => (
              <div key={p.id} style={{ marginBottom:12 }}>
                <div style={{ color:p.phaseColor, fontSize:10, fontWeight:800, padding:"4px 8px", letterSpacing:".06em" }}>{p.icon} {p.phase} — {p.title}</div>
                {p.lessons.map(l => (
                  <button key={l.id} onClick={() => go(l.id)} style={{
                    width:"100%", textAlign:"left", padding:"10px 12px", borderRadius:8,
                    border:"none", cursor:"pointer", marginBottom:3,
                    background:lessonId===l.id?p.phaseColor+"22":"transparent",
                    borderLeft:`3px solid ${lessonId===l.id?p.phaseColor:"transparent"}`,
                    display:"flex", alignItems:"center", gap:10,
                  }}>
                    <div style={{ flex:1 }}>
                      <div style={{ color:lessonId===l.id?p.phaseColor:"#e6edf3", fontSize:12, fontWeight:lessonId===l.id?700:400 }}>{l.title}</div>
                    </div>
                    <span style={{ background:l.tagColor+"22", color:l.tagColor, border:`1px solid ${l.tagColor}44`, borderRadius:4, padding:"1px 6px", fontSize:9, fontWeight:700 }}>{l.tag}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 콘텐츠 */}
      <div style={{ flex:1, padding:16, paddingBottom:90 }}>
        {/* 요약 */}
        <div style={{
          background:lesson.tagColor+"0d", border:`1px solid ${lesson.tagColor}33`,
          borderLeft:`4px solid ${lesson.tagColor}`,
          borderRadius:10, padding:"14px 16px", marginBottom:20,
          color:"#e6edf3", fontSize:13, lineHeight:1.7,
        }}>{lesson.content.summary}</div>

        {lesson.content.sections.map((s,i) => <SectionRenderer key={i} section={s}/>)}
      </div>

      {/* 하단 이전/다음 */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#0d1117", borderTop:"1px solid #21262d", padding:"10px 16px", display:"flex", gap:10 }}>
        <button onClick={() => prev && go(prev.id)} style={{
          flex:1, padding:"11px 8px", borderRadius:10, border:"none",
          background:prev?"#161b22":"transparent",
          border:`1px solid ${prev?"#30363d":"#21262d"}`,
          color:prev?"#e6edf3":"#30363d",
          cursor:prev?"pointer":"default",
          display:"flex", alignItems:"center", justifyContent:"center", gap:5, fontSize:12,
        }}>
          {prev?<>‹ <span style={{fontSize:11}}>{prev.title.length>10?prev.title.slice(0,10)+"…":prev.title}</span></>:<span>처음</span>}
        </button>
        <button onClick={() => next && go(next.id)} style={{
          flex:1, padding:"11px 8px", borderRadius:10, border:"none",
          background:next?lesson.phaseColor+"22":"transparent",
          border:`1px solid ${next?lesson.phaseColor+"55":"#21262d"}`,
          color:next?lesson.phaseColor:"#30363d",
          cursor:next?"pointer":"default",
          display:"flex", alignItems:"center", justifyContent:"center", gap:5, fontSize:12,
        }}>
          {next?<><span style={{fontSize:11}}>{next.title.length>10?next.title.slice(0,10)+"…":next.title}</span> ›</>:<span>마지막</span>}
        </button>
      </div>
    </div>
  );
}
