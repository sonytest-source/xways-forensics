import { useState, useMemo } from "react";

// ══════════════════════════════════════════════════════
// 이벤트 로그 전체 데이터베이스
// ══════════════════════════════════════════════════════
const EVENT_CATEGORIES = [
  {
    id: "logon", label: "🔐 로그온/로그오프", color: "#4cc9f0",
    events: [
      { id: "4624", name: "로그온 성공", source: "Security", threat: false,
        desc: "계정이 성공적으로 로그온함. Logon Type 값으로 로그온 방식 파악 가능.",
        detail: "LogonType: 2=콘솔, 3=네트워크, 4=배치, 5=서비스, 7=잠금해제, 8=네트워크평문, 9=새자격증명, 10=원격대화형(RDP), 11=캐시대화형",
        forensic: "Type 10(RDP) 또는 Type 3(네트워크)이면 원격 접속. SubjectLogonId로 세션 추적 가능.",
        ioc: false },
      { id: "4625", name: "로그온 실패", source: "Security", threat: true,
        desc: "계정 로그온 실패. 짧은 시간 내 반복 시 브루트포스 공격.",
        detail: "FailureReason: %%2313=잘못된 비밀번호, %%2304=계정 없음. SubStatus로 실패 원인 세분화.",
        forensic: "동일 소스 IP에서 5분 내 10회 이상 발생 시 브루트포스 의심. 관리자 계정 대상 집중 확인.",
        ioc: true },
      { id: "4634", name: "로그오프", source: "Security", threat: false,
        desc: "계정이 로그오프됨. 세션 종료 시간 파악에 활용.",
        detail: "LogonId로 4624와 매핑하면 세션 체류 시간 계산 가능.",
        forensic: "로그온(4624) ↔ 로그오프(4634) 쌍으로 묶어 체류 시간 분석. 공격자 행위 시간대 특정.",
        ioc: false },
      { id: "4647", name: "사용자 주도 로그오프", source: "Security", threat: false,
        desc: "사용자가 직접 로그오프함.",
        detail: "4634와 유사하나 사용자가 직접 로그오프한 경우.",
        forensic: "야간 또는 비업무 시간대 로그오프 이벤트는 공격자 세션 종료 징후일 수 있음.",
        ioc: false },
      { id: "4648", name: "명시적 자격증명 로그온", source: "Security", threat: true,
        desc: "다른 자격증명을 명시적으로 사용하여 로그온 시도. Pass-the-Hash, Runas 등.",
        detail: "이미 로그온된 세션에서 다른 계정 자격증명을 명시적으로 사용한 경우.",
        forensic: "공격자가 탈취한 자격증명으로 측면 이동 시 자주 발생. LogonGuid로 원본 세션 추적.",
        ioc: true },
      { id: "4672", name: "특수 권한 할당", source: "Security", threat: true,
        desc: "로그온 시 관리자급 특수 권한(SeDebugPrivilege 등)이 할당됨.",
        detail: "SeDebugPrivilege: 프로세스 메모리 접근 가능 → 자격증명 덤프에 사용.",
        forensic: "공격자가 관리자 권한 계정으로 로그온했음을 의미. 4624와 함께 분석.",
        ioc: true },
      { id: "4778", name: "세션 재연결 (RDP)", source: "Security", threat: false,
        desc: "끊겼던 원격 세션이 재연결됨.",
        detail: "ClientName·ClientAddress로 접속 출처 확인 가능.",
        forensic: "비정상적인 시간대 RDP 재연결 → 공격자 세션 재개 의심.",
        ioc: false },
      { id: "4779", name: "세션 연결 해제 (RDP)", source: "Security", threat: false,
        desc: "원격 세션이 연결 해제됨 (로그오프 아님).",
        detail: "4778/4779 쌍으로 RDP 접속 패턴 분석.",
        forensic: "연결 해제 후 재연결 반복 패턴은 공격자가 세션을 유지하는 방식일 수 있음.",
        ioc: false },
    ],
  },
  {
    id: "account", label: "👤 계정 관리", color: "#ff4d6d",
    events: [
      { id: "4720", name: "사용자 계정 생성", source: "Security", threat: true,
        desc: "새 로컬 사용자 계정이 생성됨. 백도어 계정 생성에 사용.",
        detail: "SubjectUserName: 생성한 계정. TargetUserName: 생성된 계정.",
        forensic: "업무 시간 외 계정 생성, 또는 이미 존재하는 계정과 유사한 이름(admin_bak 등) → 즉시 의심.",
        ioc: true },
      { id: "4722", name: "사용자 계정 활성화", source: "Security", threat: true,
        desc: "비활성화된 계정이 활성화됨.",
        detail: "비활성화된 기본 계정(Guest, Administrator)을 활성화하는 공격에 사용.",
        forensic: "Guest 또는 기본 Administrator 계정 활성화는 즉시 조사 필요.",
        ioc: true },
      { id: "4723", name: "비밀번호 변경 시도", source: "Security", threat: false,
        desc: "사용자가 자신의 비밀번호 변경 시도.",
        detail: "자기 비밀번호 변경. 실패 시 정책 불만족 가능.",
        forensic: "공격자가 탈취한 계정의 비밀번호를 변경하여 원래 소유자 접근 차단.",
        ioc: false },
      { id: "4724", name: "비밀번호 재설정", source: "Security", threat: true,
        desc: "관리자가 다른 계정의 비밀번호를 재설정함.",
        detail: "SubjectUserName: 변경한 계정. TargetUserName: 변경된 계정.",
        forensic: "공격자가 다른 계정의 패스워드를 재설정하여 탈취하는 행위.",
        ioc: true },
      { id: "4725", name: "사용자 계정 비활성화", source: "Security", threat: true,
        desc: "사용자 계정이 비활성화됨.",
        detail: "정상 계정을 비활성화하여 피해자의 시스템 접근을 차단하는 공격에 사용.",
        forensic: "관리자 계정 비활성화는 공격자가 잠금 행위를 수행한 것일 수 있음.",
        ioc: true },
      { id: "4726", name: "사용자 계정 삭제", source: "Security", threat: true,
        desc: "사용자 계정이 삭제됨.",
        detail: "TargetUserName: 삭제된 계정. 공격자가 생성했던 백도어 계정 삭제 시 발생.",
        forensic: "침해 종료 시 공격자가 백도어 계정 삭제로 흔적 제거. 4720 생성 이벤트와 대조.",
        ioc: true },
      { id: "4738", name: "사용자 계정 속성 변경", source: "Security", threat: true,
        desc: "사용자 계정의 속성(이름·설명·플래그 등)이 변경됨.",
        detail: "UserAccountControl 값 변경으로 계정 유형·권한·만료일 등 수정.",
        forensic: "공격자가 계정 만료일 제거하거나 패스워드 변경 불필요 플래그 설정.",
        ioc: true },
      { id: "4740", name: "계정 잠금", source: "Security", threat: true,
        desc: "계정이 여러 번 로그인 실패로 잠금됨.",
        detail: "TargetUserName: 잠긴 계정. SubjectUserName: 잠금을 유발한 컴퓨터.",
        forensic: "짧은 시간 내 다수 계정 잠금 → 자동화된 브루트포스 공격. 소스 컴퓨터 추적 필수.",
        ioc: true },
      { id: "4767", name: "계정 잠금 해제", source: "Security", threat: false,
        desc: "잠긴 계정이 관리자에 의해 잠금 해제됨.",
        detail: "4740과 쌍으로 분석.",
        forensic: "잠금 해제 후 즉시 재잠금 반복 → 지속적인 브루트포스 공격 진행 중.",
        ioc: false },
    ],
  },
  {
    id: "group", label: "👥 그룹 관리", color: "#d2a8ff",
    events: [
      { id: "4728", name: "보안 그룹에 멤버 추가 (글로벌)", source: "Security", threat: true,
        desc: "글로벌 보안 그룹(Domain Admins 등)에 멤버가 추가됨.",
        detail: "MemberName: 추가된 계정. GroupName: 대상 그룹.",
        forensic: "Domain Admins에 비정상 계정 추가 → 도메인 전체 권한 탈취 시도.",
        ioc: true },
      { id: "4732", name: "로컬 보안 그룹에 멤버 추가", source: "Security", threat: true,
        desc: "로컬 보안 그룹(Administrators 등)에 멤버가 추가됨.",
        detail: "GroupName: Administrators에 추가되면 로컬 관리자 권한 획득.",
        forensic: "공격자가 새로 생성한 계정을 Administrators 그룹에 추가하는 패턴이 흔함.",
        ioc: true },
      { id: "4733", name: "로컬 보안 그룹에서 멤버 제거", source: "Security", threat: false,
        desc: "로컬 보안 그룹에서 멤버가 제거됨.",
        detail: "공격자가 자신의 흔적(추가했던 계정)을 제거하는 데 사용.",
        forensic: "4732 추가 후 일정 시간 뒤 4733 제거 → 백도어 접근 후 흔적 제거 패턴.",
        ioc: false },
      { id: "4756", name: "유니버설 보안 그룹에 멤버 추가", source: "Security", threat: true,
        desc: "유니버설 보안 그룹에 멤버가 추가됨. Enterprise Admins 등.",
        detail: "포레스트 전체에 영향을 미치는 그룹 권한 변경.",
        forensic: "Enterprise Admins·Schema Admins 그룹 변경은 포레스트 전체 위협.",
        ioc: true },
      { id: "4764", name: "그룹 유형 변경", source: "Security", threat: true,
        desc: "보안 그룹의 유형이 변경됨.",
        detail: "배포 그룹을 보안 그룹으로 변환하여 권한을 부여하는 공격에 사용.",
        forensic: "비활성 배포 그룹을 보안 그룹으로 변환 → 기존 멤버에게 의도치 않은 권한 부여.",
        ioc: true },
    ],
  },
  {
    id: "process", label: "⚙️ 프로세스 & 실행", color: "#ffd166",
    events: [
      { id: "4688", name: "프로세스 생성", source: "Security", threat: false,
        desc: "새 프로세스가 생성됨. 명령 실행 추적의 핵심 이벤트.",
        detail: "NewProcessName: 실행된 프로세스. ParentProcessName: 부모 프로세스. ProcessCommandLine: 실행 명령어 (감사 정책 활성화 시).",
        forensic: "WINWORD.EXE→cmd.exe: 매크로 실행. explorer.exe→powershell.exe -enc: 인코딩 명령. svchost.exe→cmd.exe: 서비스 악용.",
        ioc: false },
      { id: "4689", name: "프로세스 종료", source: "Security", threat: false,
        desc: "프로세스가 종료됨.",
        detail: "4688과 쌍으로 분석하면 프로세스 실행 시간 계산 가능.",
        forensic: "악성 프로세스가 짧은 시간(수 초) 내 종료되면 자기 삭제 또는 임시 실행 의심.",
        ioc: false },
      { id: "4103", name: "PowerShell 파이프라인 실행", source: "PowerShell", threat: true,
        desc: "PowerShell 파이프라인 명령이 실행됨.",
        detail: "Module Logging 활성화 시 기록. 실행된 PowerShell 명령 내용 포함.",
        forensic: "Invoke-Expression, DownloadString, Encoded Command 등 공격 명령어 직접 확인 가능.",
        ioc: true },
      { id: "4104", name: "PowerShell 스크립트 블록 로깅", source: "PowerShell", threat: true,
        desc: "PowerShell 스크립트 블록 전체 내용이 기록됨.",
        detail: "Script Block Logging 활성화 시 기록. 난독화 해제 후 실제 실행 코드 기록.",
        forensic: "공격자가 Base64로 난독화해도 실제 실행 시 복원된 코드가 기록됨. 가장 강력한 PS 증거.",
        ioc: true },
      { id: "4105", name: "PowerShell 스크립트 시작", source: "PowerShell", threat: true,
        desc: "PowerShell 스크립트 실행이 시작됨.",
        detail: "스크립트 파일 경로 기록.",
        forensic: "비정상 경로(Temp, AppData)의 .ps1 스크립트 실행 탐지.",
        ioc: true },
      { id: "4106", name: "PowerShell 스크립트 완료", source: "PowerShell", threat: false,
        desc: "PowerShell 스크립트 실행이 완료됨.",
        detail: "4105와 쌍으로 실행 시간 계산.",
        forensic: "4105 시작 → 4106 완료 간격으로 악성 스크립트 실행 시간 파악.",
        ioc: false },
    ],
  },
  {
    id: "privilege", label: "🔺 권한 & 접근", color: "#ff9f43",
    events: [
      { id: "4673", name: "특수 권한 서비스 호출", source: "Security", threat: true,
        desc: "특수 권한이 필요한 서비스가 호출됨.",
        detail: "SeDebugPrivilege 사용 시 기록 → LSASS 접근 등 자격증명 탈취 시도.",
        forensic: "SeDebugPrivilege 권한으로 lsass.exe 접근 → Mimikatz 등 자격증명 탈취 도구 사용 의심.",
        ioc: true },
      { id: "4674", name: "특수 권한 객체 접근 시도", source: "Security", threat: true,
        desc: "특수 권한이 필요한 객체에 접근 시도.",
        detail: "ObjectServer·ObjectType·ObjectName으로 접근 대상 특정.",
        forensic: "SAM 데이터베이스나 LSASS 메모리 접근 시도 탐지.",
        ioc: true },
      { id: "4697", name: "시스템에 서비스 설치", source: "Security", threat: true,
        desc: "새 서비스가 설치됨.",
        detail: "ServiceName·ServiceFileName·ServiceType 기록.",
        forensic: "비정상 경로(Temp, AppData) 서비스 파일, 알 수 없는 서비스명 → 악성 서비스 설치.",
        ioc: true },
      { id: "4698", name: "예약 작업 생성", source: "Security", threat: true,
        desc: "새 예약 작업(Scheduled Task)이 생성됨.",
        detail: "TaskName·TaskContent 기록. 지속성 확보에 가장 많이 사용.",
        forensic: "비정상 시간(새벽·주말)이나 비정상 실행 파일 경로의 예약 작업 → 지속성 확보.",
        ioc: true },
      { id: "4699", name: "예약 작업 삭제", source: "Security", threat: true,
        desc: "예약 작업이 삭제됨.",
        detail: "공격자가 사용 후 예약 작업을 삭제하여 흔적 제거.",
        forensic: "4698 생성 → 일정 시간 후 4699 삭제 패턴 → 임시 지속성 사용 후 제거.",
        ioc: true },
      { id: "4700", name: "예약 작업 활성화", source: "Security", threat: true,
        desc: "비활성화된 예약 작업이 활성화됨.",
        detail: "기존 시스템 예약 작업을 악성 목적으로 활용.",
        forensic: "정상 작업으로 위장한 예약 작업을 활성화하여 탐지 우회.",
        ioc: true },
      { id: "4702", name: "예약 작업 수정", source: "Security", threat: true,
        desc: "기존 예약 작업의 내용이 수정됨.",
        detail: "정상 예약 작업의 실행 파일 경로를 악성으로 변경.",
        forensic: "기존 정상 예약 작업 내용 변조 → 탐지 우회 목적.",
        ioc: true },
      { id: "4656", name: "객체 핸들 요청", source: "Security", threat: true,
        desc: "객체(파일·레지스트리·프로세스 등)에 대한 핸들이 요청됨.",
        detail: "ObjectName: 접근 대상. AccessMask: 요청한 권한 (0x1FFFFF=전체 접근).",
        forensic: "lsass.exe에 대한 0x1FFFFF(PROCESS_ALL_ACCESS) 핸들 요청 → 자격증명 덤프 시도.",
        ioc: true },
      { id: "4663", name: "객체 접근 시도", source: "Security", threat: false,
        desc: "감사가 설정된 객체에 접근이 시도됨.",
        detail: "4656 이후 실제 접근 시도. AccesMask로 읽기/쓰기 구분.",
        forensic: "SAM 파일 직접 읽기 시도, 민감한 디렉토리 열람 등 탐지.",
        ioc: false },
    ],
  },
  {
    id: "network", label: "🌐 네트워크 & 원격", color: "#4ecdc4",
    events: [
      { id: "4768", name: "Kerberos TGT 요청", source: "Security", threat: false,
        desc: "Kerberos 인증 티켓(TGT)이 요청됨.",
        detail: "TargetUserName·IpAddress 기록. 실패 시 Result Code 확인.",
        forensic: "존재하지 않는 계정 TGT 요청 (Result 0x6) → 계정 열거 공격.",
        ioc: false },
      { id: "4769", name: "Kerberos 서비스 티켓 요청", source: "Security", threat: true,
        desc: "Kerberos 서비스 티켓(TGS)이 요청됨.",
        detail: "EncryptionType: 0x17 (RC4) = 구식 암호화, Kerberoasting 의심.",
        forensic: "RC4 암호화(0x17) 서비스 티켓 대량 요청 → Kerberoasting 공격(서비스 계정 패스워드 크래킹).",
        ioc: true },
      { id: "4771", name: "Kerberos 사전 인증 실패", source: "Security", threat: true,
        desc: "Kerberos 사전 인증이 실패함.",
        detail: "FailureCode: 0x18=잘못된 패스워드. 반복 시 브루트포스.",
        forensic: "AS-REP Roasting 공격 시 사전 인증 비활성 계정 대상으로 발생.",
        ioc: true },
      { id: "4776", name: "NTLM 인증 시도", source: "Security", threat: true,
        desc: "도메인 컨트롤러에서 NTLM 자격증명 검증 시도.",
        detail: "Workstation·LogonAccount 기록.",
        forensic: "Pass-the-Hash 공격 시 대량의 NTLM 인증 시도 발생. NTLM 사용 자체를 최소화하는 것이 권장.",
        ioc: true },
      { id: "5140", name: "네트워크 공유 접근", source: "Security", threat: true,
        desc: "네트워크 공유 자원(파일 공유)에 접근됨.",
        detail: "ShareName·ObjectType·SubjectUserName 기록.",
        forensic: "ADMIN$·C$ 관리 공유 접근 → 원격 관리 또는 측면 이동. IPC$ 접근 → 원격 서비스 실행 준비.",
        ioc: true },
      { id: "5145", name: "네트워크 공유 파일 접근 확인", source: "Security", threat: false,
        desc: "공유 파일 또는 폴더에 대한 접근 권한 확인.",
        detail: "RelativeTargetName: 접근한 파일 경로.",
        forensic: "내부 민감 파일에 대한 네트워크 접근 흔적 추적.",
        ioc: false },
      { id: "5156", name: "방화벽 연결 허용", source: "Security", threat: false,
        desc: "Windows 방화벽이 네트워크 연결을 허용함.",
        detail: "DestAddress·DestPort·Application 기록.",
        forensic: "악성 프로세스의 C2 연결, 비정상 포트 통신 탐지.",
        ioc: false },
      { id: "5158", name: "방화벽 포트 바인드 허용", source: "Security", threat: true,
        desc: "애플리케이션이 포트에 바인드하도록 허용됨.",
        detail: "악성코드가 리버스 셸이나 백도어 포트 오픈 시 기록.",
        forensic: "비정상 포트(4444, 1337 등) 바인드 → 백도어 또는 리버스 셸 오픈.",
        ioc: true },
    ],
  },
  {
    id: "service", label: "🔧 서비스 & 시스템", color: "#06d6a0",
    events: [
      { id: "7045", name: "새 서비스 설치", source: "System", threat: true,
        desc: "새로운 서비스가 시스템에 설치됨.",
        detail: "ServiceName·ServiceFileName·ServiceType·StartType 기록.",
        forensic: "비정상 경로(Temp, AppData) 서비스 바이너리, 무작위 서비스명 → 악성 서비스 설치.",
        ioc: true },
      { id: "7036", name: "서비스 상태 변경", source: "System", threat: false,
        desc: "서비스가 실행되거나 중지됨.",
        detail: "ServiceName·State(running/stopped) 기록.",
        forensic: "보안 서비스(Windows Defender, Firewall) 중지 이벤트 → 공격자의 방어 비활성화.",
        ioc: false },
      { id: "7040", name: "서비스 시작 유형 변경", source: "System", threat: true,
        desc: "서비스의 시작 유형이 변경됨.",
        detail: "StartType: Disabled→Automatic으로 변경하여 지속성 확보.",
        forensic: "비활성화된 보안 서비스를 다시 활성화하거나, 악성 서비스를 자동 시작으로 변경.",
        ioc: true },
      { id: "1102", name: "보안 감사 로그 삭제", source: "Security", threat: true,
        desc: "보안 이벤트 로그 전체가 삭제됨.",
        detail: "SubjectUserName: 삭제한 계정.",
        forensic: "공격자가 침해 증거 삭제 목적으로 실행. 이 이벤트 이전 로그만 분석 가능.",
        ioc: true },
      { id: "104", name: "이벤트 로그 삭제", source: "System", threat: true,
        desc: "이벤트 로그(System 등)가 삭제됨.",
        detail: "1102는 Security 로그, 104는 다른 로그(System, Application 등) 삭제.",
        forensic: "1102와 함께 발생 시 공격자가 모든 로그 삭제 시도. 시스템 로그 삭제로 서비스 설치 흔적 제거.",
        ioc: true },
    ],
  },
  {
    id: "object", label: "📁 파일 & 레지스트리", color: "#a29bfe",
    events: [
      { id: "4657", name: "레지스트리 값 수정", source: "Security", threat: true,
        desc: "레지스트리 값이 생성되거나 수정됨.",
        detail: "ObjectName: 수정된 키 경로. OldValue/NewValue 기록.",
        forensic: "Run·RunOnce 키 수정, Defender 설정 변조, Winlogon 변조 등 지속성/방어 우회 탐지.",
        ioc: true },
      { id: "4660", name: "객체 삭제", source: "Security", threat: false,
        desc: "감사가 설정된 객체(파일·레지스트리 키 등)가 삭제됨.",
        detail: "4656(핸들 요청)과 연계 분석.",
        forensic: "악성코드 자기 삭제, 증거 인멸 파일 삭제 등 탐지.",
        ioc: false },
      { id: "4670", name: "객체 권한 변경", source: "Security", threat: true,
        desc: "객체(파일·레지스트리)의 권한(ACL)이 변경됨.",
        detail: "OldSd/NewSd로 변경 전후 권한 비교.",
        forensic: "민감한 파일이나 레지스트리 키의 권한을 Everyone 쓰기 허용으로 변경 → 악용 준비.",
        ioc: true },
    ],
  },
  {
    id: "audit", label: "🔍 감사 정책", color: "#8b949e",
    events: [
      { id: "4719", name: "시스템 감사 정책 변경", source: "Security", threat: true,
        desc: "시스템 수준 감사 정책이 변경됨.",
        detail: "AuditPolicyChanges: 활성화/비활성화된 감사 항목.",
        forensic: "공격자가 자신의 행위가 기록되지 않도록 감사 정책을 비활성화.",
        ioc: true },
      { id: "4907", name: "객체 감사 설정 변경", source: "Security", threat: true,
        desc: "객체의 감사 설정이 변경됨.",
        detail: "특정 파일·레지스트리 키의 감사를 비활성화하여 접근 로그 차단.",
        forensic: "자신이 접근할 파일의 감사를 끄는 공격자 행위.",
        ioc: true },
      { id: "4946", name: "방화벽 규칙 추가", source: "Security", threat: true,
        desc: "Windows 방화벽에 새 규칙이 추가됨.",
        detail: "RuleName·Direction·Protocol·LocalPort·RemoteAddress 기록.",
        forensic: "C2 통신 허용 방화벽 규칙, 백도어 포트 오픈 규칙 추가.",
        ioc: true },
      { id: "4947", name: "방화벽 규칙 수정", source: "Security", threat: true,
        desc: "기존 방화벽 규칙이 수정됨.",
        detail: "기존 정상 규칙을 수정하여 악성 통신 허용.",
        forensic: "보안 제품 차단 규칙 수정으로 탐지 우회.",
        ioc: true },
      { id: "4950", name: "방화벽 설정 변경", source: "Security", threat: true,
        desc: "Windows 방화벽 전체 설정이 변경됨.",
        detail: "Profile(Domain/Private/Public) 별 방화벽 비활성화.",
        forensic: "방화벽 전체 비활성화 → 외부 통신 완전 개방.",
        ioc: true },
    ],
  },
  {
    id: "lateral", label: "↔️ 측면 이동", color: "#f77f00",
    events: [
      { id: "4674_wmi", name: "WMI 원격 실행", source: "Security", threat: true,
        desc: "WMI를 통한 원격 명령 실행. 측면 이동에 자주 사용.",
        detail: "프로세스 4688에서 WmiPrvSE.exe가 부모 프로세스인 경우.",
        forensic: "WmiPrvSE.exe → cmd.exe 또는 powershell.exe 생성 → WMI를 통한 원격 코드 실행.",
        ioc: true },
      { id: "4648_psexec", name: "PsExec 원격 실행", source: "Security", threat: true,
        desc: "PsExec 또는 유사 도구를 통한 원격 실행.",
        detail: "5140(ADMIN$ 공유 접근) + 7045(PSEXESVC 서비스 설치) + 4624(Type 3 로그온) 조합.",
        forensic: "PSEXESVC 서비스 생성(7045) + ADMIN$ 접근(5140) + Type 3 로그온(4624) = PsExec 패턴.",
        ioc: true },
      { id: "4624_rdp", name: "RDP 원격 로그온", source: "Security", threat: true,
        desc: "원격 데스크톱을 통한 로그온. Logon Type 10.",
        detail: "LogonType=10. TargetUserName·IpAddress·WorkstationName 기록.",
        forensic: "외부 IP 또는 비업무 시간대 RDP 로그온, 알 수 없는 사용자 계정 RDP → 침해 의심.",
        ioc: true },
      { id: "4624_pass", name: "Pass-the-Hash 로그온", source: "Security", threat: true,
        desc: "NTLM 해시를 직접 사용한 인증 (Pass-the-Hash).",
        detail: "LogonType=3, AuthPackage=NTLM, LogonProcessName=NtLmSsp. 실제 패스워드 없이 해시만으로 인증.",
        forensic: "NTLM 인증(4776) + Type 3 로그온(4624) + 소스 IP가 내부 워크스테이션 → PtH 공격 의심.",
        ioc: true },
    ],
  },
];

// 전체 이벤트 평탄화
const ALL_EVENTS = EVENT_CATEGORIES.flatMap(cat =>
  cat.events.map(ev => ({ ...ev, catId: cat.id, catLabel: cat.label, catColor: cat.color }))
);

// ══════════════════════════════════════════════════════
// 기타 아티팩트 데이터
// ══════════════════════════════════════════════════════
const OTHER_ARTIFACTS = [
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
    summary: "C2 통신·악성 파일 다운로드 경로 추적의 핵심.",
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

const TABS_OTHER = [
  { id: "overview", label: "개요",    icon: "📌" },
  { id: "events",   label: "핵심항목", icon: "🔑" },
  { id: "tips",     label: "조사팁",  icon: "💡" },
  { id: "tools",    label: "도구",    icon: "🛠" },
];

// ══════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════
export default function ArtifactGuide() {
  // 메인 화면 모드: "eventlog" | "artifact"
  const [mode, setMode]           = useState("eventlog");

  // 이벤트 로그 관련
  const [searchQ, setSearchQ]     = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterThreat, setFilterThreat] = useState(false);
  const [selectedEv, setSelectedEv] = useState(null);

  // 기타 아티팩트 관련
  const [selectedArt, setSelectedArt] = useState(OTHER_ARTIFACTS[0]);
  const [artTab, setArtTab]       = useState("overview");
  const [showArtList, setShowArtList] = useState(false);

  // 이벤트 로그 필터링
  const filtered = useMemo(() => {
    let list = ALL_EVENTS;
    if (filterCat !== "all") list = list.filter(e => e.catId === filterCat);
    if (filterThreat) list = list.filter(e => e.threat);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(e =>
        e.id.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.desc.toLowerCase().includes(q) ||
        e.forensic.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQ, filterCat, filterThreat]);

  const totalEvents = ALL_EVENTS.length;
  const threatEvents = ALL_EVENTS.filter(e => e.threat).length;

  return (
    <div style={{ minHeight:"100vh", maxWidth:480, margin:"0 auto", background:"#010409", fontFamily:"'Noto Sans KR','Segoe UI',sans-serif", color:"#e6edf3", display:"flex", flexDirection:"column" }}>

      {/* ── 최상단 모드 탭 ── */}
      <div style={{ background:"#0d1117", borderBottom:"1px solid #21262d", padding:"10px 14px", display:"flex", gap:8, position:"sticky", top:0, zIndex:60 }}>
        <button onClick={() => setMode("eventlog")} style={{
          flex:1, padding:"9px 8px", borderRadius:9, border:"none", cursor:"pointer",
          background:mode==="eventlog"?"#4cc9f033":"#161b22",
          color:mode==="eventlog"?"#4cc9f0":"#8b949e",
          border:`1px solid ${mode==="eventlog"?"#4cc9f055":"#30363d"}`,
          fontSize:12, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:5,
        }}>📋 이벤트 로그 DB</button>
        <button onClick={() => setMode("artifact")} style={{
          flex:1, padding:"9px 8px", borderRadius:9, border:"none", cursor:"pointer",
          background:mode==="artifact"?"#06d6a033":"#161b22",
          color:mode==="artifact"?"#06d6a0":"#8b949e",
          border:`1px solid ${mode==="artifact"?"#06d6a055":"#30363d"}`,
          fontSize:12, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:5,
        }}>🗂 아티팩트 가이드</button>
      </div>

      {/* ══════════════ 이벤트 로그 DB 모드 ══════════════ */}
      {mode === "eventlog" && (
        <>
          {/* 검색 & 필터 헤더 */}
          <div style={{ background:"#0d1117", borderBottom:"1px solid #21262d", padding:"12px 14px", position:"sticky", top:49, zIndex:50 }}>
            {/* 통계 */}
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              <div style={{ flex:1, background:"#161b22", border:"1px solid #21262d", borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                <div style={{ color:"#4cc9f0", fontSize:18, fontWeight:800 }}>{totalEvents}</div>
                <div style={{ color:"#8b949e", fontSize:9 }}>전체 이벤트</div>
              </div>
              <div style={{ flex:1, background:"#ff4d6d10", border:"1px solid #ff4d6d33", borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                <div style={{ color:"#ff4d6d", fontSize:18, fontWeight:800 }}>{threatEvents}</div>
                <div style={{ color:"#8b949e", fontSize:9 }}>위협 지표</div>
              </div>
              <div style={{ flex:1, background:"#06d6a010", border:"1px solid #06d6a033", borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                <div style={{ color:"#06d6a0", fontSize:18, fontWeight:800 }}>{filtered.length}</div>
                <div style={{ color:"#8b949e", fontSize:9 }}>검색 결과</div>
              </div>
            </div>

            {/* 검색 입력 */}
            <div style={{ position:"relative", marginBottom:8 }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:14 }}>🔍</span>
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Event ID, 이름, 설명 검색... (예: 4624, 로그온, Kerberos)"
                style={{
                  width:"100%", padding:"9px 10px 9px 32px",
                  background:"#161b22", border:"1px solid #30363d",
                  borderRadius:9, color:"#e6edf3", fontSize:12,
                  outline:"none", boxSizing:"border-box",
                }}
              />
              {searchQ && (
                <button onClick={() => setSearchQ("")} style={{
                  position:"absolute", right:8, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", color:"#8b949e", cursor:"pointer", fontSize:14,
                }}>✕</button>
              )}
            </div>

            {/* 카테고리 필터 */}
            <div style={{ display:"flex", overflowX:"auto", gap:5, paddingBottom:2 }}>
              <button onClick={() => setFilterCat("all")} style={{
                padding:"4px 10px", borderRadius:20, border:"none", cursor:"pointer", flexShrink:0,
                background:filterCat==="all"?"#4cc9f033":"#21262d",
                color:filterCat==="all"?"#4cc9f0":"#8b949e",
                border:`1px solid ${filterCat==="all"?"#4cc9f055":"#30363d"}`,
                fontSize:10, fontWeight:700,
              }}>전체 ({totalEvents})</button>
              {EVENT_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setFilterCat(cat.id)} style={{
                  padding:"4px 10px", borderRadius:20, border:"none", cursor:"pointer", flexShrink:0,
                  background:filterCat===cat.id?cat.color+"33":"#21262d",
                  color:filterCat===cat.id?cat.color:"#8b949e",
                  border:`1px solid ${filterCat===cat.id?cat.color+"55":"#30363d"}`,
                  fontSize:10, fontWeight:700,
                }}>{cat.label.split(" ")[0]} ({cat.events.length})</button>
              ))}
            </div>

            {/* 위협 필터 */}
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:6 }}>
              <button onClick={() => setFilterThreat(v => !v)} style={{
                padding:"4px 12px", borderRadius:20, border:"none", cursor:"pointer",
                background:filterThreat?"#ff4d6d33":"#21262d",
                color:filterThreat?"#ff4d6d":"#8b949e",
                border:`1px solid ${filterThreat?"#ff4d6d55":"#30363d"}`,
                fontSize:10, fontWeight:700,
              }}>⚠ 위협 지표만 보기</button>
            </div>
          </div>

          {/* 이벤트 목록 */}
          <div style={{ flex:1, padding:"10px 14px", paddingBottom:20 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:"#8b949e" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
                <div style={{ fontSize:14 }}>검색 결과가 없습니다</div>
                <div style={{ fontSize:12, marginTop:4 }}>다른 키워드로 검색해보세요</div>
              </div>
            ) : (
              <>
                {/* 카테고리별 그룹 or 검색 결과 평탄화 */}
                {searchQ.trim() || filterThreat ? (
                  // 검색/위협 필터 시: 평탄화 목록
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {filtered.map(ev => (
                      <EventCard key={ev.id+ev.catId} ev={ev} onSelect={setSelectedEv} />
                    ))}
                  </div>
                ) : (
                  // 기본: 카테고리별 그룹
                  EVENT_CATEGORIES.filter(cat => filterCat==="all" || cat.id===filterCat).map(cat => {
                    const catEvents = filtered.filter(e => e.catId === cat.id);
                    if (catEvents.length === 0) return null;
                    return (
                      <div key={cat.id} style={{ marginBottom:16 }}>
                        <div style={{
                          color:cat.color, fontWeight:800, fontSize:12,
                          padding:"6px 2px", marginBottom:7,
                          borderBottom:`1px solid ${cat.color}33`,
                          display:"flex", alignItems:"center", gap:6,
                        }}>
                          {cat.label}
                          <span style={{ background:cat.color+"22", borderRadius:10, padding:"1px 7px", fontSize:10 }}>{catEvents.length}</span>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          {catEvents.map(ev => (
                            <EventCard key={ev.id+ev.catId} ev={ev} onSelect={setSelectedEv} />
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ══════════════ 아티팩트 가이드 모드 ══════════════ */}
      {mode === "artifact" && (
        <>
          {/* 아티팩트 헤더 */}
          <div style={{ background:"#0d1117", borderBottom:"1px solid #21262d", padding:"10px 14px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:49, zIndex:50 }}>
            <button onClick={() => setShowArtList(v=>!v)} style={{
              background:showArtList?selectedArt.color+"33":"#21262d",
              border:`1px solid ${showArtList?selectedArt.color+"55":"#30363d"}`,
              borderRadius:8, padding:"7px 11px", color:showArtList?selectedArt.color:"#8b949e",
              cursor:"pointer", fontSize:16, flexShrink:0,
            }}>☰</button>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                <span style={{ fontSize:18 }}>{selectedArt.icon}</span>
                <span style={{ fontWeight:700, fontSize:14 }}>{selectedArt.name}</span>
                <span style={{ background:CAT_COLOR[selectedArt.category]+"22", color:CAT_COLOR[selectedArt.category], border:`1px solid ${CAT_COLOR[selectedArt.category]}44`, borderRadius:10, padding:"1px 7px", fontSize:10, fontWeight:700 }}>{selectedArt.category}</span>
              </div>
              <div style={{ color:"#8b949e", fontSize:11, marginTop:1 }}>{selectedArt.subtitle}</div>
            </div>
            {/* 이전/다음 */}
            {(() => {
              const idx = OTHER_ARTIFACTS.findIndex(a => a.id === selectedArt.id);
              const prev = OTHER_ARTIFACTS[idx-1];
              const next = OTHER_ARTIFACTS[idx+1];
              return (
                <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                  <button onClick={() => prev && (setSelectedArt(prev), setArtTab("overview"))} style={{ background:prev?"#21262d":"transparent", border:`1px solid ${prev?"#30363d":"#21262d"}`, borderRadius:6, padding:"6px 10px", color:prev?"#e6edf3":"#30363d", cursor:prev?"pointer":"default", fontSize:14 }}>‹</button>
                  <button onClick={() => next && (setSelectedArt(next), setArtTab("overview"))} style={{ background:next?"#21262d":"transparent", border:`1px solid ${next?"#30363d":"#21262d"}`, borderRadius:6, padding:"6px 10px", color:next?"#e6edf3":"#30363d", cursor:next?"pointer":"default", fontSize:14 }}>›</button>
                </div>
              );
            })()}
          </div>

          {/* 드로어 */}
          {showArtList && (
            <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex" }}>
              <div onClick={() => setShowArtList(false)} style={{ position:"absolute", inset:0, background:"#00000088" }}/>
              <div style={{ position:"relative", width:"80%", maxWidth:300, background:"#0d1117", height:"100%", overflowY:"auto", padding:"16px 12px", borderRight:"1px solid #21262d" }}>
                <div style={{ fontWeight:700, fontSize:14, padding:"4px 8px 12px", borderBottom:"1px solid #21262d", marginBottom:10 }}>🗂 아티팩트 선택</div>
                {OTHER_ARTIFACTS.map(a => (
                  <button key={a.id} onClick={() => { setSelectedArt(a); setArtTab("overview"); setShowArtList(false); }} style={{ width:"100%", textAlign:"left", padding:"11px 12px", borderRadius:9, border:"none", cursor:"pointer", background:selectedArt.id===a.id?a.color+"22":"transparent", borderLeft:`3px solid ${selectedArt.id===a.id?a.color:"transparent"}`, marginBottom:3, display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:20 }}>{a.icon}</span>
                    <div>
                      <div style={{ color:selectedArt.id===a.id?a.color:"#e6edf3", fontSize:13, fontWeight:selectedArt.id===a.id?700:400 }}>{a.name}</div>
                      <div style={{ color:"#8b949e", fontSize:10 }}>{a.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 탭 바 */}
          <div style={{ display:"flex", background:"#0d1117", borderBottom:"1px solid #21262d", position:"sticky", top:97, zIndex:40 }}>
            {TABS_OTHER.map(t => (
              <button key={t.id} onClick={() => setArtTab(t.id)} style={{ flex:1, padding:"10px 4px", border:"none", cursor:"pointer", background:"none", display:"flex", flexDirection:"column", alignItems:"center", gap:2, color:artTab===t.id?selectedArt.color:"#8b949e", borderBottom:`2px solid ${artTab===t.id?selectedArt.color:"transparent"}`, fontSize:10, fontWeight:artTab===t.id?700:400 }}>
                <span style={{ fontSize:16 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* 아티팩트 콘텐츠 */}
          <div style={{ flex:1, padding:16, paddingBottom:80 }}>
            {artTab==="overview" && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ background:selectedArt.color+"12", border:`1px solid ${selectedArt.color}33`, borderLeft:`4px solid ${selectedArt.color}`, borderRadius:10, padding:"14px 16px", display:"flex", gap:10 }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>⭐</span>
                  <div style={{ color:"#e6edf3", fontSize:13, lineHeight:1.7 }}>{selectedArt.summary}</div>
                </div>
                <div style={{ background:"#161b22", border:"1px solid #21262d", borderRadius:10, padding:"14px 16px" }}>
                  <div style={{ color:"#8b949e", fontSize:11, marginBottom:8 }}>📍 파일 위치</div>
                  <div style={{ color:selectedArt.color, fontFamily:"monospace", fontSize:12, wordBreak:"break-all", whiteSpace:"pre-line", lineHeight:1.7 }}>{selectedArt.location}</div>
                </div>
                <div style={{ background:"#161b22", border:"1px solid #21262d", borderRadius:10, padding:"14px 16px" }}>
                  <div style={{ color:"#8b949e", fontSize:11, marginBottom:10 }}>📄 주요 파일</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {selectedArt.files.map((f,i) => (
                      <span key={i} style={{ background:"#21262d", border:"1px solid #30363d", borderRadius:6, padding:"5px 10px", fontFamily:"monospace", color:"#e6edf3", fontSize:11 }}>{f}</span>
                    ))}
                  </div>
                </div>
                <div style={{ background:selectedArt.color+"0d", border:`1px solid ${selectedArt.color}33`, borderRadius:10, padding:"14px 16px" }}>
                  <div style={{ color:selectedArt.color, fontSize:11, fontWeight:700, marginBottom:8 }}>🔎 알 수 있는 것</div>
                  <div style={{ color:"#e6edf3", fontSize:13, lineHeight:1.8 }}>{selectedArt.whatYouCanFind}</div>
                </div>
                <div style={{ display:"flex", justifyContent:"center", gap:5, paddingTop:4 }}>
                  {OTHER_ARTIFACTS.map(a => (
                    <div key={a.id} onClick={() => { setSelectedArt(a); setArtTab("overview"); }} style={{ width:selectedArt.id===a.id?22:6, height:6, borderRadius:3, background:selectedArt.id===a.id?selectedArt.color:"#30363d", cursor:"pointer", transition:"all .2s" }}/>
                  ))}
                </div>
              </div>
            )}
            {artTab==="events" && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ background:"#ff4d6d10", border:"1px solid #ff4d6d30", borderRadius:8, padding:"10px 12px", marginBottom:4, color:"#ff7b7b", fontSize:12 }}>⚠ 빨간 항목은 침해사고 시 특히 주목할 지표입니다.</div>
                {selectedArt.keyEvents.map((e,i) => (
                  <div key={i} style={{ background:e.threat?"#ff4d6d0d":"#161b22", border:`1px solid ${e.threat?"#ff4d6d33":"#21262d"}`, borderLeft:`4px solid ${e.threat?"#ff4d6d":selectedArt.color}`, borderRadius:8, padding:"12px 14px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, marginBottom:5 }}>
                      <span style={{ background:e.threat?"#ff4d6d22":selectedArt.color+"22", color:e.threat?"#ff4d6d":selectedArt.color, borderRadius:5, padding:"2px 8px", fontFamily:"monospace", fontSize:11, fontWeight:700 }}>{e.id}</span>
                      {e.threat && <span style={{ background:"#ff4d6d22", color:"#ff4d6d", border:"1px solid #ff4d6d44", borderRadius:4, padding:"2px 6px", fontSize:10, fontWeight:700 }}>⚠ 위협</span>}
                    </div>
                    <div style={{ color:e.threat?"#ffaaaa":"#e6edf3", fontSize:13, lineHeight:1.6 }}>{e.desc}</div>
                  </div>
                ))}
              </div>
            )}
            {artTab==="tips" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {selectedArt.tips.map((tip,i) => (
                  <div key={i} style={{ background:"#161b22", border:"1px solid #21262d", borderRadius:10, padding:"14px 16px", display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ background:selectedArt.color+"22", color:selectedArt.color, borderRadius:"50%", width:28, height:28, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800 }}>{i+1}</div>
                    <div style={{ color:"#e6edf3", fontSize:13, lineHeight:1.7, paddingTop:3 }}>{tip}</div>
                  </div>
                ))}
              </div>
            )}
            {artTab==="tools" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {selectedArt.tools.map((tool,i) => (
                  <div key={i} style={{ background:"#161b22", border:"1px solid #21262d", borderRadius:10, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ background:selectedArt.color+"22", borderRadius:8, width:42, height:42, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🛠</div>
                    <div>
                      <div style={{ color:selectedArt.color, fontWeight:700, fontSize:14 }}>{tool}</div>
                      <div style={{ color:"#8b949e", fontSize:11, marginTop:2 }}>
                        {tool.includes("ECmd")||tool.includes("Explorer")?"Eric Zimmerman Tools (무료)":tool.includes("Autopsy")?"오픈소스 포렌식 플랫폼":tool.includes("Viewer")?"Windows 내장 도구":tool.includes("SQLite")?"DB Browser (무료)":"무료 / 오픈소스"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 하단 이전/다음 */}
          {(() => {
            const idx = OTHER_ARTIFACTS.findIndex(a => a.id === selectedArt.id);
            const prev = OTHER_ARTIFACTS[idx-1];
            const next = OTHER_ARTIFACTS[idx+1];
            return (
              <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#0d1117", borderTop:"1px solid #21262d", padding:"10px 16px", display:"flex", gap:10 }}>
                <button onClick={() => prev && (setSelectedArt(prev), setArtTab("overview"))} style={{ flex:1, padding:"11px 8px", borderRadius:10, border:"none", background:prev?"#161b22":"transparent", border:`1px solid ${prev?"#30363d":"#21262d"}`, color:prev?"#e6edf3":"#30363d", cursor:prev?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", gap:5, fontSize:12 }}>
                  {prev?<>‹ <span>{prev.icon}</span><span style={{fontSize:11}}>{prev.name}</span></>:<span>처음</span>}
                </button>
                <button onClick={() => next && (setSelectedArt(next), setArtTab("overview"))} style={{ flex:1, padding:"11px 8px", borderRadius:10, border:"none", background:next?selectedArt.color+"22":"transparent", border:`1px solid ${next?selectedArt.color+"55":"#21262d"}`, color:next?selectedArt.color:"#30363d", cursor:next?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", gap:5, fontSize:12 }}>
                  {next?<><span style={{fontSize:11}}>{next.name}</span><span>{next.icon}</span> ›</>:<span>마지막</span>}
                </button>
              </div>
            );
          })()}
        </>
      )}

      {/* ══════════════ 이벤트 상세 모달 ══════════════ */}
      {selectedEv && (
        <div onClick={() => setSelectedEv(null)} style={{ position:"fixed", inset:0, background:"#00000090", zIndex:200, display:"flex", alignItems:"flex-end" }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:"#161b22", border:`1px solid ${selectedEv.catColor}55`,
            borderRadius:"16px 16px 0 0", padding:"20px 18px",
            width:"100%", maxWidth:480, margin:"0 auto",
            maxHeight:"80vh", overflowY:"auto",
          }}>
            {/* 드래그 핸들 */}
            <div style={{ width:36, height:4, background:"#30363d", borderRadius:2, margin:"0 auto 16px" }}/>

            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ background:selectedEv.catColor+"22", color:selectedEv.catColor, borderRadius:8, padding:"6px 12px", fontFamily:"monospace", fontSize:20, fontWeight:800 }}>{selectedEv.id}</div>
              <div>
                <div style={{ fontWeight:800, fontSize:15 }}>{selectedEv.name}</div>
                <div style={{ color:selectedEv.catColor, fontSize:10, marginTop:2 }}>{selectedEv.catLabel} · {selectedEv.source}</div>
              </div>
              {selectedEv.threat && <span style={{ marginLeft:"auto", background:"#ff4d6d22", color:"#ff4d6d", border:"1px solid #ff4d6d44", borderRadius:6, padding:"3px 8px", fontSize:10, fontWeight:700 }}>⚠ 위협</span>}
            </div>

            {[
              { label:"📋 설명", text:selectedEv.desc, color:"#e6edf3" },
              { label:"🔎 주요 필드", text:selectedEv.detail, color:"#8b949e" },
              { label:"🕵️ 포렌식 분석 포인트", text:selectedEv.forensic, color:"#ffd166" },
            ].map(({ label, text, color }) => (
              <div key={label} style={{ background:"#0d1117", border:"1px solid #21262d", borderRadius:9, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ color:"#8b949e", fontSize:10, fontWeight:700, marginBottom:6 }}>{label}</div>
                <div style={{ color, fontSize:12, lineHeight:1.7 }}>{text}</div>
              </div>
            ))}

            <button onClick={() => setSelectedEv(null)} style={{ width:"100%", background:"#21262d", border:"none", borderRadius:9, padding:"12px", cursor:"pointer", color:"#e6edf3", fontSize:13, fontWeight:700, marginTop:4 }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 이벤트 카드 컴포넌트 ──────────────────────────────
function EventCard({ ev, onSelect }) {
  return (
    <button onClick={() => onSelect(ev)} style={{
      width:"100%", textAlign:"left",
      background:ev.threat?"#ff4d6d08":"#161b22",
      border:`1px solid ${ev.threat?"#ff4d6d33":"#21262d"}`,
      borderLeft:`4px solid ${ev.threat?"#ff4d6d":ev.catColor}`,
      borderRadius:9, padding:"11px 13px", cursor:"pointer",
      display:"flex", gap:10, alignItems:"flex-start",
    }}>
      <div style={{ background:ev.threat?"#ff4d6d22":ev.catColor+"22", color:ev.threat?"#ff4d6d":ev.catColor, borderRadius:6, padding:"3px 9px", fontFamily:"monospace", fontSize:12, fontWeight:800, flexShrink:0, minWidth:46, textAlign:"center" }}>{ev.id}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
          <span style={{ color:ev.threat?"#ffaaaa":"#e6edf3", fontSize:12, fontWeight:700 }}>{ev.name}</span>
          {ev.threat && <span style={{ background:"#ff4d6d22", color:"#ff4d6d", borderRadius:4, padding:"1px 5px", fontSize:9, fontWeight:700, flexShrink:0 }}>⚠</span>}
        </div>
        <div style={{ color:"#8b949e", fontSize:11, lineHeight:1.5, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{ev.desc}</div>
      </div>
      <span style={{ color:"#444c56", fontSize:14, flexShrink:0 }}>›</span>
    </button>
  );
}
