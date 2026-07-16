/**
 * Coque des écrans applicatifs : en-tête + navigation entre les 4 pages.
 */
import Link from "next/link";

const LIENS = [
  { href: "/notes", label: "Notes" },
  { href: "/rapport", label: "Rapport" },
  { href: "/historique", label: "Historique" },
  { href: "/reglages", label: "Réglages" },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <nav
          aria-label="Navigation principale"
          className="mx-auto flex max-w-4xl items-center gap-1 px-4 py-3"
        >
          <span className="mr-4 font-semibold">Delivery</span>
          {LIENS.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {lien.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
