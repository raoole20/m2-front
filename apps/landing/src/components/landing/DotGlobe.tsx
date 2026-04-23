"use client";

import { useMemo } from "react";

type Vec3 = { x: number; y: number; z: number };
type ProjectedPoint = Vec3 & { lat: number; lng: number };
type NodeProjection = { x: number; y: number; front: boolean };

const LAND_MASK: Array<[number, number, number, number]> = [
  // North America
  [24, 50, -125, -65],
  [50, 70, -140, -60],
  [15, 32, -110, -85],
  // Central America
  [8, 18, -92, -77],
  // South America
  [-34, 12, -82, -34],
  [-56, -34, -75, -53],
  // Europe
  [36, 60, -10, 40],
  [60, 71, 5, 30],
  // Africa
  [-34, 36, -17, 52],
  [12, 32, 20, 35],
  // Middle East
  [15, 40, 35, 60],
  // Asia / Russia
  [30, 55, 60, 135],
  [45, 70, 55, 180],
  [18, 45, 100, 145],
  [5, 25, 95, 125],
  // India
  [8, 32, 68, 90],
  // Australia
  [-40, -12, 113, 153],
];

function isLand(lat: number, lng: number): boolean {
  return LAND_MASK.some(
    ([lat1, lat2, lng1, lng2]) => lat >= lat1 && lat <= lat2 && lng >= lng1 && lng <= lng2,
  );
}

function rotateY(p: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}

function rotateX(p: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}

function dotColor(p: Vec3): string {
  if (Math.abs(p.y) < 0.25) return "#f472b6";
  if (Math.abs(p.y) < 0.5) return "#c084fc";
  return "#8b8cf7";
}

export function DotGlobe() {
  const size = 700;
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.44;
  const rotYang = 0.35;
  const rotXang = 0.22;

  const pts = useMemo<ProjectedPoint[]>(() => {
    const arr: ProjectedPoint[] = [];
    for (let lat = -70; lat <= 75; lat += 2) {
      const latRad = (lat * Math.PI) / 180;
      const cosLat = Math.cos(latRad);
      const step = Math.max(2, Math.round(2.2 / cosLat));
      for (let lng = -180; lng <= 180; lng += step) {
        if (!isLand(lat, lng)) continue;
        const jLat = lat + (Math.random() - 0.5) * 1.4;
        const jLng = lng + (Math.random() - 0.5) * 1.4;
        const la = (jLat * Math.PI) / 180;
        const ln = (jLng * Math.PI) / 180;
        let p: Vec3 = {
          x: Math.cos(la) * Math.sin(ln),
          y: Math.sin(la),
          z: Math.cos(la) * Math.cos(ln),
        };
        p = rotateY(p, rotYang);
        p = rotateX(p, rotXang);
        arr.push({ ...p, lat: jLat, lng: jLng });
      }
    }
    return arr;
  }, []);

  const nodeAt = (latDeg: number, lngDeg: number): NodeProjection => {
    const lat = (latDeg * Math.PI) / 180;
    const lng = (lngDeg * Math.PI) / 180;
    let p: Vec3 = {
      x: Math.cos(lat) * Math.sin(lng),
      y: Math.sin(lat),
      z: Math.cos(lat) * Math.cos(lng),
    };
    p = rotateY(p, rotYang);
    p = rotateX(p, rotXang);
    return { x: cx + p.x * R, y: cy - p.y * R, front: p.z > -0.1 };
  };

  const mex = nodeAt(19, -99);
  const col = nodeAt(4.7, -74);
  const brz = nodeAt(-15, -47);
  const arg = nodeAt(-34, -58);
  const usa = nodeAt(40, -95);
  const esp = nodeAt(40, -3);

  const arc = (a: NodeProjection, b: NodeProjection, lift = 0.28): string => {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len;
    const ny = dx / len;
    const cpx = mx + nx * len * lift;
    const cpy = my + ny * len * lift - len * 0.1;
    return `M ${a.x} ${a.y} Q ${cpx} ${cpy} ${b.x} ${b.y}`;
  };

  const nodes: NodeProjection[] = [mex, col, brz, arg, usa, esp];

  return (
    <svg className="globe-svg" viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(139,140,247,.18)" />
          <stop offset="55%" stopColor="rgba(139,140,247,.05)" />
          <stop offset="100%" stopColor="rgba(139,140,247,0)" />
        </radialGradient>
        <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx={cx} cy={cy} r={R * 1.02} fill="url(#globeGlow)" />

      {pts.map((p, i) => {
        const x = cx + p.x * R;
        const y = cy - p.y * R;
        const front = p.z > -0.05;
        if (!front && p.z < -0.35) return null;
        const op = front ? 0.42 + p.z * 0.55 : 0.14 + (p.z + 0.35) * 0.25;
        const rad = front ? 1.55 : 1.0;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={rad}
            fill={dotColor(p)}
            style={{ opacity: Math.max(0.08, op) }}
          />
        );
      })}

      <g filter="url(#arcGlow)">
        {mex.front && col.front && <path d={arc(mex, col)} className="arc green" />}
        {col.front && brz.front && <path d={arc(col, brz)} className="arc" />}
        {brz.front && arg.front && <path d={arc(brz, arg)} className="arc pink" />}
        {mex.front && usa.front && <path d={arc(mex, usa, -0.3)} className="arc warm" />}
        {usa.front && esp.front && <path d={arc(usa, esp, 0.22)} className="arc" />}
        {mex.front && esp.front && <path d={arc(mex, esp, 0.32)} className="arc pink" />}
      </g>

      {nodes
        .filter((n) => n.front)
        .map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="11" className="node-halo" />
            <circle cx={n.x} cy={n.y} r="5.5" className="node" />
          </g>
        ))}
    </svg>
  );
}
