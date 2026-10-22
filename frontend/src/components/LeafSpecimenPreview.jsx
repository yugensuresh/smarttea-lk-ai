export default function LeafSpecimenPreview({ src, className = "", alt = "Tea leaf specimen preview" }) {
  if (src) {
    return (
      <img
        key={src}
        src={src}
        alt={alt}
        className={`object-contain bg-[#eef2ef] ${className}`}
        decoding="async"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 120 90"
      className={className}
      role="img"
      aria-label="Tea leaf specimen illustration"
    >
      <rect width="120" height="90" rx="8" fill="#e8efe9" />
      <path
        d="M18 72 C 34 28, 58 18, 72 24 C 88 30, 96 48, 92 68 C 78 76, 52 82, 28 78 Z"
        fill="#6fa86a"
      />
      <path
        d="M34 68 C 48 42, 62 34, 74 38"
        fill="none"
        stroke="#4d7f49"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <rect x="44" y="34" width="14" height="10" rx="2" fill="none" stroke="#e23b45" strokeWidth="1.4" />
      <rect x="58" y="42" width="12" height="9" rx="2" fill="none" stroke="#e23b45" strokeWidth="1.4" />
      <circle cx="51" cy="39" r="2.2" fill="#e23b45" opacity="0.85" />
    </svg>
  );
}
