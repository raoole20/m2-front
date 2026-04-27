import { Canvas, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { memo, useMemo, type ReactElement } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';

import {
  atmosphereIntensityMultiplier,
  atmosphereV2,
  type AtmosphereIntensity,
  type AtmosphereMood,
  type HaloDescriptor,
} from '../atmosphere';

export type AtmosphereProps = {
  mood?: AtmosphereMood;
  intensity?: AtmosphereIntensity;
};

const PERCENT = /^\s*([-\d.]+)\s*%/;

function parsePercent(input: string, base: number): number {
  const match = PERCENT.exec(input);
  if (!match) return 0;
  const raw = match[1] ?? '0';
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return 0;
  return (value / 100) * base;
}

function parsePair(input: string, width: number, height: number): [number, number] {
  const [first = '0%', second = '0%'] = input.split(/\s+/);
  return [parsePercent(first, width), parsePercent(second, height)];
}

type ResolvedHalo = {
  cx: number;
  cy: number;
  radius: number;
  colors: readonly [string, string];
};

function resolveHalo(
  descriptor: HaloDescriptor,
  width: number,
  height: number,
  multiplier: number,
): ResolvedHalo {
  const [w, h] = parsePair(descriptor.size, width, height);
  const [x, y] = parsePair(descriptor.pos, width, height);
  const radius = Math.max(w, h) / 2;
  const alpha = Math.max(0, Math.min(1, descriptor.opacity * multiplier));
  return {
    cx: x,
    cy: y,
    radius,
    colors: [`rgba(${descriptor.color}, ${alpha})`, `rgba(${descriptor.color}, 0)`] as const,
  };
}

function AtmosphereInner({
  mood = 'inbox',
  intensity = 'rich',
}: AtmosphereProps): ReactElement | null {
  const { width, height } = useWindowDimensions();
  const halos = atmosphereV2[mood];
  const multiplier = atmosphereIntensityMultiplier[intensity];

  const resolved = useMemo<ResolvedHalo[] | null>(() => {
    if (multiplier === 0) return null;
    return halos.map((halo) => resolveHalo(halo, width, height, multiplier));
  }, [halos, multiplier, width, height]);

  if (!resolved) return null;

  return (
    <Canvas style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]} pointerEvents="none">
      {resolved.map((halo, index) => (
        <Rect key={index} x={0} y={0} width={width} height={height}>
          <RadialGradient c={vec(halo.cx, halo.cy)} r={halo.radius} colors={[...halo.colors]} />
        </Rect>
      ))}
    </Canvas>
  );
}

export const Atmosphere = memo(AtmosphereInner);
