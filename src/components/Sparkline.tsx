interface SparklineProps {
  values: Array<number | null>;
  min?: number;
  max?: number;
  color?: string;
  height?: number;
  label?: string;
  fill?: boolean;
}

const WIDTH = 160;
const HEIGHT = 40;

export function Sparkline({
  values,
  min,
  max,
  color = "var(--accent)",
  height = 48,
  label,
  fill = true,
}: SparklineProps) {
  const samples = values.slice(-60);
  const defined = samples.filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );

  let low = min ?? (defined.length ? Math.min(...defined) : 0);
  let high = max ?? (defined.length ? Math.max(...defined) : 1);

  if (high - low < 1e-9) {
    high = low + 1;
  }
  if (min === undefined || max === undefined) {
    const padding = (high - low) * 0.08;
    if (min === undefined) {
      low -= padding;
    }
    if (max === undefined) {
      high += padding;
    }
  }

  const toX = (index: number) =>
    samples.length <= 1 ? WIDTH / 2 : (index / (samples.length - 1)) * WIDTH;
  const toY = (value: number) =>
    HEIGHT - ((value - low) / (high - low)) * HEIGHT;

  const runs: Array<Array<[number, number]>> = [];
  let run: Array<[number, number]> = [];

  samples.forEach((value, index) => {
    if (value === null || !Number.isFinite(value)) {
      if (run.length > 0) {
        runs.push(run);
        run = [];
      }
      return;
    }
    run.push([toX(index), toY(value)]);
  });
  if (run.length > 0) {
    runs.push(run);
  }

  const linePath = (points: Array<[number, number]>) =>
    points
      .map(
        ([x, y], index) =>
          `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`,
      )
      .join(" ");

  const areaPath = (points: Array<[number, number]>) => {
    if (points.length < 2) {
      return null;
    }
    const first = points[0];
    const last = points[points.length - 1];
    return `M${first[0].toFixed(2)} ${HEIGHT} ${linePath(points)} L${last[0].toFixed(2)} ${HEIGHT} Z`;
  };

  return (
    <div
      className="sparkline"
      style={{ height }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
        <path
          className="spark-grid"
          d={`M0 ${HEIGHT * 0.33} H${WIDTH} M0 ${HEIGHT * 0.66} H${WIDTH}`}
          vectorEffect="non-scaling-stroke"
        />
        {defined.length === 0 && (
          <path
            className="spark-baseline"
            d={`M0 ${HEIGHT - 1} H${WIDTH}`}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {fill &&
          runs.map((points, index) => {
            const area = areaPath(points);
            return area ? (
              <path
                key={`area-${index}`}
                d={area}
                style={{ fill: color }}
                opacity={0.09}
              />
            ) : null;
          })}
        {runs.map((points, index) =>
          points.length === 1 ? (
            <circle
              key={`dot-${index}`}
              cx={points[0][0]}
              cy={points[0][1]}
              r={1.2}
              style={{ fill: color }}
            />
          ) : (
            <path
              key={`line-${index}`}
              d={linePath(points)}
              fill="none"
              style={{ stroke: color }}
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ),
        )}
      </svg>
    </div>
  );
}
