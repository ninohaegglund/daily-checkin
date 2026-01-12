
type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG Icon */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-white"
      >
        {/* Outer circle */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Calm pulse / leaf-like shape */}
        <path
          d="M8 13c2-4 6-4 8 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Center dot */}
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>

      {/* Text */}
      <span className="text-xl font-semibold text-white tracking-wide">
        Daily Check-In
      </span>
    </div>
  );
}
