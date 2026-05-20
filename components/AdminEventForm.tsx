import { Save } from "lucide-react";
import { saveEventAction } from "@/app/admin/actions";
import { isoToDatetimeLocal } from "@/lib/form";
import type { PracticeEvent } from "@/lib/types";

export function AdminEventForm({ event }: { event?: PracticeEvent }) {
  return (
    <form className="form" action={saveEventAction}>
      <input type="hidden" name="eventId" value={event?.id ?? ""} />
      <input type="hidden" name="existingImageUrl" value={event?.imageUrl ?? ""} />
      <div className="field">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" required defaultValue={event?.title ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" defaultValue={event?.description ?? ""} />
      </div>
      <div className="two-col">
        <div className="field">
          <label htmlFor="startsAt">Start date/time</label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={event ? isoToDatetimeLocal(event.startsAt) : ""}
          />
        </div>
        <div className="field">
          <label htmlFor="endsAt">End date/time</label>
          <input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            required
            defaultValue={event ? isoToDatetimeLocal(event.endsAt) : ""}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="locationContext">Location/context</label>
        <input id="locationContext" name="locationContext" defaultValue={event?.locationContext ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="image">Practice event image</label>
        <input id="image" name="image" type="file" accept="image/*" />
        {event?.imageUrl ? <p className="muted">Current image: {event.imageUrl}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="publicationStatus">Publication status</label>
        <select id="publicationStatus" name="publicationStatus" defaultValue={event?.publicationStatus ?? "draft"}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
      <button type="submit">
        <Save size={18} aria-hidden="true" />
        Save event
      </button>
    </form>
  );
}
