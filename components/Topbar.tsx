import Link from "next/link";

export function Topbar({ admin = false }: { admin?: boolean }) {
  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link className="brand" href={admin ? "/admin" : "/"}>
          <span className="brand-mark" aria-hidden="true" />
          <span>muSH Mindfulness Tracker</span>
        </Link>
        <nav className="actions" aria-label="Primary navigation">
          <Link className="button secondary" href="/">
            Events
          </Link>
          <Link className="button secondary" href="/admin">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
