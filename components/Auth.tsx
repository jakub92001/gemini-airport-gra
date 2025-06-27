

import React, { useState } from 'react';
import { supabase, supabaseError } from '../supabase';
import { GAME_NAME } from '../constants';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!supabase) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="w-full max-w-md bg-red-900/50 border border-red-700 rounded-2xl p-8 shadow-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Błąd Konfiguracji</h2>
          <p className="text-red-200 text-base mb-4">
            {supabaseError || "Nie można zainicjować klienta Supabase."}
          </p>
          <p className="text-slate-300">
            Sprawdź konsolę przeglądarki, aby uzyskać więcej informacji i upewnij się, że Twoje zmienne środowiskowe są poprawnie skonfigurowane.
          </p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setMessage(null);
      setLoading(true);
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Sprawdź swoją skrzynkę e-mail w poszukiwaniu linku potwierdzającego!");
      }
      setLoading(false);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-sm bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-4xl font-extrabold text-white mb-2 text-center">
          <span className="text-sky-400">{GAME_NAME}</span>
        </h1>
        <p className="text-slate-400 text-center mb-6">Zaloguj się, aby kontynuować, lub zarejestruj się, aby rozpocząć swoją podróż.</p>
        
        <form onSubmit={handleLogin}>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              disabled={loading}
              required
            />
            <input
              type="password"
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              disabled={loading}
              required
            />
          </div>
          {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}
          {message && <p className="mt-4 text-sm text-green-400 text-center">{message}</p>}
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {loading ? 'Przetwarzanie...' : 'Zaloguj się'}
            </button>
             <button
              type="button"
              onClick={handleSignUp}
              disabled={loading || !email || !password}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 disabled:bg-slate-700 disabled:cursor-not-allowed"
            >
              {loading ? 'Przetwarzanie...' : 'Zarejestruj się'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;