import { ArrowRight, CheckCircle2, Lock, Timer } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { deriveEventStatus, formatShanghaiDateTime } from "@/lib/domain";
import { getOrCreateParticipantSession } from "@/lib/participant-session";
import { getEventResponseState, getLocalDataStore, getStatusLabel } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { eventId } = await params;
  const { submitted } = await searchParams;
  const store = getLocalDataStore();
  const event = await store.getEvent(eventId);

  if (!event || event.publicationStatus !== "published") {
    notFound();
  }

  const session = await getOrCreateParticipantSession();
  const responseState = await getEventResponseState(store, event.id, session.id);
  const status = deriveEventStatus(event);

  return (
    <main className="page">
      <Topbar />
      <section className="shell hero">
        {submitted ? (
          <div className="notice">
            <strong>Submitted / 已提交</strong>
            <p className="muted">Your {submitted} log has been saved anonymously on this browser session.</p>
          </div>
        ) : null}
        <div
          className="event-image"
          role="img"
          aria-label={`${event.title} practice image`}
          style={event.imageUrl ? { backgroundImage: `url(${event.imageUrl})` } : undefined}
        />
        <p className="eyebrow">{getStatusLabel(status)}</p>
        <h1>{event.title}</h1>
        <p className="muted">{event.description}</p>
        <div className="meta-row">
          <span className="pill">
            <Timer size={15} aria-hidden="true" /> {formatShanghaiDateTime(event.startsAt)} -{" "}
            {formatShanghaiDateTime(event.endsAt)}
          </span>
          {event.locationContext ? <span className="pill">{event.locationContext}</span> : null}
        </div>
      </section>
      <section className="shell grid">
        <div className="card">
          <div className="card-body">
            <h2>Before log / 练习前记录</h2>
            <p className="muted">Ideally within 10 minutes before practice starts. Late before logs are still saved.</p>
            <p>{responseState.before ? <StatusDone /> : "Not submitted on this browser / 此浏览器尚未提交"}</p>
            <Link className="button" href={`/events/${event.id}/before`}>
              {responseState.before ? "Update before log" : "Start before log"} <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h2>After log / 练习后记录</h2>
            <p className="muted">Ideally within 10 minutes after practice ends. Requires the same browser before log.</p>
            <p>{responseState.after ? <StatusDone /> : "Not submitted on this browser / 此浏览器尚未提交"}</p>
            {responseState.before ? (
              <Link className="button" href={`/events/${event.id}/after`}>
                {responseState.after ? "Update after log" : "Start after log"} <ArrowRight size={17} />
              </Link>
            ) : (
              <span className="button" aria-disabled="true">
                <Lock size={17} /> Complete before log first
              </span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusDone() {
  return (
    <span className="pill">
      <CheckCircle2 size={15} aria-hidden="true" /> Submitted / 已提交
    </span>
  );
}
