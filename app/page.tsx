import { EventCard } from "@/components/EventCard";
import { Topbar } from "@/components/Topbar";
import { getLocalDataStore, listParticipantEvents } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await listParticipantEvents(getLocalDataStore());

  return (
    <main className="page">
      <Topbar />
      <section className="shell hero">
        <p className="eyebrow">Anonymous practice logs / 匿名练习记录</p>
        <h1>Before and after self-observation for mindfulness practice</h1>
        <p className="muted">
          Choose a published practice event, complete a short before log, then return on the same browser for the
          after log.
        </p>
      </section>
      <section className="shell">
        {events.length === 0 ? (
          <div className="notice">
            <h2>No published upcoming events / 暂无已发布的即将开始活动</h2>
            <p className="muted">Please check your direct event link or ask the experiment lead.</p>
          </div>
        ) : (
          <div className="grid">
            {events.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
