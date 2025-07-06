import React, { useState, useRef } from 'react';
import { FaVolumeUp, FaPause, FaPlay } from 'react-icons/fa';

interface AudioCaptchaProps {
  captchaText: string;
  className?: string;
}

const AudioCaptcha: React.FC<AudioCaptchaProps> = ({ captchaText, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speakCaptcha = () => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      setIsPlaying(true);
      setIsPaused(false);
      
      const utterance = new SpeechSynthesisUtterance();
      // Add spaces between characters for clarity
      utterance.text = captchaText.split('').join(' ');
      utterance.rate = 0.7; // Slower rate for clarity
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
      };
      
      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Audio CAPTCHA is not supported in this browser.');
    }
  };

  const pauseAudio = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel(); // Stop current speech
      setIsPaused(true);
    }
  };

  const resumeAudio = () => {
    if ('speechSynthesis' in window && isPaused) {
      // Restart the speech instead of trying to resume
      const utterance = new SpeechSynthesisUtterance();
      utterance.text = captchaText.split('').join(' ');
      utterance.rate = 0.7;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
      };
      
      currentUtteranceRef.current = utterance;
      setIsPaused(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      currentUtteranceRef.current = null;
    }
  };

  return (
    <div className={`audio-captcha-controls ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Audio CAPTCHA:</span>
        
        {!isPlaying ? (
          <button
            type="button"
            onClick={speakCaptcha}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            title="Play audio CAPTCHA"
            aria-label="Play audio CAPTCHA for accessibility"
          >
            <FaPlay size={12} />
            <span>Play</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1">
            {!isPaused ? (
              <button
                type="button"
                onClick={pauseAudio}
                className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
                title="Pause audio"
                aria-label="Pause audio playback"
              >
                <FaPause size={12} />
                <span>Pause</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={resumeAudio}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                title="Resume audio"
                aria-label="Resume audio playback"
              >
                <FaPlay size={12} />
                <span>Resume</span>
              </button>
            )}
            
            <button
              type="button"
              onClick={stopAudio}
              className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              title="Stop audio"
              aria-label="Stop audio playback"
            >
              Stop
            </button>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          {isPlaying && !isPaused && '🔊 Playing...'}
          {isPaused && '⏸️ Paused'}
          {!isPlaying && !isPaused && 'For visually impaired users'}
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-1">
        Audio will spell out each character with spaces for clarity
      </div>
    </div>
  );
};

export default AudioCaptcha;
