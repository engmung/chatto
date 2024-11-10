// services/visionService.js

class VisionService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.onPresenceChange = null;
    this.onSwipeDetected = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.baseReconnectDelay = 1000;
    this.isReconnecting = false;
    this.lastConnectionTime = null;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      this.ws = new WebSocket('ws://localhost:12345');
      
      this.ws.onopen = () => {
        console.log('Vision WebSocket Connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.lastConnectionTime = Date.now();
        this.isReconnecting = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Presence 변경 감지
          if (this.onPresenceChange && 'viewer_present' in data) {
            this.onPresenceChange(data.viewer_present);
          }

          // Swipe 제스처 감지
          if (this.onSwipeDetected && data.swipe_direction) {
            this.onSwipeDetected(data.swipe_direction);
          }
        } catch (error) {
          console.error('Vision data parse error:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('Vision WebSocket Disconnected', event.code, event.reason);
        this.isConnected = false;

        // 정상적인 종료가 아닌 경우에만 재연결 시도
        if (!event.wasClean) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        // 오류 발생 시 연결 재시도
        if (this.ws) {
          this.ws.close();
        }
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.isReconnecting) return;

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // 지수 백오프를 사용한 재연결 지연 시간 계산
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      10000
    );

    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (!this.isConnected) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.connect();
        } else {
          console.log('Max reconnection attempts reached. Resetting connection state...');
          this.resetConnection();
        }
      }
      this.isReconnecting = false;
    }, delay);
  }

  resetConnection() {
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    this.connect();
  }

  // 연결 상태 체크 및 필요시 재연결
  checkConnection() {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
      return false;
    }
    
    // 연결이 오래된 경우 재연결 시도
    if (this.lastConnectionTime && Date.now() - this.lastConnectionTime > 300000) {
      console.log('Connection is stale. Reconnecting...');
      this.disconnect();
      this.connect();
      return false;
    }

    return this.ws.readyState === WebSocket.OPEN;
  }

  disconnect() {
    if (this.ws) {
      try {
        this.ws.close(1000, "Normal closure");
      } catch (err) {
        console.error('Error closing websocket:', err);
      }
      this.ws = null;
      this.isConnected = false;
    }
  }

  // 정기적인 연결 상태 체크 시작
  startConnectionCheck() {
    setInterval(() => {
      this.checkConnection();
    }, 5000);
  }
}

// 단일 인스턴스 생성 및 자동 연결 체크 시작
const visionService = new VisionService();
visionService.startConnectionCheck();

export default visionService;