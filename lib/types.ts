export type PublicationStatus = "draft" | "published";
export type DerivedEventStatus = "draft" | "not_started" | "in_progress" | "finished";
export type LogType = "before" | "after";

export type HawkinsOption = {
  value: string;
  english: string;
  chinese: string;
  description: string;
  color: string;
};

export type PracticeEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  locationContext: string;
  imageUrl: string;
  publicationStatus: PublicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type AnonymousSession = {
  id: string;
  sessionKeyHash: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

export type QuestionnaireResponse = {
  id: string;
  practiceEventId: string;
  anonymousSessionId: string;
  anonymousSessionHash: string;
  logType: LogType;
  submittedAt: string;
  minutesFromEventStart: number;
  minutesFromEventEnd: number;
  hawkinsValue: string;
  hawkinsLabel: string;
  glucoseValue?: number;
  glucoseUnit: string;
  hadFoodDrinkBefore?: boolean;
  foodDrinkDetail: string;
  heartRateBpm?: number;
  stressScore: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type QuestionnaireInput = {
  hawkinsValue: string;
  glucoseValue?: number;
  hadFoodDrinkBefore?: boolean;
  foodDrinkDetail?: string;
  heartRateBpm?: number;
  stressScore?: string;
  note?: string;
};

export type DashboardSummary = {
  totalPublishedEvents: number;
  eventsByStatus: Record<DerivedEventStatus, number>;
  totalBeforeLogs: number;
  totalAfterLogs: number;
  pairedSessions: number;
  completionRate: number;
  hawkinsMovementByEvent: Array<{
    eventId: string;
    eventTitle: string;
    beforeAverage: number | null;
    afterAverage: number | null;
    movement: number | null;
  }>;
  hawkinsDistributionBefore: Record<string, number>;
  hawkinsDistributionAfter: Record<string, number>;
  glucoseAverageBefore: number | null;
  glucoseAverageAfter: number | null;
  heartRateAverageBefore: number | null;
  heartRateAverageAfter: number | null;
  stressAverageBefore: number | null;
  stressAverageAfter: number | null;
  recentResponses: QuestionnaireResponse[];
};
