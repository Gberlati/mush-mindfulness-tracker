import type { LogType, PublicationStatus, QuestionnaireInput } from "@/lib/types";

export function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function formNumber(formData: FormData, key: string): number | undefined {
  const text = formText(formData, key);
  if (!text) {
    return undefined;
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : undefined;
}

export function formLogType(formData: FormData): LogType {
  const value = formText(formData, "logType");
  if (value !== "before" && value !== "after") {
    throw new Error("Invalid log type.");
  }
  return value;
}

export function formPublicationStatus(formData: FormData): PublicationStatus {
  return formText(formData, "publicationStatus") === "published" ? "published" : "draft";
}

export function formQuestionnaireInput(formData: FormData): QuestionnaireInput {
  const hadFoodDrinkValue = formText(formData, "hadFoodDrinkBefore");
  return {
    hawkinsValue: formText(formData, "hawkinsValue"),
    glucoseValue: formNumber(formData, "glucoseValue"),
    hadFoodDrinkBefore:
      hadFoodDrinkValue === "yes" ? true : hadFoodDrinkValue === "no" ? false : undefined,
    foodDrinkDetail: formText(formData, "foodDrinkDetail"),
    heartRateBpm: formNumber(formData, "heartRateBpm"),
    stressScore: formText(formData, "stressScore"),
    note: formText(formData, "note")
  };
}

export function datetimeLocalToIso(value: string): string {
  if (!value) {
    throw new Error("Date/time is required.");
  }
  return new Date(value).toISOString();
}

export function isoToDatetimeLocal(value: string): string {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
