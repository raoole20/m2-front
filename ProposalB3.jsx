/* global React, Icon, CHANNELS, STEPS, PRICING, NAV, T, useReveal */

// ----- Continent land masks — rough bounding polygons in lat/lng space -----
// Each entry is a list of [latMin, latMax, lngMin, lngMax] boxes approximating continents.
const LAND_MASK = [
  // North America
  [24, 50, -125, -65], [50, 70, -140, -60], [15, 32, -110, -85],
  // Central America
  [8, 18, -92, -77],
  // South America
  [-34, 12, -82, -34], [-56, -34, -75, -53],
  // Europe
  [36, 60, -10, 40], [60, 71, 5, 30],
  // Africa
  [-34, 36, -17, 52], [12, 32, 20, 35],
  // Middle East
  [15, 40, 35, 60],
  // Asia / Russia
  [30, 55, 60, 135], [45, 70, 55, 180], [18, 45, 100, 145], [5, 25, 95, 125],
  // India
  [8, 32, 68, 90],
  // Australia
  [-40, -12, 113, 153],
];

function isLand(lat, lng) {
  return LAND_MASK.some(([lat1, lat2, lng1, lng2]) => lat >= lat1 && lat <= lat2 && lng >= lng1 && lng <= lng2);
}

// Rotate a 3D unit vector around Y / X
function rotateY(p, a) { const c=Math.cos(a), s=Math.sin(a); return { x:p.x*c+p.z*s, y:p.y, z:-p.x*s+p.z*c }; }
function rotateX(p, a) { const c=Math.cos(a), s=Math.sin(a); return { x:p.x, y:p.y*c-p.z*s, z:p.y*s+p.z*c }; }

function DotGlobe() {
  const size = 700;
  const cx = size/2, cy = size/2, R = size*0.44;
  // Tilt so Americas face us — rotY positive moves globe west
  const rotYang = 0.35;
  const rotXang = 0.22;

  const pts = React.useMemo(() => {
    // Dense lat/lng grid; keep only points that hit land and subsample
    const arr = [];
    for (let lat = -70; lat <= 75; lat += 2) {
      // more dots near equator, fewer near poles
      const latRad = lat * Math.PI / 180;
      const cosLat = Math.cos(latRad);
      const step = Math.max(2, Math.round(2.2 / cosLat));
      for (let lng = -180; lng <= 180; lng += step) {
        if (!isLand(lat, lng)) continue;
        // Jitter slightly for organic feel
        const jLat = lat + (Math.random() - 0.5) * 1.4;
        const jLng = lng + (Math.random() - 0.5) * 1.4;
        const la = jLat * Math.PI/180;
        const ln = jLng * Math.PI/180;
        let p = { x: Math.cos(la)*Math.sin(ln), y: Math.sin(la), z: Math.cos(la)*Math.cos(ln) };
        p = rotateY(p, rotYang);
        p = rotateX(p, rotXang);
        arr.push({ ...p, lat: jLat, lng: jLng });
      }
    }
    return arr;
  }, []);

  // Node positions
  const nodeAt = (latDeg, lngDeg) => {
    const lat = latDeg * Math.PI/180;
    const lng = lngDeg * Math.PI/180;
    let p = { x: Math.cos(lat)*Math.sin(lng), y: Math.sin(lat), z: Math.cos(lat)*Math.cos(lng) };
    p = rotateY(p, rotYang);
    p = rotateX(p, rotXang);
    return { x: cx + p.x*R, y: cy - p.y*R, front: p.z > -0.1 };
  };
  const mex = nodeAt(19, -99);
  const col = nodeAt(4.7, -74);
  const brz = nodeAt(-15, -47);
  const arg = nodeAt(-34, -58);
  const usa = nodeAt(40, -95);
  const esp = nodeAt(40, -3);

  const arc = (a, b, lift=0.28) => {
    const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
    const dx = b.x-a.x, dy = b.y-a.y;
    const len = Math.sqrt(dx*dx+dy*dy);
    const nx = -dy/len, ny = dx/len;
    const cpx = mx + nx*len*lift, cpy = my + ny*len*lift - len*0.1;
    return `M ${a.x} ${a.y} Q ${cpx} ${cpy} ${b.x} ${b.y}`;
  };

  // Color a point based on its vertical position (latitude) — gradient violet→pink→amber
  const dotColor = (p) => {
    // y: -1 (south) → 1 (north). Map mid-latitudes to pink.
    const t = (p.y + 1) / 2; // 0..1
    // violet (top) → pink (mid) → violet (bottom), with warm tint near equator
    if (Math.abs(p.y) < 0.25) return '#f472b6';           // equator belt → pink
    if (Math.abs(p.y) < 0.5) return '#c084fc';            // tropics → light violet
    return '#8b5cf6';                                      // poles → indigo
  };

  return (
    <svg className="globe-svg" viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(139,140,247,.18)"/>
          <stop offset="55%" stopColor="rgba(139,140,247,.05)"/>
          <stop offset="100%" stopColor="rgba(139,140,247,0)"/>
        </radialGradient>
        <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* soft glow disc */}
      <circle cx={cx} cy={cy} r={R*1.02} fill="url(#globeGlow)"/>

      {/* dots */}
      {pts.map((p, i) => {
        const x = cx + p.x*R;
        const y = cy - p.y*R;
        const front = p.z > -0.05;
        if (!front && p.z < -0.35) return null; // hide deep back-side
        const op = front ? 0.42 + p.z*0.55 : 0.14 + (p.z+0.35)*0.25;
        const rad = front ? 1.55 : 1.0;
        return <circle key={i} cx={x} cy={y} r={rad} fill={dotColor(p)} style={{opacity: Math.max(0.08, op)}}/>;
      })}

      {/* arcs — only draw if both endpoints are front-ish */}
      <g filter="url(#arcGlow)">
        {mex.front && col.front && <path d={arc(mex, col)} className="arc green"/>}
        {col.front && brz.front && <path d={arc(col, brz)} className="arc"/>}
        {brz.front && arg.front && <path d={arc(brz, arg)} className="arc pink"/>}
        {mex.front && usa.front && <path d={arc(mex, usa, -0.3)} className="arc warm"/>}
        {usa.front && esp.front && <path d={arc(usa, esp, 0.22)} className="arc"/>}
        {mex.front && esp.front && <path d={arc(mex, esp, 0.32)} className="arc pink"/>}
      </g>

      {/* nodes */}
      {[mex, col, brz, arg, usa, esp].filter(n => n.front).map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="11" className="node-halo"/>
          <circle cx={n.x} cy={n.y} r="5.5" className="node"/>
        </g>
      ))}
    </svg>
  );
}

function ProposalB3({ lang }) {
  useReveal();
  const t = T[lang];

  // Cursor-reactive aurora (from B2)
  const rootRef = React.useRef(null);
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const handleMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty('--mx', `${x}%`);
      el.style.setProperty('--my', `${y}%`);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const [activeInbox, setActiveInbox] = React.useState(1);
  const inboxItems = [
    { n: 'Laura G.', ch: 'whatsapp', col: '#25d366', prev: lang==='es'?'¿Envío a Monterrey?':'Ship to Monterrey?', t:'2m', init:'LG', bg:'linear-gradient(135deg, #34d399, #059669)' },
    { n: '@mariana.d', ch: 'instagram', col: '#e1306c', prev: lang==='es'?'¿Tienes la talla M?':'Size M available?', t:'5m', init:'M', bg:'linear-gradient(135deg, #f472b6, #db2777)' },
    { n: 'Carlos R.', ch: 'telegram', col: '#29b6f6', prev: lang==='es'?'Soporte pedido #4521':'Support order #4521', t:'12m', init:'CR', bg:'linear-gradient(135deg, #60a5fa, #2563eb)' },
    { n: 'ana@acme.co', ch: 'email', col: '#a78bfa', prev: lang==='es'?'Propuesta 50 unidades':'Proposal 50 units', t:'1h', init:'A', bg:'linear-gradient(135deg, #c4b5fd, #8b5cf6)' },
    { n: 'Jorge L.', ch: 'whatsapp', col: '#25d366', prev: lang==='es'?'Cotizar 10 unidades':'Quote 10 units', t:'2h', init:'JL', bg:'linear-gradient(135deg, #34d399, #059669)' },
  ];
  const active = inboxItems[activeInbox];

  const testimonials = [
    {
      feat: true,
      quote: lang === 'es'
        ? 'Pasamos de perder 3 de cada 10 mensajes a responder todos en menos de 2 minutos. La IA suena como mi equipo — no como un bot.'
        : 'We went from losing 3 out of 10 messages to replying to all of them in under 2 minutes. The AI sounds like my team — not a bot.',
      name: 'María Elena Rojas',
      role: lang === 'es' ? 'Fundadora · Luna Boutique' : 'Founder · Luna Boutique',
      init: 'MR',
      bg: 'linear-gradient(135deg, #f472b6, #db2777)'
    },
    {
      quote: lang === 'es'
        ? 'Conectamos WhatsApp e Instagram en 4 minutos. Al día siguiente ya teníamos 2 ventas nuevas de mensajes que antes se quedaban sin responder.'
        : 'Hooked up WhatsApp and Instagram in 4 minutes. Next day we had 2 new sales from messages that used to go unanswered.',
      name: 'Diego Hernández',
      role: lang === 'es' ? 'CEO · Nómada Wear' : 'CEO · Nómada Wear',
      init: 'DH',
      bg: 'linear-gradient(135deg, #60a5fa, #2563eb)'
    },
    {
      quote: lang === 'es'
        ? 'El traspaso a agente humano es lo mejor. La IA maneja el 80% y nos pasa solo lo importante, con todo el contexto listo.'
        : 'The human handoff is the killer feature. AI handles 80% and hands off only what matters — with full context ready.',
      name: 'Sofía Campos',
      role: lang === 'es' ? 'Head of Support · Taller 33' : 'Head of Support · Taller 33',
      init: 'SC',
      bg: 'linear-gradient(135deg, #fbbf24, #d97706)'
    },
  ];

  return (
    <div className="prop-b3" ref={rootRef}>
      {/* NAV */}
      <div className="nav">
        <div className="container nav-inner">
          <div className="logo" style={{display:'flex', alignItems:'center', gap:8}}>
            {/* "M" */}
            <svg viewBox="0 0 34 17" xmlns="http://www.w3.org/2000/svg" height="16" style={{display:'block'}}>
              <g transform="translate(-6.86, 0)">
                <path fill="#8b5cf6" d="M11.72 16L6.86 16L6.86 14.33L7.08 14.33Q7.50 14.33 7.79 14.26Q8.09 14.20 8.27 14.02Q8.44 13.84 8.44 13.54L8.44 13.54L8.44 2.84Q8.44 2.51 8.27 2.35Q8.09 2.18 7.78 2.12Q7.47 2.05 7.08 2.05L7.08 2.05L6.86 2.05L6.86 0.38L14.16 0.38L17.48 11.91L16.71 10.79L19.95 0.38L27.08 0.38L27.08 2.05L26.83 2.05Q26.24 2.05 25.86 2.21Q25.47 2.36 25.47 2.84L25.47 2.84L25.47 13.54Q25.47 14.02 25.86 14.17Q26.24 14.33 26.83 14.33L26.83 14.33L27.08 14.33L27.08 16L19.90 16L19.90 14.33L20.10 14.33Q20.37 14.33 20.66 14.31Q20.96 14.28 21.18 14.24Q21.40 14.20 21.40 14.13L21.40 14.13L21.40 0.91L21.66 0.86L16.91 16.09L14.82 16.09L10.07 0.86L10.36 0.80L10.36 14.13Q10.36 14.20 10.56 14.24Q10.77 14.28 11.07 14.31Q11.37 14.33 11.59 14.33L11.59 14.33L11.72 14.33L11.72 16Z"/>
              </g>
            </svg>

            {/* "oseo" mark in the middle */}
            <svg viewBox="0 0 40 42" xmlns="http://www.w3.org/2000/svg" height="22" style={{display:'block'}}>
              <path fill="#8b5cf6" fillRule="evenodd" clipRule="evenodd" d="M0 3.13565C0 1.74626 1.1386 0.619934 2.5433 0.619934H6.9739C7.9736 0.619934 8.9425 0.962633 9.7155 1.5897L11.0633 2.68298L11.097 2.71339C11.1281 2.70301 11.1592 2.69287 11.1904 2.68298C13.622 1.91259 16.5722 1.76608 19.5833 1.76608C22.5944 1.76608 25.5446 1.91259 27.9762 2.68298C28.0074 2.69287 28.0385 2.70301 28.0696 2.71339L28.1033 2.68298L29.4511 1.5897C30.2241 0.962633 31.193 0.619934 32.1927 0.619934H36.6233C38.028 0.619934 39.1666 1.74626 39.1666 3.13565V4.69084C39.1666 5.89409 38.6542 7.04168 37.755 7.85208L36.6677 8.83206C36.1369 9.31048 35.4998 9.65866 34.8078 9.84848L34.5506 9.91904C35.5581 12.297 36.1147 14.8388 36.1147 16.895C36.1147 25.1664 30.9408 28.7387 26.382 31.8863C22.7919 34.3651 19.5833 36.5804 19.5833 40.62C19.5833 36.5804 16.3747 34.3651 12.7846 31.8863C8.2258 28.7387 3.0519 25.1664 3.0519 16.895C3.0519 14.8388 3.6085 12.297 4.616 9.91904L4.3588 9.84848C3.6668 9.65866 3.0297 9.31048 2.4989 8.83206L1.4116 7.85208C0.512398 7.04168 0 5.89409 0 4.69084V3.13565ZM22.8896 23.6572C22.8896 24.0524 22.7154 24.4313 22.4054 24.7108C22.0954 24.9902 21.6749 25.1472 21.2364 25.1472C20.8579 25.1472 20.4927 25.0301 20.2005 24.8183C20.6979 26.1353 21.9708 27.3832 23.9069 25.3764C25.6161 23.5117 23.8309 19.5788 22.0917 17.245C21.512 16.4671 20.5603 16.0927 19.5833 16.0927C18.6063 16.0927 17.6546 16.4671 17.0749 17.245C15.3357 19.5788 13.5505 23.5117 15.2597 25.3764C17.1958 27.3832 18.4687 26.1353 18.9661 24.8183C18.6739 25.0301 18.3087 25.1472 17.9302 25.1472C17.4917 25.1472 17.0712 24.9902 16.7612 24.7108C16.4512 24.4313 16.277 24.0524 16.277 23.6572H22.8896ZM13.2526 12.0151H8.6472L12.2767 14.8898C13.0754 15.5223 14.2428 15.3201 14.737 14.4636C15.361 13.3822 14.5322 12.0151 13.2526 12.0151ZM25.914 12.0151H30.5194L26.8899 14.8898C26.0912 15.5223 24.9238 15.3201 24.4296 14.4636C23.8056 13.3822 24.6344 12.0151 25.914 12.0151Z"/>
            </svg>

            {/* "CHAT" */}
            <svg viewBox="0 0 72 17" xmlns="http://www.w3.org/2000/svg" height="16" style={{display:'block'}}>
              <g transform="translate(-46.92, 0)">
                <path fill="#8b5cf6" d="M55.04 1.88L55.04 1.88Q54.09 1.88 53.37 2.27Q52.64 2.67 52.16 3.46Q51.67 4.25 51.43 5.43Q51.19 6.61 51.19 8.19L51.19 8.19Q51.19 9.82 51.44 11.01Q51.69 12.19 52.20 12.96Q52.71 13.73 53.48 14.12Q54.25 14.50 55.28 14.50L55.28 14.50Q56.56 14.50 57.42 13.98Q58.29 13.45 58.84 12.50Q59.39 11.56 59.70 10.35L59.70 10.35L61.37 11.09Q60.96 12.70 60.12 13.90Q59.28 15.10 57.97 15.74Q56.67 16.37 54.80 16.37L54.80 16.37Q53.04 16.37 51.59 15.84Q50.15 15.30 49.10 14.24Q48.04 13.18 47.48 11.67Q46.92 10.15 46.92 8.19L46.92 8.19Q46.92 6.21 47.50 4.68Q48.09 3.15 49.13 2.11Q50.18 1.06 51.56 0.52Q52.95-0.02 54.53-0.02L54.53-0.02Q56.14-0.02 57.20 0.58Q58.27 1.17 58.91 2.25Q59.55 3.33 59.81 4.80L59.81 4.80L58.89 4.14L59.28 0.27L61.13 0.27L61.13 5.62L58.98 5.62Q58.67 4.47 58.14 3.64Q57.61 2.80 56.85 2.34Q56.09 1.88 55.04 1.88ZM66.59 8.85L66.59 7.07L75.89 7.07L75.89 8.85L66.59 8.85ZM70.31 16L63.09 16L63.09 14.33L63.33 14.33Q63.93 14.33 64.31 14.17Q64.70 14.02 64.70 13.54L64.70 13.54L64.70 2.84Q64.70 2.36 64.31 2.21Q63.93 2.05 63.33 2.05L63.33 2.05L63.09 2.05L63.09 0.38L70.31 0.38L70.31 2.03L70.13 2.03Q69.91 2.03 69.67 2.05Q69.43 2.07 69.23 2.10Q69.03 2.12 68.90 2.15Q68.77 2.18 68.77 2.25L68.77 2.25L68.77 14.13Q68.77 14.20 68.90 14.23Q69.03 14.26 69.23 14.29Q69.43 14.33 69.67 14.33Q69.91 14.33 70.13 14.33L70.13 14.33L70.31 14.33L70.31 16ZM79.99 16L72.79 16L72.79 14.35L72.97 14.35Q73.19 14.35 73.43 14.33Q73.67 14.31 73.87 14.28Q74.07 14.26 74.19 14.23Q74.31 14.20 74.31 14.13L74.31 14.13L74.31 2.25Q74.31 2.18 74.19 2.15Q74.07 2.12 73.87 2.09Q73.67 2.05 73.43 2.05Q73.19 2.05 72.97 2.05L72.97 2.05L72.79 2.05L72.79 0.38L79.99 0.38L79.99 2.05L79.77 2.05Q79.17 2.05 78.79 2.21Q78.40 2.36 78.40 2.84L78.40 2.84L78.40 13.54Q78.40 14.02 78.79 14.17Q79.17 14.33 79.77 14.33L79.77 14.33L79.99 14.33L79.99 16ZM84.74 11.07L84.87 9.42L90.92 9.42L91.05 11.07L84.74 11.07ZM91.47 14.11L87.58 1.61L88.13 2.18L84.43 13.89Q84.43 14.00 84.62 14.11Q84.80 14.22 85.13 14.27Q85.46 14.33 85.88 14.33L85.88 14.33L86.12 14.33L86.12 16L81.22 16L81.22 14.33L81.35 14.33Q81.86 14.33 82.19 14.10Q82.52 13.87 82.74 13.16L82.74 13.16L86.85 0.29L91.23 0.29L95.41 13.32Q95.61 13.93 95.95 14.13Q96.29 14.33 96.79 14.33L96.79 14.33L96.90 14.33L96.90 16L89.71 16L89.71 14.33L90.00 14.33Q90.41 14.33 90.75 14.31Q91.10 14.28 91.28 14.23Q91.47 14.17 91.47 14.11L91.47 14.11ZM103.44 13.54L103.44 13.54L103.44 2.16L102.78 2.16Q101.90 2.16 101.36 2.26Q100.82 2.36 100.58 2.59Q100.34 2.82 100.31 3.22L100.31 3.22L100.07 5.99L98.09 5.99L98.09 0.38L112.88 0.38L112.88 5.99L110.87 5.99L110.65 3.22Q110.63 2.82 110.38 2.59Q110.13 2.36 109.60 2.26Q109.07 2.16 108.19 2.16L108.19 2.16L107.53 2.16L107.53 13.54Q107.53 14.02 107.93 14.17Q108.32 14.33 108.92 14.33L108.92 14.33L109.29 14.33L109.29 16L101.66 16L101.66 14.33L102.03 14.33Q102.62 14.33 103.03 14.17Q103.44 14.02 103.44 13.54Z"/>
              </g>
            </svg>
          </div>
          <div className="nav-links">
            {NAV[lang].map(n => <a key={n.l} href={n.h}>{n.l}</a>)}
          </div>
          <div style={{display:'flex', gap:12, alignItems:'center'}}>
            <a href="#" style={{fontSize:14, color:'var(--ink-mid)', textDecoration:'none', fontWeight:500}}>{t.login}</a>
            <a href="#" className="btn btn-primary">{lang==='es'?'Empezar gratis':'Get started'} <Icon name="arrow-right" size={13}/></a>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="kicker-chip reveal">
                <span className="pulse"/>
                {lang === 'es' ? 'Nueva plataforma · Beta abierta' : 'New platform · Open beta'}
              </div>
              <h1 className="reveal" style={{transitionDelay:'60ms'}}>
                {lang === 'es' ? (
                  <>
                    <div>Convierte cada</div>
                    <div><em>conversación</em></div>
                    <div>en un cliente.</div>
                  </>
                ) : (
                  <>
                    <div>Turn every</div>
                    <div><em>conversation</em></div>
                    <div>into a customer.</div>
                  </>
                )}
              </h1>
              <p className="lede reveal" style={{transitionDelay:'140ms'}}>
                {lang === 'es'
                  ? 'M2 unifica WhatsApp, Instagram, Telegram y email en una sola bandeja. La IA responde con tu tono y te pasa solo las conversaciones que importan.'
                  : 'M2 unifies WhatsApp, Instagram, Telegram and email in one inbox. AI replies in your tone and hands off only the conversations that matter.'}
              </p>
              <div className="cta-row reveal" style={{transitionDelay:'220ms'}}>
                <a href="#" className="btn btn-primary">{lang==='es'?'Empezar gratis · 14 días':'Start free · 14 days'} <Icon name="arrow-right" size={14}/></a>
                <a href="#demo" className="btn btn-ghost">
                  <span style={{display:'inline-flex', alignItems:'center', gap:8}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    {lang === 'es' ? 'Ver demo (2 min)' : 'Watch demo (2 min)'}
                  </span>
                </a>
              </div>

              <div className="trust-inline reveal" style={{transitionDelay:'300ms'}}>
                <div className="avatars">
                  <span style={{background:'linear-gradient(135deg, #f472b6, #db2777)'}}>MR</span>
                  <span style={{background:'linear-gradient(135deg, #60a5fa, #2563eb)'}}>DH</span>
                  <span style={{background:'linear-gradient(135deg, #fbbf24, #d97706)'}}>SC</span>
                  <span style={{background:'linear-gradient(135deg, #34d399, #059669)'}}>JL</span>
                  <span style={{background:'linear-gradient(135deg, #a78bfa, #7c3aed)'}}>AM</span>
                </div>
                <div>
                  <div className="stars">★★★★★</div>
                  <div className="txt"><b>4.9/5</b> · {lang==='es'?'+850 equipos crecen con M2':'+850 teams grow with M2'}</div>
                </div>
              </div>
            </div>

            {/* APP VISUAL */}
            <div className="hero-visual reveal" style={{transitionDelay:'200ms'}}>
              <div className="app-window">
                <div className="app-titlebar">
                  <span className="dot r"/><span className="dot y"/><span className="dot g"/>
                  <span className="addr"><b>app.m2.ai</b> / inbox</span>
                </div>
                <div className="app-body">
                  <aside className="app-sidebar">
                    <div className="si on" style={{marginTop:6}}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div className="si">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 6-6"/></svg>
                    </div>
                    <div className="si">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div className="si">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    </div>
                    <div className="spc"/>
                    <div className="si" style={{marginBottom:6}}>
                      <div style={{width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg, #9a9bf9, #7677ea)', fontSize:10, color:'white', display:'grid', placeItems:'center', fontWeight:700}}>A</div>
                    </div>
                  </aside>

                  <div className="app-inbox">
                    <div className="title">
                      {lang==='es'?'Bandeja':'Inbox'}
                      <span className="n">12</span>
                    </div>
                    {inboxItems.slice(0, 5).map((it, i) => (
                      <div key={i} className={`it ${i === 1 ? 'on' : ''}`}>
                        <div className={`av ${it.ch}`} style={{background: it.bg}}>{it.init}</div>
                        <div>
                          <div className="n">{it.n}</div>
                          <div className="p">{it.prev}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="app-thread">
                    <div className="t-head">
                      <span className="dot"/>
                      <b>@mariana.d</b>
                      <span>· Instagram</span>
                      <span style={{flex:1}}/>
                      <span>{lang==='es'?'en línea':'online'}</span>
                    </div>
                    <div className="msg in">
                      <span className="tag">Instagram</span>
                      {lang==='es'?'Hola! ¿Tienes la chamarra en talla M?':'Hi! Do you have the jacket in size M?'}
                    </div>
                    <div className="msg ai">
                      <span className="tag">M2 · AI · 92% confianza</span>
                      {lang==='es'?'¡Hola Mariana! Sí, tenemos 3 disponibles en M. ¿Te mando el link para que la veas?':'Hi Mariana! Yes, we have 3 available in M. Want me to send the link so you can check it out?'}
                    </div>
                    <div className="msg in">
                      <span className="tag">Instagram</span>
                      {lang==='es'?'Sí por favor 🙏':'Yes please 🙏'}
                    </div>
                    <div className="typing"><span/><span/><span/></div>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <div className="fcard f1">
                <div className="ic" style={{background:'linear-gradient(135deg, #25d366, #128c7e)'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
                </div>
                <div>
                  <div className="lbl">{lang==='es'?'Respuesta':'Response time'}</div>
                  <div className="val">1.2s</div>
                </div>
              </div>
              <div className="fcard f2">
                <div className="ic" style={{background:'linear-gradient(135deg, #a78bfa, #6d28d9)'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                </div>
                <div>
                  <div className="lbl">{lang==='es'?'Conversaciones':'Conversations'}</div>
                  <div className="val">+18 {lang==='es'?'hoy':'today'}</div>
                </div>
              </div>
              <div className="fcard f3">
                <div className="ic" style={{background:'linear-gradient(135deg, #34d399, #059669)'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <div className="lbl">{lang==='es'?'Resueltos IA':'AI resolved'}</div>
                  <div className="val">87%</div>
                </div>
              </div>

              <div className="hero-metric" style={{top: 320, right: -50}}>
                <div className="n">+340%</div>
                <div className="l">{lang==='es'?'Conversiones':'Conversions'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* LOGOS BAR */}
        <div className="container" style={{marginTop: 80}}>
          <div className="logos">
            <div className="logos-label">{lang==='es'?'Equipos que responden con M2':'Teams replying with M2'}</div>
            <div className="logos-grid">
              <div className="lg">Luna Boutique</div>
              <div className="lg sans">NÓMADA</div>
              <div className="lg">Mila & Co.</div>
              <div className="lg sans">TALLER 33</div>
              <div className="lg">Estudio Ocho</div>
              <div className="lg sans">RUTA VERDE</div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS STRIP */}
      <section className="block" style={{paddingTop: 80}}>
        <div className="container">
          <div className="metrics-strip reveal">
            <div className="m">
              <div className="big">+<em>340</em>%</div>
              <div className="sub">{lang==='es'?'Más conversiones vs. respuesta humana tardía':'More conversions vs. delayed human reply'}</div>
            </div>
            <div className="m">
              <div className="big"><em>87</em>%</div>
              <div className="sub">{lang==='es'?'Conversaciones resueltas por IA, sin intervención':'Conversations resolved by AI, without handoff'}</div>
            </div>
            <div className="m">
              <div className="big"><em>1.2</em>s</div>
              <div className="sub">{lang==='es'?'Tiempo promedio de primera respuesta':'Average first response time'}</div>
            </div>
            <div className="m">
              <div className="big"><em>4</em>{lang==='es'?' min':' min'}</div>
              <div className="sub">{lang==='es'?'En configurar tu primer canal':'To set up your first channel'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CHANNELS */}
      <section className="block" id="channels">
        <div className="container">
          <div className="section-head reveal" style={{textAlign:'center', margin:'0 auto 48px'}}>
            <span className="kicker">{lang==='es'?'Canales unificados':'Unified channels'}</span>
            <h2>{lang === 'es' ? <>Cada canal habla distinto. M2 los entiende <em>todos</em>.</> : <>Every channel speaks differently. M2 <em>gets</em> them all.</>}</h2>
            <p style={{marginLeft:'auto', marginRight:'auto'}}>{lang === 'es' ? 'Conecta una vez. Responde donde sea. La IA adapta el tono, el formato y el momento — nunca suena a bot.' : 'Connect once. Reply anywhere. AI adapts tone, format and timing — never sounds like a bot.'}</p>
          </div>

          {/* GLOBE */}
          <div className="globe-wrap reveal">
            <DotGlobe/>
            <div className="globe-badge" style={{top:'22%', left:'18%'}}>
              <div className="ic" style={{background:'linear-gradient(135deg, #25d366, #128c7e)'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
              </div>
              <span>WhatsApp</span>
              <span className="msg">· {lang==='es'?'MX':'MX'}</span>
            </div>
            <div className="globe-badge" style={{top:'36%', right:'14%'}}>
              <div className="ic" style={{background:'linear-gradient(135deg, #e1306c, #c13584)'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/></svg>
              </div>
              <span>Instagram</span>
              <span className="msg">· ES</span>
            </div>
            <div className="globe-badge" style={{bottom:'30%', left:'10%'}}>
              <div className="ic" style={{background:'linear-gradient(135deg, #29b6f6, #0288d1)'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16l-1.858 8.759c-.14.629-.51.786-1.034.489l-2.853-2.1-1.377 1.323c-.15.149-.279.276-.57.276l.201-2.88 5.24-4.73c.229-.2-.047-.314-.354-.114l-6.47 4.073-2.79-.872c-.606-.19-.617-.606.126-.895l10.903-4.202c.505-.184.948.121.784.864z"/></svg>
              </div>
              <span>Telegram</span>
              <span className="msg">· CO</span>
            </div>
            <div className="globe-badge" style={{bottom:'14%', right:'22%'}}>
              <div className="ic" style={{background:'linear-gradient(135deg, #a78bfa, #7c3aed)'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <span>Email</span>
              <span className="msg">· BR</span>
            </div>
          </div>
          <div className="channels-grid">
            {CHANNELS.map((c, i) => (
              <div className="channel-card reveal" key={c.key} style={{transitionDelay:`${i*60}ms`}}>
                <div className="icon" style={{color: c.color, background: `${c.color}1f`}}><Icon name={c.key} size={20}/></div>
                <h3>{c.name}</h3>
                <p>{c.desc[lang]}</p>
                <div className="mini-chat"><span>{c.sample[lang]}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO / INBOX MOCK */}
      <section className="block" id="demo">
        <div className="container">
          <div className="section-head reveal">
            <span className="kicker">{lang==='es'?'La bandeja unificada':'The unified inbox'}</span>
            <h2>{lang === 'es' ? <>Una bandeja. Todos los canales. <em>Cero</em> caos.</> : <>One inbox. All channels. <em>Zero</em> chaos.</>}</h2>
            <p>{lang === 'es' ? 'Prioridad, borrador de IA y traspaso humano en una sola vista. Lo que tu equipo necesita, nada que no necesite.' : 'Priority, AI draft and human handoff — all in one view. What your team needs, nothing it doesn\'t.'}</p>
          </div>
          <div className="inbox-mock reveal">
            <div className="ibx-side">
              <div className="hdr">
                <span className="title">{lang === 'es' ? 'Bandeja' : 'Inbox'}</span>
                <span className="count">{inboxItems.length} · {lang === 'es' ? '2 sin leer' : '2 unread'}</span>
              </div>
              {inboxItems.map((it, i) => (
                <div key={i} className={`ibx-item ${i === activeInbox ? 'active' : ''}`} onClick={() => setActiveInbox(i)}>
                  <div className="ibx-avatar" style={{background: it.bg}}>{it.init}</div>
                  <div className="ibx-body">
                    <div className="name">{it.n} <span className="ch" style={{background: it.col}}/></div>
                    <div className="preview">{it.prev}</div>
                  </div>
                  <span className="t">{it.t}</span>
                </div>
              ))}
            </div>
            <div className="ibx-main">
              <div className="hdr">
                <div className="who">
                  <div className="ibx-avatar" style={{background: active.bg, width: 34, height: 34}}>{active.init}</div>
                  <span>{active.n}</span>
                  <span className="pill" style={{color: active.col, background: `${active.col}22`}}>{active.ch}</span>
                </div>
                <span className="pill">{lang === 'es' ? 'Prioridad alta' : 'High priority'}</span>
              </div>
              <div className="scroll">
                <div className="bubble" style={{alignSelf:'flex-start', background: `${active.col}12`, border: `1px solid ${active.col}30`}}>
                  <div className="from"><span style={{width:6, height:6, borderRadius:'50%', background: active.col}}/>{active.n}</div>
                  {active.prev}
                </div>
                <div className="bubble m2">
                  <div className="from"><span style={{width:6, height:6, borderRadius:'50%', background:'var(--accent)'}}/>M2 · AI draft</div>
                  {lang === 'es' ? '¡Hola Laura! Sí, enviamos a Monterrey en 24–48h. El envío es gratis en compras sobre $1,500 MXN. ¿Te comparto el catálogo?' : "Hi Laura! Yes, we ship to Monterrey in 24–48h. Free shipping on orders over $75. Want me to share the catalog?"}
                </div>
                <div style={{fontSize: 11, color:'var(--ink-lo)', alignSelf:'center', padding:'8px 0', fontWeight: 500}}>
                  {lang === 'es' ? '· IA clasificó como lead caliente · confianza 92% ·' : '· AI tagged as hot lead · 92% confidence ·'}
                </div>
              </div>
              <div className="ibx-composer">
                <span className="tag">AI</span>
                <span className="draft">{lang === 'es' ? 'Borrador listo — ajusta el tono o envía así.' : 'Draft ready — tweak tone or send as-is.'}</span>
                <div className="actions">
                  <button>{lang === 'es' ? 'Editar' : 'Edit'}</button>
                  <button className="send">{lang === 'es' ? 'Enviar' : 'Send'} ↵</button>
                </div>
              </div>
            </div>
            <div className="ibx-ai">
              <div className="sec">{lang === 'es' ? 'Resumen IA' : 'AI summary'}</div>
              <div className="card">
                <b>{lang === 'es' ? 'Cliente nuevo' : 'New customer'}</b><br/>
                {lang === 'es' ? 'Pregunta por envío a Monterrey. Interés medio-alto en chaquetas invierno.' : 'Asking about shipping to Monterrey. Medium-high interest in winter jackets.'}
              </div>
              <div className="sec">{lang === 'es' ? 'Prioridad' : 'Priority score'}</div>
              <div className="score">
                <div className="score-bar"><i style={{width:'88%'}}/></div>
                <span className="score-num">88</span>
              </div>
              <div className="sec">{lang === 'es' ? 'Acciones sugeridas' : 'Suggested actions'}</div>
              <div className="card"><b>→</b> {lang === 'es' ? 'Enviar catálogo otoño/invierno' : 'Send fall/winter catalog'}</div>
              <div className="card"><b>→</b> {lang === 'es' ? 'Agendar seguimiento en 24h' : 'Schedule 24h follow-up'}</div>
              <div className="card"><b>→</b> {lang === 'es' ? 'Etiquetar como "MTY · nueva"' : 'Tag as "MTY · new"'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="block">
        <div className="container">
          <div className="section-head reveal">
            <span className="kicker">{lang==='es'?'Confían en M2':'They trust M2'}</span>
            <h2>{lang === 'es' ? <>Equipos reales. Resultados <em>reales</em>.</> : <>Real teams. <em>Real</em> results.</>}</h2>
          </div>
          <div className="testimonials">
            {testimonials.map((t, i) => (
              <div key={i} className={`testim ${t.feat ? 'feat' : ''} reveal`} style={{transitionDelay:`${i*80}ms`}}>
                <div className="quote-mark">“</div>
                <p className="quote">{t.quote}</p>
                <div className="who">
                  <div className="av" style={{background: t.bg}}>{t.init}</div>
                  <div>
                    <div className="name">{t.name}</div>
                    <div className="role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="block" id="how">
        <div className="container">
          <div className="section-head reveal">
            <span className="kicker">{lang==='es'?'Cómo funciona':'How it works'}</span>
            <h2>{lang === 'es' ? <>Sin código. Sin consultores. <em>Sin drama</em>.</> : <>No code. No consultants. <em>No drama</em>.</>}</h2>
          </div>
          <div className="steps">
            {STEPS[lang].map((s, i) => (
              <div className="step reveal" key={s.n} style={{transitionDelay:`${i*60}ms`}}>
                <div className="n">{s.n}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="block" id="pricing">
        <div className="container">
          <div className="section-head reveal">
            <span className="kicker">{lang==='es'?'Planes':'Plans'}</span>
            <h2>{lang === 'es' ? <>Empieza pequeño. <em>Escala</em> cuando duela.</> : <>Start small. <em>Scale</em> when it hurts.</>}</h2>
          </div>
          <div className="pricing">
            {PRICING[lang].map((p, i) => (
              <div key={p.tier} className={`price-card ${p.featured ? 'featured' : ''} reveal`} data-badge={lang==='es'?'Popular':'Popular'} style={{transitionDelay:`${i*60}ms`}}>
                <div className="tier">{p.tier}</div>
                <div className="amount">{p.price}<span className="per">{p.per}</span></div>
                <ul>{p.features.map(f => <li key={f}>{f}</li>)}</ul>
                <a href="#" className={`btn ${p.featured ? 'btn-primary' : 'btn-ghost'}`} style={{marginTop:'auto', justifyContent:'center'}}>{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="block">
        <div className="container">
          <div className="cta-block reveal">
            <h2>{lang==='es' ? <>Deja de perder mensajes. Empieza <em>hoy</em>.</> : <>Stop losing messages. Start <em>today</em>.</>}</h2>
            <p>{t.finalSub}</p>
            <div className="btns">
              <a href="#" className="btn btn-primary">{t.cta1} <Icon name="arrow-right" size={14}/></a>
              <a href="#" className="btn btn-ghost">{t.cta_ghost}</a>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="foot">
          <span>© 2026 <b>M2</b> · {lang==='es'?'Hecho con cuidado en México':'Made with care in Mexico'}</span>
          <span style={{display:'flex', gap: 20, alignItems:'center'}}>
            <span style={{color:'#34d399'}}>● {lang==='es'?'Todos los sistemas operando':'All systems operational'}</span>
            <span>·</span>
            <span>{lang==='es'?'Privacidad · Términos · Estado':'Privacy · Terms · Status'}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProposalB3 });
