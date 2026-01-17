// src/components/page/auth/sign-in/SignInBackground.tsx
export default function SignInBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(900px_circle_at_85%_20%,rgba(255,255,255,0.06),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(31,43,58,0.45),rgba(31,43,58,0.92))]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:140px_140px]" />
    </div>
  );
}
