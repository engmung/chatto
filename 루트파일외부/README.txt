
# Homebrew 설치 (이미 설치되어 있다면 건너뛰기)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 전시 웹 애플리케이션 - macOS 설치 가이드

## 🚀 실행 방법
1. Terminal 열기 (⌘ + Space, 'Terminal' 입력)
2. 다운로드 폴더로 이동:
   ```bash
   cd "다운로드한 폴더 경로"
   ```
3. 실행 권한 부여:
   ```bash
   chmod +x St.sh
   ```
4. 실행:
   ```bash
   ./St.sh
   ```

## 📋 시스템 요구사항
- macOS 10.15 이상
- Node.js 20.x 버전 (자동 설치됨)
- Python 3.8 이상
- 웹캠
- 인터넷 연결

## 🚀 빠른 시작
1. 압축 파일을 다운로드하고 압축을 풉니다.
2. Terminal을 엽니다. (⌘ + Space, 'Terminal' 입력)
3. 다운로드 폴더로 이동합니다:
   ```bash
   cd "다운로드한 폴더 경로"
   ```
4. 실행 권한을 부여합니다:
   ```bash
   chmod +x start_exhibition_mac.sh
   ```
5. 스크립트를 실행합니다:
   ```bash
   ./start_exhibition_mac.sh
   ```

## 🎥 카메라 권한 설정
- 처음 실행 시 카메라 접근 권한 요청이 표시됩니다.
- '허용'을 선택해주세요.
- 실수로 '거부'한 경우:
  1. 시스템 설정 > 개인 정보 보호 및 보안 > 카메라
  2. Terminal과 Python에 대한 권한을 허용

## ⚠️ 문제 해결

### Node.js 관련 문제
```bash
# nvm 재설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc
nvm install 20
nvm use 20
```

### Python 패키지 문제
```bash
# 패키지 재설치
pip3 install --upgrade pip
pip3 install mediapipe numpy websockets
```

### 포트 충돌
- 3000번 포트가 사용 중인 경우:
```bash
# 사용 중인 프로세스 확인
lsof -i :3000
# 프로세스 종료
kill -9 [프로세스ID]
```

### 실행 권한 문제
```bash
chmod +x start_exhibition_mac.sh
```

## 📝 주의사항
- 실행 중에는 Terminal 창을 닫지 마세요
- 종료하려면 Terminal에서 Ctrl+C를 누르세요
- 처음 실행 시 필요한 패키지 설치로 인해 시간이 걸릴 수 있습니다

## 🔄 업데이트 및 재설치
문제가 지속되는 경우 완전 재설치:
```bash
# 프로젝트 폴더로 이동
cd graduation_exhibition_KYS-main

# node_modules 삭제
rm -rf node_modules package-lock.json

# npm 캐시 정리
npm cache clean --force

# 의존성 재설치
npm install
```

## 💡 팁
- 전시 실행 중에는 다른 화상 회의 앱을 종료하세요
- 웹캠이 다른 앱에서 사용 중이면 실행되지 않을 수 있습니다
- 최적의 경험을 위해 Chrome 브라우저 사용을 권장합니다