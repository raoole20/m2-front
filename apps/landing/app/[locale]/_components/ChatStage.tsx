"use client";

import type { Bubble } from "../../../lib/content";

type ChatStageProps = {
  streams: Bubble[][];
};

export function ChatStage({ streams }: ChatStageProps) {
  const bubbles = streams.flat();
  const ghostCount = 6;
  return (
    <div className="chat-stage" aria-hidden="true">
      <div className="m2-core">M2</div>
      {bubbles.map((b, i) => (
        <div key={i} className={`bubble ${b.variant} b${i + 1}`}>
          <div className="bubble-inner">
            <div className="from">
              <span className="ch-dot" />
              {b.from}
            </div>
            {b.text}
          </div>
        </div>
      ))}
      {Array.from({ length: ghostCount }).map((_, i) => (
        <div key={`g${i}`} className={`bubble ghost g${i + 1}`}>
          <div className="bubble-inner" />
        </div>
      ))}
    </div>
  );
}
