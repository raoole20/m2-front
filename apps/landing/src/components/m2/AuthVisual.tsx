import type { CSSProperties, ReactNode } from "react";

type Variant = "login" | "register" | "recover";

const QUOTES: Record<Variant, { q: string; highlights: string[]; who: string; role: string }> = {
  login: {
    q: "Nuestro equipo responde el triple de mensajes con el mismo número de personas.",
    highlights: ["triple"],
    who: "Andrea Castillo",
    role: "Fundadora, Mila Café",
  },
  register: {
    q: "Pasé de perder mensajes a convertir clientes mientras duermo.",
    highlights: ["convertir"],
    who: "Rodrigo Paz",
    role: "CEO, Nómada Accesorios",
  },
  recover: {
    q: "Entrar a M2 fue lo mejor que hicimos este año. Literal.",
    highlights: ["mejor"],
    who: "Valeria Ortiz",
    role: "Ops, Deli Market",
  },
};

function highlight(q: string, words: string[]): ReactNode[] {
  const re = new RegExp(`(${words.join("|")})`, "g");
  return q.split(re).map((part, i) => (re.test(part) ? <em key={i}>{part}</em> : <span key={i}>{part}</span>));
}

type BubbleProps = { kind: "wa" | "ig" | "tg" | "em" | "m2"; from: string; text: string; style: CSSProperties };

function Bubble({ kind, from, text, style }: BubbleProps) {
  return (
    <div className={`fb ${kind}`} style={style}>
      <span className="from">{from}</span>
      {text}
    </div>
  );
}

export function AuthVisual({ variant = "login" }: { variant?: Variant }) {
  const quote = QUOTES[variant];
  const initials = quote.who
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="auth-visual-col">
      <div className="floating-bubbles" aria-hidden="true">
        <Bubble kind="wa" from="WHATSAPP · Laura" text="¿Envían a Monterrey?" style={{ top: "8%", left: "8%" }} />
        <Bubble kind="m2" from="M2 · AI" text="Sí! 24-48h. ¿Cierro tu orden?" style={{ top: "18%", right: "10%" }} />
        <Bubble kind="ig" from="INSTAGRAM · @mariana" text="¿Tienes talla M?" style={{ top: "36%", left: "4%" }} />
        <Bubble kind="tg" from="TELEGRAM · Carlos" text="Problema con pedido #4521" style={{ top: "55%", right: "6%" }} />
        <Bubble kind="em" from="EMAIL · ana@acme.co" text="Proposal 50 unidades" style={{ top: "68%", left: "12%" }} />
        <Bubble kind="m2" from="M2 · AI" text="Lead caliente → escalado a Diego" style={{ top: "46%", left: "42%" }} />
      </div>

      <div className="visual-quote">
        <div className="q">&ldquo;{highlight(quote.q, quote.highlights)}&rdquo;</div>
        <div className="byline">
          <div className="ava">{initials}</div>
          <div>
            <div style={{ color: "var(--text)", fontWeight: 500 }}>{quote.who}</div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: ".06em",
                marginTop: 2,
              }}
            >
              {quote.role}
            </div>
          </div>
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
