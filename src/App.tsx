import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import TickerTape from './components/TickerTape';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StockDetail from './pages/StockDetail';
import Markets from './pages/Markets';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import Alerts from './pages/Alerts';
import News from './pages/News';

function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  );
}

function Shell() {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <TickerTape />
      <Navbar />
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-3 sm:px-5 py-5">
        <AnimatePresence mode="wait">
          <Routes location={loc} key={loc.pathname}>
            <Route path="/" element={<Page><Dashboard /></Page>} />
            <Route path="/stock/:symbol" element={<Page><StockDetail /></Page>} />
            <Route path="/markets" element={<Page><Markets /></Page>} />
            <Route path="/watchlist" element={<Page><Watchlist /></Page>} />
            <Route path="/portfolio" element={<Page><Portfolio /></Page>} />
            <Route path="/alerts" element={<Page><Alerts /></Page>} />
            <Route path="/news" element={<Page><News /></Page>} />
          </Routes>
        </AnimatePresence>
      </main>
      <footer className="border-t-[3px] border-[var(--border)] py-4 text-center text-xs font-mono2 text-muted">
        TERMINAL · Data via Yahoo Finance, Stooq & CoinGecko (free) with automatic failover · Not investment advice
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
