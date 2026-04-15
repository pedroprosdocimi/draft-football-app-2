import React, { useState } from 'react';
import { API_URL } from '../config.js';

export default function VerifyEmail({ email, password, onLogin, onGoLogin }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (code.trim().length !== 6) return setError('O código deve ter 6 dígitos.');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Código inválido ou expirado.');
        return;
      }

      // Email verified — now login automatically
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem('draft_token', loginData.token);
        onLogin(loginData.user);
      } else {
        // Verified but auto-login failed — send to login screen
        onGoLogin();
      }
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-3xl font-bold text-white mb-1">Verificar email</h1>
          <p className="text-gray-400 text-sm mt-2">
            Enviamos um código de 6 dígitos para<br />
            <span className="text-white font-medium">{email}</span>
          </p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Código de verificação</label>
              <input
                type="text"
                className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={onGoLogin} className="text-xs text-gray-600 hover:text-draft-green">
              Voltar ao login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
