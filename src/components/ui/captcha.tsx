
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaptchaProps {
  onVerify: (isVerified: boolean) => void;
  className?: string;
}

const generateCaptchaText = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
};

const Captcha = ({ onVerify, className }: CaptchaProps) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  
  const generateNewCaptcha = () => {
    setCaptchaText(generateCaptchaText());
    setUserInput('');
    setIsVerified(false);
    setIsWrong(false);
  };
  
  useEffect(() => {
    generateNewCaptcha();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
    setIsWrong(false);
  };
  
  const handleVerify = () => {
    const isValid = userInput === captchaText;
    setIsVerified(isValid);
    setIsWrong(!isValid);
    onVerify(isValid);
    
    if (!isValid) {
      // Generate a new captcha if the input is wrong
      setTimeout(generateNewCaptcha, 1000);
    }
  };
  
  return (
    <div className={cn("w-full rounded-md border border-gray-200 p-4", className)}>
      <div className="text-sm font-medium mb-2">Verify you're human</div>
      
      <div className="flex items-center mb-3">
        <div 
          className="flex-1 bg-gray-100 p-3 text-lg tracking-widest font-mono select-none relative overflow-hidden"
          style={{
            // Add some visual noise to make it harder for bots
            background: `
              linear-gradient(45deg, #f3f4f6 25%, transparent 25%, transparent 75%, #f3f4f6 75%),
              linear-gradient(45deg, #f3f4f6 25%, transparent 25%, transparent 75%, #f3f4f6 75%)
            `,
            backgroundSize: '4px 4px',
            backgroundPosition: '0 0, 2px 2px',
          }}
        >
          {/* Add some lines to make it harder for bots */}
          <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
            <div className="absolute bg-gray-400 h-px w-full" style={{ top: '40%', transform: 'rotate(5deg)' }}></div>
            <div className="absolute bg-gray-400 h-px w-full" style={{ top: '60%', transform: 'rotate(-7deg)' }}></div>
          </div>
          
          {captchaText.split('').map((char, index) => (
            <span 
              key={index}
              style={{
                display: 'inline-block',
                transform: `rotate(${Math.random() * 10 - 5}deg)`,
                margin: '0 1px',
                color: `hsl(${Math.random() * 60 + 180}, 70%, 40%)`,
              }}
            >
              {char}
            </span>
          ))}
        </div>
        
        <button 
          onClick={generateNewCaptcha}
          className="ml-2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Refresh captcha"
        >
          <RefreshCw size={18} />
        </button>
      </div>
      
      <div className="flex items-center">
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          className={cn(
            "flex-1 px-3 py-2 rounded-md border text-base focus:outline-none focus:ring-2 focus:ring-offset-2",
            isWrong 
              ? "border-red-300 focus:ring-red-500" 
              : isVerified
                ? "border-green-300 focus:ring-green-500"
                : "border-gray-300 focus:ring-sociodent-500"
          )}
          placeholder="Enter the code above"
          maxLength={6}
        />
        
        <button
          onClick={handleVerify}
          className="ml-2 px-4 py-2 bg-sociodent-600 text-white rounded-md hover:bg-sociodent-700 focus:outline-none focus:ring-2 focus:ring-sociodent-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={userInput.length !== captchaText.length || isVerified}
        >
          {isVerified ? 'Verified' : 'Verify'}
        </button>
      </div>
      
      {isWrong && (
        <p className="mt-1 text-sm text-red-600">
          Incorrect code. Please try again.
        </p>
      )}
    </div>
  );
};

export { Captcha };
