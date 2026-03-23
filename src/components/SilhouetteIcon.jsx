const SOIL_BROWN = '#5C3D2E';

const shapes = {
  open_center: (
    <g>
      <line x1="40" y1="75" x2="40" y2="50" stroke={SOIL_BROWN} strokeWidth="4" />
      <path d="M25 50 Q20 30 10 20" stroke={SOIL_BROWN} strokeWidth="3" fill="none" />
      <path d="M55 50 Q60 30 70 20" stroke={SOIL_BROWN} strokeWidth="3" fill="none" />
      <path d="M40 50 Q38 35 30 22" stroke={SOIL_BROWN} strokeWidth="3" fill="none" />
      <path d="M40 50 Q42 35 50 22" stroke={SOIL_BROWN} strokeWidth="3" fill="none" />
      <circle cx="10" cy="18" r="8" fill={SOIL_BROWN} opacity="0.3" />
      <circle cx="30" cy="16" r="10" fill={SOIL_BROWN} opacity="0.3" />
      <circle cx="50" cy="16" r="10" fill={SOIL_BROWN} opacity="0.3" />
      <circle cx="70" cy="18" r="8" fill={SOIL_BROWN} opacity="0.3" />
    </g>
  ),
  central_leader: (
    <g>
      <line x1="40" y1="75" x2="40" y2="10" stroke={SOIL_BROWN} strokeWidth="4" />
      <path d="M40 55 Q25 50 15 45" stroke={SOIL_BROWN} strokeWidth="2.5" fill="none" />
      <path d="M40 55 Q55 50 65 45" stroke={SOIL_BROWN} strokeWidth="2.5" fill="none" />
      <path d="M40 40 Q28 36 20 32" stroke={SOIL_BROWN} strokeWidth="2.5" fill="none" />
      <path d="M40 40 Q52 36 60 32" stroke={SOIL_BROWN} strokeWidth="2.5" fill="none" />
      <path d="M40 25 Q32 22 26 20" stroke={SOIL_BROWN} strokeWidth="2" fill="none" />
      <path d="M40 25 Q48 22 54 20" stroke={SOIL_BROWN} strokeWidth="2" fill="none" />
      <ellipse cx="40" cy="35" rx="28" ry="25" fill={SOIL_BROWN} opacity="0.15" />
      <circle cx="40" cy="10" r="5" fill={SOIL_BROWN} opacity="0.25" />
    </g>
  ),
  espalier: (
    <g>
      <line x1="40" y1="75" x2="40" y2="15" stroke={SOIL_BROWN} strokeWidth="4" />
      <line x1="12" y1="25" x2="68" y2="25" stroke={SOIL_BROWN} strokeWidth="2.5" />
      <line x1="15" y1="42" x2="65" y2="42" stroke={SOIL_BROWN} strokeWidth="2.5" />
      <line x1="18" y1="58" x2="62" y2="58" stroke={SOIL_BROWN} strokeWidth="2.5" />
      <line x1="5" y1="15" x2="5" y2="70" stroke={SOIL_BROWN} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
      <line x1="75" y1="15" x2="75" y2="70" stroke={SOIL_BROWN} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
    </g>
  ),
  natural: (
    <g>
      <path d="M40 75 Q38 60 36 50 Q34 42 40 30" stroke={SOIL_BROWN} strokeWidth="4" fill="none" />
      <path d="M40 45 Q28 38 18 32" stroke={SOIL_BROWN} strokeWidth="2.5" fill="none" />
      <path d="M40 38 Q55 30 62 25" stroke={SOIL_BROWN} strokeWidth="2.5" fill="none" />
      <path d="M40 32 Q32 22 25 15" stroke={SOIL_BROWN} strokeWidth="2" fill="none" />
      <ellipse cx="40" cy="30" rx="30" ry="22" fill={SOIL_BROWN} opacity="0.15" />
    </g>
  ),
  formal_hedge: (
    <g>
      <rect x="10" y="25" width="60" height="40" rx="3" fill={SOIL_BROWN} opacity="0.2" stroke={SOIL_BROWN} strokeWidth="2.5" />
      <line x1="20" y1="65" x2="20" y2="75" stroke={SOIL_BROWN} strokeWidth="2" />
      <line x1="40" y1="65" x2="40" y2="75" stroke={SOIL_BROWN} strokeWidth="2" />
      <line x1="60" y1="65" x2="60" y2="75" stroke={SOIL_BROWN} strokeWidth="2" />
    </g>
  ),
  tree_form: (
    <g>
      <line x1="40" y1="75" x2="40" y2="35" stroke={SOIL_BROWN} strokeWidth="5" />
      <circle cx="40" cy="25" r="20" fill={SOIL_BROWN} opacity="0.2" stroke={SOIL_BROWN} strokeWidth="2.5" />
    </g>
  ),
  size_reduction: (
    <g>
      <line x1="40" y1="75" x2="40" y2="30" stroke={SOIL_BROWN} strokeWidth="4" />
      <ellipse cx="40" cy="35" rx="25" ry="20" fill={SOIL_BROWN} opacity="0.15" stroke={SOIL_BROWN} strokeWidth="2" strokeDasharray="5 3" />
      <ellipse cx="40" cy="38" rx="18" ry="15" fill={SOIL_BROWN} opacity="0.25" stroke={SOIL_BROWN} strokeWidth="2.5" />
      <path d="M18 22 L12 16 M15 20 L12 16 L18 17" stroke={SOIL_BROWN} strokeWidth="1.5" fill="none" />
      <path d="M62 22 L68 16 M65 20 L68 16 L62 17" stroke={SOIL_BROWN} strokeWidth="1.5" fill="none" />
    </g>
  ),
  vase: (
    <g>
      <path d="M40 75 L40 55" stroke={SOIL_BROWN} strokeWidth="4" fill="none" />
      <path d="M40 55 Q30 45 15 20" stroke={SOIL_BROWN} strokeWidth="3" fill="none" />
      <path d="M40 55 Q50 45 65 20" stroke={SOIL_BROWN} strokeWidth="3" fill="none" />
      <path d="M40 55 Q35 40 25 22" stroke={SOIL_BROWN} strokeWidth="2.5" fill="none" />
      <path d="M40 55 Q45 40 55 22" stroke={SOIL_BROWN} strokeWidth="2.5" fill="none" />
      <path d="M10 22 Q40 10 70 22" stroke={SOIL_BROWN} strokeWidth="2" fill="none" opacity="0.3" />
    </g>
  ),
  climbing: (
    <g>
      <line x1="15" y1="75" x2="15" y2="10" stroke={SOIL_BROWN} strokeWidth="2" strokeDasharray="4 3" opacity="0.4" />
      <line x1="65" y1="75" x2="65" y2="10" stroke={SOIL_BROWN} strokeWidth="2" strokeDasharray="4 3" opacity="0.4" />
      <path d="M18 70 Q30 55 22 45 Q15 38 25 28 Q35 18 30 10" stroke={SOIL_BROWN} strokeWidth="3" fill="none" />
      <path d="M18 70 Q40 50 50 40 Q58 32 55 20 Q52 12 60 10" stroke={SOIL_BROWN} strokeWidth="3" fill="none" />
      <circle cx="25" cy="28" r="4" fill={SOIL_BROWN} opacity="0.3" />
      <circle cx="50" cy="40" r="4" fill={SOIL_BROWN} opacity="0.3" />
      <circle cx="30" cy="10" r="4" fill={SOIL_BROWN} opacity="0.3" />
    </g>
  ),
  rejuvenation: (
    <g>
      <line x1="30" y1="75" x2="30" y2="40" stroke={SOIL_BROWN} strokeWidth="5" />
      <line x1="30" y1="50" x2="20" y2="30" stroke={SOIL_BROWN} strokeWidth="3" />
      <line x1="30" y1="45" x2="50" y2="25" stroke={SOIL_BROWN} strokeWidth="3" />
      <line x1="30" y1="40" x2="25" y2="20" stroke={SOIL_BROWN} strokeWidth="2" strokeDasharray="4 3" opacity="0.4" />
      <line x1="30" y1="42" x2="45" y2="18" stroke={SOIL_BROWN} strokeWidth="2" strokeDasharray="4 3" opacity="0.4" />
      <path d="M55 38 Q60 42 58 48 L62 44 Q64 50 60 54" stroke={SOIL_BROWN} strokeWidth="1.5" fill="none" opacity="0.5" />
      <text x="56" y="36" fontSize="10" fill={SOIL_BROWN} opacity="0.5" fontStyle="italic">new</text>
    </g>
  ),
  canopy_lift: (
    <g>
      <line x1="40" y1="75" x2="40" y2="25" stroke={SOIL_BROWN} strokeWidth="5" />
      <ellipse cx="40" cy="22" rx="25" ry="16" fill={SOIL_BROWN} opacity="0.2" stroke={SOIL_BROWN} strokeWidth="2.5" />
      <line x1="40" y1="55" x2="25" y2="45" stroke={SOIL_BROWN} strokeWidth="2" strokeDasharray="4 3" opacity="0.3" />
      <line x1="40" y1="55" x2="55" y2="45" stroke={SOIL_BROWN} strokeWidth="2" strokeDasharray="4 3" opacity="0.3" />
      <path d="M22 48 L18 52 M28 48 L22 48 L24 42" stroke={SOIL_BROWN} strokeWidth="1.5" fill="none" opacity="0.5" />
    </g>
  ),
  thinning: (
    <g>
      <line x1="40" y1="75" x2="40" y2="30" stroke={SOIL_BROWN} strokeWidth="4" />
      <path d="M40 50 Q25 42 15 35" stroke={SOIL_BROWN} strokeWidth="2.5" fill="none" />
      <path d="M40 50 Q55 42 65 35" stroke={SOIL_BROWN} strokeWidth="2.5" fill="none" />
      <path d="M40 40 Q30 34 22 28" stroke={SOIL_BROWN} strokeWidth="2.5" fill="none" />
      <path d="M40 35 Q48 28 55 22" stroke={SOIL_BROWN} strokeWidth="2.5" fill="none" />
      <line x1="40" y1="45" x2="30" y2="38" stroke={SOIL_BROWN} strokeWidth="2" strokeDasharray="3 3" opacity="0.3" />
      <line x1="40" y1="42" x2="52" y2="30" stroke={SOIL_BROWN} strokeWidth="2" strokeDasharray="3 3" opacity="0.3" />
    </g>
  ),
  structural: (
    <g>
      <line x1="40" y1="75" x2="40" y2="30" stroke={SOIL_BROWN} strokeWidth="5" />
      <line x1="40" y1="55" x2="20" y2="40" stroke={SOIL_BROWN} strokeWidth="3" />
      <line x1="40" y1="55" x2="60" y2="40" stroke={SOIL_BROWN} strokeWidth="3" />
      <line x1="40" y1="42" x2="25" y2="28" stroke={SOIL_BROWN} strokeWidth="3" />
      <line x1="40" y1="42" x2="55" y2="28" stroke={SOIL_BROWN} strokeWidth="3" />
      <line x1="40" y1="32" x2="30" y2="18" stroke={SOIL_BROWN} strokeWidth="2.5" />
      <line x1="40" y1="32" x2="50" y2="18" stroke={SOIL_BROWN} strokeWidth="2.5" />
      <circle cx="20" cy="40" r="3" fill={SOIL_BROWN} opacity="0.3" />
      <circle cx="60" cy="40" r="3" fill={SOIL_BROWN} opacity="0.3" />
      <circle cx="25" cy="28" r="3" fill={SOIL_BROWN} opacity="0.3" />
      <circle cx="55" cy="28" r="3" fill={SOIL_BROWN} opacity="0.3" />
    </g>
  ),
};

// Fallback generic tree
const fallback = (
  <g>
    <line x1="40" y1="75" x2="40" y2="35" stroke={SOIL_BROWN} strokeWidth="4" />
    <ellipse cx="40" cy="28" rx="22" ry="18" fill={SOIL_BROWN} opacity="0.2" stroke={SOIL_BROWN} strokeWidth="2" />
  </g>
);

export default function SilhouetteIcon({ shape, size = 80, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {shapes[shape] || fallback}
    </svg>
  );
}
