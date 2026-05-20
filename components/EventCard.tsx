import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { deriveEventStatus, formatShanghaiDateTime } from "@/lib/domain";
import { getStatusLabel } from "@/lib/store";
import type { PracticeEvent } from "@/lib/types";

export function EventCard({ event }: { event: PracticeEvent }) {
  const status = deriveEventStatus(event);
  return (
    <article className="card">
      <div
        className="event-image"
        role="img"
        aria-label={`${event.title} practice image`}
        style={event.imageUrl ? { backgroundImage: `url(${event.imageUrl})` } : undefined}
      />
      <div className="card-body">
        <p className="eyebrow">{getStatusLabel(status)}</p>
        <h2>{event.title}</h2>
        <p className="muted">{event.description || "Anonymous before/after self-observation practice."}</p>
        <div className="meta-row">
          <span className="pill">
            <CalendarDays size={15} aria-hidden="true" /> {formatShanghaiDateTime(event.startsAt)}
          </span>
          {event.locationContext ? (
            <span className="pill">
              <MapPin size={15} aria-hidden="true" /> {event.locationContext}
            </span>
          ) : null}
        </div>
        <Link className="button" href={`/events/${event.id}`}>
          Open event
        </Link>
      </div>
    </article>
  );
}
