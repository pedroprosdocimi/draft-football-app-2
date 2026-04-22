import React, { useState, useEffect } from 'react';
import { API_URL } from './config.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import Home from './pages/Home.jsx';
import Draft from './pages/Draft.jsx';
import EndScreen from './pages/EndScreen.jsx';
import Admin from './pages/Admin.jsx';
import Partidas from './pages/Partidas.jsx';
import Championship from './pages/Championship.jsx';

function getInitialChampionshipShareCode() {
  return new URLSearchParams(window.location.search).get('championship') || null;
}

function syncChampionshipQuery(shareCode) {
  const url = new URL(window.location.href);
  if (shareCode) url.searchParams.set('championship', shareCode);
  else url.searchParams.delete('championship');
  window.history.replaceState({}, '', url.toString());
}

export default function App() {
  const initialShareCode = getInitialChampionshipShareCode();
  const [authPage, setAuthPage] = useState('login');
  const [verifyEmail, setVerifyEmail] = useState(null); // { email, password }
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(initialShareCode ? 'championship' : 'home');
  const [draftId, setDraftId] = useState(null);
  const [championshipId, setChampionshipId] = useState(null);
  const [championshipShareCode, setChampionshipShareCode] = useState(initialShareCode);
  const [error, setError] = useState(null);

  // Validate stored token on startup
  useEffect(() => {
    const token = localStorage.getItem('draft_token');
    if (!token) return;
    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser(data.user);
        else localStorage.removeItem('draft_token');
      })
      .catch(() => localStorage.removeItem('draft_token'));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setPage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('draft_token');
    setUser(null);
    setAuthPage('login');
    setPage(championshipShareCode ? 'championship' : 'home');
    setDraftId(null);
  };

  const handleStartDraft = (id) => {
    setDraftId(id);
    setPage('draft');
  };

  const handleDraftComplete = (id) => {
    setDraftId(id);
    setPage('end');
  };

  const handleViewDraft = (id) => {
    setDraftId(id);
    setPage('end');
  };

  const handleOpenChampionship = ({ id, shareCode }) => {
    setChampionshipId(id || null);
    setChampionshipShareCode(shareCode || null);
    syncChampionshipQuery(shareCode || null);
    setPage('championship');
  };

  const handleCloseChampionship = () => {
    setChampionshipId(null);
    setChampionshipShareCode(null);
    syncChampionshipQuery(null);
    setPage('home');
  };

  if (!user && page !== 'championship') {
    return (
      <div className="min-h-screen">
        {authPage === 'login' && (
          <Login onLogin={handleLogin}
            onGoRegister={() => setAuthPage('register')}
            onGoForgot={() => setAuthPage('forgot')} />
        )}
        {authPage === 'register' && (
          <Register
            onLogin={handleLogin}
            onGoLogin={() => setAuthPage('login')}
            onGoVerify={(email, password) => {
              setVerifyEmail({ email, password });
              setAuthPage('verify-email');
            }}
          />
        )}
        {authPage === 'verify-email' && verifyEmail && (
          <VerifyEmail
            email={verifyEmail.email}
            password={verifyEmail.password}
            onLogin={handleLogin}
            onGoLogin={() => { setVerifyEmail(null); setAuthPage('login'); }}
          />
        )}
        {authPage === 'forgot' && (
          <ForgotPassword onGoLogin={() => setAuthPage('login')} />
        )}
      </div>
    );
  }

  const showPartidasTab = ['home', 'partidas'].includes(page);

  return (
    <div className="min-h-screen">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900 border border-red-600 text-red-100 px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* Partidas tab — top-left, visible on home and partidas pages */}
      {showPartidasTab && (
        <button
          type="button"
          onClick={() => setPage(page === 'partidas' ? 'home' : 'partidas')}
          className={`fixed top-4 left-4 z-40 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
            page === 'partidas'
              ? 'border-draft-gold/50 bg-draft-gold/15 text-draft-gold'
              : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white'
          }`}
        >
          🏟 Partidas
        </button>
      )}

      {page === 'home' && (
        <Home user={user} onLogout={handleLogout}
          onGoAdmin={() => setPage('admin')}
          onStartDraft={handleStartDraft}
          onViewDraft={handleViewDraft}
          onOpenChampionship={handleOpenChampionship} />
      )}
      {page === 'partidas' && <Partidas onBack={() => setPage('home')} />}
      {page === 'admin' && <Admin onBack={() => setPage('home')} />}
      {page === 'championship' && (
        <Championship
          championshipId={championshipId}
          shareCode={championshipShareCode}
          user={user}
          onGoHome={handleCloseChampionship}
        />
      )}
      {page === 'draft' && draftId && (
        <Draft draftId={draftId} user={user}
          onGoHome={() => setPage('home')}
          onComplete={handleDraftComplete} />
      )}
      {page === 'end' && draftId && (
        <EndScreen draftId={draftId} user={user} onGoHome={() => { setDraftId(null); setPage('home'); }} />
      )}
    </div>
  );
}
