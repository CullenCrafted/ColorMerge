import { useRef, useCallback, useEffect } from 'react';

export const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeAudio = useCallback(() => {
    if (!audioRef.current) {
      try {
        audioRef.current = new Audio();
        audioRef.current.preload = 'auto';
        audioRef.current.loop = false; // Manual looping for fade control
        audioRef.current.volume = 0.15; // Lower volume for background music
        
        // Import the audio file
        import('@assets/bubble-sound.mp3').then((audioModule) => {
          if (audioRef.current) {
            audioRef.current.src = audioModule.default;
            
            // Add event listeners for smooth looping with fade
            audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
            audioRef.current.addEventListener('ended', handleTrackEnd);
          }
        }).catch(console.error);
        
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      const duration = audio.duration;
      const currentTime = audio.currentTime;
      
      // Start fade out 2 seconds before end
      if (duration - currentTime <= 2 && duration - currentTime > 0) {
        const fadeProgress = (duration - currentTime) / 2; // 0 to 1
        audio.volume = 0.15 * fadeProgress; // Fade from 0.15 to 0
      }
    }
  }, []);

  const handleTrackEnd = useCallback(() => {
    if (audioRef.current) {
      // Reset volume and restart for seamless loop
      audioRef.current.volume = 0.15;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  }, []);

  const startBackgroundMusic = useCallback(() => {
    if (!audioRef.current) {
      initializeAudio();
    }
    
    if (audioRef.current) {
      try {
        audioRef.current.volume = 0.15;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      } catch (error) {
        console.error('Failed to start background music:', error);
      }
    }
  }, [initializeAudio]);

  const stopBackgroundMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.15; // Reset volume
    }
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  const toggleBackgroundMusic = useCallback((isEnabled: boolean) => {
    if (isEnabled) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [startBackgroundMusic, stopBackgroundMusic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleTrackEnd);
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, [handleTimeUpdate, handleTrackEnd]);

  // Handle page visibility changes to pause music when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (audioRef.current) {
        if (document.hidden) {
          audioRef.current.pause();
        } else if (audioRef.current.paused && audioRef.current.src) {
          // Only resume if audio was initialized and user has sound enabled
          audioRef.current.play().catch(console.error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    startBackgroundMusic,
    stopBackgroundMusic,
    toggleBackgroundMusic,
    initializeAudio
  };
};