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
    this.retryCount = 0;
    this.maxRetries = 3;
    this.processingFrame = false;
    this.SHOULDER_WIDTH_THRESHOLD = 0.2;
    this.PRESENCE_TIMEOUT = 2000;
  }

  setupVideoElement() {
    if (this.videoElement) return this.videoElement;

    const video = document.createElement('video');
    video.style.cssText = `
      position: fixed;
      right: 0;
      bottom: 0;
      width: 32px;
      height: 24px;
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

  async loadDependencies() {
    const loadScript = async (url) => {
      if (document.querySelector(`script[src="${url}"]`)) {
        return;
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    try {
      await Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.min.js'),
        loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.min.js')
      ]);

      // MediaPipe 초기화를 위한 대기 시간
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to load dependencies:', error);
      throw error;
    }
  }

  async initializeMediaPipe() {
    if (!window.Pose) {
      throw new Error('MediaPipe Pose not loaded');
    }

    const pose = new window.Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
      }
    });

    pose.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      selfieMode: true
    });

    pose.onResults(this.onResults);

    try {
      await pose.initialize();
      return pose;
    } catch (error) {
      console.error('Failed to initialize MediaPipe Pose:', error);
      throw error;
    }
  }

  async processFrame() {
    if (!this.isConnected || !this.pose || this.suspended || this.processingFrame) return;
    
    try {
      this.processingFrame = true;
      await this.pose.send({ image: this.videoElement });
    } catch (error) {
      console.warn('Frame processing error:', error);
    } finally {
      this.processingFrame = false;
    }
  }

  async setupCamera() {
    if (!this.videoElement || !window.Camera) {
      throw new Error('Camera dependencies not initialized');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user',
          frameRate: { ideal: 30 }
        }
      });

      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      const camera = new window.Camera(this.videoElement, {
        onFrame: async () => this.processFrame(),
        width: 640,
        height: 480
      });

      return camera;
    } catch (error) {
      console.error('Camera setup failed:', error);
      throw error;
    }
  }

  suspend() {
    if (!this.isConnected) return;
    
    this.suspended = true;
    this.processingFrame = false;
  }

  resume() {
    if (!this.isConnected) return;
    
    this.suspended = false;
  }

  async connect() {
    if (this.isConnected || this.isInitializing) return;

    try {
      this.isInitializing = true;
      this.suspended = false;
      this.processingFrame = false;

      await this.loadDependencies();
      this.setupVideoElement();
      this.pose = await this.initializeMediaPipe();
      this.camera = await this.setupCamera();
      await this.camera.start();

      this.isConnected = true;
      this.retryCount = 0;

    } catch (error) {
      console.error('Vision Service initialization failed:', error);
      this.disconnect();
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.connect();
      }
      
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  disconnect() {
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
  }
}

const visionService = new VisionService();
export default visionService;