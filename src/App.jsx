import React, { useState, useEffect } from 'react';
import { API_URL } from './config.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Home from './pages/Home.jsx';
import Lobby from './pages/Lobby.jsx';
import Draft from './pages/Draft.jsx';
import EndScreen from './pages/EndScreen.jsx';
import Admin from './pages/Admin.jsx';


function readSession() {
  try { return JSON.parse(localStorage.getItem('draft_session')); } catch { return null; }
}

function saveSession(roomCode, participantId, isAdmin) {
  if (roomCode && participantId) {
    localStorage.setItem('draft_session', JSON.stringify({ roomCode, participantId, isAdmin }));
  }
}

function clearSession() {
  localStorage.removeItem('draft_session');
}

// Read room code from URL (e.g. /ABC123)
function getRoomCodeFromUrl() {
  const match = window.location.pathname.match(/^\/([A-Z0-9]{6})$/i);
  return match ? match[1].toUpperCase() : null;
}

export default function App() {
  // Auth state
  const [authPage, setAuthPage] = useState('login'); // 'login' | 'register' | 'forgot'
  const [user, setUser] = useState(null);

  // App state — initialized from localStorage so reconnect works on page refresh
  const [page, setPage] = useState('home');
  const [roomCode, setRoomCode] = useState(() => readSession()?.roomCode || null);
  const [participantId, setParticipantId] = useState(() => readSession()?.participantId || null);
  const [isAdmin, setIsAdmin] = useState(() => readSession()?.isAdmin || false);
  const [draftData, setDraftData] = useState(null);
  const [lobbyState, setLobbyState] = useState(null); // initial state for lobby reconnect
  const [teams, setTeams] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // On load: if URL has a room code, handle invite or reconnect
  useEffect(() => {
    const urlCode = getRoomCodeFromUrl();
    if (!urlCode) return;
    const session = readSession();
    if (!session || session.roomCode !== urlCode) {
      // No matching session → save as invite for Home to pre-fill
      sessionStorage.setItem('draft_invite_code', urlCode);
      window.history.replaceState(null, '', '/');
    }
    // If session matches → keep URL, reconnect will happen via socket connect
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Browser back button → exit room and go home
  useEffect(() => {
    const onPopState = () => {
      if (!getRoomCodeFromUrl()) {
        clearSession();
        setPage('home');
        setRoomCode(null);
        setParticipantId(null);
        setDraftData(null);
        setTeams(null);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Validate stored token on startup
  useEffect(() => {
    const token = localStorage.getItem('draft_token');
    if (!token) return;
    fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser(data.user);
        else localStorage.removeItem('draft_token');
      })
      .catch(() => localStorage.removeItem('draft_token'));
  }, []);

  // TODO(Task 9): socket.io removed — real-time reconnect logic will be replaced with REST polling

  const handleLogin = (userData) => {
    setUser(userData);
    setPage('home');
  };

  const handleLogout = () => {
    clearSession();
    localStorage.removeItem('draft_token');
    setUser(null);
    setAuthPage('login');
    setPage('home');
    setRoomCode(null);
    setParticipantId(null);
    setDraftData(null);
    setTeams(null);
  };

  // Not logged in → show auth screens
  if (!user) {
    return (
      <div className="min-h-screen">
        {authPage === 'login' && (
          <Login
            onLogin={handleLogin}
            onGoRegister={() => setAuthPage('register')}
            onGoForgot={() => setAuthPage('forgot')}
          />
        )}
        {authPage === 'register' && (
          <Register
            onLogin={handleLogin}
            onGoLogin={() => setAuthPage('login')}
          />
        )}
        {authPage === 'forgot' && (
          <ForgotPassword
            onGoLogin={() => setAuthPage('login')}
          />
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

      {loading && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="card text-center p-8">
            <div className="animate-spin text-4xl mb-4">⚽</div>
            <p className="text-gray-300">{loading}</p>
          </div>
        </div>
      )}

      {page === 'home' && (
        <Home
          user={user}
          onLogout={handleLogout}
          onGoAdmin={() => setPage('admin')}
          onRejoin={() => {
            // TODO(Task 9): implement REST-based rejoin
          }}
        />
      )}

      {page === 'admin' && <Admin onBack={() => setPage('home')} />}

      {page === 'lobby' && (
        <Lobby
          roomCode={roomCode}
          participantId={participantId}
          isAdmin={isAdmin}
          initialState={lobbyState}
          onLeave={() => {
            clearSession();
            setPage('home');
            setRoomCode(null);
            setParticipantId(null);
            setLobbyState(null);
            window.history.replaceState(null, '', '/');
          }}
          onGoHome={() => setPage('home')}
        />
      )}

      {page === 'draft' && draftData && (
        <Draft
          key={draftData.formationPhase ? 'formation' : 'real'}
          roomCode={roomCode}
          participantId={participantId}
          isAdmin={isAdmin}
          initialData={draftData}
          onParallelTurnDone={() => {
            setDraftData(null);
            setPage('lobby');
          }}
          onGoHome={() => setPage('home')}
        />
      )}

      {page === 'end' && teams && (
        <EndScreen teams={teams} participantId={participantId} />
      )}
    </div>
  );
}
