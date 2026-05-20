import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { requireAdmin } from "@/lib/admin-session";
import { formatShanghaiDateTime } from "@/lib/domain";
import { getLocalDataStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminResponsesPage({
  searchParams
}: {
  searchParams: Promise<{ eventId?: string; logType?: string; q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const store = getLocalDataStore();
  const events = await store.listEvents();
  const eventById = new Map(events.map((event) => [event.id, event]));
  const responses = (await store.listResponses()).filter((response) => {
    const matchesEvent = params.eventId ? response.practiceEventId === params.eventId : true;
    const matchesLogType = params.logType === "before" || params.logType === "after" ? response.logType === params.logType : true;
    const q = params.q?.toLowerCase().trim();
    const matchesSearch = q
      ? response.note.toLowerCase().includes(q) || response.foodDrinkDetail.toLowerCase().includes(q)
      : true;
    return matchesEvent && matchesLogType && matchesSearch;
  });

  return (
    <main className="page">
      <Topbar admin />
      <section className="shell hero">
        <p className="eyebrow">Anonymous responses</p>
        <h1>Review logs and paired sessions</h1>
      </section>
      <section className="shell">
        <form className="form" method="get">
          <div className="two-col">
            <div className="field">
              <label htmlFor="eventId">Filter by event</label>
              <select id="eventId" name="eventId" defaultValue={params.eventId ?? ""}>
                <option value="">All events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="logType">Filter by before/after</label>
              <select id="logType" name="logType" defaultValue={params.logType ?? ""}>
                <option value="">All logs</option>
                <option value="before">Before</option>
                <option value="after">After</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="q">Search notes and food/drink</label>
            <input id="q" name="q" defaultValue={params.q ?? ""} />
          </div>
          <button type="submit">Apply filters</button>
        </form>
        <div className="notice warning">
          Free text may contain accidental personal data. Exports are for experiment analysis only.
        </div>
        <div className="table-wrap" style={{ marginTop: "1rem" }}>
          <table>
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Event</th>
                <th>Type</th>
                <th>Hawkins</th>
                <th>Paired key</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((response) => (
                <tr key={response.id}>
                  <td>{formatShanghaiDateTime(response.submittedAt)}</td>
                  <td>{eventById.get(response.practiceEventId)?.title ?? "Unknown event"}</td>
                  <td>{response.logType}</td>
                  <td>{response.hawkinsLabel}</td>
                  <td>{response.anonymousSessionHash.slice(0, 12)}...</td>
                  <td>
                    <Link href={`/admin/responses/${response.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
