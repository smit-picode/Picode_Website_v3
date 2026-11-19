/** Low-poly holographic Jarvis face (SVG) with glowing, blinking eyes. */
export function FaceGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <g fill="none" stroke="#5fe3ff" strokeWidth="0.9" strokeLinejoin="round">
        <path d="M24 5 C14 5 10 13 10.5 21 C11 28 13 35 18 40 C20 42 22 43 24 43 C26 43 28 42 30 40 C35 35 37 28 37.5 21 C38 13 34 5 24 5 Z" fill="#0a5c8a" fillOpacity="0.55" />
        <path d="M10.5 21 L17 18 L24 19 L31 18 L37.5 21" />
        <path d="M17 18 L14 12 M31 18 L34 12 M24 19 L24 5" opacity="0.6" />
        <path d="M24 19 L22 29 L24 31 L26 29 Z" />
        <path d="M18 40 L20 34 L24 35 L28 34 L30 40" opacity="0.7" />
        <path d="M13 28 L18 25 L22 29 M35 28 L30 25 L26 29" opacity="0.6" />
        <path d="M20 35.5 Q24 37.5 28 35.5" stroke="#9ff1ff" />
      </g>
      <g style={{ filter: "drop-shadow(0 0 1.5px #00ff88)" }}>
        <ellipse cx="18.5" cy="22.5" rx="2.4" ry="0.9" fill="#00ff88">
          <animate attributeName="ry" values="0.9;0.9;0.12;0.9;0.9" keyTimes="0;0.9;0.93;0.96;1" dur="4s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="29.5" cy="22.5" rx="2.4" ry="0.9" fill="#00ff88">
          <animate attributeName="ry" values="0.9;0.9;0.12;0.9;0.9" keyTimes="0;0.9;0.93;0.96;1" dur="4s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </svg>
  );
}

/**
 * Shown in the head stage while the 3D avatar boots, so the panel never opens
 * on a dead frame. Deliberately has no face of its own (only the real 3D head
 * should ever appear): a scan sweep and a status line over the HUD rings.
 * Cross-fades out once the WebGL head has drawn.
 */
export function HeadPlaceholder({ visible = true }: { visible?: boolean }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <span className="absolute inset-x-0 top-0 h-1/3 animate-scan-y bg-gradient-to-b from-transparent via-cyan-300/15 to-transparent" />
      <span className="absolute inset-x-0 bottom-[14%] text-center font-mono text-[0.625rem] uppercase tracking-[0.35em] text-cyan-300/70">
        Calibrating avatar
        <span className="animate-pulse">…</span>
      </span>
    </div>
  );
}
