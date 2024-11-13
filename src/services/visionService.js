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
    this.retryCount = 0;
    this.maxRetries = 3;

    // Constants
    this.SHOULDER_WIDTH_THRESHOLD = 0.2;
    this.PRESENCE_TIMEOUT = 2000;
  }

  setupVideoElement() {
    if (this.videoElement) {
      return this.videoElement;
    }

    const video = document.createElement('video');
    video.style.cssText = `
      position: fixed;
      right: 0;
      bottom: 0;
      width: 32px;
      height: 24px;
      opacity: 0;
      pointer-events: none;
    `;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    document.body.appendChild(video);
    this.videoElement = video;
    return video;
  }

  onResults = (results) => {
    if (!results.poseLandmarks) {
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
    if (!this.isConnected) return false;

    const currentTime = Date.now();
    const previousState = this.isViewerPresent;

    if (isDetected) {
      this.lastPresenceTime = currentTime;
      if (!this.isViewerPresent) {
        this.isViewerPresent = true;
        this.onPresenceChange?.(true);
      }
    } else if (this.isViewerPresent) {
      const timeSinceLastPresence = currentTime - this.lastPresenceTime;
      if (timeSinceLastPresence > this.PRESENCE_TIMEOUT) {
        this.isViewerPresent = false;
        this.onPresenceChange?.(false);
      }
    }

    return previousState !== this.isViewerPresent;
  }

  async loadDependencies() {
    // Load camera_utils.js
    if (!window.Camera) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Load pose detection
    if (!window.Pose) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  }

  async initializeMediaPipe() {
    await this.loadDependencies();

    const pose = new window.Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
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

  async setupCamera() {
    if (!this.videoElement) {
      throw new Error('Video element not initialized');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });

      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      const camera = new window.Camera(this.videoElement, {
        onFrame: async () => {
          if (this.isConnected && this.pose) {
            try {
              await this.pose.send({ image: this.videoElement });
            } catch (error) {
              console.warn('Frame processing error:', error);
            }
          }
        },
        width: 640,
        height: 480
      });

      return camera;

    } catch (error) {
      console.error('Camera setup failed:', error);
      throw error;
    }
  }

  async connect() {
    if (this.isConnected || this.isInitializing) {
      return;
    }

    try {
      console.log('Vision Service: Initializing...');
      this.isInitializing = true;

      // Setup video element
      this.setupVideoElement();

      // Initialize MediaPipe
      this.pose = await this.initializeMediaPipe();

      // Setup camera
      this.camera = await this.setupCamera();
      await this.camera.start();

      this.isConnected = true;
      this.isInitializing = false;
      console.log('Vision Service: Connected successfully');

    } catch (error) {
      console.error('Vision Service initialization failed:', error);
      this.disconnect();
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying connection (attempt ${this.retryCount}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.connect();
      }
      
      throw error;
    }
  }

  disconnect() {
    if (this.camera) {
      try {
        this.camera.stop();
      } catch (e) {
        console.warn('Error stopping camera:', e);
      }
      this.camera = null;
    }

    if (this.pose) {
      try {
        this.pose.close();
      } catch (e) {
        console.warn('Error closing pose:', e);
      }
      this.pose = null;
    }

    if (this.videoElement) {
      try {
        if (this.videoElement.srcObject) {
          const tracks = this.videoElement.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        }
        this.videoElement.parentNode?.removeChild(this.videoElement);
      } catch (e) {
        console.warn('Error cleaning up video element:', e);
      }
      this.videoElement = null;
    }

    this.isConnected = false;
    this.isInitializing = false;
    this.isViewerPresent = false;
    this.retryCount = 0;
    console.log('Vision Service: Disconnected');
  }

  suspend() {
    if (this.camera) {
      try {
        this.camera.stop();
      } catch (e) {
        console.warn('Error suspending camera:', e);
      }
    }
  }

  resume() {
    if (this.camera && this.isConnected) {
      try {
        this.camera.start();
      } catch (e) {
        console.warn('Error resuming camera:', e);
      }
    }
  }
}

const visionService = new VisionService();
export default visionService;