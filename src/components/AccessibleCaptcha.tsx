import React, { useState, useEffect, useRef } from 'react';

interface AccessibleCaptchaProps {
  onVerification: (isValid: boolean) => void;
  onCaptchaChange?: (captchaValue: string) => void;
}

const AccessibleCaptcha: React.FC<AccessibleCaptchaProps> = ({
  onVerification,
  onCaptchaChange
}) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [audioMode, setAudioMode] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate random CAPTCHA text
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput('');
    setIsVerified(false);
    setError('');
    onVerification(false);
    onCaptchaChange?.('');
  };

  // Draw visual CAPTCHA on canvas
  const drawCaptcha = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise lines
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
    
    // Draw text
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw each character with slight rotation and color variation
    const spacing = canvas.width / (captchaText.length + 1);
    for (let i = 0; i < captchaText.length; i++) {
      ctx.save();
      const x = spacing * (i + 1);
      const y = canvas.height / 2 + (Math.random() - 0.5) * 10;
      
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      
      // Random color for each character
      const colors = ['#1f2937', '#374151', '#4b5563', '#6b7280'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      
      ctx.fillText(captchaText[i], 0, 0);
      ctx.restore();
    }
    
    // Add noise dots
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.4)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  // Text-to-speech for audio CAPTCHA
  const speakCaptcha = () => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance();
      utterance.text = captchaText.split('').join(' '); // Add spaces between characters
      utterance.rate = 0.7; // Slower rate for clarity
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
        setError('Audio playback failed. Please try refreshing the CAPTCHA.');
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      setError('Audio CAPTCHA is not supported in this browser.');
    }
  };

  // Verify CAPTCHA input
  const verifyCaptcha = () => {
    const isValid = userInput.toUpperCase() === captchaText.toUpperCase();
    setIsVerified(isValid);
    
    if (isValid) {
      setError('');
      onVerification(true);
    } else {
      setError('CAPTCHA verification failed. Please try again.');
      onVerification(false);
      generateCaptcha(); // Generate new CAPTCHA on failure
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);
    setError('');
    onCaptchaChange?.(value);
    
    // Auto-verify when user types the correct length
    if (value.length === captchaText.length) {
      setTimeout(() => verifyCaptcha(), 500);
    }
  };

  // Initialize CAPTCHA on component mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  // Redraw canvas when captcha text changes
  useEffect(() => {
    if (captchaText && !audioMode) {
      drawCaptcha();
    }
  }, [captchaText, audioMode]);

  // Pause audio
  const pauseAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  };

  // Resume audio
  const resumeAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  return (
    <div className="accessible-captcha space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50" role="group" aria-labelledby="captcha-label">
      <div id="captcha-label" className="text-sm font-medium text-gray-700">
        Security Verification (CAPTCHA)
      </div>
      
      {/* Mode Toggle */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-600">Choose verification method:</span>
        <button
          type="button"
          onClick={() => setAudioMode(false)}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            !audioMode 
              ? 'bg-[#1669AE] text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          aria-pressed={!audioMode}
          aria-label="Switch to visual CAPTCHA"
        >
          👁️ Visual
        </button>
        <button
          type="button"
          onClick={() => setAudioMode(true)}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            audioMode 
              ? 'bg-[#1669AE] text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          aria-pressed={audioMode}
          aria-label="Switch to audio CAPTCHA for accessibility"
        >
          🔊 Audio
        </button>
      </div>

      {/* Visual CAPTCHA */}
      {!audioMode && (
        <div className="visual-captcha">
          <canvas
            ref={canvasRef}
            width={250}
            height={80}
            className="border-2 border-gray-300 rounded-lg bg-white mx-auto block"
            aria-label={`Visual CAPTCHA showing ${captchaText.split('').join(' ')}`}
            role="img"
          />
          <div className="text-xs text-gray-600 text-center mt-2">
            Enter the characters shown above
          </div>
        </div>
      )}

      {/* Audio CAPTCHA */}
      {audioMode && (
        <div className="audio-captcha bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="text-center space-y-3">
            <div className="text-sm text-blue-800 mb-3">
              🔊 Audio CAPTCHA - Listen to the characters and type them below
            </div>
            
            <div className="flex justify-center space-x-2 flex-wrap">
              <button
                type="button"
                onClick={speakCaptcha}
                disabled={isPlaying}
                className="bg-[#1669AE] text-white px-4 py-2 rounded-md hover:bg-[#135a94] disabled:bg-blue-400 transition-colors flex items-center space-x-2"
                aria-label="Play audio CAPTCHA"
              >
                <span>{isPlaying ? '⏸️' : '▶️'}</span>
                <span>{isPlaying ? 'Playing...' : 'Play Audio'}</span>
              </button>
              
              {isPlaying && (
                <button
                  type="button"
                  onClick={pauseAudio}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  aria-label="Pause audio playback"
                >
                  ⏸️ Pause
                </button>
              )}
              
              <button
                type="button"
                onClick={generateCaptcha}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                aria-label="Generate new CAPTCHA"
              >
                🔄 New
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Field */}
      <div className="captcha-input space-y-2">
        <label 
          htmlFor="captcha-input" 
          className="block text-sm font-medium text-gray-700"
        >
          Enter the {audioMode ? 'characters you heard' : 'characters shown above'}:
        </label>
        <div className="relative">
          <input
            id="captcha-input"
            type="text"
            value={userInput}
            onChange={handleInputChange}
            maxLength={5}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
              isVerified 
                ? 'border-green-500 bg-green-50 focus:ring-green-500' 
                : error 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-[#1669AE]'
            }`}
            placeholder="Enter 5 characters"
            aria-describedby={error ? 'captcha-error' : 'captcha-help'}
            aria-invalid={!!error}
            autoComplete="off"
          />
          {isVerified && (
            <div className="absolute right-3 top-2.5 text-green-500">
              ✅
            </div>
          )}
        </div>
        
        <div id="captcha-help" className="text-xs text-gray-600">
          {audioMode 
            ? 'Listen to the audio and type the 5 characters you hear. Use the play button to repeat.'
            : 'Type the 5 characters shown in the image above. Letters and numbers are case-insensitive.'
          }
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          id="captcha-error" 
          className="text-red-600 text-sm bg-red-50 p-2 rounded-md border border-red-200"
          role="alert"
          aria-live="polite"
        >
          ⚠️ {error}
        </div>
      )}

      {/* Success Message */}
      {isVerified && (
        <div 
          className="text-green-600 text-sm bg-green-50 p-2 rounded-md border border-green-200"
          role="status"
          aria-live="polite"
        >
          ✅ CAPTCHA verified successfully!
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={generateCaptcha}
          className="text-[#1669AE] hover:text-[#135a94] text-sm underline"
          aria-label="Generate a new CAPTCHA challenge"
        >
          🔄 Get New CAPTCHA
        </button>
      </div>
    </div>
  );
};

export default AccessibleCaptcha;
