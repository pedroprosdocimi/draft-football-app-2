// PlayerFigure.jsx — back-view bonequinho SVG + national kit palette
// Shared between FieldPlayerPreview (field cards) and PickPanel (pick cards).

export const NATIONAL_KITS = {
  br: { skin:'#7a5230', hair:'#141210', jersey:'#ffd400', sleeve:'#149a4b', name_color:'#16713c' },
  fr: { skin:'#5b3a26', hair:'#120f0d', jersey:'#1b3a8f', sleeve:'#16306f', name_color:'#ffffff' },
  es: { skin:'#a06b42', hair:'#15110e', jersey:'#c4222a', sleeve:'#a31a22', name_color:'#ffd24a' },
  ar: { skin:'#e0b48d', hair:'#4a3322', jersey:'#75acdf', sleeve:'#75acdf', name_color:'#14213d', stripes:true, stripe1:'#7cb1e2', stripe2:'#f3f4f2' },
  pt: { skin:'#d49e74', hair:'#181410', jersey:'#b81f33', sleeve:'#0a6b34', name_color:'#ffffff' },
  de: { skin:'#c8956c', hair:'#2e1f12', jersey:'#ffffff', sleeve:'#000000', name_color:'#000000' },
  nl: { skin:'#c8956c', hair:'#3a2810', jersey:'#f76d2b', sleeve:'#e55a18', name_color:'#ffffff' },
  'gb-eng': { skin:'#c8a882', hair:'#3d2a1a', jersey:'#ffffff', sleeve:'#cc0000', name_color:'#cc0000' },
  uy: { skin:'#c8956c', hair:'#2e1f12', jersey:'#5eb2e0', sleeve:'#4899c5', name_color:'#ffffff' },
  co: { skin:'#7a5230', hair:'#1a1008', jersey:'#ffd700', sleeve:'#e6b800', name_color:'#003087' },
  mx: { skin:'#8a6540', hair:'#1a0f06', jersey:'#006847', sleeve:'#005538', name_color:'#ffffff' },
  us: { skin:'#c8a882', hair:'#3d2a1a', jersey:'#ffffff', sleeve:'#002868', name_color:'#002868' },
  it: { skin:'#c8956c', hair:'#2e1f12', jersey:'#003d9e', sleeve:'#002d7a', name_color:'#ffffff' },
  hr: { skin:'#c8956c', hair:'#2e1f12', jersey:'#cc0000', sleeve:'#cc0000', name_color:'#ffffff', stripes:true, stripe1:'#cc0000', stripe2:'#ffffff' },
  ma: { skin:'#8a6540', hair:'#1a0f06', jersey:'#c1272d', sleeve:'#a01e22', name_color:'#ffffff' },
  _: { skin:'#3a434b', hair:'#2c343b', jersey:'#222a30', sleeve:'#1a2127', name_color:'rgba(0,0,0,0)' },
};

export default function PlayerFigure({ kit: k, number, surname, uid, className = '' }) {
  const pid = `strp-${uid}`;
  const torsoFill = k.stripes ? `url(#${pid})` : k.jersey;
  return (
    <svg
      className={`fcard-fig ${className}`}
      viewBox="2 14 196 184"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {k.stripes && (
          <pattern id={pid} width="24" height="10" patternUnits="userSpaceOnUse">
            <rect width="24" height="10" fill={k.stripe2} />
            <rect width="12" height="10" fill={k.stripe1} />
          </pattern>
        )}
      </defs>
      {/* arms */}
      <rect x="44" y="104" width="16" height="84" rx="7.5" fill={k.skin} />
      <rect x="140" y="104" width="16" height="84" rx="7.5" fill={k.skin} />
      {/* neck */}
      <rect x="87" y="62" width="26" height="24" rx="7" fill={k.skin} />
      {/* jersey torso */}
      <path d="M58,90 C58,83 64,80 73,80 L127,80 C136,80 142,83 142,90 L137,196 L63,196 Z" fill={torsoFill} />
      {/* sleeves */}
      <path d="M58,90 C50,87 43,91 40,101 L46,118 C52,115 57,107 60,99 Z" fill={k.sleeve} />
      <path d="M142,90 C150,87 157,91 160,101 L154,118 C148,115 143,107 140,99 Z" fill={k.sleeve} />
      {/* collar */}
      <path d="M84,82 Q100,91 116,82" fill="none" stroke={k.sleeve} strokeWidth="4.5" strokeLinecap="round" />
      {/* surname + number */}
      {surname ? (
        <text x="100" y="112" textAnchor="middle" fontFamily="'Bricolage Grotesque',sans-serif"
              fontWeight="800" fontSize="17" letterSpacing="0.5" fill={k.name_color}>{surname}</text>
      ) : null}
      {number ? (
        <text x="100" y="178" textAnchor="middle" fontFamily="'Bricolage Grotesque',sans-serif"
              fontWeight="800" fontSize="74" fill={k.name_color}>{number}</text>
      ) : null}
      {/* head + ears */}
      <circle cx="71" cy="48" r="6.5" fill={k.skin} />
      <circle cx="129" cy="48" r="6.5" fill={k.skin} />
      <circle cx="100" cy="44" r="30" fill={k.hair} />
    </svg>
  );
}
