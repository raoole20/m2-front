"use client";

import { useState } from "react";

import {
  CHANNEL_COLORS,
  CHANNEL_GRADIENTS,
  type InboxItem,
} from "../../../lib/content";

type InboxStrings = {
  sidebarTitle: string;
  sidebarCount: string;
  priority: string;
  aiDraftLabel: string;
  aiTagLine: string;
  aiDraft: string;
  draftReady: string;
  edit: string;
  send: string;
  aiSummary: string;
  priorityScore: string;
  suggestedActions: string;
  newCustomer: string;
  aiSummaryBody: string;
};

type InboxDemoProps = {
  items: InboxItem[];
  actions: string[];
  strings: InboxStrings;
};

export function InboxDemo({ items, actions, strings }: InboxDemoProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = items[activeIdx] ?? items[0]!;
  const activeColor = CHANNEL_COLORS[active.channel];

  return (
    <div className="inbox-mock">
      <div className="ibx-side">
        <div className="hdr">
          <span className="title">{strings.sidebarTitle}</span>
          <span className="count">{strings.sidebarCount}</span>
        </div>
        {items.map((it, i) => {
          const color = CHANNEL_COLORS[it.channel];
          return (
            <button
              key={i}
              type="button"
              className={`ibx-item ${i === activeIdx ? "active" : ""}`}
              onClick={() => setActiveIdx(i)}
              aria-pressed={i === activeIdx}
            >
              <span className="ibx-avatar" style={{ background: CHANNEL_GRADIENTS[it.channel] }}>
                {it.initials}
              </span>
              <span className="ibx-body-info">
                <span className="name">
                  {it.name} <span className="ch" style={{ background: color }} />
                </span>
                <span className="preview">{it.preview}</span>
              </span>
              <span className="t">{it.time}</span>
            </button>
          );
        })}
      </div>

      <div className="ibx-main">
        <div className="hdr">
          <div className="who">
            <span
              className="ibx-avatar"
              style={{
                background: CHANNEL_GRADIENTS[active.channel],
                width: 34,
                height: 34,
              }}
            >
              {active.initials}
            </span>
            <span>{active.name}</span>
            <span
              className="pill"
              style={{ color: activeColor, background: `${activeColor}22` }}
            >
              {active.channel}
            </span>
          </div>
          <span className="pill">{strings.priority}</span>
        </div>
        <div className="scroll">
          <div
            className="bubble"
            style={{
              alignSelf: "flex-start",
              background: `${activeColor}12`,
              borderColor: `${activeColor}30`,
            }}
          >
            <div className="from">
              <span className="ch-dot" style={{ background: activeColor }} />
              {active.name}
            </div>
            {active.preview}
          </div>
          <div className="bubble m2">
            <div className="from">
              <span className="ch-dot" />
              {strings.aiDraftLabel}
            </div>
            {strings.aiDraft}
          </div>
          <div className="ibx-meta">{strings.aiTagLine}</div>
        </div>
        <div className="ibx-composer">
          <span className="tag">AI</span>
          <span className="draft">{strings.draftReady}</span>
          <div className="actions">
            <button type="button">{strings.edit}</button>
            <button type="button" className="send">
              {strings.send} ↵
            </button>
          </div>
        </div>
      </div>

      <div className="ibx-ai">
        <div className="sec">{strings.aiSummary}</div>
        <div className="card">
          <b>{strings.newCustomer}</b>
          {strings.aiSummaryBody}
        </div>
        <div className="sec">{strings.priorityScore}</div>
        <div className="score">
          <div className="score-bar">
            <i style={{ width: "88%" }} />
          </div>
          <span className="score-num">88</span>
        </div>
        <div className="sec">{strings.suggestedActions}</div>
        {actions.map((a) => (
          <div key={a} className="card">
            <b>→ {a}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
