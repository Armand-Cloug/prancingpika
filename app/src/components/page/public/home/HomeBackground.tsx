// src/components/page/public/home/HomeBackground.tsx
export default function HomeBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_10%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(900px_circle_at_80%_20%,rgba(34,211,238,0.08),transparent_55%)]" />
      {/* Vignette */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(31,43,58,0.65),rgba(31,43,58,0.92))]" />
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:120px_120px]" />
    </div>
  );
}
