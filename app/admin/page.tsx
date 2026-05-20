import { Download, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { Topbar } from "@/components/Topbar";
import { requireAdmin } from "@/lib/admin-session";
import { deriveEventStatus } from "@/lib/domain";
import { getDashboardSummary } from "@/lib/domain";
import { getLocalDataStore, getStatusLabel } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const store = getLocalDataStore();
  const events = await store.listEvents();
  const responses = await store.listResponses();
  const summary = getDashboardSummary({ events, responses, now: new Date().toISOString() });

  return (
    <main className="page">
      <Topbar admin />
      <section className="shell hero">
        <p className="eyebrow">Admin dashboard</p>
        <h1>Events, responses, and before/after signals</h1>
        <div className="actions">
          <Link className="button" href="/admin/events/new">
            <Plus size={18} /> New event
          </Link>
          <Link className="button secondary" href="/admin/responses">
            <FileText size={18} /> Responses
          </Link>
          <Link className="button secondary" href="/admin/export">
            <Download size={18} /> CSV export
          </Link>
          <form action={logoutAction}>
            <button className="secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </section>
      <section className="shell grid">
        <Metric label="Published events" value={summary.totalPublishedEvents} />
        <Metric label="Before logs" value={summary.totalBeforeLogs} />
        <Metric label="After logs" value={summary.totalAfterLogs} />
        <Metric label="Completion rate" value={`${Math.round(summary.completionRate * 100)}%`} />
      </section>
      <section className="shell" style={{ marginTop: "1.5rem" }}>
        <h2>Event status</h2>
        <div className="grid">
          {events.map((event) => (
            <article className="card" key={event.id}>
              <div className="card-body">
                <p className="eyebrow">{getStatusLabel(deriveEventStatus(event))}</p>
                <h3>{event.title}</h3>
                <p className="muted">{event.publicationStatus}</p>
                <Link className="button secondary" href={`/admin/events/${event.id}`}>
                  Edit
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="shell" style={{ marginTop: "1.5rem" }}>
        <h2>Hawkins before/after movement</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Before avg</th>
                <th>After avg</th>
                <th>Movement</th>
              </tr>
            </thead>
            <tbody>
              {summary.hawkinsMovementByEvent.map((movement) => (
                <tr key={movement.eventId}>
                  <td>{movement.eventTitle}</td>
                  <td>{movement.beforeAverage ?? "n/a"}</td>
                  <td>{movement.afterAverage ?? "n/a"}</td>
                  <td>{movement.movement ?? "n/a"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="card">
      <div className="card-body">
        <p className="eyebrow">{label}</p>
        <h2>{value}</h2>
      </div>
    </article>
  );
}
