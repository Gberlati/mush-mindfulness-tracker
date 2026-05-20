import { Plus } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { requireAdmin } from "@/lib/admin-session";
import { deriveEventStatus, formatShanghaiDateTime } from "@/lib/domain";
import { getLocalDataStore, getStatusLabel } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  await requireAdmin();
  const events = await getLocalDataStore().listEvents();

  return (
    <main className="page">
      <Topbar admin />
      <section className="shell hero">
        <p className="eyebrow">Admin events</p>
        <h1>Manage scheduled practice events</h1>
        <Link className="button" href="/admin/events/new">
          <Plus size={18} /> New event
        </Link>
      </section>
      <section className="shell table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Start</th>
              <th>Publication</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>
                  <Link href={`/admin/events/${event.id}`}>{event.title}</Link>
                </td>
                <td>{getStatusLabel(deriveEventStatus(event))}</td>
                <td>{formatShanghaiDateTime(event.startsAt)}</td>
                <td>{event.publicationStatus}</td>
                <td>
                  <Link href={`/events/${event.id}`}>Participant link</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
