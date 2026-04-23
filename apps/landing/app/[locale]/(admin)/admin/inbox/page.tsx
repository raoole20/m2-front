"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { AppIcon } from "../../../../../src/components/m2/AppIcon";
import { AppShell } from "../../../../../src/components/m2/AppShell";
import {
  CONVERSATIONS,
  THREAD_LAURA,
  type ChannelKey,
  type ConversationMock,
} from "../../../../../src/components/m2/mock-data";

type Filter = "all" | "unread" | "hot" | "human";

const CHANNEL_META: Record<ChannelKey, { name: string; col: string }> = {
  wa: { name: "WhatsApp", col: "#25d366" },
  ig: { name: "Instagram", col: "#e1306c" },
  tg: { name: "Telegram", col: "#29b6f6" },
  em: { name: "Email", col: "#a78bfa" },
};

function filterConvs(
  list: ConversationMock[],
  channelKey: ChannelKey | null,
  filter: Filter,
  search: string,
): ConversationMock[] {
  let convs = list;
  if (channelKey && CHANNEL_META[channelKey]) convs = convs.filter((c) => c.ch === channelKey);
  if (filter === "unread") convs = convs.filter((c) => c.unread > 0);
  if (filter === "hot")
    convs = convs.filter((c) => c.tags.some((t) => t.label.includes("caliente") || t.label.includes("Lead")));
  if (filter === "human") convs = convs.filter((c) => c.needsHuman);
  if (search) {
    const q = search.toLowerCase();
    convs = convs.filter((c) => c.name.toLowerCase().includes(q) || c.prev.toLowerCase().includes(q));
  }
  return convs;
}

export default function InboxPage() {
  const searchParams = useSearchParams();
  const channelKey = (searchParams?.get("ch") as ChannelKey | null) ?? null;
  const initialConvId = Number(searchParams?.get("c")) || 1;

  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<number>(initialConvId);
  const [aiOn, setAiOn] = useState(true);
  const [showSide, setShowSide] = useState(true);
  const [draft, setDraft] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(true);
  const [search, setSearch] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [selectedId]);

  const convs = filterConvs(CONVERSATIONS, channelKey, filter, search);
  const selected = CONVERSATIONS.find((c) => c.id === selectedId) ?? CONVERSATIONS[0];
  const headerName = channelKey && CHANNEL_META[channelKey] ? CHANNEL_META[channelKey].name : "Bandeja unificada";

  if (!selected) return null;

  const send = () => {
    if (!draft.trim()) return;
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const suggestedText =
    "Perfecto Laura! Te paso el total con envío: 3x X-200 a $890 c/u + $89 envío = $2,759 MXN. ¿Te mando link de pago?";

  return (
    <AppShell>
      <div className={`inbox-shell ${showSide ? "" : "no-side"}`}>
        <aside className="inbox-list">
          <div className="inbox-head">
            <div className="ih-title">
              <div className="ih-name">
                {channelKey && CHANNEL_META[channelKey] && (
                  <span className="ch-dot" style={{ background: CHANNEL_META[channelKey].col }} />
                )}
                {headerName}
              </div>
              <span className="ih-count">{convs.length} chats</span>
            </div>
            <div className="ih-search">
              <AppIcon name="search" size={13} />
              <input
                placeholder="Buscar por nombre o contenido…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="ih-filters">
              {(
                [
                  { k: "all", label: "Todos" },
                  { k: "unread", label: "No leídos" },
                  { k: "hot", label: "Leads calientes" },
                  { k: "human", label: "Necesitan humano" },
                ] as const
              ).map((f) => (
                <button
                  key={f.k}
                  type="button"
                  className={filter === f.k ? "on" : ""}
                  onClick={() => setFilter(f.k)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="inbox-scroll">
            {convs.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>
                <AppIcon name="inbox" size={32} />
                <div style={{ marginTop: 12 }}>Sin conversaciones en este filtro</div>
              </div>
            ) : (
              convs.map((c) => (
                <div
                  key={c.id}
                  className={`conv-item ${c.id === selectedId ? "on" : ""}`}
                  onClick={() => setSelectedId(c.id)}
                >
                  <div className="ci-ava" style={{ background: c.avaBg }}>
                    {c.init}
                    <span className="ci-ch" style={{ background: c.col }} />
                  </div>
                  <div className="ci-body">
                    <div className="ci-top">
                      <div className="ci-name">{c.name}</div>
                      <div className="ci-time">{c.time}</div>
                    </div>
                    <div className="ci-prev">
                      {c.lastBy === "ai" && <span style={{ color: "var(--accent-soft)", fontWeight: 500 }}>M2: </span>}
                      {c.lastBy === "human" && <span style={{ color: "#c4b5fd" }}>Tú: </span>}
                      {c.prev}
                    </div>
                    {c.tags.length > 0 && (
                      <div className="ci-meta">
                        {c.tags.slice(0, 2).map((t, i) => (
                          <span key={i} className={`badge badge-${t.color}`}>
                            {t.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ci-side">{c.unread > 0 && <span className="unread">{c.unread}</span>}</div>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="thread">
          <div className="thread-head">
            <div className="th-ava" style={{ background: selected.avaBg }}>
              {selected.init}
            </div>
            <div className="th-main">
              <div className="th-name">
                {selected.name}
                {selected.online && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#22c55e",
                      boxShadow: "0 0 8px #22c55e",
                    }}
                  />
                )}
              </div>
              <div className="th-sub">
                <span className="ch-dot" style={{ background: selected.col, width: 6, height: 6 }} />
                <span>{selected.chLabel}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>{selected.online ? "En línea" : "Últ. vez hace 2h"}</span>
              </div>
            </div>
            <div className="th-tools">
              <div className={`ai-toggle ${aiOn ? "on" : ""}`} onClick={() => setAiOn(!aiOn)}>
                <div className="ai-switch" />
                <AppIcon name="bot" size={13} />
                M2 AI
              </div>
              <button type="button" className="btn-icon" aria-label="Llamar">
                <AppIcon name="phone" size={16} />
              </button>
              <button
                type="button"
                className="btn-icon"
                aria-label="Info"
                onClick={() => setShowSide(!showSide)}
              >
                <AppIcon name="user" size={16} />
              </button>
              <button type="button" className="btn-icon" aria-label="Más">
                <AppIcon name="more" size={16} />
              </button>
            </div>
          </div>

          <div className="thread-body" ref={bodyRef}>
            {THREAD_LAURA.map((m, i) => {
              if (m.type === "day") return <div key={i} className="day-sep">{m.at}</div>;
              if (m.type === "handoff")
                return (
                  <div key={i} className="handoff-marker">
                    <AppIcon name="sparkles" size={14} color="var(--accent-soft)" />
                    <div>
                      <b>{m.text}</b> · {m.time}
                    </div>
                  </div>
                );
              const isOut = m.from === "ai" || m.from === "human";
              const isAi = m.from === "ai";
              return (
                <div key={i} className={`msg ${isOut ? "out" : "in"} ${isAi ? "ai" : ""}`}>
                  {isAi && <div className="msg-avatar ai">M2</div>}
                  {!isOut && (
                    <div className="msg-avatar" style={{ background: selected.avaBg }}>
                      {selected.init}
                    </div>
                  )}
                  <div>
                    <div className="msg-bubble">{m.text}</div>
                    <div className="msg-meta">
                      {isAi && (
                        <span className="from-ai">
                          <AppIcon name="sparkles" size={10} /> M2 respondió
                        </span>
                      )}
                      <span>{m.time}</span>
                      {isOut && <AppIcon name="check" size={11} color="#6ee7b7" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {aiOn && (
              <div
                className="handoff-marker"
                style={{ borderColor: "rgba(52,211,153,.3)", background: "rgba(52,211,153,.04)" }}
              >
                <AppIcon name="bot" size={14} color="#6ee7b7" />
                <div style={{ color: "var(--text-muted)" }}>
                  <b style={{ color: "#6ee7b7" }}>M2 está escribiendo una respuesta…</b> — puedes intervenir en
                  cualquier momento
                </div>
              </div>
            )}
          </div>

          <div className="composer">
            {showSuggestion && aiOn && (
              <div className="ai-suggestion">
                <div className="as-icon">M2</div>
                <div className="as-body">
                  <div className="as-label">Sugerencia de respuesta · confianza 92%</div>
                  <div>{suggestedText}</div>
                  <div className="as-actions">
                    <button
                      type="button"
                      className="primary"
                      onClick={() => {
                        setDraft(suggestedText);
                        setShowSuggestion(false);
                      }}
                    >
                      Usar esta
                    </button>
                    <button type="button" onClick={() => setShowSuggestion(false)}>
                      Editar
                    </button>
                    <button type="button" onClick={() => setShowSuggestion(false)}>
                      Descartar
                    </button>
                  </div>
                </div>
                <button type="button" className="btn-icon" onClick={() => setShowSuggestion(false)}>
                  <AppIcon name="close" size={14} />
                </button>
              </div>
            )}

            <div className="composer-box">
              <textarea
                placeholder={aiOn ? "Escribe o deja que M2 responda por ti…" : "Escribe un mensaje…"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
              />
              <div className="composer-tools">
                <button type="button" className="btn-icon" aria-label="Adjuntar">
                  <AppIcon name="paperclip" size={15} />
                </button>
                <button type="button" className="btn-icon" aria-label="Plantillas">
                  <AppIcon name="bolt" size={15} />
                </button>
                <button type="button" className="btn-icon" aria-label="Emoji">
                  <AppIcon name="smile" size={15} />
                </button>
                <button type="button" className="btn-icon" aria-label="IA reescribe">
                  <AppIcon name="sparkles" size={15} color="var(--accent-soft)" />
                </button>
                <div className="spacer" />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--text-dim)",
                    marginRight: 8,
                  }}
                >
                  ⏎ para enviar
                </span>
                <button type="button" className="btn-send" onClick={send} aria-label="Enviar">
                  <AppIcon name="send" size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {showSide && (
          <aside className="inbox-side">
            <div className="side-section side-profile">
              <div className="ava-lg" style={{ background: selected.avaBg }}>
                {selected.init}
              </div>
              <div className="name">{selected.name}</div>
              <div className="meta">
                <span className="ch-dot" style={{ background: selected.col, width: 6, height: 6 }} />
                {selected.chLabel}
              </div>
              <div className="qtool-row">
                <button type="button" className="btn btn-subtle btn-sm">
                  <AppIcon name="user" size={12} /> Perfil
                </button>
                <button type="button" className="btn btn-subtle btn-sm">
                  <AppIcon name="tag" size={12} /> Etiquetar
                </button>
              </div>
            </div>

            <div className="side-section">
              <div className="ss-title">Handoff rápido</div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}
              >
                <AppIcon name="user-plus" size={12} /> Asignar a humano
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <button type="button" className="btn btn-subtle btn-sm" style={{ justifyContent: "center" }}>
                  Diego R.
                </button>
                <button type="button" className="btn btn-subtle btn-sm" style={{ justifyContent: "center" }}>
                  Ana L.
                </button>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-dim)", marginTop: 8, lineHeight: 1.4 }}>
                M2 sigue sugiriendo en segundo plano para tu agente.
              </div>
            </div>

            <div className="side-section">
              <div className="ss-title">Información</div>
              <div className="side-info-row">
                <div className="k">Email</div>
                <div className="v">{selected.email}</div>
              </div>
              <div className="side-info-row">
                <div className="k">Teléfono</div>
                <div className="v">{selected.phone}</div>
              </div>
              <div className="side-info-row">
                <div className="k">Ciudad</div>
                <div className="v">{selected.city}</div>
              </div>
              <div className="side-info-row">
                <div className="k">Cliente</div>
                <div className="v">{selected.customer}</div>
              </div>
              <div className="side-info-row">
                <div className="k">Órdenes</div>
                <div className="v">{selected.orders} pedidos</div>
              </div>
            </div>

            <div className="side-section">
              <div className="ss-title">Etiquetas</div>
              <div>
                {selected.labels.map((l, i) => (
                  <span key={i} className="tag-chip">
                    <span
                      className="tc-dot"
                      style={{
                        background: ["#f59e0b", "#22c55e", "#a78bfa", "#29b6f6", "#e1306c"][i % 5],
                      }}
                    />
                    {l}
                  </span>
                ))}
                <span className="tag-chip" style={{ color: "var(--text-dim)", borderStyle: "dashed" }}>
                  <AppIcon name="plus" size={10} /> Nueva
                </span>
              </div>
            </div>

            <div className="side-section">
              <div className="ss-title">Actividad</div>
              {[
                {
                  i: "sparkles",
                  txt: (
                    <>
                      M2 marcó como <b style={{ color: "var(--accent-soft)" }}>lead caliente</b>
                    </>
                  ),
                  t: "hace 2 min",
                },
                { i: "bot", txt: <>M2 respondió 3 mensajes</>, t: "hace 8 min" },
                {
                  i: "inbox",
                  txt: (
                    <>
                      Primera vez en <b>WhatsApp</b>
                    </>
                  ),
                  t: "hace 1 día",
                },
                {
                  i: "user",
                  txt: (
                    <>
                      Asignada a <b>Diego R.</b> brevemente
                    </>
                  ),
                  t: "hace 2 días",
                },
              ].map((a, i) => (
                <div key={i} className="timeline-item">
                  <div className="ti-icon">
                    <AppIcon name={a.i} size={11} />
                  </div>
                  <div className="ti-body">
                    <div className="txt">{a.txt}</div>
                    <div className="t">{a.t}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </AppShell>
  );
}
