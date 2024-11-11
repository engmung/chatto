class VisionService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.onPresenceChange = null;
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
        } catch (error) {
          console.error('Vision data parse error:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('Vision WebSocket Disconnected', event.code, event.reason);
        this.isConnected = false;

        if (!event.wasClean) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
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
          console.log('Max reconnection attempts reached');
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

  startConnectionCheck() {
    setInterval(() => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.connect();
      }
    }, 5000);
  }
}

const visionService = new VisionService();
visionService.startConnectionCheck();

export default visionService;