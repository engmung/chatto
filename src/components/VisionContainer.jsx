const VisionContainer = React.memo(() => {
  const videoRef = useRef(null);
  
  useEffect(() => {
    const video = document.createElement('video');
    video.style.cssText = `
      position: fixed;
      right: 16px;
      bottom: 16px;
      width: 320px;
      height: 240px;
      opacity: 0;
      pointer-events: none;
      z-index: -1;
      transform-origin: bottom right;
      transform: scale(0.1);
    `;
    video.playsInline = true;
    video.muted = true;
    video.setAttribute('playsinline', '');
    document.body.appendChild(video);
    videoRef.current = video;

    return () => {
      if (videoRef.current) {
        videoRef.current.remove();
      }
    };
  }, []);

  return null;
});

export default VisionContainer;