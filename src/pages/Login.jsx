import React, { useState } from 'react';
import { API_URL } from '../config.js';

export default function Login({ onLogin, onGoRegister, onGoForgot }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login.');
        return;
      }
      localStorage.setItem('draft_token', data.token);
      onLogin(data.user);
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-3xl font-bold text-white mb-1">Draft Football</h1>
          <p className="text-gray-400 text-sm">Entre na sua conta para continuar</p>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input type="email" className="input-field" placeholder="seu@email.com"
                value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
              <input type="password" className="input-field" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <button onClick={onGoForgot} className="text-xs text-gray-600 hover:text-gray-400">
              Esqueci minha senha
            </button>
            <div>
              <button onClick={onGoRegister} className="text-xs text-gray-600 hover:text-draft-green">
                Criar conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
