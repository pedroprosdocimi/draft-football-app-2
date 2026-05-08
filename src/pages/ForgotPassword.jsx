import React, { useState } from 'react';
import { API_URL } from '../config.js';

export default function ForgotPassword({ onGoLogin }) {
  const [step, setStep] = useState(1); // 1=request code, 2=reset
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Nao foi possivel solicitar o codigo.');
      setStep(2);
    } catch {
      setError('Erro de conexao com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (code.trim().length !== 6) return setError('O codigo deve ter 6 digitos.');
    if (novaSenha.length < 8) return setError('A senha deve ter no minimo 8 caracteres.');
    if (novaSenha !== confirmar) return setError('As senhas nao coincidem.');

    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), password: novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Erro ao redefinir senha.');
      setSuccess(true);
    } catch {
      setError('Erro de conexao com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">KEY</div>
          <h1 className="text-3xl font-bold text-white mb-1">Draft Football</h1>
          <p className="text-gray-400 text-sm">Redefinir senha</p>
        </div>

        <div className="card">
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">OK</div>
              <p className="text-green-400 font-medium">Senha redefinida com sucesso!</p>
              <button onClick={onGoLogin} className="btn-primary w-full">
                Fazer login
              </button>
            </div>
          ) : step === 1 ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-2">Recuperar senha</h2>
              <p className="text-gray-500 text-sm mb-6">Informe seu email para receber um codigo.</p>

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    autoCapitalize="none"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button type="submit" className="btn-primary w-full" disabled={loading || !email.trim()}>
                  {loading ? 'Enviando...' : 'Enviar codigo'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-2">Nova senha</h2>
              <p className="text-gray-500 text-sm mb-6">
                Email: <span className="text-white font-medium">{email}</span>
              </p>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Codigo</label>
                  <input
                    type="text"
                    className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                    placeholder="000000"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\\D/g, ''))}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nova senha</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Minimo 8 caracteres"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Confirmar senha</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="********"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
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
                  disabled={loading || code.trim().length !== 6 || !novaSenha || !confirmar}
                >
                  {loading ? 'Salvando...' : 'Redefinir senha'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError('');
                    setCode('');
                    setNovaSenha('');
                    setConfirmar('');
                  }}
                  className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {'<- Voltar'}
                </button>
              </form>
            </>
          )}

          {!success && (
            <div className="mt-6 pt-5 border-t border-gray-800 text-center">
              <button
                onClick={onGoLogin}
                className="text-draft-green hover:text-green-400 text-sm font-medium transition-colors"
              >
                {'<- Voltar ao login'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
