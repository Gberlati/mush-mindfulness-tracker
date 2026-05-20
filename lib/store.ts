import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  createAnonymousSession,
  deriveEventStatus,
  hashAnonymousSessionKey,
  upsertQuestionnaireResponse
} from "@/lib/domain";
import type {
  AnonymousSession,
  DerivedEventStatus,
  LogType,
  PracticeEvent,
  PublicationStatus,
  QuestionnaireInput,
  QuestionnaireResponse
} from "@/lib/types";

type AppData = {
  events: PracticeEvent[];
  anonymousSessions: AnonymousSession[];
  responses: QuestionnaireResponse[];
};

type EventInput = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  locationContext: string;
  imageUrl: string;
  publicationStatus: PublicationStatus;
};

export type DataStore = {
  listEvents(): Promise<PracticeEvent[]>;
  getEvent(id: string): Promise<PracticeEvent | undefined>;
  saveEvent(event: PracticeEvent): Promise<PracticeEvent>;
  listResponses(): Promise<QuestionnaireResponse[]>;
  saveResponses(responses: QuestionnaireResponse[]): Promise<void>;
  ensureAnonymousSession(rawKey: string, secret: string, now: string): Promise<AnonymousSession>;
};

const emptyData: AppData = {
  events: [],
  anonymousSessions: [],
  responses: []
};

export function getLocalDataStore(): DataStore {
  const filePath = join(process.env.DATA_DIR ?? ".data", "store.json");

  async function readData(): Promise<AppData> {
    try {
      const raw = await readFile(filePath, "utf8");
      return JSON.parse(raw) as AppData;
    } catch {
      return structuredClone(emptyData);
    }
  }

  async function writeData(data: AppData): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
  }

  return {
    async listEvents() {
      const data = await readData();
      return data.events.toSorted((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    },
    async getEvent(id) {
      const data = await readData();
      return data.events.find((event) => event.id === id);
    },
    async saveEvent(event) {
      const data = await readData();
      const existing = data.events.find((candidate) => candidate.id === event.id);
      const events = existing
        ? data.events.map((candidate) => (candidate.id === event.id ? event : candidate))
        : [...data.events, event];
      await writeData({ ...data, events });
      return event;
    },
    async listResponses() {
      const data = await readData();
      return data.responses.toSorted(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    },
    async saveResponses(responses) {
      const data = await readData();
      await writeData({ ...data, responses });
    },
    async ensureAnonymousSession(rawKey, secret, now) {
      const data = await readData();
      const sessionKeyHash = hashAnonymousSessionKey(rawKey, secret);
      const existing = data.anonymousSessions.find(
        (session) => session.sessionKeyHash === sessionKeyHash && new Date(session.expiresAt).getTime() > new Date(now).getTime()
      );

      if (existing) {
        const updated = { ...existing, lastSeenAt: now };
        await writeData({
          ...data,
          anonymousSessions: data.anonymousSessions.map((session) =>
            session.id === existing.id ? updated : session
          )
        });
        return updated;
      }

      const session = await createAnonymousSession(rawKey, secret, now);
      await writeData({ ...data, anonymousSessions: [...data.anonymousSessions, session] });
      return session;
    }
  };
}

export async function createPracticeEvent(store: DataStore, input: EventInput): Promise<PracticeEvent> {
  const now = new Date().toISOString();
  const event: PracticeEvent = {
    id: randomUUID(),
    title: input.title.trim(),
    description: input.description.trim(),
    startsAt: new Date(input.startsAt).toISOString(),
    endsAt: new Date(input.endsAt).toISOString(),
    locationContext: input.locationContext.trim(),
    imageUrl: input.imageUrl.trim(),
    publicationStatus: input.publicationStatus,
    createdAt: now,
    updatedAt: now
  };
  validateEvent(event);
  return store.saveEvent(event);
}

export async function updatePracticeEvent(
  store: DataStore,
  eventId: string,
  input: EventInput
): Promise<PracticeEvent> {
  const existing = await store.getEvent(eventId);
  if (!existing) {
    throw new Error("Event not found.");
  }

  const event: PracticeEvent = {
    ...existing,
    title: input.title.trim(),
    description: input.description.trim(),
    startsAt: new Date(input.startsAt).toISOString(),
    endsAt: new Date(input.endsAt).toISOString(),
    locationContext: input.locationContext.trim(),
    imageUrl: input.imageUrl.trim(),
    publicationStatus: input.publicationStatus,
    updatedAt: new Date().toISOString()
  };
  validateEvent(event);
  return store.saveEvent(event);
}

export async function listParticipantEvents(store: DataStore, now = new Date().toISOString()) {
  const events = await store.listEvents();
  return events.filter((event) => {
    const status = deriveEventStatus(event, now);
    return event.publicationStatus === "published" && status !== "finished";
  });
}

export async function getEventResponseState(store: DataStore, eventId: string, anonymousSessionId: string) {
  const responses = await store.listResponses();
  const matching = responses.filter(
    (response) => response.practiceEventId === eventId && response.anonymousSessionId === anonymousSessionId
  );
  return {
    before: matching.find((response) => response.logType === "before"),
    after: matching.find((response) => response.logType === "after")
  };
}

export async function submitLog(
  store: DataStore,
  {
    eventId,
    session,
    logType,
    now,
    input
  }: {
    eventId: string;
    session: AnonymousSession;
    logType: LogType;
    now: string;
    input: QuestionnaireInput;
  }
): Promise<QuestionnaireResponse> {
  const event = await store.getEvent(eventId);
  if (!event) {
    throw new Error("Practice event not found.");
  }
  if (event.publicationStatus !== "published") {
    throw new Error("This practice event is not open for participant logging.");
  }

  const existingResponses = await store.listResponses();
  const result = upsertQuestionnaireResponse({
    existingResponses,
    event,
    session,
    logType,
    now,
    input
  });
  await store.saveResponses(result.responses);
  return result.response;
}

export function getStatusLabel(status: DerivedEventStatus) {
  const labels: Record<DerivedEventStatus, string> = {
    draft: "Draft",
    not_started: "Not started",
    in_progress: "In progress",
    finished: "Finished"
  };
  return labels[status];
}

function validateEvent(event: PracticeEvent): void {
  if (!event.title) {
    throw new Error("Title is required.");
  }
  if (new Date(event.endsAt).getTime() <= new Date(event.startsAt).getTime()) {
    throw new Error("End date/time must be after start date/time.");
  }
}
