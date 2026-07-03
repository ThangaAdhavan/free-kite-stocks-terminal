import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Mail, Lock, Loader2 } from 'lucide-react';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  if (!loading && user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if (!email || !password) { setErr('Email and password required.'); return; }
    if (password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setBusy(true);
    try {
      if (mode === 'up') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg('Account created. Check your email to verify, then sign in.');
        setMode('in');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav('/');
      }
    } catch (e: any) { setErr(e.message || 'Authentication failed.'); }
    finally { setBusy(false); }
  };

  const reset = async () => {
    if (!email) { setErr('Enter your email first.'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setErr(error.message); else setMsg('Password reset email sent.');
  };

  const demo = async () => {
    setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: 'demo@terminal.io', password: 'password123' });
    if (error) setErr('Demo unavailable: ' + error.message);
    else nav('/');
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="grid lg:grid-cols-2 gap-0 max-w-4xl w-full nb bg-[var(--bg-card)] overflow-hidden">
        <div className="p-8 sm:p-10 bg-[var(--accent)] text-[#0a0a0a] border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-[var(--border)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="grid place-items-center w-11 h-11 bg-[#0a0a0a] text-[var(--accent)] border-[3px] border-[#0a0a0a]"><TrendingUp strokeWidth={3} /></span>
              <span className="font-mono2 font-bold text-2xl tracking-tighter">TERMINAL</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-[0.95] tracking-tight mb-4">AI STOCK<br/>RESEARCH<br/>THAT BITES.</h1>
            <p className="font-mono2 text-sm max-w-xs">Live prices, TradingView-grade charts, AI analysis, watchlists, portfolios & Gmail alerts. Powered by free market data.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {['CANDLESTICK','RSI / MACD','AI SWOT','ALERTS'].map((t) => (
              <span key={t} className="text-[11px] font-bold border-2 border-[#0a0a0a] px-2 py-1 bg-white">{t}</span>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8 sm:p-10">
          <div className="flex gap-2 mb-6">
            <button onClick={() => setMode('in')} className={`flex-1 py-2 text-sm font-bold border-2 border-[var(--border)] ${mode === 'in' ? 'bg-[var(--accent2)] text-white' : ''}`}>Sign In</button>
            <button onClick={() => setMode('up')} className={`flex-1 py-2 text-sm font-bold border-2 border-[var(--border)] ${mode === 'up' ? 'bg-[var(--accent2)] text-white' : ''}`}>Sign Up</button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="flex items-center gap-2 nb-sm px-3 py-2.5 bg-[var(--bg-card)]">
              <Mail size={16} className="text-muted" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="bg-transparent outline-none flex-1 text-sm font-mono2" />
            </label>
            <label className="flex items-center gap-2 nb-sm px-3 py-2.5 bg-[var(--bg-card)]">
              <Lock size={16} className="text-muted" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-transparent outline-none flex-1 text-sm font-mono2" />
            </label>
            {err && <div className="text-xs font-bold p-2 border-2 border-[var(--border)]" style={{ background: 'var(--color-bear)', color: '#fff' }}>{err}</div>}
            {msg && <div className="text-xs font-bold p-2 border-2 border-[var(--border)]" style={{ background: 'var(--color-bull)', color: '#0a0a0a' }}>{msg}</div>}
            <button type="submit" disabled={busy} className="w-full py-3 font-bold nb-sm nb-press bg-[var(--accent)] text-[#0a0a0a] flex items-center justify-center gap-2">
              {busy && <Loader2 size={16} className="animate-spin" />} {mode === 'up' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {mode === 'in' && <button onClick={reset} className="text-xs text-muted underline mt-2">Forgot password?</button>}

          <div className="flex items-center gap-3 my-4">
            <div className="h-[2px] flex-1 bg-[var(--border)]" /><span className="text-xs font-bold text-muted">OR</span><div className="h-[2px] flex-1 bg-[var(--border)]" />
          </div>

          <button onClick={() => signInWithGoogle('TERMINAL')} className="w-full py-3 font-bold nb-sm nb-press bg-[var(--bg-card)] flex items-center justify-center gap-2 text-sm">
            <svg width="17" height="17" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>
          <button onClick={demo} disabled={busy} className="w-full py-2.5 font-bold text-sm underline text-muted mt-3">Try the demo account →</button>
        </motion.div>
      </div>
    </div>
  );
}
