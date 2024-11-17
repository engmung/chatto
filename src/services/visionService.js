class VisionService {
  constructor() {
    this.videoElement = null;
    this.camera = null;
    this.pose = null;
    this.isConnected = false;
    this.onPresenceChange = null;
    this.isViewerPresent = false;
    this.lastPresenceTime = Date.now();
    this.isInitializing = false;
    this.suspended = false;
    this.initializationAttempts = 0;
    this.maxInitAttempts = 5;
    this.cooldownPeriod = 5000;
    this.lastAttemptTime = 0;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.processingFrame = false;
    this.SHOULDER_WIDTH_THRESHOLD = 0.2;
    this.PRESENCE_TIMEOUT = 2000;

    // 로그 관련 속성
    this.connectionStartTime = null;
    this.logInterval = null;
    this.totalAttempts = 0;

    // 성능 최적화를 위한 고정 설정
    this.processingResolution = {
      width: 320,  // 최적화된 해상도
      height: 240
    };
    this.frameRate = 15;  // 최적화된 프레임레이트
    this.processEveryNthFrame = 2;  // 프레임 스킵
    this.frameCount = 0;
  }

  logConnectionAttempt() {
    if (!this.connectionStartTime) {
      this.connectionStartTime = Date.now();
      this.totalAttempts = 1;
    } else {
      this.totalAttempts++;
    }

    const elapsedTime = ((Date.now() - this.connectionStartTime) / 1000).toFixed(1);
    const attempts = this.totalAttempts;
    
    console.log(
      `%c[Vision Service] Reconnecting... (Attempt ${attempts}, Time: ${elapsedTime}s)`,
      'color: #fbbf24; font-weight: bold;'
    );
  }

  startConnectionLog() {
    if (this.logInterval) return;
    
    console.log(
      '%c[Vision Service] Starting connection process...',
      'color: #60a5fa; font-weight: bold;'
    );
    
    this.logInterval = setInterval(() => {
      const dots = '.'.repeat(this.totalAttempts % 4);
      const spaces = ' '.repeat(3 - (this.totalAttempts % 4));
      console.log(
        `%c[Vision Service] Attempting to connect${dots}${spaces}`,
        'color: #93c5fd;'
      );
    }, 1000);
  }

  stopConnectionLog(success = false) {
    if (this.logInterval) {
      clearInterval(this.logInterval);
      this.logInterval = null;
    }

    const elapsedTime = ((Date.now() - this.connectionStartTime) / 1000).toFixed(1);
    const attempts = this.totalAttempts;

    if (success) {
      console.log(
        `%c[Vision Service] Connected successfully! (Attempts: ${attempts}, Time: ${elapsedTime}s)`,
        'color: #34d399; font-weight: bold;'
      );
    } else {
      console.log(
        `%c[Vision Service] Connection failed after ${attempts} attempts (${elapsedTime}s)`,
        'color: #f87171; font-weight: bold;'
      );
    }

    this.connectionStartTime = null;
    this.totalAttempts = 0;
  }

  setupVideoElement() {
    if (this.videoElement) return this.videoElement;

    const video = document.createElement('video');
    video.style.cssText = `
      position: fixed;
      right: 0;
      bottom: 0;
      width: ${this.processingResolution.width}px;
      height: ${this.processingResolution.height}px;
      opacity: 0;
      pointer-events: none;
      z-index: -1;
    `;
    video.playsInline = true;
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    document.body.appendChild(video);
    this.videoElement = video;
    return video;
  }

  onResults = (results) => {
    if (this.suspended || !results.poseLandmarks) {
      this.updatePresence(false);
      return;
    }

    try {
      const leftShoulder = results.poseLandmarks[11];
      const rightShoulder = results.poseLandmarks[12];
      
      if (!leftShoulder || !rightShoulder) {
        this.updatePresence(false);
        return;
      }

      const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
      this.updatePresence(shoulderWidth > this.SHOULDER_WIDTH_THRESHOLD);
    } catch (error) {
      console.warn('Error processing pose results:', error);
      this.updatePresence(false);
    }
  }

  updatePresence(isDetected) {
    if (!this.isConnected || this.suspended) return false;

    const currentTime = Date.now();
    const previousState = this.isViewerPresent;

    if (isDetected) {
      this.lastPresenceTime = currentTime;
      if (!this.isViewerPresent) {
        this.isViewerPresent = true;
        requestAnimationFrame(() => {
          if (this.onPresenceChange && !this.suspended) {
            this.onPresenceChange(true);
          }
        });
      }
    } else if (this.isViewerPresent) {
      const timeSinceLastPresence = currentTime - this.lastPresenceTime;
      if (timeSinceLastPresence > this.PRESENCE_TIMEOUT) {
        this.isViewerPresent = false;
        requestAnimationFrame(() => {
          if (this.onPresenceChange && !this.suspended) {
            this.onPresenceChange(false);
          }
        });
      }
    }

    return previousState !== this.isViewerPresent;
  }

  async initializeMediaPipe() {
    try {
      const { Pose } = await import('@mediapipe/pose');
      
      const pose = new Pose({
        locateFile: (file) => {
          return `/node_modules/@mediapipe/pose/${file}`;
        }
      });

      pose.setOptions({
        modelComplexity: 0,  // 가장 가벼운 모델 사용
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: true,
        enableSegmentation: false  // 세그멘테이션 비활성화
      });

      pose.onResults(this.onResults);
      await pose.initialize();
      return pose;
    } catch (error) {
      console.error('Failed to initialize MediaPipe Pose:', error);
      throw error;
    }
  }

  async processFrame() {
    if (!this.isConnected || !this.pose || this.suspended || this.processingFrame) return;
    
    this.frameCount++;
    if (this.frameCount % this.processEveryNthFrame !== 0) return;
    
    try {
      this.processingFrame = true;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      canvas.width = this.processingResolution.width;
      canvas.height = this.processingResolution.height;
      
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
      await this.pose.send({ image: canvas });
      
      canvas.remove();
    } catch (error) {
      console.warn('Frame processing error:', error);
    } finally {
      this.processingFrame = false;
    }
  }

  async setupCamera() {
    try {
      const { Camera } = await import('@mediapipe/camera_utils');

      if (!this.videoElement) {
        throw new Error('Camera dependencies not initialized');
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: this.processingResolution.width,
            height: this.processingResolution.height,
            facingMode: 'user',
            frameRate: { ideal: this.frameRate }
          }
        });

        this.videoElement.srcObject = stream;
        await this.videoElement.play();

        const camera = new Camera(this.videoElement, {
          onFrame: async () => this.processFrame(),
          width: this.processingResolution.width,
          height: this.processingResolution.height
        });

        return camera;
      } catch (error) {
        console.error('Camera setup failed:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to load Camera utils:', error);
      throw error;
    }
  }

  suspend() {
    if (!this.isConnected) return;
    console.log('%c[Vision Service] Suspended', 'color: #9ca3af;');
    this.suspended = true;
    this.processingFrame = false;
  }

  resume() {
    if (!this.isConnected) return;
    console.log('%c[Vision Service] Resumed', 'color: #9ca3af;');
    this.suspended = false;
  }

  async connect() {
    if (this.isConnected || this.isInitializing) return;

    const currentTime = Date.now();
    if (currentTime - this.lastAttemptTime < this.cooldownPeriod) {
      console.warn('Attempting to reconnect too quickly, waiting for cooldown');
      return;
    }

    try {
      this.isInitializing = true;
      this.lastAttemptTime = currentTime;
      this.initializationAttempts++;

      if (!this.connectionStartTime) {
        this.startConnectionLog();
      }
      this.logConnectionAttempt();

      if (this.initializationAttempts > this.maxInitAttempts) {
        console.warn('Max initialization attempts reached, waiting for longer cooldown');
        await new Promise(resolve => setTimeout(resolve, this.cooldownPeriod * 2));
        this.initializationAttempts = 0;
      }

      this.setupVideoElement();
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.pose = await this.initializeMediaPipe();
      this.camera = await this.setupCamera();
      await this.camera.start();

      this.isConnected = true;
      this.initializationAttempts = 0;
      this.stopConnectionLog(true);

    } catch (error) {
      console.error('Vision Service initialization failed:', error);
      this.disconnect();
      
      const retryDelay = Math.min(1000 * Math.pow(2, this.initializationAttempts), 10000);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      if (this.initializationAttempts < this.maxInitAttempts) {
        return this.connect();
      } else {
        this.stopConnectionLog(false);
      }
    } finally {
      this.isInitializing = false;
    }
  }

  disconnect() {
    console.log('%c[Vision Service] Disconnecting...', 'color: #9ca3af;');
    this.suspended = true;
    this.processingFrame = false;

    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }

    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }

    if (this.videoElement?.srcObject) {
      const tracks = this.videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.videoElement.remove();
      this.videoElement = null;
    }

    this.isConnected = false;
    this.isInitializing = false;
    this.isViewerPresent = false;
    this.retryCount = 0;
    this.frameCount = 0;
    
    if (this.logInterval) {
      this.stopConnectionLog(false);
    }
  }
}

const visionService = new VisionService();
export default visionService;