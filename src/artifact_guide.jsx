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
// 아티팩트 상세 데이터
// ══════════════════════════════════════════════════════
const ARTIFACTS_DETAIL = [
  {
    id:"prefetch", icon:"⚡", name:"프리패치", subtitle:"Prefetch",
    color:"#ffd166", category:"실행흔적",
    summary:"프로그램 로딩 속도 향상을 위해 Windows가 자동 생성하는 파일. 실행 파일 이름·실행 횟수·최근 8회 실행 시간·접근한 파일 목록을 담고 있어 삭제된 악성 파일의 실행도 증명 가능.",
    locations:[
      { path:"C:\\Windows\\Prefetch\\", desc:"모든 .pf 파일 저장 위치" },
      { path:"파일명 형식: <실행파일명>-<해시8자리>.pf", desc:"예: POWERSHELL.EXE-AB12CD34.pf" },
    ],
    tools:[
      { name:"PECmd", desc:"Eric Zimmerman 도구. CSV/JSON 출력 지원. 가장 많이 사용", cmd:"PECmd.exe -d C:\\Windows\\Prefetch --csv output\\ --csvf prefetch.csv" },
      { name:"WinPrefetchView", desc:"GUI 도구. 직관적이나 일괄 처리 불가" },
      { name:"Autopsy", desc:"통합 포렌식 플랫폼 — Prefetch 자동 파싱" },
    ],
    keyItems:[
      {
        name:"실행 파일 경로 & 이름", threat:true,
        desc:"PF 파일에서 원본 실행 파일의 전체 경로와 이름을 추출.",
        parse_output:`Source Name                          Source Created          Source Modified        Run Count  Last Run                 Volume Path
---------------------------------------------------------------------------------------------------------------------------
MIMIKATZ.EXE-3B7D2F1A.pf            2024-09-02 10:44        2024-09-02 10:44       1          2024-09-02 10:44         \\VOLUME{...}\\
SVCUPD.EXE-C4F8A2E1.pf              2024-09-02 09:32        2024-09-02 09:32       5          2024-09-02 11:30         \\VOLUME{...}\\
POWERSHELL.EXE-7EC4A3D2.pf          2023-01-10 08:00        2024-09-02 09:31       47         2024-09-02 09:31         \\VOLUME{...}\\`,
        interpretation:[
          { field:"Source Name (파일명)", meaning:"PF 파일명에서 실행 파일명 추출. MIMIKATZ, PROCDUMP, METERPRETER, COBALTSTRIKE 등 공격 도구명 직접 검색" },
          { field:"Run Count (실행 횟수)", meaning:"총 실행 횟수. 1회면 최초 실행 후 삭제 의심. 수십 회면 자동 재실행 또는 스크립트에서 반복 호출" },
          { field:"Last Run (최근 실행 시간)", meaning:"가장 최근 실행 시간. 침해 시간대와 대조. 파일이 삭제된 후에도 PF 파일이 남으면 실행 사실 증명 가능" },
          { field:"Source Created (PF 생성 시간)", meaning:"처음 실행된 시간과 동일. 악성코드 최초 실행 시점 특정" },
          { field:"Volume Path", meaning:"실행 당시 마운트된 볼륨 경로. USB 실행이면 이동식 볼륨 경로 기록" },
        ],
        forensic:"삭제된 악성 파일도 PF 파일이 남아 있으면 실행 사실을 증명할 수 있다. 파일을 지워도 증거는 남는다.",
        ioc:"C:\\Windows\\Temp, C:\\ProgramData, C:\\Users\\...\\AppData\\Local\\Temp 경로 .exe 실행 이력",
      },
      {
        name:"최근 8회 실행 시간", threat:false,
        desc:"Windows Vista 이후 최근 8회 실행 시간이 모두 기록됨. 공격 빈도와 패턴 파악 가능.",
        parse_output:`파일명: SVCUPD.EXE-C4F8A2E1.pf
Run 1: 2024-09-02 09:32:11 UTC
Run 2: 2024-09-02 09:35:44 UTC
Run 3: 2024-09-02 10:18:03 UTC
Run 4: 2024-09-03 00:00:01 UTC  ← 자동 재실행 패턴 (자정)
Run 5: 2024-09-04 00:00:02 UTC
Run 6: 2024-09-05 00:00:01 UTC
Run 7: 2024-09-06 00:00:03 UTC
Run 8: 2024-09-07 00:00:01 UTC`,
        interpretation:[
          { field:"실행 간격 패턴", meaning:"일정 간격(매일 자정 등) 반복 실행 → 예약 작업 또는 자동 재실행 메커니즘 존재" },
          { field:"실행 시간대", meaning:"새벽 시간대 집중 실행 → 사람이 직접 실행한 것이 아닌 자동화 의심" },
          { field:"첫 실행 vs 마지막 실행 간격", meaning:"짧으면 단순 테스트 / 길면 장기간 지속 활동" },
        ],
        forensic:"규칙적 실행 패턴(매일 00:00:01)은 예약 작업을 통한 지속성 확보. 이벤트 로그 4698(예약 작업 생성)과 교차 확인.",
        ioc:"매일 자정 정각 실행, 업무 시간 외 새벽 반복 실행 패턴",
      },
      {
        name:"접근 파일 목록", threat:true,
        desc:"해당 프로그램이 실행되면서 접근(읽기·쓰기)한 파일 목록. 악성코드의 행동 반경 파악 핵심.",
        parse_output:`파일명: MIMIKATZ.EXE-3B7D2F1A.pf  접근 파일 목록:
\\WINDOWS\\SYSTEM32\\LSASS.EXE        ← 자격증명 덤프 대상
\\WINDOWS\\SYSTEM32\\NTDLL.DLL
\\WINDOWS\\SYSTEM32\\CRYPTDLL.DLL
\\WINDOWS\\TEMP\\LSS.DMP             ← 덤프 파일 생성 경로
\\PROGRAMDATA\\MICROSOFTUPDATE\\SVCUPD.CFG  ← C2 설정 파일 접근`,
        interpretation:[
          { field:"lsass.exe 접근", meaning:"자격증명 탈취 시도. Mimikatz, ProcDump 등이 LSASS 프로세스 메모리에 접근 시 기록" },
          { field:".dmp 파일 접근", meaning:"메모리 덤프 파일 생성 또는 읽기. 덤프 파일 경로와 이름이 직접 기록됨" },
          { field:"비정상 설정 파일 접근", meaning:"C2 설정·암호화 키·페이로드 파일에 접근한 흔적. 악성코드 동작 방식 파악 가능" },
          { field:"네트워크 드라이브 경로", meaning:"\\\\서버\\공유 형태 경로가 있으면 네트워크를 통한 파일 접근 또는 측면 이동" },
        ],
        forensic:"접근 파일 목록으로 악성코드가 무엇을 했는지 역추적 가능. 설정 파일·덤프 파일 경로를 MFT에서 추가 확인.",
        ioc:"LSASS.EXE 접근, .dmp 파일 생성, \\\\내부서버\\공유 경로 접근",
      },
    ],
    tips:[
      "Windows Server는 기본적으로 Prefetch 비활성화 → EnablePrefetcher=3으로 활성화 여부 레지스트리 확인",
      "SSD 환경에서도 PF 파일은 생성됨 (ReadyBoost 정책과 무관)",
      "같은 파일명이라도 경로가 다르면 해시값이 다른 별도 PF 파일 생성",
      "PECmd -d 옵션으로 폴더 전체 일괄 파싱 → CSV 출력 후 Excel 필터 활용",
      "악성코드가 PF 파일을 삭제해도 $UsnJrnl에 삭제 이벤트 기록 남음",
    ],
  },
  {
    id:"mft", icon:"📁", name:"$MFT · $LogFile · $UsnJrnl", subtitle:"NTFS 파일시스템 메타데이터 3종",
    color:"#06d6a0", category:"파일시스템",
    summary:"NTFS 파일시스템의 핵심 3대 메타데이터. $MFT는 모든 파일의 레코드 DB, $LogFile은 파일시스템 트랜잭션 로그, $UsnJrnl은 파일 변경 이벤트 저널이다. 삭제된 파일, 시간 조작, 흔적 삭제 탐지의 핵심 아티팩트.",
    locations:[
      { path:"C:\\$MFT", desc:"NTFS 마스터 파일 테이블 — 볼륨 내 모든 파일·폴더 레코드 (1레코드=1024bytes)" },
      { path:"C:\\$MFTMirr", desc:"$MFT 앞 4개 레코드의 백업 — 복구 용도" },
      { path:"C:\\$LogFile", desc:"NTFS 트랜잭션 로그 — 파일시스템 변경 내역. 최대 수십 MB, 빠르게 롤오버" },
      { path:"C:\\$Extend\\$UsnJrnl", desc:"파일 변경 저널 메인 파일" },
      { path:"C:\\$Extend\\$UsnJrnl:$J", desc:"$UsnJrnl의 실제 저널 데이터 스트림 (대용량, 포렌식 수집 대상)" },
      { path:"C:\\$Extend\\$UsnJrnl:$Max", desc:"저널 최대 크기 및 할당 델타 설정 스트림" },
      { path:"C:\\$Bitmap", desc:"클러스터 사용/미사용 현황 비트맵 — 파일 카빙 시 참조" },
      { path:"C:\\$Boot", desc:"볼륨 부트 레코드 — NTFS 버전·클러스터 크기·$MFT 위치 등 기록" },
    ],
    tools:[
      { name:"MFTECmd ($MFT)", desc:"Eric Zimmerman. $MFT 전체 파싱. CSV/JSON 출력", cmd:"MFTECmd.exe -f \"C:\\$MFT\" --csv output\\ --csvf mft.csv" },
      { name:"MFTECmd ($J 스트림)", desc:"$UsnJrnl 저널 파싱. 파일 변경 이벤트 전체 추출", cmd:"MFTECmd.exe -f \"C:\\$Extend\\$UsnJrnl:$J\" --csv output\\ --csvf usnjrnl.csv" },
      { name:"MFTECmd ($LogFile)", desc:"$LogFile 트랜잭션 파싱", cmd:"MFTECmd.exe -f \"C:\\$LogFile\" --csv output\\ --csvf logfile.csv" },
      { name:"MFTECmd (--body)", desc:"log2timeline 형식으로 타임라인 통합 출력", cmd:"MFTECmd.exe -f \"C:\\$MFT\" --body output\\ --bodyf mft_body.txt" },
      { name:"Autopsy", desc:"MFT 자동 파싱 + 타임라인 뷰 + 삭제 파일 복구 통합 제공" },
      { name:"Velociraptor", desc:"라이브 수집 및 원격 MFT 분석. NTFS artifact 활용", cmd:"velociraptor artifacts collect Windows.NTFS.MFT" },
    ],
    // keyItems에 파일별 섹션 구분 플래그 추가
    fileSections:[
      { id:"mft_main", label:"📄 $MFT", color:"#06d6a0" },
      { id:"logfile",  label:"📝 $LogFile", color:"#4cc9f0" },
      { id:"usnjrnl",  label:"📋 $UsnJrnl", color:"#ffd166" },
    ],
    keyItems:[
      // ── $MFT 항목 ──
      {
        file:"$MFT",
        name:"MFT 레코드 구조 (파일 메타데이터)", threat:false,
        desc:"파일 1개 = MFT 레코드 1개(1024B). 레코드 내 속성($STANDARD_INFORMATION, $FILE_NAME, $DATA 등)에 타임스탬프·크기·경로·내용이 저장된다.",
        parse_output:`[MFTECmd CSV 출력 — 주요 컬럼]
EntryNumber  FileName         InUse  ParentPath                    FileSize   Created($SI)          Modified($SI)         Changed($SI)          Accessed($SI)
                                                                             Created($FN)          Modified($FN)         Changed($FN)          Accessed($FN)
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
847261       svcupd.exe       True   C:\\ProgramData\\MicrosoftUpdate  251904     2024-09-02 09:32:11   2024-09-02 09:32:11   2024-09-02 09:33:15   2024-09-02 09:32:00
                                                                             2024-09-02 09:32:11   2024-09-02 09:32:11   2024-09-02 09:32:11   2024-09-02 09:32:11
851334       lss.dmp          False  C:\\Windows\\Temp                 43237376   2024-09-02 10:44:17   2024-09-02 10:44:17   2024-09-02 10:44:17   2024-09-02 10:44:17
                                                                             2024-09-02 10:44:17   2024-09-02 10:44:17   2024-09-02 10:44:17   2024-09-02 10:44:17
847400       malware_fake.exe True   C:\\Windows\\System32             245760     2019-01-15 08:00:00   2019-01-15 08:00:00   2024-09-02 09:32:30   2024-09-02 09:32:00
                                                                             2024-09-02 09:32:11   2024-09-02 09:32:11   2024-09-02 09:32:11   2024-09-02 09:32:11
                                                                             ↑ $FN은 실제 드롭 시간  ↑$SI만 과거로 조작 → Timestomping!`,
        interpretation:[
          { field:"EntryNumber (MFT 레코드 번호)", meaning:"파일마다 고유 번호. $UsnJrnl의 EntryId와 매핑하면 동일 파일의 생성~삭제 전체 이력 추적 가능" },
          { field:"InUse=True/False", meaning:"True=현재 존재 / False=삭제됨. False여도 레코드가 재사용 전이면 메타데이터 전체 확인 가능. 이것이 '삭제 파일 복구'의 원리" },
          { field:"$SI_Created vs $FN_Created 비교", meaning:"$STANDARD_INFORMATION($SI)은 Windows API(SetFileTime)로 누구나 변경 가능. $FILE_NAME($FN)은 커널 내부에서만 변경 → 훨씬 신뢰. 두 값이 다르면 Timestomping 강력 의심" },
          { field:"$SI_Changed (MFT Changed)", meaning:"MFT 레코드 자체가 마지막으로 변경된 시간. 파일 내용·속성·권한이 변경될 때 갱신. Timestomping 시 이 값도 변함 → $FN_Changed와 비교" },
          { field:"ParentPath (부모 경로)", meaning:"파일이 속한 폴더 경로. 비정상 경로(C:\\Temp, C:\\ProgramData, C:\\Windows\\Temp) 파일 집중 분석" },
          { field:"FileSize=0 + InUse=True", meaning:"파일은 존재하지만 크기가 0 → 내용이 삭제되거나 비워진 것. 공격자가 증거 인멸을 위해 내용만 삭제한 패턴" },
        ],
        forensic:"$SI와 $FN 타임스탬프 차이 = Timestomping 확정 증거. $FN 기준으로 실제 침해 시간 재구성. InUse=False 파일의 메타데이터로 삭제된 악성 파일 목록 복원.",
        ioc:"$SI_Created 수년 전 + $FN_Created 침해 시점, C:\\Temp·AppData 경로 .exe InUse=False",
      },
      {
        file:"$MFT",
        name:"ADS (대체 데이터 스트림)", threat:true,
        desc:"NTFS는 파일 하나에 여러 개의 데이터 스트림($DATA 속성)을 가질 수 있다. 기본 스트림 외 숨겨진 스트림에 악성 페이로드를 숨길 수 있다.",
        parse_output:`[MFTECmd — ADS(대체 데이터 스트림) 포함 출력]
EntryNumber  FileName              StreamName          StreamSize   InUse  경로
-----------------------------------------------------------------------------------------------
847500       readme.txt            (기본 스트림)        1024         True   C:\\Users\\victim\\Desktop\\
847500       readme.txt            :hidden_payload      245760       True   ← ADS에 실행파일 숨김!
847501       legitimate.jpg        (기본 스트림)        102400       True   C:\\Users\\victim\\Pictures\\
847501       legitimate.jpg        :Zone.Identifier     196          True   ← 정상 (인터넷 다운로드 표시)
847502       normal_doc.docx       (기본 스트림)        50000        True   C:\\Users\\victim\\Documents\\
847502       normal_doc.docx       :shellcode.exe       102400       True   ← 악성 ADS!`,
        interpretation:[
          { field:"StreamName이 비어있음", meaning:"기본 데이터 스트림($DATA). 일반적으로 파일 내용이 저장되는 곳" },
          { field:":Zone.Identifier", meaning:"인터넷에서 다운로드된 파일에 자동 생성되는 정상 ADS. ZoneId=3이면 인터넷 다운로드. 이 값이 없는 .exe는 직접 복사되거나 프로그래밍으로 생성된 것" },
          { field:":hidden_payload, :shellcode.exe 등", meaning:"정상 파일에 숨겨진 악성 페이로드. dir 명령이나 탐색기에서 보이지 않음. type readme.txt:hidden_payload로 실행 가능" },
          { field:"StreamSize vs 파일 크기", meaning:"기본 스트림 크기와 전체 파일 크기가 다르면 ADS 존재. 탐색기에서 표시되는 크기는 기본 스트림만 반영" },
        ],
        forensic:"MFTECmd의 --ads 옵션으로 대체 데이터 스트림 전체 열거. Zone.Identifier 없는 .exe = 인터넷 다운로드 흔적 없음 → 내부 전달 또는 메모리에서 드롭된 파일.",
        ioc:"정상 파일(txt, jpg, docx 등)에 .exe .dll .bat 스트림 존재, StreamSize 비정상적으로 큰 경우",
      },
      {
        file:"$MFT",
        name:"삭제 파일 복구 분석", threat:false,
        desc:"InUse=False 레코드 분석으로 삭제된 파일의 메타데이터를 복원. 파일 내용 복구는 클러스터 덮어쓰기 여부에 따라 다름.",
        parse_output:`[삭제된 파일 목록 — InUse=False 필터링 결과]
EntryNumber  FileName         FileSize    $FN_Created           $FN_Modified          ParentPath                  IsOrphan
-------------------------------------------------------------------------------------------------------------------------------------------
851334       lss.dmp          43237376    2024-09-02 10:44:17   2024-09-02 10:44:17   C:\\Windows\\Temp\\             False
918822       svcupd.exe       251904      2024-09-02 09:32:11   2024-09-02 09:32:11   C:\\ProgramData\\MicrosoftUpdate  False
918823       svcupd.cfg       8192        2024-09-02 09:32:11   2024-09-02 09:32:11   C:\\ProgramData\\MicrosoftUpdate  False
918901       tmp_arch.7z      487221843   2024-09-10 22:28:00   2024-09-10 22:28:00   C:\\ProgramData\\               False
             (이름 없음)       4096        2024-09-15 03:10:00   2024-09-15 03:10:00   (고아 레코드)                  True  ← IsOrphan`,
        interpretation:[
          { field:"InUse=False + FileSize > 0", meaning:"삭제됐지만 클러스터를 아직 덮어쓰지 않았을 가능성. 파일 내용 복구 시도 가치 있음. 단, SSD의 TRIM 기능이 활성화됐다면 복구 불가" },
          { field:"IsOrphan=True", meaning:"부모 디렉토리 레코드도 삭제된 '고아' 파일. 폴더 구조 없이 파일만 남은 상태. 공격자가 폴더째로 삭제 시 발생" },
          { field:"$FN 타임스탬프 (삭제 파일)", meaning:"삭제된 파일도 $FN 타임스탬프는 유지. 악성 파일의 원본 생성·수정 시간 확인 가능" },
          { field:"tmp_arch.7z FileSize=487MB", meaning:"유출 압축 파일 크기와 SRUM 송신량(487MB)이 일치하면 유출 파일 확정 증거" },
        ],
        forensic:"삭제 파일의 $FN 타임스탬프 + $UsnJrnl FileDelete 이벤트 + 파일 크기 3종 교차로 '언제, 무엇을, 얼마나 컸는지' 모두 증명.",
        ioc:"침해 종료 시점(03:00~04:00) 대용량 파일·악성파일 일괄 삭제 패턴",
      },
      // ── $LogFile 항목 ──
      {
        file:"$LogFile",
        name:"$LogFile 트랜잭션 로그", threat:false,
        desc:"NTFS가 파일시스템 일관성을 위해 모든 메타데이터 변경을 트랜잭션으로 기록하는 로그. 매우 빠르게 롤오버되므로 최근 수십 분~수 시간 이내의 이벤트만 확인 가능.",
        parse_output:`[MFTECmd $LogFile 파싱 결과]
ClientLsn    TransactionId  Redo               Undo              FileName         Timestamp
-----------------------------------------------------------------------------------------------
0x1A2B3C4D   0x00001234     CreateFile         DeleteFile        svcupd.exe       2024-09-15 03:12:40
0x1A2B3C4E   0x00001234     DeleteFile         CreateFile        svcupd.exe       2024-09-15 03:12:44  ← 삭제 완료
0x1A2B3C4F   0x00001235     SetFileInfo        SetFileInfo       lss.dmp          2024-09-15 03:12:45
0x1A2B3C50   0x00001235     DeleteFile         CreateFile        lss.dmp          2024-09-15 03:12:46
0x1A2B3C51   0x00001236     RenameFile         RenameFile        malware→svchost  2024-09-02 09:32:05  ← 이름 변경!

[LSN 시퀀스 번호]
현재 LSN:     0x1F3A8C00  (최신 로그 위치)
첫 LSN:       0x1A2B0000  (이 이전은 롤오버로 손실)
로그 크기:    65536 KB (64 MB)`,
        interpretation:[
          { field:"ClientLsn (로그 시퀀스 번호)", meaning:"단조 증가하는 고유 번호. 번호 순서로 파일시스템 작업의 정확한 순서 재구성 가능" },
          { field:"Redo / Undo 작업", meaning:"Redo=작업 내용, Undo=롤백 내용. CreateFile-DeleteFile 쌍이면 파일이 생성됐다가 삭제된 것" },
          { field:"TransactionId 동일 항목", meaning:"같은 트랜잭션 ID를 가진 항목들은 하나의 원자적 작업. 여러 파일이 동시에 생성·삭제된 배치 작업 탐지 가능" },
          { field:"RenameFile 이벤트", meaning:"파일 이름 변경 기록. 악성 파일이 정상 파일명으로 위장하거나, 파일 이름을 바꾸어 탐지 우회하는 패턴 탐지" },
          { field:"로그 롤오버 (손실 구간)", meaning:"$LogFile 크기(기본 64MB) 초과 시 오래된 레코드 덮어씀. 롤오버 발생 시 롤오버 이전 이벤트 손실. $UsnJrnl이 더 오래 유지됨" },
        ],
        forensic:"$LogFile은 롤오버가 빠르므로 수집 우선순위는 낮음. 그러나 최근 수십 분 이내 파일명 변경·삭제 순서 재구성에는 $UsnJrnl보다 세밀한 정보 제공.",
        ioc:"Redo=DeleteFile 대량 발생, RenameFile로 악성→정상 이름 변경, 트랜잭션 ID 단위 일괄 삭제",
      },
      // ── $UsnJrnl 항목 ──
      {
        file:"$UsnJrnl",
        name:"$UsnJrnl:$J 변경 저널 — 파일 변경 이벤트", threat:true,
        desc:"파일 생성·수정·삭제·이름변경 등 모든 파일시스템 이벤트를 USN(Update Sequence Number) 순서로 기록. $LogFile보다 훨씬 오래 유지(수십~수백 MB). 삭제 증거 복원의 핵심.",
        parse_output:`[MFTECmd $J 파싱 결과 — 주요 컬럼]
TimeStamp(UTC)          EntryId    ParentEntryId  EntryName             Reason                                          Extension  IsDirectory
------------------------------------------------------------------------------------------------------------------------------------------------------------------
2024-09-02 09:32:11     847261     847200         svcupd.exe            FileCreate                                      .exe       False
2024-09-02 09:32:11     847262     847200         svcupd.cfg            FileCreate                                      .cfg       False
2024-09-02 09:33:15     847261     847200         svcupd.exe            BasicInfoChange                                 .exe       False  ← 타임스탬프 변경!
2024-09-02 09:35:01     847263     847200         config.dat            FileCreate|StreamChange                         .dat       False
2024-09-02 10:44:17     851334     40961          lss.dmp               FileCreate|DataExtend|Close                     .dmp       False
2024-09-02 11:15:00     852100     40000          RD-SRV-002            RenameOldName                                   (없음)     False
2024-09-02 11:15:00     852101     40000          RD-SRV-002.rdp        RenameNewName                                   .rdp       False  ← 이름 변경!
2024-09-03 14:22:01     854200     40961          Staging               DirectoryCreate                                 (없음)     True   ← 폴더 생성!
2024-09-10 22:28:00     891200     40961          7z.exe                FileCreate                                      .exe       False  ← 압축 도구 드롭
2024-09-10 22:28:30     891201     40961          tmp_arch.7z           FileCreate|DataExtend|Close                     .7z        False
2024-09-15 03:12:40     918820     847200         MicrosoftUpdate       DirectoryDelete|Close                           (없음)     True   ← 폴더 삭제!
2024-09-15 03:12:44     918822     847200         svcupd.exe            FileDelete|Close                                .exe       False  ← 파일 삭제!
2024-09-15 03:12:45     918823     40961          lss.dmp               FileDelete|Close                                .dmp       False
2024-09-15 03:12:46     918901     40961          tmp_arch.7z           FileDelete|Close                                .7z        False`,
        interpretation:[
          { field:"Reason: FileCreate", meaning:"새 파일 생성. 악성 파일 드롭 정확한 시점 특정. EntryId로 MFT 레코드와 연결하면 파일 크기·속성도 확인" },
          { field:"Reason: FileDelete | Close", meaning:"파일 삭제 완료. 공격자 철수 시 증거 삭제 목록 완전 복원 가능. MFT InUse=False 레코드와 교차 확인" },
          { field:"Reason: BasicInfoChange", meaning:"$STANDARD_INFORMATION 속성 변경. 타임스탬프 변조(Timestomping) 시 반드시 이 이벤트 발생. FileCreate 직후 BasicInfoChange = Timestomping 강력 의심" },
          { field:"Reason: DataExtend | DataTruncation", meaning:"파일 크기 증가/감소. 파일에 데이터가 추가되거나 잘린 것. 단계적 DataExtend = 파일 점진적 작성 (압축 파일 생성 패턴)" },
          { field:"Reason: RenameOldName + RenameNewName", meaning:"파일 이름 변경의 이전 이름과 새 이름. 두 이벤트가 쌍으로 발생. 악성 파일이 정상 파일명으로 위장하는 순간 포착" },
          { field:"Reason: StreamChange", meaning:"대체 데이터 스트림(ADS) 변경. ADS에 페이로드를 숨기는 공격 탐지" },
          { field:"IsDirectory=True", meaning:"폴더에 대한 이벤트. 스테이징 폴더 생성(DirectoryCreate)·삭제(DirectoryDelete) 추적 가능" },
          { field:"EntryId + ParentEntryId", meaning:"MFT 레코드 번호와 부모 폴더 번호. MFT와 조합하면 삭제된 파일의 전체 경로 재구성 가능" },
        ],
        forensic:"FileCreate→BasicInfoChange 패턴 = Timestomping. FileCreate→FileDelete 쌍 = 존재했다가 삭제된 파일. DirectoryCreate(Staging) = 데이터 수집 스테이징 폴더.",
        ioc:"BasicInfoChange immediately after FileCreate, FileDelete 대량 발생 (침해 종료 시간대), DirectoryCreate Staging",
      },
      {
        file:"$UsnJrnl",
        name:"$UsnJrnl Reason 코드 전체 가이드", threat:false,
        desc:"$UsnJrnl의 Reason 필드에 기록되는 코드 전체 목록과 의미. 여러 코드가 OR 결합되어 하나의 이벤트에 복수 코드가 나타날 수 있다.",
        parse_output:`Reason 코드              16진수값   의미
------------------------------------------------------------------
FileCreate               0x00000100  파일 새로 생성됨
FileDelete               0x00000200  파일 삭제됨
DataOverwrite            0x00000001  파일 내용 덮어쓰기
DataExtend               0x00000002  파일 크기 증가 (데이터 추가)
DataTruncation           0x00000004  파일 크기 감소 (데이터 잘림)
BasicInfoChange          0x00008000  타임스탬프·속성 변경 (Timestomping!)
RenameOldName            0x00001000  이름 변경 — 이전 이름
RenameNewName            0x00002000  이름 변경 — 새 이름
SecurityChange           0x00000800  파일 권한(ACL) 변경
StreamChange             0x00200000  대체 데이터 스트림(ADS) 변경
ObjectIdChange           0x00080000  객체 ID 변경
CompressionChange        0x00020000  압축 속성 변경
EncryptionChange         0x00040000  암호화 속성 변경
DirectoryCreate          0x00000100  폴더 생성 (IsDirectory=True)
DirectoryDelete          0x00000200  폴더 삭제 (IsDirectory=True)
Close                    0x80000000  파일 핸들 닫힘 (이벤트 완료)
Indexable                0x00004000  인덱싱 속성 변경

[복합 이벤트 예시]
FileCreate | DataExtend | Close  = 새 파일 생성 후 데이터 쓰고 핸들 닫음 (일반적 파일 생성)
FileDelete | Close               = 파일 삭제 후 핸들 닫음 (완전 삭제)
DataOverwrite | DataExtend       = 기존 파일 내용 변경 (수정)`,
        interpretation:[
          { field:"Close 코드 포함", meaning:"핸들이 닫힌 시점 = 작업 완료 시점. FileCreate|Close의 시간 = 파일 생성 완료 시간" },
          { field:"FileCreate | DataExtend 연속", meaning:"파일 생성 후 데이터 추가. 단계적으로 파일이 쓰여지는 과정. 대용량 파일(압축본, 덤프)을 점진적으로 작성할 때 나타남" },
          { field:"BasicInfoChange 단독", meaning:"파일 내용 변경 없이 타임스탬프·속성만 변경. 전형적인 Timestomping 이벤트" },
          { field:"SecurityChange", meaning:"파일 권한 변경. 악성 파일을 Everyone 읽기·실행 가능으로 변경하는 준비 단계" },
        ],
        forensic:"Reason 코드 조합 패턴으로 공격 행위를 정확히 식별. FileCreate+BasicInfoChange=Timestomping, DataExtend 반복=단계적 파일 작성.",
        ioc:"BasicInfoChange 단독, FileCreate 직후 BasicInfoChange, SecurityChange on 악성 파일",
      },
      {
        file:"$UsnJrnl",
        name:"$UsnJrnl 롤오버 & 수집 전략", threat:false,
        desc:"$UsnJrnl은 크기 제한이 있어 오래된 데이터부터 덮어씀. 수집 전략과 유실 여부 확인 방법.",
        parse_output:`[$Max 스트림 정보 — 저널 크기 설정]
MaximumSize:   0x0000000004000000  (64 MB — 기본값)
AllocationDelta: 0x0000000000800000 (8 MB 단위 할당)

[수집 가능한 USN 범위 확인]
첫 번째 USN:   0x00000000 1A2B0000  (이전 데이터는 손실)
현재 USN:      0x00000000 1F3A8C00
손실 예상 기간: 약 7일치 이벤트 (시스템 활동량에 따라 다름)

[롤오버 감지]
MFT EntryId 847261 파일의 $UsnJrnl 첫 이벤트가
FileCreate가 아닌 DataExtend로 시작 → 생성 이벤트가 롤오버로 손실됨

[ExtractUsnJrnl 수집 명령]
fsutil usn readjournal C: csv > usnjrnl_live.csv   (라이브 시스템)
MFTECmd.exe -f $J --csv output\\                   (오프라인 이미지)`,
        interpretation:[
          { field:"MaximumSize=64MB", meaning:"기본값. 시스템 활동이 활발하면 수일 분량만 유지. 보안 강화 환경에서는 512MB~1GB로 늘리기도 함" },
          { field:"첫 번째 USN vs 현재 USN 간격", meaning:"간격이 클수록 많은 이벤트 기록됨. 간격이 작으면 최근 롤오버 발생. 손실 없이 얼마나 거슬러 올라갈 수 있는지 파악 필수" },
          { field:"FileCreate 없이 DataExtend로 시작", meaning:"해당 파일의 생성 이벤트가 롤오버로 손실됨. MFT의 $FN 타임스탬프로 생성 시간을 대신 확인" },
          { field:"라이브 수집 vs 오프라인 분석", meaning:"라이브: fsutil usn readjournal (현재 활성 저널만). 오프라인: MFTECmd -f $J (이미지에서 추출, 전체 $J 스트림 분석 가능)" },
        ],
        forensic:"사고 접수 즉시 $J 스트림 수집이 최우선. 시간이 지날수록 롤오버로 이벤트 손실. 수집 시 $J의 전체 크기를 메모할 것.",
        ioc:"수집 지연으로 인한 롤오버 → FileCreate 이벤트 손실 → MFT $FN 타임스탬프로 보완",
      },
    ],
    tips:[
      "수집 최우선순위: $J($UsnJrnl) > $MFT > $LogFile. $J는 롤오버로 가장 빨리 소실",
      "$SI_Created < $FN_Created이면 Timestomping 확정. $FN을 실제 생성 시간으로 사용",
      "MFTECmd --body 옵션 → log2timeline 형식 → plaso/timesketch로 전체 타임라인 통합",
      "InUse=False + FileSize > 0 → 카빙 시도. SSD TRIM 활성화 시 복구 어려움",
      "ADS 탐지: MFTECmd --ads 옵션 또는 dir /r 명령으로 열거",
      "$LogFile은 64MB 초과 시 빠르게 롤오버 → 최근 수십 분만 유효. 빠른 수집 필요",
      "Zone.Identifier ADS 없는 .exe는 브라우저 다운로드가 아님 → 내부 드롭 또는 메모리 실행",
      "Velociraptor로 라이브 시스템 $MFT + $J 원격 수집 가능 — 이미지 불필요",
    ],
  },
  {
    id:"lnk", icon:"🔗", name:"LNK / 점프리스트", subtitle:"Shortcut & JumpList",
    color:"#ffa657", category:"사용자행위",
    summary:"사용자가 파일을 열 때 Windows가 자동 생성하는 바로가기 파일. 원본 파일이 삭제되어도 경로·접근 시간·MAC 주소·볼륨 시리얼이 LNK에 남아 파일 접근 사실을 증명한다.",
    locations:[
      { path:"C:\\Users\\<user>\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\*.lnk", desc:"최근 파일 LNK 모음" },
      { path:"C:\\Users\\<user>\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\AutomaticDestinations\\*.automaticDestinations-ms", desc:"자동 점프리스트 (앱별 최근 파일)" },
      { path:"C:\\Users\\<user>\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\CustomDestinations\\*.customDestinations-ms", desc:"사용자 고정 점프리스트" },
      { path:"C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\ (공용 바로가기)", desc:"시스템 전체 바로가기" },
    ],
    tools:[
      { name:"LECmd", desc:"Eric Zimmerman LNK 파서", cmd:"LECmd.exe -d \"C:\\Users\\user\\AppData\\Roaming\\Microsoft\\Windows\\Recent\" --csv output\\ --csvf lnk.csv" },
      { name:"JLECmd", desc:"Eric Zimmerman 점프리스트 파서", cmd:"JLECmd.exe -d \"C:\\Users\\user\\AppData\\Roaming\\Microsoft\\Windows\\Recent\" --csv output\\ --csvf jumplist.csv" },
    ],
    keyItems:[
      {
        name:"LNK 핵심 메타데이터", threat:false,
        desc:"LNK 파일 하나에 원본 파일에 대한 방대한 정보가 저장된다.",
        parse_output:`Source Name: 방산청_협력사_공문_2024.docx.lnk
Source Created:    2024-09-02 09:14:33   ← LNK 생성 = 파일 최초 접근 시간
Source Modified:   2024-09-02 09:14:33
Source Accessed:   2024-09-02 09:31:20

[링크 대상 정보]
Target Full Path:  C:\\Users\\victim\\Downloads\\방산청_협력사_공문_2024.docx
Target Created:    2024-09-02 09:13:45
Target Modified:   2024-09-02 09:13:45
Target File Size:  245760 bytes (240 KB)

[볼륨 정보]
Drive Type:        Fixed (내장 드라이브)
Volume Serial:     0xA1B2C3D4
Volume Label:      Windows

[네트워크 공유 정보 — USB/네트워크인 경우]
Network Share Path: \\\\192.168.10.20\\C$\\Tools\\malware.exe  ← 네트워크 접근 경로!
Network Share Name: C$

[호스트 정보]
Machine ID (MAC):  00-1A-2B-3C-4D-5E   ← 생성 당시 네트워크 어댑터 MAC
NetBIOS Name:      ATTACKER-PC          ← 원본 컴퓨터명`,
        interpretation:[
          { field:"Source Created = LNK 생성 시간", meaning:"원본 파일을 처음 연 시간. 파일 탐색기, Office 등으로 파일을 열면 LNK 자동 생성. 정확한 최초 접근 시점" },
          { field:"Target Full Path", meaning:"원본 파일의 전체 경로. 파일이 삭제되어도 경로 정보가 여기에 남음. 악성 파일의 위치 특정 가능" },
          { field:"Network Share Path", meaning:"네트워크 공유로 파일 접근 시 \\\\서버IP\\공유명\\파일명 형태로 기록. 측면 이동 경로 직접 증명" },
          { field:"Machine ID (MAC 주소)", meaning:"LNK 파일 생성 당시 PC의 네트워크 어댑터 MAC. 다른 PC에서 만들어진 LNK라면 원본 PC 식별 가능" },
          { field:"NetBIOS Name", meaning:"LNK를 생성한 컴퓨터 이름. 내부 이동 경로 추적, 원본 PC 특정에 활용" },
          { field:"Volume Serial", meaning:"드라이브 고유 식별자. MountedDevices, USBSTOR 레지스트리와 교차하면 드라이브 특정 가능" },
        ],
        forensic:"LNK의 Network Share Path에 내부 서버 IP가 있으면 측면 이동의 직접 증거. MAC 주소로 원본 PC 특정.",
        ioc:"Network Share Path에 \\\\내부IP\\ADMIN$ 또는 \\\\내부IP\\C$ 포함, 다른 PC의 MAC 주소",
      },
      {
        name:"점프리스트 (JumpList)", threat:false,
        desc:"앱별로 최근 사용한 파일 목록을 저장. LNK보다 더 많은 파일 접근 이력을 보관.",
        parse_output:`[자동 점프리스트: Microsoft Word]
AppId: d3b233c31b22c7ac
Entry Count: 18

순서  파일명                                    접근시간              크기
-------------------------------------------------------------------------------------
0     방산청_협력사_공문_2024.docx               2024-09-02 09:14      245760
1     기술연구_기밀_Rev3.docx                    2024-09-03 14:30      1052160   ← 기밀 문서!
2     직원_급여_명세.xlsx                        2024-09-04 11:20      87040
3     system_admin_credentials.txt              2024-09-04 16:45      1024      ← 자격증명 파일!
4     VPN_config_backup.conf                    2024-09-05 09:00      4096      ← VPN 설정!`,
        interpretation:[
          { field:"AppId", meaning:"앱별 고유 ID. Word, Excel, Explorer, Chrome 등 앱이 특정됨. 어떤 앱으로 파일을 열었는지 파악" },
          { field:"Entry Count", meaning:"저장된 파일 접근 이력 개수. LNK보다 더 많은 이력을 보관하는 경우가 많음" },
          { field:"파일명 목록", meaning:"공격자가 열람한 파일 목록. 기밀 문서, 자격증명 파일, 설정 파일에 대한 접근 직접 증명" },
          { field:"접근 시간 순서", meaning:"파일 열람 순서와 시간으로 공격자의 행동 흐름 재구성 가능" },
        ],
        forensic:"credentials, password, vpn, config, backup 등 키워드가 포함된 파일명이 있으면 내부 정찰 직접 증거.",
        ioc:"자격증명 파일(.txt, .xlsx), VPN 설정 파일, 기밀 문서에 대한 접근 이력",
      },
    ],
    tips:[
      "LNK 파일은 원본 삭제 후에도 30일간 유지 (Windows 기본 정책)",
      "공격자가 Recent 폴더를 삭제해도 $UsnJrnl에 LNK 생성·삭제 이벤트 남음",
      "LECmd --all 옵션으로 숨겨진 LNK 속성까지 모두 추출",
      "JumpList의 AppId 목록: WORD=d3b233c31b22c7ac, EXCEL=5d696d521de238c3, EXPLORER=b8ab77100df80ab3",
      "점프리스트는 LNK보다 더 오래된 파일 접근 이력을 보관하는 경우가 많음",
    ],
  },
  {
    id:"shellbag", icon:"🗂", name:"쉘백", subtitle:"Shellbag",
    color:"#ff9f43", category:"사용자행위",
    summary:"파일 탐색기로 폴더를 열 때 Windows가 창 크기·위치·정렬 방식을 저장하는 레지스트리 키. 사용자가 방문한 모든 폴더 경로와 접근 시간이 기록되며, 폴더가 삭제된 후에도 흔적이 남는다.",
    locations:[
      { path:"NTUSER.DAT: Software\\Microsoft\\Windows\\Shell\\BagMRU", desc:"탐색기 폴더 탐색 이력 (기본 폴더)" },
      { path:"NTUSER.DAT: Software\\Microsoft\\Windows\\Shell\\Bags", desc:"각 폴더의 창 설정 저장" },
      { path:"UsrClass.dat: Local Settings\\Software\\Microsoft\\Windows\\Shell\\BagMRU", desc:"더 상세한 탐색 이력. ZIP·폴더 내부 포함 (핵심!)" },
      { path:"UsrClass.dat: Local Settings\\Software\\Microsoft\\Windows\\Shell\\Bags", desc:"창 설정 (UsrClass)" },
    ],
    tools:[
      { name:"ShellBagsExplorer", desc:"Eric Zimmerman GUI 도구. 폴더 트리 시각화", cmd:"ShellBagsExplorer.exe (GUI)" },
      { name:"SBECmd", desc:"명령줄 쉘백 파서. CSV 출력", cmd:"SBECmd.exe -d \"C:\\Users\" --csv output\\ --csvf shellbag.csv" },
    ],
    keyItems:[
      {
        name:"폴더 탐색 이력", threat:false,
        desc:"탐색기로 열어본 모든 폴더의 경로와 접근 시간. 삭제된 폴더, 외부 드라이브, 네트워크 공유 경로까지 기록.",
        parse_output:`AbsolutePath                                          FirstInteracted          LastInteracted           MRUOrder
------------------------------------------------------------------------------------------------------------------------------
C:\\                                                    2023-01-15 09:00         2024-09-15 03:10         0
C:\\Staging                                             2024-09-03 14:22         2024-09-10 22:28         1  ← 스테이징 폴더!
C:\\Staging\\Research                                   2024-09-03 14:25         2024-09-10 22:25         2
C:\\Windows\\Temp                                       2024-09-02 09:35         2024-09-15 03:12         3  ← 악성 파일 확인
C:\\ProgramData\\MicrosoftUpdate                        2024-09-02 09:33         2024-09-02 09:33         4  ← 악성 폴더
E:\\SecretDocs (이동식 드라이브)                          2024-09-05 22:10         2024-09-05 22:30         5  ← USB!
\\\\192.168.10.20\\C$\\Tools                             2024-09-02 11:15         2024-09-07 03:00         6  ← 측면이동!`,
        interpretation:[
          { field:"AbsolutePath (절대 경로)", meaning:"탐색기로 접근한 폴더의 전체 경로. 폴더가 삭제되어도 경로가 여기에 남아 존재했음을 증명" },
          { field:"FirstInteracted", meaning:"해당 폴더를 처음 열어본 시간. 스테이징 폴더 최초 생성 시점과 연계 분석 가능" },
          { field:"LastInteracted", meaning:"마지막으로 접근한 시간. 공격 종료 시점 추정에 활용" },
          { field:"이동식 드라이브 경로 (E:\\...)", meaning:"USB 또는 외장 하드에서 탐색한 폴더. LNK·USBSTOR 레지스트리와 교차하면 USB 접근 확정" },
          { field:"네트워크 경로 (\\\\IP\\...)", meaning:"내부 서버 공유 폴더 접근. 측면 이동 경로와 정찰 범위 직접 파악 가능" },
          { field:"비정상 폴더 (C:\\Staging, ProgramData\\...)", meaning:"정상 사용에서 나타나지 않는 경로. 공격자가 생성한 수집·스테이징 폴더 접근 증거" },
        ],
        forensic:"\\\\내부IP\\공유 경로 존재 시 측면 이동 확정. C:\\Staging 같은 비정상 폴더는 데이터 수집 증거.",
        ioc:"C:\\Staging\\ 또는 유사 수집 폴더, \\\\내부IP\\ADMIN$, 이동식 드라이브 경로",
      },
    ],
    tips:[
      "UsrClass.dat의 쉘백이 NTUSER.DAT보다 훨씬 상세함 — 반드시 둘 다 분석",
      "ZIP 파일 내부 폴더도 쉘백에 기록됨 → 압축 파일 탐색 이력 파악 가능",
      "네트워크 경로(UNC)가 있으면 해당 IP의 이벤트 로그와 교차 분석",
      "삭제된 폴더는 경로가 남지만 FirstInteracted 시간이 부정확할 수 있음",
      "SBECmd --dt 옵션으로 로컬 시간 기준 출력 (타임존 자동 적용)",
    ],
  },
  {
    id:"browser", icon:"🌐", name:"브라우저 히스토리", subtitle:"Browser Artifacts",
    color:"#4ecdc4", category:"네트워크",
    summary:"Chrome·Edge·Firefox 등의 방문 기록, 다운로드 이력, 검색어, 쿠키, 저장된 비밀번호가 SQLite DB로 저장된다. C2 서버 접속·피싱 사이트 방문·악성 파일 다운로드 경로 추적의 핵심.",
    locations:[
      { path:"C:\\Users\\<user>\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\History", desc:"Chrome 방문·다운로드 기록 (SQLite)" },
      { path:"C:\\Users\\<user>\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\History", desc:"Edge 방문·다운로드 기록 (동일 구조)" },
      { path:"C:\\Users\\<user>\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\<profile>\\places.sqlite", desc:"Firefox 방문 기록" },
      { path:"C:\\Users\\<user>\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Login Data", desc:"저장된 자격증명 (암호화)" },
      { path:"C:\\Users\\<user>\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cookies", desc:"쿠키 데이터" },
      { path:"C:\\Users\\<user>\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache\\", desc:"캐시 파일 (일부 복원 가능)" },
    ],
    tools:[
      { name:"Hindsight", desc:"Chrome·Chromium 전용 포렌식 도구. 방문 기록·다운로드·쿠키·캐시 통합 분석", cmd:"hindsight.py -i \"Chrome\\User Data\\Default\" -o output\\" },
      { name:"DB Browser for SQLite", desc:"SQLite DB 직접 열람. 테이블 구조 확인에 유용", cmd:"(GUI 도구)" },
      { name:"BrowsingHistoryView", desc:"여러 브라우저 통합 히스토리 뷰어", cmd:"(GUI 도구)" },
    ],
    keyItems:[
      {
        name:"방문 기록 (urls·visits 테이블)", threat:true,
        desc:"방문한 모든 URL과 방문 시간. C2 서버 도메인, 피싱 사이트, 악성 파일 호스팅 사이트 탐지.",
        parse_output:`[urls 테이블 + visits 테이블 조인 결과]
visit_time(UTC)       url                                                   title                    visit_count
--------------------------------------------------------------------------------------------------------------------
2024-09-02 09:13:20   http://attacker-cdn[.]com/docs/공문.docx               문서 다운로드               1
2024-09-02 09:13:22   http://attacker-cdn[.]com/docs/공문.docx               문서 다운로드               2  (리다이렉트)
2024-09-02 09:35:01   https://update-ms-cdn[.]com/beacon                    (빈 페이지)                1  ← C2 비콘!
2024-09-02 09:35:02   https://update-ms-cdn[.]com/beacon                    (빈 페이지)                2
2024-09-10 22:00:00   https://wetransfer.com/uploads                        WeTransfer               1  ← 파일 업로드!
2024-09-10 22:05:44   https://wetransfer.com/downloads/...                  다운로드 링크              1`,
        interpretation:[
          { field:"visit_time (WebKit 타임스탬프)", meaning:"1601-01-01 기준 마이크로초 단위. DB Browser나 Hindsight가 자동 변환. 수동 변환: (값 - 11644473600000000) / 1000000 → Unix timestamp" },
          { field:"visit_count > 1", meaning:"같은 URL 여러 번 방문 또는 리다이렉트 체인. C2 비콘이 반복 전송될 때 나타남" },
          { field:"C2 도메인 패턴", meaning:"update-, cdn-, cdn-delivery-, ms-update- 등 Microsoft 위장 도메인. IP 직접 접속(http://123.456.x.x) 패턴도 주목" },
          { field:"파일 업로드 서비스 접속", meaning:"WeTransfer, Google Drive, Dropbox, Mega 등 클라우드 스토리지 → 데이터 유출 경로 의심" },
        ],
        forensic:"C2 도메인 방문 이력 + SRUM 네트워크 사용량 조합으로 통신 시간과 용량 모두 증명 가능.",
        ioc:"Microsoft 위장 도메인, IP 직접 접속 URL, 파일 업로드 서비스 접속",
      },
      {
        name:"다운로드 기록 (downloads 테이블)", threat:true,
        desc:"다운로드한 파일의 URL, 저장 경로, 크기, 시작·완료 시간이 기록된다. referrer로 파일의 출처 사이트도 파악.",
        parse_output:`[downloads 테이블]
start_time            end_time              target_path                                          total_bytes  referrer                              state
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
2024-09-02 09:13:45   2024-09-02 09:13:46   C:\\Users\\victim\\Downloads\\방산청_협력사_공문_2024.docx  245760       http://attacker-cdn[.]com/phishing/    COMPLETE
2024-09-02 09:31:50   2024-09-02 09:32:05   C:\\Users\\victim\\Downloads\\update_tool.exe              2457600      http://attacker-cdn[.]com/tools/       COMPLETE
2024-09-10 21:58:00   (null)                C:\\Staging\\archive.7z                                  (partial)    (없음)                                INTERRUPTED`,
        interpretation:[
          { field:"target_path (저장 경로)", meaning:"파일이 저장된 경로. Downloads 폴더가 아닌 비정상 경로(Staging, Temp 등)는 공격자가 직접 지정한 것" },
          { field:"referrer (출처 URL)", meaning:"파일을 다운로드한 페이지의 URL. 피싱 사이트, C2 서버, 악성 다운로드 페이지 특정 가능" },
          { field:"total_bytes vs 실제 파일 크기", meaning:"다운로드 완료 크기와 MFT 파일 크기가 일치하면 동일 파일 확인. 불일치 시 중간 처리 의심" },
          { field:"state=INTERRUPTED", meaning:"다운로드 중단. 큰 파일 업로드/다운로드 시도 흔적. partial 파일이 남아있을 수 있음" },
        ],
        forensic:"referrer URL이 공격자 인프라와 일치하면 최초 침투 경로 직접 증명. 저장 경로의 MFT 타임스탬프와 교차 확인.",
        ioc:"Downloads 외 비정상 경로 저장, .exe .bat .ps1 파일 다운로드, 공격자 도메인 referrer",
      },
    ],
    tips:[
      "시크릿/InPrivate 모드 사용 시 History DB에 기록 없음 → SRUM·DNS 캐시·방화벽 로그로 보완",
      "Chrome은 WAL(Write-Ahead Log) 사용 — History-wal 파일도 함께 가져와야 최신 데이터 확인",
      "Hindsight로 캐시 분석 시 공격자가 방문한 페이지 일부 복원 가능",
      "Login Data 파일: 저장된 자격증명(암호화). DPAPI 키로 복호화 가능",
      "방문 기록 삭제해도 SQLite freelist 영역에 일부 데이터 잔존 가능성 있음",
    ],
  },
  {
    id:"srum", icon:"📊", name:"SRUM", subtitle:"System Resource Usage Monitor",
    color:"#a29bfe", category:"네트워크",
    summary:"Windows 8 이후 도입. 모든 프로세스의 네트워크 사용량·CPU·메모리를 최대 30일간 기록하는 ESE 데이터베이스. 악성 파일이 삭제된 후에도 통신 이력과 유출량을 증명할 수 있다.",
    locations:[
      { path:"C:\\Windows\\System32\\sru\\SRUDB.dat", desc:"SRUM 메인 DB (ESE 형식)" },
      { path:"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SRUM\\Extensions\\", desc:"SRUM 확장 설정 레지스트리" },
    ],
    tools:[
      { name:"SrumECmd", desc:"Eric Zimmerman SRUM 파서. 네트워크·앱 사용량 CSV 출력", cmd:"SrumECmd.exe -f SRUDB.dat --csv output\\ --csvf srum.csv" },
      { name:"srum-dump", desc:"오픈소스 Python 파서", cmd:"python srum_dump.py SRUDB.dat -t SOFTWARE -o output.xlsx" },
    ],
    keyItems:[
      {
        name:"네트워크 사용량 ({DD6636C4-...} 테이블)", threat:true,
        desc:"프로세스별 네트워크 송수신 바이트를 시간대별로 기록. 데이터 유출 규모와 시점을 정확히 측정.",
        parse_output:`[네트워크 사용량 테이블]
TimeStamp              ExeInfo                                    UserId   BytesSent    BytesRecvd   ConnectStartTime
---------------------------------------------------------------------------------------------------------------------------------
2024-09-02 09:35:00    C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe  S-1-5-18  1024         48620        2024-09-02 09:35:01
2024-09-02 10:00:00    C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe  S-1-5-18  2048         52428        2024-09-02 09:35:01
2024-09-10 22:30:00    C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe  S-1-5-18  487302144    12288        2024-09-10 22:30:05  ← 대용량 송신!
2024-09-10 22:30:00    C:\\Windows\\System32\\svchost.exe             S-1-5-18  128          24576        -
2024-09-15 03:00:00    (삭제된 파일 경로)\\svcupd.exe                S-1-5-18  1024         512          2024-09-15 02:59:00`,
        interpretation:[
          { field:"ExeInfo (실행 파일 경로)", meaning:"파일이 삭제된 후에도 경로 기록이 30일간 유지됨. 삭제된 악성 파일의 통신 이력 증명 가능" },
          { field:"BytesSent (송신 바이트)", meaning:"외부로 전송한 데이터량. 대용량(수십~수백 MB) 송신은 데이터 유출 강력 의심. 487MB = 압축 파일 크기와 일치하면 확정" },
          { field:"BytesRecvd (수신 바이트)", meaning:"C2에서 받은 데이터. 명령·페이로드 수신 패턴. 주기적 수신은 비콘 통신" },
          { field:"ConnectStartTime", meaning:"TCP 연결 시작 시간. 네트워크 연결의 정확한 시작 시점 추적 가능" },
          { field:"UserId (SID)", meaning:"해당 통신을 수행한 계정의 SID. S-1-5-18=SYSTEM 권한으로 실행된 프로세스" },
        ],
        forensic:"BytesSent가 수백 MB인 프로세스 → 유출 주체. 유출 시간 + MFT 압축 파일 크기 + 브라우저 업로드 기록 3중 교차 검증.",
        ioc:"svcupd.exe BytesSent: 487,302,144 bytes (09-10 22:30), 비정상 경로 프로세스 대용량 송신",
      },
      {
        name:"앱 리소스 사용량 ({973F5D5C-...} 테이블)", threat:false,
        desc:"CPU·메모리·포그라운드/백그라운드 실행 시간 기록. 프로세스가 언제 얼마나 실행됐는지 파악.",
        parse_output:`[앱 리소스 테이블]
TimeStamp              ExeInfo                                    ForegroundCycleTime  BackgroundCycleTime  ForegroundContextSwitches
------------------------------------------------------------------------------------------------------------------------------------------------
2024-09-02 09:32:00    C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe  0                    8923756281           45231    ← 백그라운드만 실행
2024-09-02 09:31:00    C:\\Windows\\System32\\cmd.exe                 1234567890           0                    892
2024-09-02 09:31:00    C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe  9876543210  2345678901  15432`,
        interpretation:[
          { field:"ForegroundCycleTime=0, BackgroundCycleTime 존재", meaning:"사용자 화면에 표시 없이 백그라운드에서만 실행됨. 악성코드의 전형적인 실행 패턴" },
          { field:"CPU 사이클 시간", meaning:"높은 값 = 많은 CPU 사용. 암호화(랜섬웨어), 해시 크래킹, 대용량 파일 압축 시 높게 나타남" },
        ],
        forensic:"ForegroundCycleTime=0인 악성 프로세스는 사용자 몰래 백그라운드 실행 중인 악성코드.",
        ioc:"백그라운드 전용 실행(ForegroundCycleTime=0), 비정상 경로 프로세스 높은 CPU 사용",
      },
    ],
    tips:[
      "SRUM은 현재 운영 중인 시스템에서는 잠금 상태 → 오프라인 분석 또는 볼륨 섀도 복사본 활용",
      "SrumECmd 실행 시 SOFTWARE 하이브도 함께 제공해야 앱 이름 정확히 매핑됨",
      "30일이 지난 데이터는 자동 삭제. 최대한 빠른 수집이 중요",
      "프로세스 경로가 없는 SID 항목은 삭제된 서비스 계정이나 도메인 계정일 수 있음",
      "타임스탬프는 UTC 기준 1시간 단위 집계. ConnectStartTime으로 정확한 시작 시간 확인",
    ],
  },
];

const CAT_COLOR = {
  로그:"#4cc9f0", 설정:"#d2a8ff", 실행흔적:"#ffd166",
  파일시스템:"#06d6a0", 사용자행위:"#ffa657", 네트워크:"#a29bfe",
};

// ══════════════════════════════════════════════════════
// 레지스트리 하이브 & 키 데이터베이스
// ══════════════════════════════════════════════════════
const REG_HIVES = [
  {
    id:"sam", name:"SAM", color:"#ff4d6d",
    path:"C:\\Windows\\System32\\config\\SAM",
    desc:"로컬 사용자 계정 정보와 패스워드 해시 저장. 운영 중엔 SYSTEM만 접근 가능.",
    rootKey:"HKLM\\SAM",
    recmd:"RECmd.exe -f SAM --bn BatchExamples\\SAM.reb --csv output\\",
    contents:["로컬 사용자 계정 목록","NTLM 패스워드 해시 (암호화)","계정 생성·수정·마지막 로그온 시간","로그인 실패 횟수·잠금 상태","계정 RID (상대 식별자)"],
  },
  {
    id:"system", name:"SYSTEM", color:"#ffd166",
    path:"C:\\Windows\\System32\\config\\SYSTEM",
    desc:"시스템 부팅 설정, 서비스, 드라이버, 네트워크, 타임존 등 핵심 시스템 구성.",
    rootKey:"HKLM\\SYSTEM",
    recmd:"RECmd.exe -f SYSTEM --bn BatchExamples\\System.reb --csv output\\",
    contents:["설치된 서비스 목록 (Services)","네트워크 인터페이스 설정","타임존 정보 (분석 시 필수!)","USB/장치 연결 이력 (USBSTOR)","마운트된 볼륨 목록","ControlSet 선택 정보"],
  },
  {
    id:"software", name:"SOFTWARE", color:"#4cc9f0",
    path:"C:\\Windows\\System32\\config\\SOFTWARE",
    desc:"설치된 프로그램, 자동실행 항목, Windows 정책, OS 버전 등 소프트웨어 설정.",
    rootKey:"HKLM\\SOFTWARE",
    recmd:"RECmd.exe -f SOFTWARE --bn BatchExamples\\Software.reb --csv output\\",
    contents:["자동실행 Run·RunOnce 키","설치된 프로그램 목록 (Uninstall)","Windows Defender 설정","최근 실행 명령어 (RunMRU)","RDP 설정","보안 정책 (Policies)","OS 버전·빌드 정보"],
  },
  {
    id:"security", name:"SECURITY", color:"#a29bfe",
    path:"C:\\Windows\\System32\\config\\SECURITY",
    desc:"도메인 인증 정보, LSA 비밀, 캐시된 도메인 자격증명 저장.",
    rootKey:"HKLM\\SECURITY",
    recmd:"RECmd.exe -f SECURITY --bn BatchExamples\\Security.reb --csv output\\",
    contents:["LSA Secrets (서비스 계정 패스워드)","캐시된 도메인 로그온 자격증명 (DCC2)","도메인 신뢰 관계 정보","감사 정책 설정"],
  },
  {
    id:"ntuser", name:"NTUSER.DAT", color:"#06d6a0",
    path:"C:\\Users\\<username>\\NTUSER.DAT",
    desc:"각 사용자별 설정. 최근 문서·실행 프로그램·탐색기 설정·쉘백 등 사용자 행위 기록.",
    rootKey:"HKCU\\",
    recmd:"RECmd.exe -f NTUSER.DAT --bn BatchExamples\\NTUser.reb --csv output\\",
    contents:["사용자 Run·RunOnce 자동실행","최근 열어본 문서 (RecentDocs)","실행한 프로그램 목록 (UserAssist)","검색 기록 (WordWheelQuery)","RDP 접속 이력 (Terminal Server Client)","탐색기 설정·쉘백 (BagMRU)","TypedPaths (주소창 입력 경로)"],
  },
  {
    id:"usrclass", name:"UsrClass.dat", color:"#ffa657",
    path:"C:\\Users\\<username>\\AppData\\Local\\Microsoft\\Windows\\UsrClass.dat",
    desc:"사용자 쉘백 데이터의 주요 저장소. 탐색기로 열어본 폴더 전체 이력.",
    rootKey:"HKCU\\Software\\Classes",
    recmd:"RECmd.exe -f UsrClass.dat --bn BatchExamples\\UsrClass.reb --csv output\\",
    contents:["쉘백 (BagMRU) — 탐색기 폴더 접근 이력","ZIP·폴더 내부 탐색 이력","외부 드라이브 탐색 경로"],
  },
  {
    id:"amcache", name:"Amcache.hve", color:"#4ecdc4",
    path:"C:\\Windows\\AppCompat\\Programs\\Amcache.hve",
    desc:"실행된 프로그램의 해시·경로·설치시간을 기록. 삭제된 악성파일도 흔적이 남음.",
    rootKey:"Root\\",
    recmd:"RECmd.exe -f Amcache.hve --bn BatchExamples\\Amcache.reb --csv output\\",
    contents:["실행 파일 전체 경로","SHA-1 해시 값 (악성코드 식별 가능)","파일 크기·컴파일 시간","설치·실행 시간","삭제된 파일도 기록 유지"],
  },
];

const REG_KEYS = [
  // ─ 지속성 ─
  {
    id:"run", category:"지속성", threat:true, color:"#ff4d6d",
    name:"Run / RunOnce",
    hive:"SOFTWARE / NTUSER.DAT",
    path:"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\nHKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce\nHKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
    desc:"시스템 시작 또는 사용자 로그온 시 자동으로 실행되는 프로그램을 등록. 악성코드 지속성 확보에 가장 많이 사용.",
    recmd_plugin:"run",
    parse_output:`값 이름(Name)          데이터(Data)
--------------------------------------------------
WindowsUpdate         C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe /silent
OneDrive              C:\\Program Files\\OneDrive\\OneDrive.exe /background
SecurityHealth        C:\\Windows\\System32\\SecurityHealthSystray.exe`,
    interpretation:[
      { field:"값 이름(Name)", meaning:"자동실행 항목 식별자. 정상: 알려진 프로그램명 / 의심: 랜덤문자열, 시스템 이름 위장(svchost32, WindowsUpdate 등)" },
      { field:"데이터(Data)", meaning:"실행될 파일 경로. 정상: Program Files, System32 / 의심: Temp, AppData\\Local, ProgramData, Users\\Public 등 비정상 경로" },
      { field:"LastWrite 시간", meaning:"키 마지막 수정 시간. 침해 시점과 일치하면 직접 증거" },
    ],
    forensic:"경로가 Temp·AppData·ProgramData면 90% 의심. RunOnce는 1회 실행 후 삭제 → 드롭퍼에서 자주 사용.",
    ioc_example:"C:\\Users\\victim\\AppData\\Local\\Temp\\update.exe\nC:\\ProgramData\\MicrosoftUpdate\\svcupd.exe",
  },
  {
    id:"services", category:"지속성", threat:true, color:"#ff4d6d",
    name:"Services",
    hive:"SYSTEM",
    path:"HKLM\\SYSTEM\\CurrentControlSet\\Services\\<ServiceName>",
    desc:"설치된 모든 서비스 목록. 악성 서비스 설치로 재부팅 후에도 지속성 확보.",
    recmd_plugin:"services",
    parse_output:`서비스명              실행파일 경로                           시작유형    상태
---------------------------------------------------------------------------------------------
malware_svc           C:\\Windows\\Temp\\malware_svc.exe          Auto        Running
wuauserv              C:\\Windows\\System32\\svchost.exe -k netsvcs  Auto      Running
PSEXESVC              C:\\Windows\\PSEXESVC.exe                   Demand      Stopped`,
    interpretation:[
      { field:"서비스명(ServiceName)", meaning:"정상: Microsoft 공식 서비스명 / 의심: 오타나 변형(wuauserv → wuauserv2), 알 수 없는 이름" },
      { field:"실행파일 경로(ImagePath)", meaning:"정상: System32, SysWOW64 / 의심: Temp, AppData, ProgramData, Users\\Public" },
      { field:"시작유형(StartType)", meaning:"0=Boot, 1=System, 2=Auto(자동), 3=Demand(수동), 4=Disabled. Auto로 설정 시 부팅마다 실행" },
      { field:"PSEXESVC", meaning:"PsExec 도구 사용 흔적. 원격 실행 시 자동 생성되는 서비스" },
    ],
    forensic:"비정상 경로 + Auto StartType 조합이면 악성 서비스. PSEXESVC 존재 시 PsExec을 통한 측면 이동 의심.",
    ioc_example:"ImagePath: C:\\Windows\\Temp\\svc.exe\nServiceName: PSEXESVC",
  },
  {
    id:"scheduledtasks_reg", category:"지속성", threat:true, color:"#ff4d6d",
    name:"예약 작업 (레지스트리)",
    hive:"SOFTWARE",
    path:"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Schedule\\TaskCache\\Tasks\nHKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Schedule\\TaskCache\\Tree",
    desc:"예약 작업의 메타데이터가 레지스트리에도 저장됨. C:\\Windows\\System32\\Tasks\\ 파일과 교차 확인.",
    recmd_plugin:"scheduledtasks",
    parse_output:`작업명                        경로                                    마지막 실행
---------------------------------------------------------------------------------------
MicrosoftEdgeUpdateCore       \\Microsoft\\Edge\\MicrosoftEdgeUpdateCore   2024-09-02 09:33
WindowsDefenderScheduledScan  \\Microsoft\\Windows Defender\\...           2024-09-01 03:00
악성작업_임시               \\악성작업_임시                              2024-09-02 09:33`,
    interpretation:[
      { field:"작업명(TaskName)", meaning:"정상: Microsoft 공식 이름 / 의심: 무작위 문자열, Microsoft 이름 위장" },
      { field:"경로(Path)", meaning:"루트 경로(\\)에 직접 위치한 작업은 의심. 정상은 \\Microsoft\\... 하위" },
      { field:"마지막 실행(LastRunTime)", meaning:"침해 시간대와 일치하는지 확인" },
    ],
    forensic:"경로가 루트(\\)인 작업, 이름이 정상 Microsoft 작업과 유사하게 위장한 것 주의.",
    ioc_example:"\\MicrosoftEdgeUpdateCore (정상 위장)\n실행파일: C:\\ProgramData\\svcupd.exe",
  },
  {
    id:"winlogon", category:"지속성", threat:true, color:"#ff4d6d",
    name:"Winlogon",
    hive:"SOFTWARE",
    path:"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon",
    desc:"로그온 프로세스 설정. Userinit·Shell 값 변조로 로그온 시 악성코드 실행 가능.",
    recmd_plugin:"winlogon",
    parse_output:`값 이름        정상 값                              현재 값
-----------------------------------------------------------------------
Userinit       C:\\Windows\\System32\\userinit.exe,     C:\\Windows\\System32\\userinit.exe, C:\\Temp\\backdoor.exe
Shell          explorer.exe                          explorer.exe
AutoAdminLogon 0                                     0`,
    interpretation:[
      { field:"Userinit", meaning:"정상: userinit.exe, 만 있어야 함. 추가 항목(쉼표 뒤)은 로그온 시 함께 실행됨 → 즉시 의심" },
      { field:"Shell", meaning:"정상: explorer.exe / 변조 시: 악성 실행파일로 대체되어 데스크톱 대신 악성코드 실행" },
      { field:"AutoAdminLogon", meaning:"1이면 자동 로그온 → DefaultUserName·DefaultPassword 값에 자격증명 평문 저장" },
    ],
    forensic:"Userinit 값에 쉼표 뒤 추가 경로가 있으면 반드시 확인. Shell 변조는 드물지만 강력한 지속성 기법.",
    ioc_example:"Userinit: userinit.exe, C:\\Temp\\backdoor.exe",
  },
  {
    id:"appinitdlls", category:"지속성", threat:true, color:"#ff4d6d",
    name:"AppInit_DLLs",
    hive:"SOFTWARE",
    path:"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Windows\\AppInit_DLLs\nHKLM\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows NT\\CurrentVersion\\Windows\\AppInit_DLLs",
    desc:"모든 GUI 프로세스 실행 시 지정된 DLL이 자동으로 로드됨. DLL 인젝션 지속성 기법.",
    recmd_plugin:"appinit",
    parse_output:`값 이름          데이터
----------------------------------------------------
AppInit_DLLs     C:\\Windows\\Temp\\inject.dll
LoadAppInit_DLLs 1`,
    interpretation:[
      { field:"AppInit_DLLs", meaning:"정상: 비어있거나 알려진 보안 소프트웨어 DLL / 의심: 비정상 경로 DLL" },
      { field:"LoadAppInit_DLLs", meaning:"1이면 AppInit_DLLs 활성화 상태. 기본값 0이어야 정상" },
    ],
    forensic:"LoadAppInit_DLLs=1 + 비정상 DLL 경로 → 모든 GUI 프로세스에 악성 DLL 인젝션.",
    ioc_example:"AppInit_DLLs: C:\\Windows\\Temp\\inject.dll\nLoadAppInit_DLLs: 1",
  },
  // ─ 방어 우회 ─
  {
    id:"defender", category:"방어우회", threat:true, color:"#ffa657",
    name:"Windows Defender 비활성화",
    hive:"SOFTWARE",
    path:"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\nHKLM\\SOFTWARE\\Microsoft\\Windows Defender\\Features",
    desc:"Windows Defender(AV) 실시간 보호, 스캔 등을 레지스트리로 비활성화.",
    recmd_plugin:"defender",
    parse_output:`키 경로: HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender
값 이름                      데이터    의미
---------------------------------------------------------
DisableAntiSpyware           1         AntiSpyware 비활성화
DisableAntiVirus             1         AntiVirus 비활성화
DisableRealtimeMonitoring    1         실시간 보호 비활성화
DisableBehaviorMonitoring    1         행위 기반 탐지 비활성화
DisableIOAVProtection        1         다운로드 파일 스캔 비활성화`,
    interpretation:[
      { field:"DisableAntiSpyware / DisableAntiVirus", meaning:"1이면 완전 비활성화. 공격자가 가장 먼저 실행하는 방어 우회 조치" },
      { field:"DisableRealtimeMonitoring", meaning:"실시간 보호 비활성화. 악성코드 실행 전 선행 조치" },
      { field:"Policies vs Features 키", meaning:"Policies 키의 설정이 우선 적용됨. Features 키만 변경된 경우도 확인 필요" },
    ],
    forensic:"이 키의 LastWrite 시간이 악성 파일 드롭 직전이면 공격자가 의도적으로 방어 비활성화한 증거.",
    ioc_example:"DisableAntiSpyware=1 (LastWrite: 2024-09-02 09:34)",
  },
  {
    id:"uac_bypass", category:"방어우회", threat:true, color:"#ffa657",
    name:"UAC 우회",
    hive:"SOFTWARE",
    path:"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\nHKCU\\SOFTWARE\\Classes\\ms-settings\\shell\\open\\command",
    desc:"UAC(사용자 계정 컨트롤) 설정 변경 또는 우회 기법 흔적.",
    recmd_plugin:"uac",
    parse_output:`키: HKLM\\...\\Policies\\System
값 이름              데이터    의미
----------------------------------------------
EnableLUA            0         UAC 완전 비활성화 ← 위험
ConsentPromptBehaviorAdmin  0  관리자 승인 없이 권한상승
PromptOnSecureDesktop 0        보안 데스크톱 없이 승인

키: HKCU\\SOFTWARE\\Classes\\ms-settings\\shell\\open\\command
DelegateExecute      (비어있음)
(Default)            cmd.exe /c powershell -ep bypass  ← UAC 우회 페이로드`,
    interpretation:[
      { field:"EnableLUA=0", meaning:"UAC 완전 비활성화. 모든 프로그램이 관리자 권한으로 실행됨" },
      { field:"ms-settings DelegateExecute", meaning:"fodhelper.exe UAC 우회 기법. HKCU 키 생성으로 관리자 없이 권한상승" },
      { field:"(Default) 값의 명령어", meaning:"UAC 우회 시 실행될 페이로드. PowerShell, cmd 등이 여기에 기록됨" },
    ],
    forensic:"ms-settings\\shell\\open\\command 키 존재 자체가 UAC 우회 시도 강력한 증거.",
    ioc_example:"HKCU\\...\\ms-settings\\shell\\open\\command: cmd.exe /c powershell -ep bypass",
  },
  // ─ 사용자 행위 ─
  {
    id:"userassist", category:"사용자행위", threat:false, color:"#4cc9f0",
    name:"UserAssist",
    hive:"NTUSER.DAT",
    path:"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist\\{GUID}\\Count",
    desc:"탐색기에서 실행한 프로그램 목록과 실행 횟수·마지막 실행 시간. ROT13 인코딩.",
    recmd_plugin:"userassist",
    parse_output:`프로그램명(ROT13 디코딩)                      실행횟수  마지막 실행
---------------------------------------------------------------------------
C:\\Windows\\System32\\cmd.exe                     23        2024-09-02 10:02
C:\\Users\\victim\\AppData\\Local\\Temp\\malware.exe   3         2024-09-02 09:32
C:\\Program Files\\Google\\Chrome\\chrome.exe         156       2024-09-01 18:45
Microsoft.Windows.Explorer                         89        2024-09-02 09:00`,
    interpretation:[
      { field:"프로그램 경로", meaning:"ROT13 인코딩으로 저장됨. RECmd가 자동 디코딩. 실행 경로 확인 필수" },
      { field:"실행 횟수(RunCount)", meaning:"비정상적으로 높은 횟수 → 반복 실행 또는 자동화. 1회만 실행 후 삭제된 악성코드도 확인 가능" },
      { field:"마지막 실행 시간(LastExecuted)", meaning:"침해 시간대와 대조. 파일 삭제 후에도 실행 이력 남음" },
    ],
    forensic:"Temp, AppData 경로 프로그램의 실행 횟수와 시간은 악성코드 실행 직접 증거.",
    ioc_example:"C:\\Users\\victim\\AppData\\Local\\Temp\\malware.exe (실행횟수: 3, 최종: 09:32)",
  },
  {
    id:"recentdocs", category:"사용자행위", threat:false, color:"#4cc9f0",
    name:"RecentDocs",
    hive:"NTUSER.DAT",
    path:"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs",
    desc:"사용자가 최근 열어본 파일 목록. 파일 유형별로 분류되어 저장.",
    recmd_plugin:"recentdocs",
    parse_output:`파일명                                    확장자   마지막 접근
-----------------------------------------------------------------------
방산청_협력사_공문_2024.docx              .docx    2024-09-02 09:14
기술_연구_보고서_기밀.pdf                 .pdf     2024-09-03 14:30
employee_credentials.xlsx                .xlsx    2024-09-04 11:20
C:\\Staging\\collect.bat                  .bat     2024-09-05 09:00`,
    interpretation:[
      { field:"파일명", meaning:"파일 삭제 후에도 MRU 목록에 남음. 공격자가 접근한 파일명 직접 확인" },
      { field:"확장자별 분류", meaning:"RECmd는 확장자별로 그룹화. .exe .bat .ps1 등 실행 파일 접근 이력 주목" },
      { field:"마지막 접근 시간", meaning:"LNK 파일과 교차 검증하면 더 강력한 증거" },
    ],
    forensic:"기밀문서, 자격증명 파일명이 MRU에 있으면 공격자가 해당 파일을 열람한 직접 증거.",
    ioc_example:"employee_credentials.xlsx (접근: 2024-09-04 11:20)",
  },
  {
    id:"wordwheelquery", category:"사용자행위", threat:false, color:"#4cc9f0",
    name:"WordWheelQuery (탐색기 검색)",
    hive:"NTUSER.DAT",
    path:"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\WordWheelQuery",
    desc:"탐색기 검색창에 입력한 검색어 목록. 공격자가 내부 파일 정찰 시 사용.",
    recmd_plugin:"wordwheelquery",
    parse_output:`순서  검색어
------------------------------
0     password
1     credential
2     admin
3     vpn config
4     ssh key
5     .pem
6     secret`,
    interpretation:[
      { field:"검색어(MRUList 순서)", meaning:"최근 순서대로 정렬. 0이 가장 최근" },
      { field:"검색 내용", meaning:"password, credential, admin, vpn 등 공격자가 민감 정보 탐색 시 사용하는 키워드가 있으면 즉시 의심" },
    ],
    forensic:"공격자가 내부 파일 시스템에서 자격증명·키 파일을 검색한 흔적. 타임라인과 연계 분석.",
    ioc_example:"검색어: password, credential, ssh key, .pem",
  },
  {
    id:"typedpaths", category:"사용자행위", threat:false, color:"#4cc9f0",
    name:"TypedPaths (주소창 입력)",
    hive:"NTUSER.DAT",
    path:"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\TypedPaths",
    desc:"탐색기 주소창에 직접 타이핑한 경로 목록. 공격자가 직접 접근한 경로 파악.",
    recmd_plugin:"typedpaths",
    parse_output:`순서  입력된 경로
----------------------------------------------
url1  C:\\Staging
url2  \\\\192.168.10.20\\C$
url3  C:\\Windows\\Temp
url4  C:\\Users\\Administrator`,
    interpretation:[
      { field:"입력 경로", meaning:"탐색기에서 직접 타이핑한 경로만 기록. 즐겨찾기·클릭 접근은 포함 안 됨" },
      { field:"UNC 경로 (\\\\IP\\share)", meaning:"네트워크 공유 직접 접근. 내부 서버 측면 이동 경로 추적에 핵심" },
    ],
    forensic:"\\\\IP\\C$ 형태 UNC 경로는 측면 이동 직접 증거. C:\\Staging, C:\\Temp 등 수집 경로도 확인.",
    ioc_example:"\\\\192.168.10.20\\C$ → 내부 서버 직접 접근",
  },
  {
    id:"rdp_mru", category:"네트워크", threat:true, color:"#4ecdc4",
    name:"RDP 접속 이력 (MRU)",
    hive:"NTUSER.DAT",
    path:"HKCU\\SOFTWARE\\Microsoft\\Terminal Server Client\\Servers\nHKCU\\SOFTWARE\\Microsoft\\Terminal Server Client\\Default",
    desc:"원격 데스크톱(RDP)으로 접속했던 서버 목록과 사용한 계정명.",
    recmd_plugin:"terminalserverclient",
    parse_output:`서버 주소              사용 계정          마지막 접속
------------------------------------------------------------
192.168.10.20          Administrator      2024-09-02 11:15
192.168.10.50          admin              2024-09-05 03:22
10.0.0.5               victim             2024-09-01 09:00
RD-SRV-002             domain\\admin       2024-09-02 11:15`,
    interpretation:[
      { field:"서버 주소(ServerName)", meaning:"RDP로 접속한 대상 서버. 내부 IP면 측면 이동, 외부 IP면 데이터 유출 서버 의심" },
      { field:"사용 계정(UsernameHint)", meaning:"접속 시 입력한 계정명. 탈취한 계정(Administrator, admin) 사용 여부 확인" },
      { field:"MRU 순서", meaning:"Default 키의 MRU0~MRU9로 최근 접속 순서 파악" },
    ],
    forensic:"비업무 시간대 내부 서버 RDP + 관리자 계정 사용 조합 → 측면 이동 핵심 증거.",
    ioc_example:"192.168.10.20 (Administrator, 새벽 03:22)",
  },
  {
    id:"usbstor", category:"네트워크", threat:false, color:"#4ecdc4",
    name:"USBSTOR (USB 연결 이력)",
    hive:"SYSTEM",
    path:"HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR",
    desc:"연결된 USB 저장장치의 정보와 시리얼 번호. 법적으로 특정 USB 기기를 식별하는 핵심 증거.",
    recmd_plugin:"usbstor",
    parse_output:`장치 유형              벤더·제품명           시리얼 번호              마지막 연결
------------------------------------------------------------------------------------------
Disk&Ven_Samsung&...   Samsung USB Flash      AA9876543210&0          2024-09-02 09:10
Disk&Ven_Kingston&...  Kingston DataTraveler  001372954C3F34C1&0      2024-09-01 17:30
Disk&Ven_Generic&...   USB Mass Storage       5&1234abcd&0&00         2024-09-05 22:15`,
    interpretation:[
      { field:"장치 유형 문자열", meaning:"Disk&Ven_<벤더>&Prod_<제품>&Rev_<버전> 형식으로 제조사·제품 특정 가능" },
      { field:"시리얼 번호(SerialNumber)", meaning:"특정 USB 기기를 법적으로 식별하는 고유 값. LNK 파일의 볼륨 시리얼과 교차 확인" },
      { field:"LastWrite 시간", meaning:"해당 USB가 마지막으로 연결된 시간" },
    ],
    forensic:"시리얼 번호로 특정 USB 기기 식별 → 해당 USB 압수 시 직접 증거 연결 가능.",
    ioc_example:"Samsung USB (SN: AA9876543210) — 침해 시작 직전 연결",
  },
  {
    id:"mounteddevices", category:"네트워크", threat:false, color:"#4ecdc4",
    name:"MountedDevices",
    hive:"SYSTEM",
    path:"HKLM\\SYSTEM\\MountedDevices",
    desc:"마운트된 볼륨의 드라이브 문자 매핑. USB가 어떤 드라이브 문자로 마운트됐는지 파악.",
    recmd_plugin:"mounteddevices",
    parse_output:`드라이브 문자   볼륨 시리얼          장치 유형
-------------------------------------------------
C:             {GUID-시스템드라이브}   Fixed Disk
E:             0xA1B2C3D4            Removable (USB)
F:             0xE5F6A7B8            Removable (USB)
\\\\?\\Volume{...}  0xC9D0E1F2          CD-ROM`,
    interpretation:[
      { field:"드라이브 문자", meaning:"USB가 E:, F: 등으로 마운트. LNK 파일의 경로와 매핑하면 어떤 USB인지 특정" },
      { field:"볼륨 시리얼", meaning:"USBSTOR의 시리얼 번호와 연계하여 동일 기기 확인" },
    ],
    forensic:"LNK 파일에서 E:\\ 드라이브 경로 발견 → MountedDevices에서 해당 드라이브의 USB 시리얼 확인 → USBSTOR에서 기기 특정.",
    ioc_example:"E: = 볼륨시리얼 0xA1B2C3D4 → USBSTOR Samsung USB",
  },
  {
    id:"timezone", category:"시스템정보", threat:false, color:"#8b949e",
    name:"TimeZone (타임존)",
    hive:"SYSTEM",
    path:"HKLM\\SYSTEM\\CurrentControlSet\\Control\\TimeZoneInformation",
    desc:"시스템의 타임존 설정. 분석 시작 전 반드시 확인해야 하는 필수 정보.",
    recmd_plugin:"timezone",
    parse_output:`값 이름                  데이터
----------------------------------------------
TimeZoneKeyName          Korea Standard Time
ActiveTimeBias           -540  (UTC+9, 단위: 분)
Bias                     -540
StandardBias             0
DaylightBias             -60`,
    interpretation:[
      { field:"TimeZoneKeyName", meaning:"타임존 이름. Korea Standard Time = UTC+9" },
      { field:"ActiveTimeBias", meaning:"UTC 기준 오프셋(분). -540 = UTC+9(한국). 양수면 UTC보다 늦음" },
      { field:"Bias", meaning:"표준 시간대 오프셋. DaylightBias와 합산하면 서머타임 적용 시간 계산 가능" },
    ],
    forensic:"이 값 없이는 이벤트 로그의 시간이 어느 시간대인지 알 수 없음. 분석 시작 전 반드시 기록.",
    ioc_example:"Bias=-540 → 모든 시간을 UTC+9로 해석해야 함",
  },
  {
    id:"shimcache", category:"실행흔적", threat:false, color:"#ffd166",
    name:"Shimcache (AppCompatCache)",
    hive:"SYSTEM",
    path:"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\AppCompatCache",
    desc:"실행 가능한 파일의 경로·수정 시간 캐시. 파일이 삭제된 후에도 실행 가능했음을 증명.",
    recmd_plugin:"appcompatcache",
    parse_output:`순서  파일 경로                                          수정 시간              실행 여부
---------------------------------------------------------------------------------------
0     C:\\Windows\\System32\\cmd.exe                         2024-01-10 12:00        Executed
1     C:\\ProgramData\\MicrosoftUpdate\\svcupd.exe            2024-09-02 09:32        Executed  ← 의심
2     C:\\Windows\\Temp\\malware_svc.exe                      2024-09-02 09:35        Executed  ← 의심
3     C:\\Windows\\System32\\notepad.exe                      2023-06-14 08:00        Not executed`,
    interpretation:[
      { field:"파일 경로", meaning:"해당 경로에 실행 가능한 파일이 존재했음을 증명. 파일 삭제 후에도 기록 남음" },
      { field:"수정 시간", meaning:"파일의 마지막 수정 시간. MFT 타임스탬프와 비교하여 Timestomping 탐지" },
      { field:"실행 여부(Executed)", meaning:"Windows 8 이후 일부 버전에서만 제공. Executed 표시 시 확실한 실행 증거" },
    ],
    forensic:"삭제된 악성 파일도 Shimcache에 경로가 남으면 존재 및 실행 가능성 증명 가능.",
    ioc_example:"C:\\Windows\\Temp\\malware_svc.exe (Executed, 이후 삭제됨)",
  },
  {
    id:"sam_accounts", category:"계정정보", threat:true, color:"#d2a8ff",
    name:"SAM 계정 정보",
    hive:"SAM",
    path:"HKLM\\SAM\\SAM\\Domains\\Account\\Users",
    desc:"로컬 사용자 계정의 전체 목록과 계정 상태, 마지막 로그온 시간, 패스워드 해시.",
    recmd_plugin:"samparse",
    parse_output:`사용자명         RID    계정상태    생성시간              마지막 로그온           로그인횟수  패스워드 해시(NTLM)
---------------------------------------------------------------------------------------------------------------
Administrator    500    활성화      -                     2024-09-02 10:52        147        aad3b435...
Guest            501    비활성화    -                     Never                   0          -
admin_bak        1002   활성화      2024-09-02 09:33      2024-09-02 11:20        3          e3d7...  ← 백도어 의심
kim_finance      1001   활성화      2023-01-15 09:00      2024-09-02 09:00        892        8846...`,
    interpretation:[
      { field:"RID (상대 식별자)", meaning:"500=기본 Administrator, 501=Guest, 1000+= 일반 사용자. 1000 이상 계정 중 낯선 것 확인" },
      { field:"생성 시간", meaning:"침해 시간대에 생성된 계정 → 백도어 계정. 특히 Admin 이름 위장 계정 주의" },
      { field:"마지막 로그온 시간", meaning:"침해 시간대 관리자 계정 로그온 → 공격자 사용 의심" },
      { field:"NTLM 해시", meaning:"별도 오프라인 크래킹 도구로 패스워드 복원 가능. aad3b435b51404eeaad3b435b51404ee = 패스워드 없음" },
    ],
    forensic:"침해 시간대 생성된 신규 계정(RID 1000+)은 백도어 계정 1순위. 마지막 로그온 시간으로 공격자 사용 여부 확인.",
    ioc_example:"admin_bak (RID:1002, 생성: 09-02 09:33, 마지막 로그온: 11:20) → 백도어 계정",
  },
  {
    id:"lsa_secrets", category:"계정정보", threat:true, color:"#d2a8ff",
    name:"LSA Secrets",
    hive:"SECURITY",
    path:"HKLM\\SECURITY\\Policy\\Secrets",
    desc:"서비스 계정 패스워드, 자동 로그온 패스워드, 캐시된 도메인 자격증명 등 저장.",
    recmd_plugin:"lsasecrets",
    parse_output:`비밀 이름                의미
---------------------------------------------------
_SC_<ServiceName>        서비스 계정 패스워드
DefaultPassword          자동 로그온 패스워드 (평문)
CachedDefaultPassword    캐시된 자격증명
DPAPI_SYSTEM             DPAPI 마스터 키
NL$KM                    캐시된 도메인 로그온 키 (DCC2)
$MACHINE.ACC             도메인 컴퓨터 계정 패스워드`,
    interpretation:[
      { field:"_SC_<서비스명>", meaning:"해당 서비스가 사용하는 계정의 패스워드. 서비스 계정 탈취에 사용" },
      { field:"DefaultPassword", meaning:"자동 로그온 설정 시 패스워드가 여기에 저장됨. 평문 또는 간단 암호화" },
      { field:"NL$KM / CachedDefaultPassword", meaning:"도메인 연결 없이 로그온 가능한 캐시된 자격증명 (DCC2 해시)" },
    ],
    forensic:"LSA Secrets 추출은 오프라인 분석(SYSTEM+SECURITY 하이브 동시 필요)에서만 가능. Mimikatz의 주요 탈취 대상.",
    ioc_example:"DefaultPassword 값 존재 → 평문 패스워드 노출 위험",
  },
];

const REG_CATEGORIES = [
  { id:"all",      label:"전체" },
  { id:"지속성",   label:"🔴 지속성" },
  { id:"방어우회", label:"🟠 방어우회" },
  { id:"사용자행위",label:"🔵 사용자행위" },
  { id:"네트워크", label:"🟢 네트워크" },
  { id:"계정정보", label:"🟣 계정정보" },
  { id:"실행흔적", label:"🟡 실행흔적" },
  { id:"시스템정보",label:"⚪ 시스템정보" },
];

// ══════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════
export default function ArtifactGuide() {
  // 메인 화면 모드: "eventlog" | "registry" | "artifact"
  const [mode, setMode]           = useState("eventlog");

  // 이벤트 로그 관련
  const [searchQ, setSearchQ]     = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterThreat, setFilterThreat] = useState(false);
  const [selectedEv, setSelectedEv] = useState(null);

  // 레지스트리 관련
  const [regView, setRegView]     = useState("keys"); // "hives" | "keys"
  const [regCat, setRegCat]       = useState("all");
  const [regSearch, setRegSearch] = useState("");
  const [selectedHive, setSelectedHive] = useState(null);
  const [selectedKey, setSelectedKey]   = useState(null);
  const [keyTab, setKeyTab]       = useState("parse");

  // 기타 아티팩트 관련
  // selectedArt는 ArtifactDetailMode 내부로 이동됨
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

  // 레지스트리 키 필터링
  const filteredKeys = useMemo(() => {
    let list = REG_KEYS;
    if (regCat !== "all") list = list.filter(k => k.category === regCat);
    if (regSearch.trim()) {
      const q = regSearch.toLowerCase();
      list = list.filter(k =>
        k.name.toLowerCase().includes(q) ||
        k.desc.toLowerCase().includes(q) ||
        k.path.toLowerCase().includes(q) ||
        k.forensic.toLowerCase().includes(q)
      );
    }
    return list;
  }, [regCat, regSearch]);

  const totalEvents = ALL_EVENTS.length;
  const threatEvents = ALL_EVENTS.filter(e => e.threat).length;

  return (
    <div style={{ minHeight:"100vh", maxWidth:480, margin:"0 auto", background:"#010409", fontFamily:"'Noto Sans KR','Segoe UI',sans-serif", color:"#e6edf3", display:"flex", flexDirection:"column" }}>

      {/* ── 최상단 모드 탭 ── */}
      <div style={{ background:"#0d1117", borderBottom:"1px solid #21262d", padding:"8px 12px", display:"flex", gap:6, position:"sticky", top:0, zIndex:60 }}>
        <button onClick={() => setMode("eventlog")} style={{
          flex:1, padding:"8px 4px", borderRadius:8, border:"none", cursor:"pointer",
          background:mode==="eventlog"?"#4cc9f033":"#161b22",
          color:mode==="eventlog"?"#4cc9f0":"#8b949e",
          border:`1px solid ${mode==="eventlog"?"#4cc9f055":"#30363d"}`,
          fontSize:11, fontWeight:700, display:"flex", flexDirection:"column", alignItems:"center", gap:1,
        }}><span style={{fontSize:14}}>📋</span>이벤트 로그</button>
        <button onClick={() => setMode("registry")} style={{
          flex:1, padding:"8px 4px", borderRadius:8, border:"none", cursor:"pointer",
          background:mode==="registry"?"#d2a8ff33":"#161b22",
          color:mode==="registry"?"#d2a8ff":"#8b949e",
          border:`1px solid ${mode==="registry"?"#d2a8ff55":"#30363d"}`,
          fontSize:11, fontWeight:700, display:"flex", flexDirection:"column", alignItems:"center", gap:1,
        }}><span style={{fontSize:14}}>🗝</span>레지스트리</button>
        <button onClick={() => setMode("artifact")} style={{
          flex:1, padding:"8px 4px", borderRadius:8, border:"none", cursor:"pointer",
          background:mode==="artifact"?"#06d6a033":"#161b22",
          color:mode==="artifact"?"#06d6a0":"#8b949e",
          border:`1px solid ${mode==="artifact"?"#06d6a055":"#30363d"}`,
          fontSize:11, fontWeight:700, display:"flex", flexDirection:"column", alignItems:"center", gap:1,
        }}><span style={{fontSize:14}}>🗂</span>아티팩트</button>
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

      {/* ══════════════ 레지스트리 모드 ══════════════ */}
      {mode === "registry" && (
        <>
          {/* 서브 뷰 탭 */}
          <div style={{ background:"#0d1117", borderBottom:"1px solid #21262d", display:"flex", gap:0, position:"sticky", top:49, zIndex:50 }}>
            <button onClick={() => setRegView("hives")} style={{
              flex:1, padding:"10px 8px", border:"none", cursor:"pointer", background:"none",
              color:regView==="hives"?"#d2a8ff":"#8b949e",
              borderBottom:`2px solid ${regView==="hives"?"#d2a8ff":"transparent"}`,
              fontSize:12, fontWeight:regView==="hives"?700:400,
            }}>💾 하이브 파일 구조</button>
            <button onClick={() => setRegView("keys")} style={{
              flex:1, padding:"10px 8px", border:"none", cursor:"pointer", background:"none",
              color:regView==="keys"?"#d2a8ff":"#8b949e",
              borderBottom:`2px solid ${regView==="keys"?"#d2a8ff":"transparent"}`,
              fontSize:12, fontWeight:regView==="keys"?700:400,
            }}>🔑 핵심 키 & 파싱 결과</button>
          </div>

          {/* ── 하이브 파일 구조 뷰 ── */}
          {regView === "hives" && (
            <div style={{ flex:1, padding:14, paddingBottom:20 }}>
              <div style={{ background:"#d2a8ff10", border:"1px solid #d2a8ff33", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
                <div style={{ color:"#d2a8ff", fontWeight:700, fontSize:12, marginBottom:6 }}>🗝 레지스트리란?</div>
                <div style={{ color:"#e6edf3", fontSize:12, lineHeight:1.7 }}>Windows의 모든 설정을 저장하는 계층형 데이터베이스. 여러 개의 <strong style={{color:"#d2a8ff"}}>하이브(Hive) 파일</strong>로 구성되며, 각 파일마다 저장하는 정보가 다릅니다. 포렌식에서는 이 파일들을 오프라인으로 직접 로드하여 분석합니다.</div>
              </div>

              {REG_HIVES.map(hive => (
                <div key={hive.id} onClick={() => setSelectedHive(selectedHive?.id===hive.id?null:hive)} style={{
                  background: selectedHive?.id===hive.id ? hive.color+"15" : "#161b22",
                  border:`1px solid ${selectedHive?.id===hive.id ? hive.color+"55" : "#21262d"}`,
                  borderLeft:`4px solid ${hive.color}`,
                  borderRadius:10, padding:"13px 14px", marginBottom:8, cursor:"pointer",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ background:hive.color+"22", color:hive.color, borderRadius:6, padding:"3px 9px", fontFamily:"monospace", fontSize:12, fontWeight:800 }}>{hive.name}</span>
                    <span style={{ color:"#8b949e", fontSize:10 }}>{hive.rootKey}</span>
                    <span style={{ marginLeft:"auto", color:"#444c56", fontSize:14 }}>{selectedHive?.id===hive.id?"▲":"▼"}</span>
                  </div>
                  <div style={{ color:"#e6edf3", fontSize:12, lineHeight:1.5, marginBottom:selectedHive?.id===hive.id?8:0 }}>{hive.desc}</div>

                  {selectedHive?.id===hive.id && (
                    <div style={{ marginTop:10 }}>
                      {/* 파일 경로 */}
                      <div style={{ background:"#0d1117", border:"1px solid #21262d", borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
                        <div style={{ color:"#8b949e", fontSize:10, marginBottom:5 }}>📍 파일 경로</div>
                        <code style={{ color:hive.color, fontSize:11, fontFamily:"monospace", wordBreak:"break-all" }}>{hive.path}</code>
                      </div>
                      {/* 저장 내용 */}
                      <div style={{ background:"#0d1117", border:"1px solid #21262d", borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
                        <div style={{ color:"#8b949e", fontSize:10, marginBottom:8 }}>📦 저장 내용</div>
                        {hive.contents.map((c,i) => (
                          <div key={i} style={{ display:"flex", gap:8, marginBottom:5 }}>
                            <span style={{ color:hive.color, fontSize:11, flexShrink:0 }}>▸</span>
                            <span style={{ color:"#e6edf3", fontSize:11, lineHeight:1.5 }}>{c}</span>
                          </div>
                        ))}
                      </div>
                      {/* RECmd 명령어 */}
                      <div style={{ background:"#0d1117", border:"1px solid #06d6a033", borderRadius:8, padding:"10px 12px" }}>
                        <div style={{ color:"#06d6a0", fontSize:10, marginBottom:6 }}>🛠 RECmd 파싱 명령어</div>
                        <code style={{ display:"block", color:"#06d6a0", fontSize:10, fontFamily:"monospace", wordBreak:"break-all", lineHeight:1.6 }}>{hive.recmd}</code>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* 분석 순서 팁 */}
              <div style={{ background:"#ffd16610", border:"1px solid #ffd16630", borderRadius:10, padding:"13px 14px", marginTop:6 }}>
                <div style={{ color:"#ffd166", fontWeight:700, fontSize:12, marginBottom:8 }}>💡 하이브 분석 순서 (권장)</div>
                {["① SYSTEM → 타임존 확인 (분석 시작 전 필수!)", "② SAM → 로컬 계정·백도어 계정 확인", "③ SOFTWARE → Run키·서비스·설치 프로그램", "④ SECURITY → LSA Secrets·캐시 자격증명", "⑤ NTUSER.DAT → 사용자별 행위 분석", "⑥ UsrClass.dat → 쉘백 분석", "⑦ Amcache.hve → 실행 파일 해시 확인"].map((t,i) => (
                  <div key={i} style={{ color:"#e6edf3", fontSize:12, lineHeight:1.8 }}>{t}</div>
                ))}
              </div>
            </div>
          )}

          {/* ── 핵심 키 & 파싱 결과 뷰 ── */}
          {regView === "keys" && (
            <>
              {/* 검색 & 필터 */}
              <div style={{ background:"#0d1117", borderBottom:"1px solid #21262d", padding:"10px 12px", position:"sticky", top:97, zIndex:40 }}>
                <div style={{ position:"relative", marginBottom:8 }}>
                  <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13 }}>🔍</span>
                  <input value={regSearch} onChange={e=>setRegSearch(e.target.value)}
                    placeholder="키 이름, 경로, 설명 검색..."
                    style={{ width:"100%", padding:"8px 10px 8px 30px", background:"#161b22", border:"1px solid #30363d", borderRadius:8, color:"#e6edf3", fontSize:12, outline:"none", boxSizing:"border-box" }}
                  />
                  {regSearch && <button onClick={()=>setRegSearch("")} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#8b949e", cursor:"pointer", fontSize:13 }}>✕</button>}
                </div>
                <div style={{ display:"flex", overflowX:"auto", gap:5 }}>
                  {REG_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={()=>setRegCat(cat.id)} style={{
                      padding:"4px 10px", borderRadius:20, border:"none", cursor:"pointer", flexShrink:0,
                      background:regCat===cat.id?"#d2a8ff33":"#21262d",
                      color:regCat===cat.id?"#d2a8ff":"#8b949e",
                      border:`1px solid ${regCat===cat.id?"#d2a8ff55":"#30363d"}`,
                      fontSize:10, fontWeight:700,
                    }}>{cat.label}</button>
                  ))}
                </div>
              </div>

              {/* 키 목록 */}
              <div style={{ flex:1, padding:"10px 14px", paddingBottom:20 }}>
                {filteredKeys.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"40px 20px", color:"#8b949e" }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>🔍</div>
                    <div>검색 결과 없음</div>
                  </div>
                ) : filteredKeys.map(key => (
                  <button key={key.id} onClick={()=>{setSelectedKey(key); setKeyTab("parse");}} style={{
                    width:"100%", textAlign:"left",
                    background:key.threat?"#ff4d6d08":"#161b22",
                    border:`1px solid ${key.threat?"#ff4d6d33":"#21262d"}`,
                    borderLeft:`4px solid ${key.color}`,
                    borderRadius:10, padding:"12px 13px", marginBottom:7, cursor:"pointer",
                    display:"flex", gap:10, alignItems:"flex-start",
                  }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" }}>
                        <span style={{ color:key.color, fontWeight:800, fontSize:13 }}>{key.name}</span>
                        <span style={{ background:key.color+"22", color:key.color, borderRadius:10, padding:"1px 7px", fontSize:9, fontWeight:700 }}>{key.category}</span>
                        {key.threat && <span style={{ background:"#ff4d6d22", color:"#ff4d6d", borderRadius:4, padding:"1px 5px", fontSize:9, fontWeight:700 }}>⚠ 위협</span>}
                      </div>
                      <div style={{ color:"#8b949e", fontSize:11, lineHeight:1.5 }}>{key.desc}</div>
                      <div style={{ color:"#444c56", fontSize:10, fontFamily:"monospace", marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{key.hive}</div>
                    </div>
                    <span style={{ color:"#444c56", fontSize:14, flexShrink:0 }}>›</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── 키 상세 바텀시트 ── */}
          {selectedKey && (
            <div onClick={()=>setSelectedKey(null)} style={{ position:"fixed", inset:0, background:"#00000090", zIndex:200, display:"flex", alignItems:"flex-end" }}>
              <div onClick={e=>e.stopPropagation()} style={{ background:"#161b22", border:`1px solid ${selectedKey.color}44`, borderRadius:"16px 16px 0 0", padding:"18px 16px", width:"100%", maxWidth:480, margin:"0 auto", maxHeight:"88vh", overflowY:"auto" }}>
                <div style={{ width:36, height:4, background:"#30363d", borderRadius:2, margin:"0 auto 14px" }}/>

                {/* 헤더 */}
                <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:5 }}>
                      <span style={{ background:selectedKey.color+"22", color:selectedKey.color, borderRadius:6, padding:"2px 9px", fontSize:12, fontWeight:800 }}>{selectedKey.name}</span>
                      <span style={{ background:selectedKey.color+"15", color:selectedKey.color, borderRadius:10, padding:"2px 7px", fontSize:10 }}>{selectedKey.category}</span>
                      {selectedKey.threat && <span style={{ background:"#ff4d6d22", color:"#ff4d6d", borderRadius:4, padding:"2px 7px", fontSize:10, fontWeight:700 }}>⚠ 위협 지표</span>}
                    </div>
                    <div style={{ color:"#e6edf3", fontSize:13, lineHeight:1.6 }}>{selectedKey.desc}</div>
                  </div>
                </div>

                {/* 경로 */}
                <div style={{ background:"#0d1117", border:"1px solid #21262d", borderRadius:8, padding:"10px 12px", marginBottom:10 }}>
                  <div style={{ color:"#8b949e", fontSize:10, marginBottom:5 }}>📍 레지스트리 경로</div>
                  <code style={{ color:selectedKey.color, fontSize:10, fontFamily:"monospace", wordBreak:"break-all", whiteSpace:"pre-line", lineHeight:1.7 }}>{selectedKey.path}</code>
                </div>

                {/* 탭 */}
                <div style={{ display:"flex", gap:0, marginBottom:12, borderBottom:"1px solid #21262d" }}>
                  {[{id:"parse",label:"📊 파싱 결과 예시"},{id:"interpret",label:"🔎 필드 해석"},{id:"forensic",label:"🕵️ 포렌식 활용"}].map(t => (
                    <button key={t.id} onClick={()=>setKeyTab(t.id)} style={{ flex:1, padding:"9px 4px", border:"none", cursor:"pointer", background:"none", color:keyTab===t.id?selectedKey.color:"#8b949e", borderBottom:`2px solid ${keyTab===t.id?selectedKey.color:"transparent"}`, fontSize:10, fontWeight:keyTab===t.id?700:400 }}>{t.label}</button>
                  ))}
                </div>

                {/* 탭 콘텐츠 */}
                {keyTab==="parse" && (
                  <div>
                    <div style={{ color:"#8b949e", fontSize:11, marginBottom:6 }}>
                      🛠 RECmd 플러그인: <code style={{ color:"#06d6a0", fontFamily:"monospace" }}>{selectedKey.recmd_plugin}</code>
                    </div>
                    <div style={{ background:"#0d1117", border:"1px solid #30363d", borderRadius:8, padding:"12px", overflowX:"auto" }}>
                      <pre style={{ color:"#e6edf3", fontSize:10, fontFamily:"monospace", margin:0, lineHeight:1.8, whiteSpace:"pre-wrap", wordBreak:"break-all" }}>{selectedKey.parse_output}</pre>
                    </div>
                  </div>
                )}

                {keyTab==="interpret" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {selectedKey.interpretation.map((item,i) => (
                      <div key={i} style={{ background:"#0d1117", border:"1px solid #21262d", borderRadius:8, padding:"11px 13px" }}>
                        <div style={{ color:selectedKey.color, fontWeight:700, fontSize:11, fontFamily:"monospace", marginBottom:5 }}>{item.field}</div>
                        <div style={{ color:"#e6edf3", fontSize:12, lineHeight:1.6 }}>{item.meaning}</div>
                      </div>
                    ))}
                  </div>
                )}

                {keyTab==="forensic" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ background:"#ffd16610", border:"1px solid #ffd16630", borderLeft:"3px solid #ffd166", borderRadius:8, padding:"11px 13px" }}>
                      <div style={{ color:"#ffd166", fontWeight:700, fontSize:11, marginBottom:5 }}>🕵️ 포렌식 분석 포인트</div>
                      <div style={{ color:"#e6edf3", fontSize:12, lineHeight:1.7 }}>{selectedKey.forensic}</div>
                    </div>
                    <div style={{ background:"#ff4d6d0d", border:"1px solid #ff4d6d33", borderLeft:"3px solid #ff4d6d", borderRadius:8, padding:"11px 13px" }}>
                      <div style={{ color:"#ff4d6d", fontWeight:700, fontSize:11, marginBottom:5 }}>🚨 IOC 예시</div>
                      <pre style={{ color:"#ff7b7b", fontSize:11, fontFamily:"monospace", margin:0, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{selectedKey.ioc_example}</pre>
                    </div>
                  </div>
                )}

                <button onClick={()=>setSelectedKey(null)} style={{ width:"100%", background:"#21262d", border:"none", borderRadius:9, padding:"12px", cursor:"pointer", color:"#e6edf3", fontSize:13, fontWeight:700, marginTop:12 }}>닫기</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════ 아티팩트 가이드 모드 ══════════════ */}
      {mode === "artifact" && (
        <ArtifactDetailMode />
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

// ── 아티팩트 상세 모드 컴포넌트 ──────────────────────────────
function ArtifactDetailMode() {
  const [selId, setSelId]         = useState(ARTIFACTS_DETAIL[0].id);
  const [mainTab, setMainTab]     = useState("overview"); // overview | keyitems | tools | tips
  const [showList, setShowList]   = useState(false);
  const [selItem, setSelItem]     = useState(null);
  const [itemTab, setItemTab]     = useState("parse");
  const [fileFilter, setFileFilter] = useState("all");

  const art = ARTIFACTS_DETAIL.find(a => a.id === selId);
  const idx = ARTIFACTS_DETAIL.findIndex(a => a.id === selId);
  const prev = ARTIFACTS_DETAIL[idx-1];
  const next = ARTIFACTS_DETAIL[idx+1];

  const goArt = (id) => { setSelId(id); setMainTab("overview"); setShowList(false); setSelItem(null); setFileFilter("all"); };

  // keyItems 필터
  const filteredItems = art.keyItems
    ? (fileFilter==="all" ? art.keyItems : art.keyItems.filter(k => k.file===fileFilter))
    : [];

  const FILE_LABEL_COLORS = { "$MFT":"#06d6a0", "$LogFile":"#4cc9f0", "$UsnJrnl":"#ffd166" };

  return (
    <>
      {/* 헤더 */}
      <div style={{ background:"#0d1117", borderBottom:"1px solid #21262d", padding:"10px 14px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:49, zIndex:50 }}>
        <button onClick={()=>setShowList(v=>!v)} style={{ background:showList?art.color+"33":"#21262d", border:`1px solid ${showList?art.color+"55":"#30363d"}`, borderRadius:8, padding:"7px 11px", color:showList?art.color:"#8b949e", cursor:"pointer", fontSize:16, flexShrink:0 }}>☰</button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:18 }}>{art.icon}</span>
            <span style={{ fontWeight:700, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{art.name}</span>
            <span style={{ background:art.color+"22", color:art.color, borderRadius:10, padding:"1px 7px", fontSize:9, fontWeight:700, flexShrink:0 }}>{art.category}</span>
          </div>
          <div style={{ color:"#8b949e", fontSize:10, marginTop:1 }}>{art.subtitle}</div>
        </div>
        <div style={{ display:"flex", gap:4, flexShrink:0 }}>
          <button onClick={()=>prev&&goArt(prev.id)} style={{ background:prev?"#21262d":"transparent", border:`1px solid ${prev?"#30363d":"#21262d"}`, borderRadius:6, padding:"6px 10px", color:prev?"#e6edf3":"#30363d", cursor:prev?"pointer":"default", fontSize:14 }}>‹</button>
          <button onClick={()=>next&&goArt(next.id)} style={{ background:next?"#21262d":"transparent", border:`1px solid ${next?"#30363d":"#21262d"}`, borderRadius:6, padding:"6px 10px", color:next?"#e6edf3":"#30363d", cursor:next?"pointer":"default", fontSize:14 }}>›</button>
        </div>
      </div>

      {/* 드로어 */}
      {showList && (
        <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex" }}>
          <div onClick={()=>setShowList(false)} style={{ position:"absolute", inset:0, background:"#00000088" }}/>
          <div style={{ position:"relative", width:"80%", maxWidth:300, background:"#0d1117", height:"100%", overflowY:"auto", padding:"16px 12px", borderRight:"1px solid #21262d" }}>
            <div style={{ fontWeight:700, fontSize:14, padding:"4px 8px 12px", borderBottom:"1px solid #21262d", marginBottom:10 }}>🗂 아티팩트 선택</div>
            {ARTIFACTS_DETAIL.map(a => (
              <button key={a.id} onClick={()=>goArt(a.id)} style={{ width:"100%", textAlign:"left", padding:"11px 12px", borderRadius:9, border:"none", cursor:"pointer", background:selId===a.id?a.color+"22":"transparent", borderLeft:`3px solid ${selId===a.id?a.color:"transparent"}`, marginBottom:3, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20 }}>{a.icon}</span>
                <div>
                  <div style={{ color:selId===a.id?a.color:"#e6edf3", fontSize:12, fontWeight:selId===a.id?700:400 }}>{a.name}</div>
                  <div style={{ color:"#8b949e", fontSize:10 }}>{a.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 메인 탭 바 */}
      <div style={{ display:"flex", background:"#0d1117", borderBottom:"1px solid #21262d", position:"sticky", top:97, zIndex:40 }}>
        {[{id:"overview",label:"개요",icon:"📌"},{id:"keyitems",label:"핵심항목",icon:"🔑"},{id:"tools",label:"도구",icon:"🛠"},{id:"tips",label:"팁",icon:"💡"}].map(t => (
          <button key={t.id} onClick={()=>setMainTab(t.id)} style={{ flex:1, padding:"9px 4px", border:"none", cursor:"pointer", background:"none", display:"flex", flexDirection:"column", alignItems:"center", gap:1, color:mainTab===t.id?art.color:"#8b949e", borderBottom:`2px solid ${mainTab===t.id?art.color:"transparent"}`, fontSize:10, fontWeight:mainTab===t.id?700:400 }}>
            <span style={{ fontSize:15 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex:1, padding:14, paddingBottom:90 }}>

        {/* 개요 탭 */}
        {mainTab==="overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ background:art.color+"12", border:`1px solid ${art.color}33`, borderLeft:`4px solid ${art.color}`, borderRadius:10, padding:"13px 15px", display:"flex", gap:10 }}>
              <span style={{ fontSize:18, flexShrink:0 }}>⭐</span>
              <div style={{ color:"#e6edf3", fontSize:12, lineHeight:1.7 }}>{art.summary}</div>
            </div>

            {/* 파일 위치 목록 */}
            <div style={{ background:"#161b22", border:"1px solid #21262d", borderRadius:10, padding:"13px 15px" }}>
              <div style={{ color:"#8b949e", fontSize:11, marginBottom:10 }}>📍 파일 위치 (전체)</div>
              {art.locations.map((loc,i) => (
                <div key={i} style={{ marginBottom:10, paddingBottom:10, borderBottom:i<art.locations.length-1?"1px solid #21262d":"none" }}>
                  <code style={{ color:art.color, fontSize:10, fontFamily:"monospace", wordBreak:"break-all", display:"block", marginBottom:3 }}>{loc.path}</code>
                  <div style={{ color:"#8b949e", fontSize:11 }}>{loc.desc}</div>
                </div>
              ))}
            </div>

            {/* fileSections 있으면 구조 설명 */}
            {art.fileSections && (
              <div style={{ background:"#0d1117", border:"1px solid #21262d", borderRadius:10, padding:"13px 15px" }}>
                <div style={{ color:"#8b949e", fontSize:11, marginBottom:8 }}>📂 구성 파일</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {art.fileSections.map(fs => (
                    <div key={fs.id} style={{ background:fs.color+"15", border:`1px solid ${fs.color}33`, borderLeft:`3px solid ${fs.color}`, borderRadius:7, padding:"8px 12px", display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ color:fs.color, fontFamily:"monospace", fontWeight:800, fontSize:12 }}>{fs.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 도트 인디케이터 */}
            <div style={{ display:"flex", justifyContent:"center", gap:5, paddingTop:4 }}>
              {ARTIFACTS_DETAIL.map(a => (
                <div key={a.id} onClick={()=>goArt(a.id)} style={{ width:selId===a.id?22:6, height:6, borderRadius:3, background:selId===a.id?art.color:"#30363d", cursor:"pointer", transition:"all .2s" }}/>
              ))}
            </div>
          </div>
        )}

        {/* 핵심 항목 탭 */}
        {mainTab==="keyitems" && (
          <div>
            {/* 파일 필터 (fileSections 있는 경우만) */}
            {art.fileSections && (
              <div style={{ display:"flex", gap:5, marginBottom:12, overflowX:"auto" }}>
                <button onClick={()=>setFileFilter("all")} style={{ padding:"4px 10px", borderRadius:20, border:"none", cursor:"pointer", flexShrink:0, background:fileFilter==="all"?art.color+"33":"#21262d", color:fileFilter==="all"?art.color:"#8b949e", border:`1px solid ${fileFilter==="all"?art.color+"55":"#30363d"}`, fontSize:10, fontWeight:700 }}>전체</button>
                {art.fileSections.map(fs => (
                  <button key={fs.id} onClick={()=>setFileFilter(fs.label.replace(/📄|📝|📋|\s/g,""))} style={{ padding:"4px 10px", borderRadius:20, border:"none", cursor:"pointer", flexShrink:0, background:fileFilter===fs.label.replace(/📄|📝|📋|\s/g,"")?fs.color+"33":"#21262d", color:fileFilter===fs.label.replace(/📄|📝|📋|\s/g,"")?fs.color:"#8b949e", border:`1px solid ${fileFilter===fs.label.replace(/📄|📝|📋|\s/g,"")?fs.color+"55":"#30363d"}`, fontSize:10, fontWeight:700 }}>{fs.label}</button>
                ))}
              </div>
            )}

            {/* 항목 카드 목록 */}
            {filteredItems.map((item,i) => {
              const fileLabelColor = item.file ? (FILE_LABEL_COLORS[item.file]||art.color) : art.color;
              return (
                <button key={i} onClick={()=>{setSelItem(item);setItemTab("parse");}} style={{
                  width:"100%", textAlign:"left",
                  background:item.threat?"#ff4d6d08":"#161b22",
                  border:`1px solid ${item.threat?"#ff4d6d33":"#21262d"}`,
                  borderLeft:`4px solid ${item.threat?"#ff4d6d":fileLabelColor}`,
                  borderRadius:10, padding:"12px 13px", marginBottom:7, cursor:"pointer",
                  display:"flex", gap:10, alignItems:"flex-start",
                }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:4 }}>
                      {item.file && <span style={{ background:fileLabelColor+"22", color:fileLabelColor, borderRadius:4, padding:"1px 6px", fontSize:9, fontFamily:"monospace", fontWeight:800 }}>{item.file}</span>}
                      <span style={{ color:item.threat?"#ffaaaa":"#e6edf3", fontWeight:700, fontSize:12 }}>{item.name}</span>
                      {item.threat && <span style={{ background:"#ff4d6d22", color:"#ff4d6d", borderRadius:4, padding:"1px 5px", fontSize:9, fontWeight:700 }}>⚠</span>}
                    </div>
                    <div style={{ color:"#8b949e", fontSize:11, lineHeight:1.5 }}>{item.desc}</div>
                  </div>
                  <span style={{ color:"#444c56", fontSize:14, flexShrink:0 }}>›</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 도구 탭 */}
        {mainTab==="tools" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {art.tools.map((tool,i) => (
              <div key={i} style={{ background:"#161b22", border:"1px solid #21262d", borderRadius:10, padding:"13px 15px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <div style={{ background:art.color+"22", borderRadius:7, width:38, height:38, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🛠</div>
                  <div>
                    <div style={{ color:art.color, fontWeight:700, fontSize:13 }}>{tool.name}</div>
                    <div style={{ color:"#8b949e", fontSize:11, marginTop:1 }}>{tool.desc}</div>
                  </div>
                </div>
                {tool.cmd && <code style={{ display:"block", background:"#0d1117", border:"1px solid #30363d", borderRadius:6, padding:"8px 10px", color:"#06d6a0", fontSize:10, fontFamily:"monospace", wordBreak:"break-all", lineHeight:1.6 }}>{tool.cmd}</code>}
              </div>
            ))}
          </div>
        )}

        {/* 팁 탭 */}
        {mainTab==="tips" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {art.tips.map((tip,i) => (
              <div key={i} style={{ background:"#161b22", border:"1px solid #21262d", borderRadius:10, padding:"13px 15px", display:"flex", gap:10, alignItems:"flex-start" }}>
                <div style={{ background:art.color+"22", color:art.color, borderRadius:"50%", width:26, height:26, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800 }}>{i+1}</div>
                <div style={{ color:"#e6edf3", fontSize:12, lineHeight:1.7, paddingTop:2 }}>{tip}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 이전/다음 */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#0d1117", borderTop:"1px solid #21262d", padding:"10px 14px", display:"flex", gap:10 }}>
        <button onClick={()=>prev&&goArt(prev.id)} style={{ flex:1, padding:"10px 8px", borderRadius:10, border:"none", background:prev?"#161b22":"transparent", border:`1px solid ${prev?"#30363d":"#21262d"}`, color:prev?"#e6edf3":"#30363d", cursor:prev?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", gap:5, fontSize:11 }}>
          {prev?<>‹ <span>{prev.icon}</span><span>{prev.name.length>10?prev.name.slice(0,10)+"…":prev.name}</span></>:<span>처음</span>}
        </button>
        <button onClick={()=>next&&goArt(next.id)} style={{ flex:1, padding:"10px 8px", borderRadius:10, border:"none", background:next?art.color+"22":"transparent", border:`1px solid ${next?art.color+"55":"#21262d"}`, color:next?art.color:"#30363d", cursor:next?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", gap:5, fontSize:11 }}>
          {next?<><span>{next.name.length>10?next.name.slice(0,10)+"…":next.name}</span><span>{next.icon}</span>›</>:<span>마지막</span>}
        </button>
      </div>

      {/* 핵심 항목 상세 바텀시트 */}
      {selItem && (
        <div onClick={()=>setSelItem(null)} style={{ position:"fixed", inset:0, background:"#00000090", zIndex:200, display:"flex", alignItems:"flex-end" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#161b22", border:`1px solid ${art.color}44`, borderRadius:"16px 16px 0 0", padding:"16px 15px", width:"100%", maxWidth:480, margin:"0 auto", maxHeight:"88vh", overflowY:"auto" }}>
            <div style={{ width:36, height:4, background:"#30363d", borderRadius:2, margin:"0 auto 14px" }}/>

            {/* 항목 헤더 */}
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:5 }}>
                {selItem.file && <span style={{ background:(FILE_LABEL_COLORS[selItem.file]||art.color)+"22", color:FILE_LABEL_COLORS[selItem.file]||art.color, borderRadius:4, padding:"2px 8px", fontSize:10, fontFamily:"monospace", fontWeight:800 }}>{selItem.file}</span>}
                {selItem.threat && <span style={{ background:"#ff4d6d22", color:"#ff4d6d", borderRadius:4, padding:"2px 7px", fontSize:10, fontWeight:700 }}>⚠ 위협 지표</span>}
              </div>
              <div style={{ fontWeight:800, fontSize:15, color:"#e6edf3", marginBottom:4 }}>{selItem.name}</div>
              <div style={{ color:"#8b949e", fontSize:12, lineHeight:1.6 }}>{selItem.desc}</div>
            </div>

            {/* 탭 */}
            <div style={{ display:"flex", gap:0, borderBottom:"1px solid #21262d", marginBottom:12 }}>
              {[{id:"parse",label:"📊 파싱 결과"},{id:"interpret",label:"🔎 필드 해석"},{id:"forensic",label:"🕵️ 포렌식"}].map(t => (
                <button key={t.id} onClick={()=>setItemTab(t.id)} style={{ flex:1, padding:"8px 4px", border:"none", cursor:"pointer", background:"none", color:itemTab===t.id?art.color:"#8b949e", borderBottom:`2px solid ${itemTab===t.id?art.color:"transparent"}`, fontSize:10, fontWeight:itemTab===t.id?700:400 }}>{t.label}</button>
              ))}
            </div>

            {itemTab==="parse" && (
              <div style={{ background:"#0d1117", border:"1px solid #30363d", borderRadius:8, padding:"11px 12px", overflowX:"auto" }}>
                <pre style={{ color:"#e6edf3", fontSize:10, fontFamily:"monospace", margin:0, lineHeight:1.8, whiteSpace:"pre-wrap", wordBreak:"break-all" }}>{selItem.parse_output}</pre>
              </div>
            )}

            {itemTab==="interpret" && (
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {selItem.interpretation.map((item,i) => (
                  <div key={i} style={{ background:"#0d1117", border:"1px solid #21262d", borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ color:art.color, fontWeight:700, fontSize:11, fontFamily:"monospace", marginBottom:4 }}>{item.field}</div>
                    <div style={{ color:"#e6edf3", fontSize:11, lineHeight:1.6 }}>{item.meaning}</div>
                  </div>
                ))}
              </div>
            )}

            {itemTab==="forensic" && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ background:"#ffd16610", border:"1px solid #ffd16630", borderLeft:"3px solid #ffd166", borderRadius:8, padding:"10px 12px" }}>
                  <div style={{ color:"#ffd166", fontWeight:700, fontSize:11, marginBottom:4 }}>🕵️ 포렌식 분석 포인트</div>
                  <div style={{ color:"#e6edf3", fontSize:11, lineHeight:1.7 }}>{selItem.forensic}</div>
                </div>
                <div style={{ background:"#ff4d6d0d", border:"1px solid #ff4d6d33", borderLeft:"3px solid #ff4d6d", borderRadius:8, padding:"10px 12px" }}>
                  <div style={{ color:"#ff4d6d", fontWeight:700, fontSize:11, marginBottom:4 }}>🚨 IOC / 의심 패턴</div>
                  <pre style={{ color:"#ff7b7b", fontSize:11, fontFamily:"monospace", margin:0, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{selItem.ioc}</pre>
                </div>
              </div>
            )}

            <button onClick={()=>setSelItem(null)} style={{ width:"100%", background:"#21262d", border:"none", borderRadius:9, padding:"11px", cursor:"pointer", color:"#e6edf3", fontSize:13, fontWeight:700, marginTop:12 }}>닫기</button>
          </div>
        </div>
      )}
    </>
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
