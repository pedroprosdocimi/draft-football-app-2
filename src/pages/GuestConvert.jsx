import React from 'react';
import FieldPlayerPreview from '../components/FieldPlayerPreview.jsx';

/* ============================================================================
   GuestConvert — tela de conversão após o guest montar os 11 titulares.
   Props: starters (array de player), formation (string),
          onRegister(), onLogin()
   ============================================================================ */

const CONVERT_BENEFITS = [
  'Completar o elenco: 5 reservas e o capitão',
  'Salvar seu time e competir a cada rodada',
  'Criar campeonatos privados com amigos',
  'Ver rankings, histórico e pontuações ao vivo',
];

const LiveEyebrow = ({ children }) => (
  <span className="land-eyebrow">
    <span className="land-live" /> {children}
  </span>
);

export default function GuestConvert({ starters = [], formation, onRegister, onLogin }) {
  return (
    <div className="land-root">
      <div className="land-state" data-active="true">
        <div className="land-convert-screen">

          {/* Mini grid dos 11 titulares */}
          {starters.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
              justifyContent: 'center', maxWidth: 440, width: '100%',
            }}>
              {starters.map((p) => (
                <div key={p.id} style={{ '--fcw': '60px' }}>
                  <FieldPlayerPreview player={p} posLabel={null} />
                </div>
              ))}
            </div>
          )}

          {/* Card de conversão */}
          <div className="land-convert land-stadium">
            <LiveEyebrow>Seu time titular está pronto</LiveEyebrow>
            <h2>Falta pouco para entrar em campo.</h2>
            <p className="sub">
              Crie sua conta para completar o elenco — escolher os 5 reservas e o capitão —
              salvar o time e disputar os campeonatos.
            </p>
            <ul className="land-benefits">
              {CONVERT_BENEFITS.map((b) => (
                <li key={b}><span className="ck">✓</span> {b}</li>
              ))}
            </ul>
            <div className="land-convert-cta">
              <button
                className="land-btn land-btn-primary land-btn-lg land-btn-block"
                onClick={onRegister}
              >
                Criar minha conta grátis →
              </button>
              <button
                className="land-btn land-btn-ghost land-btn-block"
                onClick={onLogin}
              >
                Já tenho conta → Entrar
              </button>
            </div>
            <div className="land-convert-note">Grátis. Sem cartão de crédito.</div>
          </div>

        </div>
      </div>
    </div>
  );
}
