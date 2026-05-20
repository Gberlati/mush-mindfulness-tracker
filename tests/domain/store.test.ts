import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createPracticeEvent,
  getEventResponseState,
  getLocalDataStore,
  submitLog
} from "@/lib/store";

let dataDir: string;

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "mush-store-"));
  process.env.DATA_DIR = dataDir;
  process.env.SESSION_HASH_SECRET = "store-test-secret";
});

afterEach(async () => {
  await rm(dataDir, { recursive: true, force: true });
  delete process.env.DATA_DIR;
});

describe("local data store workflow", () => {
  it("creates events and persists a participant before/after pair", async () => {
    const store = getLocalDataStore();
    const event = await createPracticeEvent(store, {
      title: "Guided Meditation",
      description: "Morning practice",
      startsAt: "2026-05-23T01:30:00.000Z",
      endsAt: "2026-05-23T02:00:00.000Z",
      locationContext: "Shanghai",
      imageUrl: "",
      publicationStatus: "published"
    });
    const session = await store.ensureAnonymousSession("raw-browser-key", "secret", "2026-05-23T01:20:00.000Z");

    const before = await submitLog(store, {
      eventId: event.id,
      session,
      logType: "before",
      now: "2026-05-23T01:25:00.000Z",
      input: {
        hawkinsValue: "200",
        note: "Before note"
      }
    });
    const after = await submitLog(store, {
      eventId: event.id,
      session,
      logType: "after",
      now: "2026-05-23T02:05:00.000Z",
      input: {
        hawkinsValue: "310",
        heartRateBpm: 62
      }
    });

    const state = await getEventResponseState(store, event.id, session.id);

    expect(before.logType).toBe("before");
    expect(after.logType).toBe("after");
    expect(state.before?.id).toBe(before.id);
    expect(state.after?.id).toBe(after.id);
  });
});
