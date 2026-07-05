import { useEffect, useRef, type FC } from 'react';
import './ArcReactor.css';

export type ReactorState = 'disconnected' | 'idle' | 'listening' | 'thinking' | 'speaking';

interface ArcReactorProps {
  state: ReactorState;
  /** 0–1 normalized volume level (mic or speaker) */
  volume?: number;
  /** Size in pixels */
  size?: number;
}

/**
 * Arc Reactor — Animated SVG centerpiece
 *
 * Animation is driven entirely through CSS custom properties set via refs,
 * so React never re-renders on every audio frame. The `volume` prop updates
 * a CSS variable on the container element via requestAnimationFrame.
 */
const ArcReactor: FC<ArcReactorProps> = ({ state, volume = 0, size = 380 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const currentVolumeRef = useRef(0);

  // Smoothly interpolate volume → CSS variable (no React re-render)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const animate = () => {
      // Lerp for smoothness
      currentVolumeRef.current += (volume - currentVolumeRef.current) * 0.25;
      el.style.setProperty('--reactor-volume', currentVolumeRef.current.toFixed(3));
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [volume]);

  // Generate outer teeth (triangular notches around the housing)
  const teeth = [];
  const teethCount = 24;
  for (let i = 0; i < teethCount; i++) {
    const angle = (i / teethCount) * 360;
    const rad = (angle * Math.PI) / 180;
    const innerR = 170;
    const outerR = 182;
    const halfWidth = 3;

    const x1 = 200 + Math.cos(rad - halfWidth / innerR) * innerR;
    const y1 = 200 + Math.sin(rad - halfWidth / innerR) * innerR;
    const x2 = 200 + Math.cos(rad) * outerR;
    const y2 = 200 + Math.sin(rad) * outerR;
    const x3 = 200 + Math.cos(rad + halfWidth / innerR) * innerR;
    const y3 = 200 + Math.sin(rad + halfWidth / innerR) * innerR;

    teeth.push(
      <polygon
        key={`tooth-${i}`}
        className="reactor-tooth"
        points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
      />
    );
  }

  // Generate middle ring radial lines
  const middleLines = [];
  const lineCount = 36;
  for (let i = 0; i < lineCount; i++) {
    const angle = (i / lineCount) * 360;
    const rad = (angle * Math.PI) / 180;
    const r1 = 120;
    const r2 = 155;

    middleLines.push(
      <line
        key={`mline-${i}`}
        className="reactor-middle-line"
        x1={200 + Math.cos(rad) * r1}
        y1={200 + Math.sin(rad) * r1}
        x2={200 + Math.cos(rad) * r2}
        y2={200 + Math.sin(rad) * r2}
      />
    );
  }

  const isRotating = state === 'thinking' || state === 'speaking';
  const isPulseActive = state === 'listening' || state === 'speaking';

  return (
    <div
      ref={containerRef}
      className="arc-reactor-container"
      data-state={state}
      style={{ width: size, height: size }}
    >
      {/* Ambient background glow */}
      <div className="reactor-ambient-glow" />

      <svg
        className="arc-reactor-svg"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Core radial gradient */}
          <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EAFBFF" />
            <stop offset="30%" stopColor="#00D4FF" />
            <stop offset="70%" stopColor="#0091FF" />
            <stop offset="100%" stopColor="#003366" stopOpacity="0" />
          </radialGradient>

          {/* Inner glow */}
          <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#EAFBFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
          </radialGradient>

          {/* Outer ring gradient */}
          <radialGradient id="outerRingGlow" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="transparent" />
            <stop offset="95%" stopColor="rgba(0, 212, 255, 0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* === LAYER 1: Outer Machined Housing Ring === */}
        <circle
          className="reactor-outer-ring"
          cx="200" cy="200" r="175"
        />
        <circle
          className="reactor-outer-ring-accent"
          cx="200" cy="200" r="185"
        />
        <circle
          className="reactor-outer-ring-accent"
          cx="200" cy="200" r="165"
        />

        {/* Triangular teeth */}
        {teeth}

        {/* === LAYER 2: Middle Rotating Ring === */}
        <g className={`reactor-middle-ring-group ${isRotating ? 'rotating' : ''}`}>
          <circle
            className="reactor-middle-ring-circle"
            cx="200" cy="200" r="155"
          />
          <circle
            className="reactor-middle-ring-circle"
            cx="200" cy="200" r="120"
          />
          {middleLines}
        </g>

        {/* === LAYER 3: Inner Decoration Circles === */}
        <circle className="reactor-inner-deco" cx="200" cy="200" r="100" />
        <circle className="reactor-inner-deco" cx="200" cy="200" r="85" />
        <circle className="reactor-inner-deco" cx="200" cy="200" r="70" />

        {/* === LAYER 4: Volume-reactive Pulse Ring === */}
        <circle
          className={`reactor-pulse-ring ${isPulseActive ? 'active' : ''}`}
          cx="200" cy="200" r="110"
        />

        {/* === LAYER 5: Glowing Core === */}
        <circle
          className="reactor-core-outer"
          cx="200" cy="200" r="60"
          fill="url(#coreGradient)"
        />
        <circle
          className="reactor-core-inner"
          cx="200" cy="200" r="35"
          fill="url(#coreGradient)"
        />
        <circle
          className="reactor-core-hot"
          cx="200" cy="200" r="18"
          fill="url(#innerGlow)"
        />

        {/* Center bright spot */}
        <circle
          className="reactor-core-hot"
          cx="200" cy="200" r="6"
          fill="#FFFFFF"
          opacity="0.8"
        />
      </svg>
    </div>
  );
};

export default ArcReactor;
