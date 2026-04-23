"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type BubbleKind = "wa" | "ig" | "tg" | "em" | "m2" | "fm" | "li" | "sm";

type BubbleProps = {
  kind: BubbleKind;
  from: string;
  text: string;
  depth: number;
  rot: number;
  delay: number;
  style: CSSProperties;
};

function Bubble({ kind, from, text, depth, rot, delay, style }: BubbleProps) {
  const zOpacity = Math.max(0, Math.min(1, (depth + 40) / 120));
  const cssVars = {
    "--z": `${depth}px`,
    "--rot": `${rot}deg`,
    "--delay": `${delay}s`,
    "--z-opacity": zOpacity.toFixed(2),
  } as CSSProperties;

  return (
    <div className={`fb ${kind}`} style={{ ...style, ...cssVars }} aria-hidden="true">
      <span className="from">{from}</span>
      {text}
    </div>
  );
}

export function AuthVisual() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let nextX = 0;
    let nextY = 0;

    const apply = () => {
      frame = 0;
      el.style.setProperty("--mx", nextX.toFixed(3));
      el.style.setProperty("--my", nextY.toFixed(3));
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      nextX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      nextY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      nextX = 0;
      nextY = 0;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="auth-visual-col" ref={stageRef}>
      <div className="floating-bubbles">
        <div className="stage">
          <Bubble
            kind="wa"
            from="WHATSAPP · Laura"
            text="¿Envían a Monterrey?"
            depth={-20}
            rot={1.5}
            delay={0.18}
            style={{ top: "8%", right: "6%" }}
          />
          <Bubble
            kind="m2"
            from="M2 · AI"
            text="Sí! 24-48h. ¿Cierro tu orden?"
            depth={75}
            rot={-0.8}
            delay={0.32}
            style={{ top: "24%", right: "4%" }}
          />
          <Bubble
            kind="sm"
            from="SMS · +52 81··4917"
            text="Código de verificación: 824917"
            depth={-5}
            rot={-1.2}
            delay={0.12}
            style={{ top: "18%", left: "8%" }}
          />
          <Bubble
            kind="tg"
            from="TELEGRAM · Carlos"
            text="Problema con pedido #4521"
            depth={30}
            rot={1}
            delay={0.22}
            style={{ top: "44%", right: "3%" }}
          />
          <Bubble
            kind="ig"
            from="INSTAGRAM · @mariana"
            text="¿Tienes talla M?"
            depth={15}
            rot={-0.4}
            delay={0.28}
            style={{ top: "38%", left: "6%" }}
          />
          <Bubble
            kind="m2"
            from="M2 · AI"
            text="Lead caliente → escalado a Diego"
            depth={55}
            rot={0.6}
            delay={0.42}
            style={{ top: "52%", left: "34%" }}
          />
          <Bubble
            kind="em"
            from="EMAIL · ana@acme.co"
            text="Proposal 50 unidades"
            depth={-10}
            rot={-1}
            delay={0.2}
            style={{ top: "66%", left: "4%" }}
          />
          <Bubble
            kind="fm"
            from="MESSENGER · Diego"
            text="Me interesa el plan pro 👀"
            depth={20}
            rot={1.4}
            delay={0.36}
            style={{ top: "72%", right: "8%" }}
          />
          <Bubble
            kind="li"
            from="LINKEDIN · Rodrigo Paz"
            text="¿Demo mañana 3pm?"
            depth={5}
            rot={-0.6}
            delay={0.5}
            style={{ top: "74%", left: "28%" }}
          />
        </div>
      </div>

      <div className="visual-stats">
        <div className="vs-item">
          <div className="n">
            13.6<em>k</em>
          </div>
          <div className="l">Mensajes / semana</div>
        </div>
        <div className="vs-item">
          <div className="n">
            94<em>%</em>
          </div>
          <div className="l">Auto-respondidos</div>
        </div>
        <div className="vs-item">
          <div className="n">
            3.2<em>s</em>
          </div>
          <div className="l">Tiempo promedio</div>
        </div>
      </div>
    </div>
  );
}
