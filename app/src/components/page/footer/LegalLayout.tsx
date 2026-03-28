// src/components/page/footer/LegalLayout.tsx
// Shared layout wrapper for all legal/informational footer pages.

interface LegalLayoutProps {
  /** Short uppercase category label (e.g. "Legal", "Privacy") */
  eyebrow: string;
  /** Page title — rendered as h1 with text-gradient */
  title: string;
  /** Subtitle below the title */
  subtitle: string;
  /** ISO date string for "Last updated" footer, e.g. "March 2025" */
  lastUpdated?: string;
  children: React.ReactNode;
}

export default function LegalLayout({
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">
          {eyebrow}
        </p>
        <h1
          className="text-4xl font-bold text-gradient tracking-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {title}
        </h1>
        <p className="mt-2 text-[13px] text-zinc-500">{subtitle}</p>
      </header>

      <main>
        <div className="flex flex-col gap-5">{children}</div>

        {lastUpdated && (
          <p className="mt-8 text-[11px] text-zinc-600 text-center">
            Last updated: {lastUpdated}
          </p>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable sub-components
// ---------------------------------------------------------------------------

interface LegalSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section className="glass rounded-2xl p-5" aria-labelledby={`section-${id}`}>
      <h2
        id={`section-${id}`}
        className="text-[15px] font-bold text-zinc-100 mb-3"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

interface LegalListProps {
  items: string[];
}

export function LegalList({ items }: LegalListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-[13px] text-zinc-400">
          <span
            className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50"
            aria-hidden="true"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}
