import React, { useState } from 'react';
import { API_URL } from '../config.js';

export default function Register({ onLogin, onGoLogin }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      return setError('Nome, email e senha são obrigatórios.');
    }
    if (form.password !== form.confirm) return setError('As senhas não coincidem.');
    if (form.password.length < 8) return setError('Senha deve ter pelo menos 8 caracteres.');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta.');
        return;
      }
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem('draft_token', loginData.token);
        onLogin(loginData.user);
      } else {
        setError('Conta criada! Verifique seu email para ativar.');
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
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-3xl font-bold text-white mb-1">Draft Football</h1>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">Criar conta</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
              <input type="text" className="input-field" placeholder="Seu nome"
                value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input type="email" className="input-field" placeholder="seu@email.com"
                value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Telefone (opcional)</label>
              <input type="tel" className="input-field" placeholder="+5511999999999"
                value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
              <input type="password" className="input-field" placeholder="mínimo 8 caracteres"
                value={form.password} onChange={set('password')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Confirmar senha</label>
              <input type="password" className="input-field"
                value={form.confirm} onChange={set('confirm')} />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={onGoLogin} className="text-xs text-gray-600 hover:text-draft-green">
              Já tenho conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
