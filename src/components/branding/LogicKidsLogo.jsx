export default function LogicKidsLogo({ size = 44 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="48" fill="url(#brandGradient)" />
      <path
        d="M35 50C35 40 42 35 50 35C58 35 65 40 65 50C65 60 58 65 50 65C42 65 35 60 35 50Z"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M50 35V20" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <path d="M50 65V80" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="50" r="4" fill="white" />
      <circle cx="50" cy="20" r="4" fill="white" />
      <circle cx="50" cy="80" r="4" fill="white" />
      <path
        d="M31 35C25 40 25 60 31 65"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M69 35C75 40 75 60 69 65"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="brandGradient" x1="0" y1="0" x2="100" y2="100">
          <stop stopColor="#2F6CE5" />
          <stop offset="1" stopColor="#17B890" />
        </linearGradient>
      </defs>
    </svg>
  );
}
