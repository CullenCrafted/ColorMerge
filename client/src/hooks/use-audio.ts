import { useRef, useCallback } from 'react';

export const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const initializeAudio = useCallback(() => {
    if (!audioRef.current) {
      try {
        audioRef.current = new Audio();
        audioRef.current.preload = 'auto';
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3; // Set to 30% volume for pleasant sound
        
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

  const playBubbleSound = useCallback(() => {
    if (!audioRef.current) {
      initializeAudio();
    }
    
    if (audioRef.current) {
      try {
        // Reset to beginning for clean loop
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
        
        // Stop after 3 seconds to match bubble animation
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
        }, 3000);
      } catch (error) {
        console.error('Failed to play bubble sound:', error);
      }
    }
  }, [initializeAudio]);

  const stopBubbleSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return {
    playBubbleSound,
    stopBubbleSound,
    initializeAudio
  };
};