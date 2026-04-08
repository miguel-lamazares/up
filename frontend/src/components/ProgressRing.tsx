interface ProgressRingProps {
  percentage: number;
  color?: string;
  size?: number;
}

const ProgressRing = ({ percentage, color = "hsl(var(--primary))", size = 72 }: ProgressRingProps) => {
  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring"
          fill="none"
        />
      </svg>
      <span className="text-xs font-bold text-foreground">{percentage}%</span>
    </div>
  );
};

export default ProgressRing;
