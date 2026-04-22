"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement | null>(null);
  const trailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const glow = glowRef.current;
    const trail = trailRef.current;
    if (!glow || !trail) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let glowX = targetX;
    let glowY = targetY;
    let trailX = targetX;
    let trailY = targetY;
    let visible = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) {
        visible = true;
        glow.style.opacity = "1";
        trail.style.opacity = "1";
      }
    };

    const onLeave = () => {
      visible = false;
      glow.style.opacity = "0";
      trail.style.opacity = "0";
    };

    const onEnter = () => {
      visible = true;
      glow.style.opacity = "1";
      trail.style.opacity = "1";
    };

    const tick = () => {
      glowX += (targetX - glowX) * 0.22;
      glowY += (targetY - glowY) * 0.22;
      trailX += (targetX - trailX) * 0.09;
      trailY += (targetY - trailY) * 0.09;
      glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
      trail.style.transform = `translate3d(${trailX}px, ${trailY}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
    };
  }, []);

  return (
    <>
      <div ref={trailRef} className="cursor-glow cursor-glow-trail" aria-hidden="true" />
      <div ref={glowRef} className="cursor-glow cursor-glow-core" aria-hidden="true" />
    </>
  );
}
