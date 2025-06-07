import React, { useState } from 'react';
// Add .js/.ts extension (if not using module aliases)
import { EmailService } from '../../services/emailService';

const EmailTest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendTestEmail = async (type: 'welcome' | 'reset') => {
    setIsSending(true);
    setMessage('');

    try {
      if (type === 'welcome') {
        await EmailService.sendWelcomeEmail(email, name);
        setMessage('Welcome email sent successfully!');
      } else {
        // For demo purposes, using a fake token
        await EmailService.sendPasswordResetEmail(email, name, 'demo-reset-token');
        setMessage('Password reset email sent successfully!');
      }
    } catch (error) {
      setMessage('Failed to send email. Check console for details.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Email Testing</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Recipient Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="user@example.com"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Recipient Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="John Doe"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleSendTestEmail('welcome')}
          disabled={isSending || !email || !name}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSending ? 'Sending...' : 'Send Welcome Email'}
        </button>
        
        <button
          onClick={() => handleSendTestEmail('reset')}
          disabled={isSending || !email || !name}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {isSending ? 'Sending...' : 'Send Reset Email'}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-md ${message.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default EmailTest;