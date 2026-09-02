import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api, setStoredToken } from '../../services/api';
import { User } from '../../types';

interface LoginScreenProps {
  onAuthenticated: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res =
        mode === 'login'
          ? await api.auth.login(email, password)
          : await api.auth.register(email, password, name || undefined);
      setStoredToken(res.access_token);
      onAuthenticated(res.user);
    } catch (err: any) {
      setError(err.message || 'Não foi possível autenticar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b101b] text-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-slate-950 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <span className="text-white font-black text-lg tracking-tighter">AR</span>
          </div>
          <h1 className="font-extrabold text-xl text-slate-100 tracking-wide">AzureRose</h1>
          <p className="text-xs text-slate-500 mt-1">Clear vision to make the impossible possible.</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'login' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'register' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'register' && (
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Nome (opcional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Como podemos te chamar"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="voce@exemplo.com"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Senha</label>
              <input
                type="password"
                required
                minLength={mode === 'register' ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
              />
            </div>

            {error && (
              <p className="text-xs text-white bg-slate-950/60 border border-white/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-slate-950 text-white text-sm font-semibold py-2.5 rounded-lg shadow-md shadow-blue-500/10 hover:opacity-95 transition-opacity disabled:opacity-60"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {mode === 'login' ? 'Entrar no workspace' : 'Criar minha conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
