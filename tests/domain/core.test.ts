import { describe, expect, it } from "vitest";
import {
  ANONYMOUS_SESSION_COOKIE_MAX_AGE_SECONDS,
  CSV_EXPORT_HEADERS,
  createAnonymousSession,
  deriveEventStatus,
  exportResponsesToCsv,
  getDashboardSummary,
  getHawkinsOptionByValue,
  HAWKINS_OPTIONS,
  upsertQuestionnaireResponse
} from "@/lib/domain";
import type { AnonymousSession, PracticeEvent, QuestionnaireResponse } from "@/lib/types";

const baseEvent: PracticeEvent = {
  id: "event-1",
  title: "Breathwork",
  description: "Evening practice",
  startsAt: "2026-05-22T11:00:00.000Z",
  endsAt: "2026-05-22T12:00:00.000Z",
  locationContext: "OpenFlow Bazaar",
  imageUrl: "",
  publicationStatus: "published",
  createdAt: "2026-05-20T09:00:00.000Z",
  updatedAt: "2026-05-20T09:00:00.000Z"
};

const session: AnonymousSession = {
  id: "session-1",
  sessionKeyHash: "hash-only",
  createdAt: "2026-05-20T09:00:00.000Z",
  lastSeenAt: "2026-05-20T09:00:00.000Z",
  expiresAt: "2026-06-03T09:00:00.000Z"
};

const beforeResponse: QuestionnaireResponse = {
  id: "response-before",
  practiceEventId: "event-1",
  anonymousSessionId: "session-1",
  anonymousSessionHash: "hash-only",
  logType: "before",
  submittedAt: "2026-05-22T10:55:00.000Z",
  minutesFromEventStart: -5,
  minutesFromEventEnd: -65,
  hawkinsValue: "200",
  hawkinsLabel: "Courage",
  glucoseValue: 95,
  glucoseUnit: "mg/dL",
  hadFoodDrinkBefore: true,
  foodDrinkDetail: "tea",
  heartRateBpm: 65,
  stressScore: "4",
  note: "ready",
  createdAt: "2026-05-22T10:55:00.000Z",
  updatedAt: "2026-05-22T10:55:00.000Z"
};

describe("event status derivation", () => {
  it("derives draft, not started, in progress, and finished from publication and Shanghai time", () => {
    expect(
      deriveEventStatus({ ...baseEvent, publicationStatus: "draft" }, "2026-05-22T10:30:00.000Z")
    ).toBe("draft");
    expect(deriveEventStatus(baseEvent, "2026-05-22T10:30:00.000Z")).toBe("not_started");
    expect(deriveEventStatus(baseEvent, "2026-05-22T11:30:00.000Z")).toBe("in_progress");
    expect(deriveEventStatus(baseEvent, "2026-05-22T12:30:00.000Z")).toBe("finished");
  });
});

describe("anonymous sessions", () => {
  it("stores only a hash of the raw browser key and expires in two weeks", async () => {
    const rawKey = "participant-browser-random-key";
    const anonymous = await createAnonymousSession(rawKey, "pepper", "2026-05-20T09:00:00.000Z");

    expect(anonymous.sessionKeyHash).not.toContain(rawKey);
    expect(anonymous.sessionKeyHash).toHaveLength(64);
    expect(anonymous.expiresAt).toBe("2026-06-03T09:00:00.000Z");
    expect(ANONYMOUS_SESSION_COOKIE_MAX_AGE_SECONDS).toBe(60 * 60 * 24 * 14);
  });
});

describe("Hawkins scale", () => {
  it("keeps numeric values as persistence data while labels carry the participant-facing meaning", () => {
    expect(HAWKINS_OPTIONS).toHaveLength(17);
    expect(getHawkinsOptionByValue("700-1000")?.english).toBe("Enlightenment");
    expect(HAWKINS_OPTIONS.map((option) => option.value)).toContain("20");
  });
});

describe("questionnaire response rules", () => {
  it("blocks after logs until a before log exists for the same event and anonymous session", () => {
    expect(() =>
      upsertQuestionnaireResponse({
        existingResponses: [],
        event: baseEvent,
        session,
        logType: "after",
        now: "2026-05-22T12:05:00.000Z",
        input: { hawkinsValue: "250" }
      })
    ).toThrow(/before log/i);
  });

  it("updates the unique response for the same event, session, and log type", () => {
    const updated = upsertQuestionnaireResponse({
      existingResponses: [beforeResponse],
      event: baseEvent,
      session,
      logType: "before",
      now: "2026-05-22T10:58:00.000Z",
      input: {
        hawkinsValue: "250",
        note: "settled",
        hadFoodDrinkBefore: false
      }
    });

    expect(updated.responses).toHaveLength(1);
    expect(updated.response.id).toBe("response-before");
    expect(updated.response.hawkinsLabel).toBe("Neutrality");
    expect(updated.response.note).toBe("settled");
    expect(updated.response.foodDrinkDetail).toBe("");
  });
});

describe("admin dashboard and export", () => {
  const afterResponse: QuestionnaireResponse = {
    ...beforeResponse,
    id: "response-after",
    logType: "after",
    submittedAt: "2026-05-22T12:05:00.000Z",
    minutesFromEventStart: 65,
    minutesFromEventEnd: 5,
    hawkinsValue: "310",
    hawkinsLabel: "Willingness",
    foodDrinkDetail: "",
    hadFoodDrinkBefore: undefined
  };

  it("computes published events, paired sessions, completion rate, and biometric averages", () => {
    const summary = getDashboardSummary({
      events: [baseEvent],
      responses: [beforeResponse, afterResponse],
      now: "2026-05-22T12:05:00.000Z"
    });

    expect(summary.totalPublishedEvents).toBe(1);
    expect(summary.totalBeforeLogs).toBe(1);
    expect(summary.totalAfterLogs).toBe(1);
    expect(summary.pairedSessions).toBe(1);
    expect(summary.completionRate).toBe(1);
    expect(summary.glucoseAverageBefore).toBe(95);
  });

  it("exports anonymous CSV without identity fields and escapes spreadsheet formulas", () => {
    const csv = exportResponsesToCsv({
      events: [baseEvent],
      responses: [{ ...beforeResponse, note: "=IMPORTXML(\"https://example.com\")" }]
    });

    expect(CSV_EXPORT_HEADERS).not.toContain("IP address");
    expect(CSV_EXPORT_HEADERS).not.toContain("Email");
    expect(csv).toContain("Hashed anonymous session key");
    expect(csv).not.toContain("participant-browser-random-key");
    expect(csv).toContain("\"'=IMPORTXML(\"\"https://example.com\"\")\"");
  });
});
