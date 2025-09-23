import React, { useState, FormEvent } from 'react';

interface PinAuthProps {
  onPinSubmit: (pin: string) => void;
  error: string | null;
}

const PinAuth: React.FC<PinAuthProps> = ({ onPinSubmit, error }) => {
  const [pin, setPin] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pin.trim()) {
        onPinSubmit(pin);
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center text-white font-sans p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 sm:text-5xl">
          JIPLAK_PROMPT 2.0
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          Please enter your PIN to access the application.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="relative">
            <input
              id="pin"
              name="pin"
              type="password"
              autoComplete="current-password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-center text-2xl tracking-widest bg-slate-800"
              placeholder="••••"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm animate-shake">{error}</p>
          )}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-colors"
            >
              Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinAuth;
