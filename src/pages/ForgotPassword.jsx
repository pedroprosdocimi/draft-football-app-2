import React, { useState } from 'react';
import { API_URL } from '../config.js';

export default function ForgotPassword({ onGoLogin }) {
  const [step, setStep] = useState(1); // 1=verificar identidade, 2=nova senha
  const [username, setUsername] = useState('');
  const [telefone, setTelefone] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!username.trim() || !telefone.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-identity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), telefone: telefone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Dados inválidos.');
      setStep(2);
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (novaSenha.length < 6) return setError('A senha deve ter no mínimo 6 caracteres.');
    if (novaSenha !== confirmar) return setError('As senhas não coincidem.');

    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), telefone: telefone.trim(), nova_senha: novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Erro ao redefinir senha.');
      setSuccess(true);
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
          <div className="text-6xl mb-4">🔑</div>
          <h1 className="text-3xl font-bold text-white mb-1">Draft Cartola</h1>
          <p className="text-gray-400 text-sm">Redefinir senha</p>
        </div>

        <div className="card">
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <p className="text-green-400 font-medium">Senha redefinida com sucesso!</p>
              <button onClick={onGoLogin} className="btn-primary w-full">
                Fazer login
              </button>
            </div>
          ) : step === 1 ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-2">Verificar identidade</h2>
              <p className="text-gray-500 text-sm mb-6">Informe seu username e telefone cadastrado.</p>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="seu_username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoFocus
                    autoCapitalize="none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Telefone</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="(11) 99999-9999"
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading || !username.trim() || !telefone.trim()}
                >
                  {loading ? 'Verificando...' : 'Continuar'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-2">Nova senha</h2>
              <p className="text-gray-500 text-sm mb-6">
                Conta: <span className="text-white font-medium">{username}</span>
              </p>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nova senha</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Mínimo 6 caracteres"
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Confirmar senha</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••"
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading || !novaSenha || !confirmar}
                >
                  {loading ? 'Salvando...' : 'Redefinir senha'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  ← Voltar
                </button>
              </form>
            </>
          )}

          {!success && (
            <div className="mt-6 pt-5 border-t border-gray-800 text-center">
              <button
                onClick={onGoLogin}
                className="text-cartola-green hover:text-green-400 text-sm font-medium transition-colors"
              >
                ← Voltar ao login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
