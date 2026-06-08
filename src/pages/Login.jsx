import React, { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

const IconEnvelope = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2.5"/>
    <path d="m4 7 8 6 8-6"/>
  </svg>
);

const IconLock = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="10" width="16" height="11" rx="2.5"/>
    <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
  </svg>
);

const IconEye = ({ size = 18, crossed = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
    {crossed && <path d="m3 3 18 18"/>}
  </svg>
);

const IconArrow = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m13 6 6 6-6 6"/>
  </svg>
);

const Emblem = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="emblemGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#1f7a46"/>
        <stop offset="1" stopColor="#0b3a20"/>
      </linearGradient>
      <clipPath id="emblemClip">
        <rect x="3" y="3" width="94" height="94" rx="26"/>
      </clipPath>
    </defs>
    <rect x="3" y="3" width="94" height="94" rx="26" fill="url(#emblemGrad)"/>
    <g clipPath="url(#emblemClip)">
      <rect x="3" y="3" width="15.666" height="94" fill="#ffffff" opacity="0.05"/>
      <rect x="18.666" y="3" width="15.666" height="94" fill="#06351c" opacity="0.30"/>
      <rect x="34.333" y="3" width="15.666" height="94" fill="#ffffff" opacity="0.05"/>
      <rect x="50" y="3" width="15.666" height="94" fill="#06351c" opacity="0.30"/>
      <rect x="65.666" y="3" width="15.666" height="94" fill="#ffffff" opacity="0.05"/>
      <rect x="81.333" y="3" width="15.666" height="94" fill="#06351c" opacity="0.30"/>
      <rect x="3" y="3" width="94" height="48" rx="26" fill="#ffffff" opacity="0.05"/>
    </g>
    <rect x="7" y="7" width="86" height="86" rx="22" fill="none" stroke="#fbd07a" strokeWidth="0.9" opacity="0.55"/>
    <text x="50" y="49" textAnchor="middle" dominantBaseline="central" fontFamily="'Bricolage Grotesque', sans-serif" fontWeight="800" fontSize="44" letterSpacing="-2" fill="#f6f8f6">11</text>
    <text x="50" y="72" textAnchor="middle" fontFamily="'Bricolage Grotesque', sans-serif" fontWeight="700" fontSize="8" letterSpacing="2.5" fill="#fbd07a">DRAFTING</text>
  </svg>
);

const WcTag = () => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(245,166,35,.09)', border: '1px solid rgba(245,166,35,.34)',
    borderRadius: 999, padding: '5px 12px',
    fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 11,
    letterSpacing: '.14em', color: '#fbd07a',
  }}>
    <span style={{ color: '#f5a623' }}>★</span> COPA DO MUNDO 2026
  </span>
);

const MOBILE_FLAGS = ['br', 'ar', 'fr', 'es', 'pt', 'gb-eng', 'de', 'nl'];
const DESKTOP_FLAGS = [...MOBILE_FLAGS, 'it', 'mx'];

const FlagStrip = ({ flags, flagSize }) => (
  <div style={{ display: 'flex', gap: 7 }}>
    {flags.map(code => (
      <span
        key={code}
        className={`fi fi-${code}`}
        style={{
          width: flagSize, aspectRatio: '3/2', borderRadius: 3,
          boxShadow: '0 1px 4px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.13)',
          display: 'inline-block', flexShrink: 0,
        }}
      />
    ))}
  </div>
);

export default function Login({ onLogin, onGoRegister, onGoForgot }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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
      onLogin?.(data.user);
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const [focusedField, setFocusedField] = useState(null);

  const desktop = isDesktop;
  const iconSz = desktop ? 18 : 17;

  const focusStyle = {
    borderColor: '#1a6b3c',
    background: '#1b2228',
    boxShadow: '0 0 0 3px rgba(26,107,60,.22)',
  };

  const inputBase = (field) => ({
    width: '100%',
    height: desktop ? 50 : 46,
    borderRadius: desktop ? 12 : 11,
    background: focusedField === field ? '#1b2228' : '#1c2126',
    border: `1px solid ${focusedField === field ? '#1a6b3c' : '#2a313a'}`,
    boxShadow: focusedField === field ? '0 0 0 3px rgba(26,107,60,.22)' : 'none',
    color: '#e8eaed',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    transition: 'border-color .15s, box-shadow .15s, background .15s',
    fontSize: desktop ? 15 : 14.5,
  });

  const formFields = (
    <>
      {/* Email */}
      <div style={{ marginBottom: desktop ? 18 : 16 }}>
        <label htmlFor="login-email" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#a8aeb6', marginBottom: 7 }}>
          Email
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: desktop ? 14 : 13, color: '#6c727a', pointerEvents: 'none', display: 'flex' }}>
            <IconEnvelope size={iconSz} />
          </span>
          <input
            id="login-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            className="placeholder-[#4a4f56]"
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            style={{ ...inputBase('email'), paddingLeft: desktop ? 44 : 40, paddingRight: desktop ? 16 : 14 }}
          />
        </div>
      </div>

      {/* Password */}
      <div style={{ marginBottom: desktop ? 8 : 4 }}>
        <label htmlFor="login-password" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#a8aeb6', marginBottom: 7 }}>
          Senha
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: desktop ? 14 : 13, color: '#6c727a', pointerEvents: 'none', display: 'flex' }}>
            <IconLock size={iconSz} />
          </span>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            className="placeholder-[#4a4f56]"
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            style={{ ...inputBase('password'), paddingLeft: desktop ? 44 : 40, paddingRight: desktop ? 44 : 40 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            style={{
              position: 'absolute', right: 8,
              height: desktop ? 34 : 32, width: desktop ? 34 : 32,
              border: 0, background: 'transparent',
              display: 'grid', placeItems: 'center',
              color: '#6c727a', cursor: 'pointer', borderRadius: 8, padding: 0,
            }}
          >
            <IconEye size={desktop ? 19 : 18} crossed={showPassword} />
          </button>
        </div>
      </div>

      {/* Forgot */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: desktop ? '-2px 0 18px' : '-4px 0 16px' }}>
        <button
          type="button"
          onClick={() => onGoForgot?.()}
          style={{ background: 'none', border: 0, padding: 2, fontSize: 12, color: '#6c727a', cursor: 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fbd07a'}
          onMouseLeave={e => e.currentTarget.style.color = '#6c727a'}
        >
          Esqueci minha senha
        </button>
      </div>

      {/* Error */}
      {error && <p role="alert" style={{ color: '#ef5350', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', height: desktop ? 50 : 48,
          border: 0, borderRadius: 12,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: '.01em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'linear-gradient(180deg,#23864b,#1a6b3c)', color: '#fff',
          boxShadow: '0 10px 24px -10px rgba(26,107,60,.7), inset 0 0 0 1px rgba(70,201,122,.18)',
          opacity: loading ? 0.5 : 1,
          transition: 'transform .08s, background .15s',
        }}
      >
        {loading ? 'Entrando...' : <><span>Entrar</span><IconArrow size={17} /></>}
      </button>
    </>
  );

  /* ── DESKTOP ─────────────────────────────────────────────────────────── */
  if (isDesktop) {
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.05fr 1fr',
        fontFamily: "'Inter', sans-serif", WebkitFontSmoothing: 'antialiased',
      }}>
        {/* Left: brand panel */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(150deg,#1f7a46,#0b3a20 70%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '56px 56px 48px',
        }}>
          {/* Grass stripes */}
          <div style={{
            position: 'absolute', inset: 0, opacity: .5, pointerEvents: 'none',
            background: 'repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 64px, rgba(6,53,28,.34) 64px 128px)',
          }} />
          {/* Vignette */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(120% 90% at 30% 0%, transparent 40%, rgba(4,20,12,.55))',
          }} />

          {/* Top row */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: '-.01em', color: '#e8eaed' }}>
              drafting<span style={{ color: '#fbd07a' }}>11</span>
            </span>
            <WcTag />
          </div>

          {/* Center content */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 420 }}>
            <div style={{ filter: 'drop-shadow(0 24px 44px rgba(0,0,0,.4))' }}>
              <Emblem size={120} />
            </div>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
              fontSize: 42, lineHeight: 1.05, letterSpacing: '-.02em', margin: 0, color: '#fff',
            }}>
              A Copa é sua.<br/>Monte o time dos sonhos.
            </h2>
            <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: 'rgba(234,255,242,.82)', maxWidth: 380 }}>
              Faça o draft dos maiores craques do mundo, escale sua seleção e dispute cada rodada do Mundial.
            </p>
          </div>

          {/* Bottom */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FlagStrip flags={DESKTOP_FLAGS} flagSize={27} />
            <p style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, letterSpacing: '.12em', color: 'rgba(234,255,242,.55)' }}>
              48 SELEÇÕES · UM TÍTULO
            </p>
          </div>
        </div>

        {/* Right: form panel */}
        <div style={{
          position: 'relative',
          background: `
            radial-gradient(120% 80% at 100% 0%, rgba(26,107,60,.12), transparent 55%),
            radial-gradient(90% 70% at 0% 120%, rgba(245,166,35,.05), transparent 60%),
            #0a0b0d
          `,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48,
        }}>
          <div style={{ width: '100%', maxWidth: 368 }}>
            <div style={{ marginBottom: 26 }}>
              <h1 style={{
                fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700,
                fontSize: 26, margin: '0 0 6px', letterSpacing: '-.01em', color: '#e8eaed',
              }}>
                Entrar
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: '#a8aeb6' }}>Entre na sua conta para continuar</p>
            </div>
            <form onSubmit={handleSubmit}>
              {formFields}
            </form>
            <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13.5, color: '#6c727a' }}>
              Não tem conta?{' '}
              <button
                type="button"
                onClick={() => onGoRegister?.()}
                style={{ background: 'none', border: 'none', color: '#fbd07a', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                Criar conta grátis
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── MOBILE ──────────────────────────────────────────────────────────── */
  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(120% 70% at 50% -6%, rgba(26,107,60,.22), transparent 58%),
        radial-gradient(110% 60% at 50% 112%, rgba(245,166,35,.07), transparent 60%),
        #0a0b0d
      `,
      display: 'flex', flexDirection: 'column',
      padding: '80px 30px 26px',
      fontFamily: "'Inter', sans-serif", WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Brand block */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 13, marginBottom: 20 }}>
        <div style={{ filter: 'drop-shadow(0 16px 30px rgba(0,0,0,.5))' }}>
          <Emblem size={84} />
        </div>
        <h1 style={{
          fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
          fontSize: 32, letterSpacing: '-.02em', margin: 0, lineHeight: 1, color: '#e8eaed',
        }}>
          drafting<span style={{ color: '#f5a623' }}>11</span>
        </h1>
        <WcTag />
        <p style={{ margin: 0, fontSize: 13.5, color: '#a8aeb6' }}>Monte sua seleção e dispute a Copa</p>
      </div>

      {/* Form card */}
      <div style={{
        background: '#111316', border: '1px solid #23292f',
        borderRadius: 20, padding: '24px 22px 22px',
        boxShadow: '0 20px 50px -28px rgba(0,0,0,.7)',
      }}>
        <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, margin: '0 0 20px', color: '#e8eaed' }}>
          Entrar
        </h2>
        <form onSubmit={handleSubmit}>
          {formFields}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 2px' }}>
            <span style={{ height: 1, flex: 1, background: '#23292f' }} />
            <span style={{ fontSize: 11, color: '#4a4f56', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.1em' }}>OU</span>
            <span style={{ height: 1, flex: 1, background: '#23292f' }} />
          </div>

          {/* Ghost button */}
          <button
            type="button"
            onClick={() => onGoRegister?.()}
            style={{
              width: '100%', height: 48, border: '1px solid #2a313a', borderRadius: 12,
              background: 'transparent', color: '#e8eaed',
              fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 15,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a6b3c'; e.currentTarget.style.background = 'rgba(26,107,60,.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a313a'; e.currentTarget.style.background = 'transparent'; }}
          >
            Criar conta&nbsp;<span style={{ color: '#fbd07a' }}>grátis</span>
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', textAlign: 'center', paddingTop: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11 }}>
        <FlagStrip flags={MOBILE_FLAGS} flagSize={23} />
        <p style={{ margin: 0, fontSize: 10.5, color: '#4a4f56', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.09em' }}>
          48 SELEÇÕES · COPA DO MUNDO 2026
        </p>
      </div>
    </div>
  );
}
