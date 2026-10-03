import { useCallback, useEffect, useRef } from 'react';
import musicUrl from '@assets/bubble-sound.mp3';

/** One owned audio element per mounted game; mute survives visibility changes. */
export const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabledRef = useRef(false);
  const playIfEnabled = useCallback(() => {
    const audio = audioRef.current;
    if (enabledRef.current && !document.hidden && audio?.src) {
      // Autoplay can be denied. A subsequent pointer gesture retries quietly.
      void audio.play().catch(() => {});
    }
  }, []);
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const left = audio.duration - audio.currentTime;
    audio.volume = Number.isFinite(left) && left < 2 ? Math.max(0, left / 2) * 0.15 : 0.15;
  }, []);
  const handleTrackEnd = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = 0.15;
    playIfEnabled();
  }, [playIfEnabled]);
  const initializeAudio = useCallback(() => {
    if (audioRef.current) return;
    const audio = new Audio(musicUrl);
    audio.preload = 'none';
    audio.volume = 0.15;
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleTrackEnd);
    audioRef.current = audio;
  }, [handleTimeUpdate, handleTrackEnd]);
  const startBackgroundMusic = useCallback(() => {
    enabledRef.current = true;
    initializeAudio();
    playIfEnabled();
  }, [initializeAudio, playIfEnabled]);
  const stopBackgroundMusic = useCallback(() => {
    enabledRef.current = false;
    audioRef.current?.pause();
  }, []);
  const toggleBackgroundMusic = useCallback((enabled: boolean) => {
    if (enabled) startBackgroundMusic();
    else stopBackgroundMusic();
  }, [startBackgroundMusic, stopBackgroundMusic]);
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) audioRef.current?.pause();
      else playIfEnabled();
    };
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('pointerdown', playIfEnabled);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('pointerdown', playIfEnabled);
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleTrackEnd);
        audio.removeAttribute('src');
        audio.load();
      }
      audioRef.current = null;
    };
  }, [handleTimeUpdate, handleTrackEnd, playIfEnabled]);
  return { startBackgroundMusic, stopBackgroundMusic, toggleBackgroundMusic, initializeAudio };
};
