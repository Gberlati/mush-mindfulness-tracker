"use server";

import { redirect } from "next/navigation";
import { formLogType, formQuestionnaireInput, formText } from "@/lib/form";
import { getOrCreateParticipantSession } from "@/lib/participant-session";
import { getLocalDataStore, submitLog } from "@/lib/store";

export async function submitQuestionnaireAction(formData: FormData) {
  const store = getLocalDataStore();
  const eventId = formText(formData, "eventId");
  const logType = formLogType(formData);
  const session = await getOrCreateParticipantSession();

  await submitLog(store, {
    eventId,
    session,
    logType,
    now: new Date().toISOString(),
    input: formQuestionnaireInput(formData)
  });

  redirect(`/events/${eventId}?submitted=${logType}`);
}
