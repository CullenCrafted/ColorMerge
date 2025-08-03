import { useRef, useCallback } from 'react';

export const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const initializeAudio = useCallback(() => {
    if (!audioRef.current) {
      try {
        audioRef.current = new Audio();
        audioRef.current.preload = 'auto';
        audioRef.current.loop = true;
        audioRef.current.volume = 0.2; // Set to 20% volume for background music
        
        // Import the audio file
        import('@assets/bubble-sound.mp3').then((audioModule) => {
          if (audioRef.current) {
            audioRef.current.src = audioModule.default;
          }
        }).catch(console.error);
        
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    }
  }, []);

  const startBackgroundMusic = useCallback(() => {
    if (!audioRef.current) {
      initializeAudio();
    }
    
    if (audioRef.current) {
      try {
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
    }
  }, []);

  const toggleBackgroundMusic = useCallback((isEnabled: boolean) => {
    if (isEnabled) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [startBackgroundMusic, stopBackgroundMusic]);

  return {
    startBackgroundMusic,
    stopBackgroundMusic,
    toggleBackgroundMusic,
    initializeAudio
  };
};