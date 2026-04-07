import React, { useState, useEffect } from 'react';
import { API_URL } from './config.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Home from './pages/Home.jsx';
import Draft from './pages/Draft.jsx';
import EndScreen from './pages/EndScreen.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  const [authPage, setAuthPage] = useState('login');
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [draftId, setDraftId] = useState(null);
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
    setPage('home');
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

  if (!user) {
    return (
      <div className="min-h-screen">
        {authPage === 'login' && (
          <Login onLogin={handleLogin}
            onGoRegister={() => setAuthPage('register')}
            onGoForgot={() => setAuthPage('forgot')} />
        )}
        {authPage === 'register' && (
          <Register onLogin={handleLogin} onGoLogin={() => setAuthPage('login')} />
        )}
        {authPage === 'forgot' && (
          <ForgotPassword onGoLogin={() => setAuthPage('login')} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900 border border-red-600 text-red-100 px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
      {page === 'home' && (
        <Home user={user} onLogout={handleLogout}
          onGoAdmin={() => setPage('admin')}
          onStartDraft={handleStartDraft} />
      )}
      {page === 'admin' && <Admin onBack={() => setPage('home')} />}
      {page === 'draft' && draftId && (
        <Draft draftId={draftId} user={user}
          onGoHome={() => setPage('home')}
          onComplete={handleDraftComplete} />
      )}
      {page === 'end' && draftId && (
        <EndScreen draftId={draftId} onGoHome={() => { setDraftId(null); setPage('home'); }} />
      )}
    </div>
  );
}
