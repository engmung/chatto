# Exhibition Web Application

## 시작하기

### Windows 사용자
1. `start_exhibition.bat` 파일을 더블클릭하여 실행합니다.
2. 자동으로 웹 브라우저가 열리고 전시가 시작됩니다.
3. 종료하려면 콘솔 창에서 아무 키나 누르세요.

### macOS 사용자

#### 1. Python 라이브러리 설치
먼저 Terminal을 열고 다음 명령어들을 순서대로 실행합니다:

```bash
# Homebrew 설치 (이미 설치되어 있다면 건너뛰기)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Python 3 설치 (이미 설치되어 있다면 건너뛰기)
brew install python3

# pip3가 최신 버전인지 확인
pip3 install --upgrade pip

# OpenCV 설치
brew install opencv

# MediaPipe 및 기타 필요한 라이브러리 설치
pip3 install mediapipe
pip3 install numpy
pip3 install websockets
```

만약 카메라 접근 권한 요청이 뜨면 '허용'을 선택해주세요.

#### 2. 실행 권한 설정
Terminal에서 다음 명령어를 실행하여 실행 스크립트에 권한을 부여합니다:
```bash
chmod +x start_exhibition.command
```

#### 3. 실행
1. `start_exhibition.command` 파일을 더블클릭하여 실행합니다.
2. 자동으로 웹 브라우저가 열리고 전시가 시작됩니다.
3. 종료하려면 Terminal 창에서 Ctrl+C를 누르세요.

## 요구사항
- Node.js (16.0.0 이상)
- Python 3.8 이상
- NPM
- 웹캠

### macOS 특정 요구사항
- Homebrew
- OpenCV
- MediaPipe
- NumPy
- Websockets

## 문제 해결

### 일반적인 문제
- 실행이 되지 않는 경우 위의 요구사항이 모두 설치되어 있는지 확인해주세요.
- Windows에서는 `check_requirements.bat`를 실행하여 확인할 수 있습니다.
- macOS에서는 `check_requirements.sh`를 실행하여 확인할 수 있습니다.

### macOS 관련 문제
1. 카메라 접근 권한이 없는 경우:
   - 시스템 환경설정 > 보안 및 개인 정보 보호 > 카메라에서 Terminal 또는 Python에 대한 권한을 허용해주세요.

2. OpenCV 설치 문제 발생 시:
   ```bash
   # OpenCV 재설치
   brew uninstall opencv
   brew install opencv
   ```

3. MediaPipe 설치 실패 시:
   ```bash
   # 가상환경 사용 권장
   python3 -m venv venv
   source venv/bin/activate
   pip3 install mediapipe
   ```

4. "command not found: brew" 오류 발생 시:
   - Homebrew PATH가 올바르게 설정되어 있는지 확인하세요.
   - M1 Mac의 경우:
     ```bash
     echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
     source ~/.zshrc
     ```
   - Intel Mac의 경우:
     ```bash
     echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zshrc
     source ~/.zshrc
     ```