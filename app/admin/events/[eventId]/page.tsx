import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminEventForm } from "@/components/AdminEventForm";
import { Topbar } from "@/components/Topbar";
import { requireAdmin } from "@/lib/admin-session";
import { deriveEventStatus } from "@/lib/domain";
import { getLocalDataStore, getStatusLabel } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EditAdminEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireAdmin();
  const { eventId } = await params;
  const event = await getLocalDataStore().getEvent(eventId);
  if (!event) {
    notFound();
  }

  return (
    <main className="page">
      <Topbar admin />
      <section className="shell hero">
        <p className="eyebrow">{getStatusLabel(deriveEventStatus(event))}</p>
        <h1>{event.title}</h1>
        <div className="actions">
          <Link className="button secondary" href={`/events/${event.id}`}>
            Direct participant link
          </Link>
        </div>
      </section>
      <section className="shell">
        <AdminEventForm event={event} />
      </section>
    </main>
  );
}
