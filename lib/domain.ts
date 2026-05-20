import { createHash, randomUUID } from "node:crypto";
import type {
  AnonymousSession,
  DashboardSummary,
  DerivedEventStatus,
  HawkinsOption,
  LogType,
  PracticeEvent,
  QuestionnaireInput,
  QuestionnaireResponse
} from "@/lib/types";

export const ANONYMOUS_SESSION_COOKIE_NAME = "mush_anonymous_session";
export const ANONYMOUS_SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export const HAWKINS_OPTIONS: HawkinsOption[] = [
  { value: "20", english: "Shame", chinese: "羞耻", description: "Collapse, hiding, unworthy", color: "#7F1D1D" },
  { value: "30", english: "Guilt", chinese: "内疚", description: "Blame, regret, burden", color: "#991B1B" },
  { value: "50", english: "Apathy", chinese: "冷漠", description: "Numb, helpless, drained", color: "#6B7280" },
  { value: "75", english: "Grief", chinese: "悲伤", description: "Loss, sorrow, mourning", color: "#4B5563" },
  { value: "100", english: "Fear", chinese: "恐惧", description: "Threat, worry, alert", color: "#92400E" },
  { value: "125", english: "Desire", chinese: "欲望", description: "Craving, chasing, wanting", color: "#B45309" },
  { value: "150", english: "Anger", chinese: "愤怒", description: "Friction, protest, heat", color: "#DC2626" },
  { value: "175", english: "Pride", chinese: "骄傲", description: "Status, defense, proving", color: "#C2410C" },
  { value: "200", english: "Courage", chinese: "勇气", description: "Agency, action, honesty", color: "#16A34A" },
  { value: "250", english: "Neutrality", chinese: "中立", description: "Flexible, okay, balanced", color: "#059669" },
  { value: "310", english: "Willingness", chinese: "主动", description: "Open, ready, cooperative", color: "#0D9488" },
  { value: "350", english: "Acceptance", chinese: "接纳", description: "Ownership, grounded, allowing", color: "#0891B2" },
  { value: "400", english: "Reason", chinese: "理性", description: "Clear, discerning, thoughtful", color: "#2563EB" },
  { value: "500", english: "Love", chinese: "爱", description: "Warmth, care, connection", color: "#DB2777" },
  { value: "540", english: "Joy", chinese: "喜悦", description: "Light, grateful, radiant", color: "#CA8A04" },
  { value: "600", english: "Peace", chinese: "平和", description: "Still, spacious, complete", color: "#65A30D" },
  {
    value: "700-1000",
    english: "Enlightenment",
    chinese: "开悟",
    description: "Unity, presence, transcendence",
    color: "#7C3AED"
  }
];

export const CSV_EXPORT_HEADERS = [
  "Response ID",
  "Event ID",
  "Event title",
  "Hashed anonymous session key",
  "Log type",
  "Submitted timestamp",
  "Minutes from event start/end",
  "Hawkins value",
  "Hawkins label",
  "Glucose value",
  "Glucose unit",
  "Food/drink yes/no",
  "Food/drink detail",
  "Heart rate bpm",
  "Stress score",
  "Note"
];

export function getHawkinsOptionByValue(value: string): HawkinsOption | undefined {
  return HAWKINS_OPTIONS.find((option) => option.value === value);
}

export function hawkinsNumericValue(value: string): number {
  if (value === "700-1000") {
    return 700;
  }
  return Number(value);
}

export function deriveEventStatus(event: PracticeEvent, nowInput = new Date().toISOString()): DerivedEventStatus {
  if (event.publicationStatus === "draft") {
    return "draft";
  }

  const now = new Date(nowInput).getTime();
  const startsAt = new Date(event.startsAt).getTime();
  const endsAt = new Date(event.endsAt).getTime();

  if (now < startsAt) {
    return "not_started";
  }
  if (now <= endsAt) {
    return "in_progress";
  }
  return "finished";
}

export function formatShanghaiDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export async function createAnonymousSession(
  rawSessionKey: string,
  secret: string,
  nowInput = new Date().toISOString()
): Promise<AnonymousSession> {
  const now = new Date(nowInput);
  const expires = new Date(now.getTime() + ANONYMOUS_SESSION_COOKIE_MAX_AGE_SECONDS * 1000);

  return {
    id: randomUUID(),
    sessionKeyHash: hashAnonymousSessionKey(rawSessionKey, secret),
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt: expires.toISOString()
  };
}

export function hashAnonymousSessionKey(rawSessionKey: string, secret: string): string {
  return createHash("sha256").update(`${secret}:${rawSessionKey}`).digest("hex");
}

export function upsertQuestionnaireResponse({
  existingResponses,
  event,
  session,
  logType,
  now,
  input
}: {
  existingResponses: QuestionnaireResponse[];
  event: PracticeEvent;
  session: AnonymousSession;
  logType: LogType;
  now: string;
  input: QuestionnaireInput;
}): { response: QuestionnaireResponse; responses: QuestionnaireResponse[] } {
  const hawkins = getHawkinsOptionByValue(input.hawkinsValue);
  if (!hawkins) {
    throw new Error("A valid Hawkins Scale selection is required.");
  }

  const note = normalizeText(input.note);
  if (note.length > 1000) {
    throw new Error("Note must be 1000 characters or fewer.");
  }

  if (logType === "after") {
    const hasBefore = existingResponses.some(
      (response) =>
        response.practiceEventId === event.id &&
        response.anonymousSessionId === session.id &&
        response.logType === "before"
    );
    if (!hasBefore) {
      throw new Error("A before log is required before submitting an after log.");
    }
  }

  const existing = existingResponses.find(
    (response) =>
      response.practiceEventId === event.id &&
      response.anonymousSessionId === session.id &&
      response.logType === logType
  );

  const submittedAt = new Date(now);
  const response: QuestionnaireResponse = {
    id: existing?.id ?? randomUUID(),
    practiceEventId: event.id,
    anonymousSessionId: session.id,
    anonymousSessionHash: session.sessionKeyHash,
    logType,
    submittedAt: submittedAt.toISOString(),
    minutesFromEventStart: minutesBetween(event.startsAt, submittedAt.toISOString()),
    minutesFromEventEnd: minutesBetween(event.endsAt, submittedAt.toISOString()),
    hawkinsValue: hawkins.value,
    hawkinsLabel: hawkins.english,
    glucoseValue: optionalNumber(input.glucoseValue),
    glucoseUnit: "mg/dL",
    hadFoodDrinkBefore: logType === "before" ? input.hadFoodDrinkBefore : undefined,
    foodDrinkDetail:
      logType === "before" && input.hadFoodDrinkBefore ? normalizeText(input.foodDrinkDetail) : "",
    heartRateBpm: optionalInteger(input.heartRateBpm),
    stressScore: normalizeText(input.stressScore),
    note,
    createdAt: existing?.createdAt ?? submittedAt.toISOString(),
    updatedAt: submittedAt.toISOString()
  };

  const responses = existing
    ? existingResponses.map((candidate) => (candidate.id === existing.id ? response : candidate))
    : [...existingResponses, response];

  return { response, responses };
}

export function getDashboardSummary({
  events,
  responses,
  now
}: {
  events: PracticeEvent[];
  responses: QuestionnaireResponse[];
  now: string;
}): DashboardSummary {
  const eventsByStatus: Record<DerivedEventStatus, number> = {
    draft: 0,
    not_started: 0,
    in_progress: 0,
    finished: 0
  };

  for (const event of events) {
    eventsByStatus[deriveEventStatus(event, now)] += 1;
  }

  const before = responses.filter((response) => response.logType === "before");
  const after = responses.filter((response) => response.logType === "after");
  const afterKeys = new Set(after.map(pairingKey));
  const pairedSessions = before.filter((response) => afterKeys.has(pairingKey(response))).length;

  return {
    totalPublishedEvents: events.filter((event) => event.publicationStatus === "published").length,
    eventsByStatus,
    totalBeforeLogs: before.length,
    totalAfterLogs: after.length,
    pairedSessions,
    completionRate: before.length === 0 ? 0 : pairedSessions / before.length,
    hawkinsMovementByEvent: events.map((event) => getHawkinsMovementForEvent(event, responses)),
    hawkinsDistributionBefore: distributionByLabel(before),
    hawkinsDistributionAfter: distributionByLabel(after),
    glucoseAverageBefore: average(before.map((response) => response.glucoseValue)),
    glucoseAverageAfter: average(after.map((response) => response.glucoseValue)),
    heartRateAverageBefore: average(before.map((response) => response.heartRateBpm)),
    heartRateAverageAfter: average(after.map((response) => response.heartRateBpm)),
    stressAverageBefore: average(before.map((response) => Number(response.stressScore))),
    stressAverageAfter: average(after.map((response) => Number(response.stressScore))),
    recentResponses: responses
      .toSorted((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10)
  };
}

export function exportResponsesToCsv({
  events,
  responses
}: {
  events: PracticeEvent[];
  responses: QuestionnaireResponse[];
}): string {
  const eventById = new Map(events.map((event) => [event.id, event]));
  const rows = responses.map((response) => {
    const event = eventById.get(response.practiceEventId);
    return [
      response.id,
      response.practiceEventId,
      event?.title ?? "",
      response.anonymousSessionHash,
      response.logType,
      response.submittedAt,
      `${response.minutesFromEventStart}/${response.minutesFromEventEnd}`,
      response.hawkinsValue,
      response.hawkinsLabel,
      response.glucoseValue ?? "",
      response.glucoseUnit,
      foodDrinkExportValue(response.hadFoodDrinkBefore),
      response.foodDrinkDetail,
      response.heartRateBpm ?? "",
      response.stressScore,
      response.note
    ];
  });

  return [CSV_EXPORT_HEADERS, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function getHawkinsMovementForEvent(event: PracticeEvent, responses: QuestionnaireResponse[]) {
  const eventResponses = responses.filter((response) => response.practiceEventId === event.id);
  const beforeAverage = average(
    eventResponses
      .filter((response) => response.logType === "before")
      .map((response) => hawkinsNumericValue(response.hawkinsValue))
  );
  const afterAverage = average(
    eventResponses
      .filter((response) => response.logType === "after")
      .map((response) => hawkinsNumericValue(response.hawkinsValue))
  );

  return {
    eventId: event.id,
    eventTitle: event.title,
    beforeAverage,
    afterAverage,
    movement: beforeAverage === null || afterAverage === null ? null : afterAverage - beforeAverage
  };
}

function pairingKey(response: QuestionnaireResponse): string {
  return `${response.practiceEventId}:${response.anonymousSessionId}`;
}

function distributionByLabel(responses: QuestionnaireResponse[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const response of responses) {
    distribution[response.hawkinsLabel] = (distribution[response.hawkinsLabel] ?? 0) + 1;
  }
  return distribution;
}

function average(values: Array<number | undefined | null>): number | null {
  const numericValues = values.filter((value): value is number => Number.isFinite(value));
  if (numericValues.length === 0) {
    return null;
  }
  return Math.round((numericValues.reduce((total, value) => total + value, 0) / numericValues.length) * 100) / 100;
}

function optionalNumber(value: number | undefined): number | undefined {
  return Number.isFinite(value) ? value : undefined;
}

function optionalInteger(value: number | undefined): number | undefined {
  return Number.isFinite(value) ? Math.trunc(Number(value)) : undefined;
}

function normalizeText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function minutesBetween(referenceIso: string, submittedIso: string): number {
  return Math.round((new Date(submittedIso).getTime() - new Date(referenceIso).getTime()) / 60_000);
}

function foodDrinkExportValue(value: boolean | undefined): string {
  if (value === undefined) {
    return "";
  }
  return value ? "yes" : "no";
}

function csvCell(value: string | number): string {
  const raw = String(value);
  const formulaSafe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${formulaSafe.replaceAll('"', '""')}"`;
}
