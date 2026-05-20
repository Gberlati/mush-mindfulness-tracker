import { redirect, notFound } from "next/navigation";
import { QuestionnaireForm } from "@/components/QuestionnaireForm";
import { Topbar } from "@/components/Topbar";
import { getOrCreateParticipantSession } from "@/lib/participant-session";
import { getEventResponseState, getLocalDataStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AfterQuestionnairePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const store = getLocalDataStore();
  const event = await store.getEvent(eventId);
  if (!event || event.publicationStatus !== "published") {
    notFound();
  }
  const session = await getOrCreateParticipantSession();
  const state = await getEventResponseState(store, event.id, session.id);

  if (!state.before) {
    redirect(`/events/${event.id}?needsBefore=1`);
  }

  return (
    <main className="page">
      <Topbar />
      <section className="shell hero">
        <p className="eyebrow">After log / 练习后记录</p>
        <h1>{event.title}</h1>
      </section>
      <section className="shell">
        <QuestionnaireForm event={event} logType="after" existing={state.after} />
      </section>
    </main>
  );
}
