import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Star, Briefcase, Bell, Newspaper, Globe, Sun, Moon, LogOut, Menu, X, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import SearchBar from './SearchBar';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/markets', label: 'Markets', icon: Globe },
  { to: '/watchlist', label: 'Watchlist', icon: Star },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/news', label: 'News', icon: Newspaper },
];

export default function Navbar() {
  const { dark, toggle } = useTheme();
  const { user } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = async () => { await supabase.auth.signOut(); nav('/login'); };

  return (
    <header className="sticky top-0 z-40 glass border-b-[3px] border-[var(--border)]">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-5 py-2.5 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid place-items-center w-9 h-9 bg-[var(--accent)] border-[3px] border-[var(--border)]">
            <TrendingUp size={18} strokeWidth={3} className="text-[#0a0a0a]" />
          </span>
          <span className="font-mono2 font-bold text-lg tracking-tighter hidden sm:block">TERMINAL</span>
        </Link>

        <div className="flex-1 hidden md:block"><SearchBar /></div>

        <nav className="hidden lg:flex items-center gap-1">
          {LINKS.map((l) => {
            const A = l.icon;
            const on = loc.pathname === l.to;
            return (
              <Link key={l.to} to={l.to}
                className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold border-2 ${on ? 'bg-[var(--accent2)] text-white border-[var(--border)]' : 'border-transparent hover:border-[var(--border)]'}`}>
                <A size={15} /> {l.label}
              </Link>
            );
          })}
        </nav>

        <button onClick={toggle} className="nb-sm nb-press w-9 h-9 grid place-items-center bg-[var(--bg-card)] shrink-0">
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button onClick={logout} className="nb-sm nb-press hidden lg:grid w-9 h-9 place-items-center bg-[var(--accent3)] text-white shrink-0" title={user?.email || 'Sign out'}>
          <LogOut size={16} />
        </button>
        <button onClick={() => setOpen((o) => !o)} className="lg:hidden nb-sm w-9 h-9 grid place-items-center bg-[var(--bg-card)]">
          {open ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      <div className="md:hidden px-3 pb-2.5"><SearchBar compact /></div>

      {open && (
        <div className="lg:hidden border-t-[3px] border-[var(--border)] bg-[var(--bg-card)] px-3 py-3 grid grid-cols-2 gap-2">
          {LINKS.map((l) => {
            const A = l.icon;
            return (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-bold nb-sm ${loc.pathname === l.to ? 'bg-[var(--accent2)] text-white' : 'bg-[var(--bg-card)]'}`}>
                <A size={16} /> {l.label}
              </Link>
            );
          })}
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold nb-sm bg-[var(--accent3)] text-white col-span-2">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </header>
  );
}
