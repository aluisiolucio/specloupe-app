import { clamp } from "../lib/format";

interface GaugeProps {
  value: number;
  caption: string;
  detail?: string;
}

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 88;
const START_ANGLE = 135;
const SWEEP = 270;
const TICKS = 61;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_LENGTH = CIRCUMFERENCE * (SWEEP / 360);

export function Gauge({ value, caption, detail }: GaugeProps) {
  const safeValue = clamp(value);
  const progress = (safeValue / 100) * ARC_LENGTH;

  return (
    <div className="gauge">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${caption}: ${Math.round(safeValue)} percent`}>
        <circle
          className="gauge-track"
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
          transform={`rotate(${START_ANGLE} ${CENTER} ${CENTER})`}
        />
        <circle
          className="gauge-track gauge-track-reverse"
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          strokeDasharray={`${CIRCUMFERENCE - ARC_LENGTH} ${CIRCUMFERENCE}`}
          strokeDashoffset={-ARC_LENGTH}
          transform={`rotate(${START_ANGLE} ${CENTER} ${CENTER})`}
        />
        <circle
          className="gauge-progress"
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          strokeDasharray={`${progress} ${CIRCUMFERENCE}`}
          transform={`rotate(${START_ANGLE} ${CENTER} ${CENTER})`}
        />

        {Array.from({ length: TICKS }, (_, index) => {
          const ratio = index / (TICKS - 1);
          const angle = START_ANGLE + ratio * SWEEP;
          const radians = (angle * Math.PI) / 180;
          const major = index % 10 === 0;
          const outer = 104;
          const inner = major ? 94 : 99;
          const active = ratio <= safeValue / 100;
          return (
            <line
              key={index}
              className={`gauge-tick${active ? " is-active" : ""}${major ? " is-major" : ""}`}
              x1={CENTER + Math.cos(radians) * inner}
              y1={CENTER + Math.sin(radians) * inner}
              x2={CENTER + Math.cos(radians) * outer}
              y2={CENTER + Math.sin(radians) * outer}
            />
          );
        })}

        <circle className="gauge-reticle" cx={CENTER} cy={CENTER} r={60} />
        <path
          className="gauge-cross"
          d={`M${CENTER} 44v9M${CENTER} 187v9M44 ${CENTER}h9M187 ${CENTER}h9`}
        />

        <text className="gauge-caption" x={CENTER} y={CENTER - 42} textAnchor="middle">
          {caption}
        </text>
        <text className="gauge-value" x={CENTER - 6} y={CENTER + 12} textAnchor="middle">
          {Math.round(safeValue)}
        </text>
        <text className="gauge-unit" x={CENTER + 24} y={CENTER + 10}>
          %
        </text>
        {detail && (
          <text className="gauge-detail" x={CENTER} y={CENTER + 38} textAnchor="middle">
            {detail}
          </text>
        )}
      </svg>
    </div>
  );
}
