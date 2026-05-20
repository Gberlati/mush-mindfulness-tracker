"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminSession, requireAdmin, setAdminSession } from "@/lib/admin-session";
import { verifyAdminCredentials } from "@/lib/auth";
import { datetimeLocalToIso, formPublicationStatus, formText } from "@/lib/form";
import { createPracticeEvent, getLocalDataStore, updatePracticeEvent } from "@/lib/store";

export async function loginAction(formData: FormData) {
  const username = formText(formData, "username");
  const password = formText(formData, "password");
  const valid = await verifyAdminCredentials(username, password);
  if (!valid) {
    redirect("/admin/login?error=1");
  }

  await setAdminSession(username);
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function saveEventAction(formData: FormData) {
  await requireAdmin();
  const store = getLocalDataStore();
  const eventId = formText(formData, "eventId");
  const existingImageUrl = formText(formData, "existingImageUrl");
  const imageUrl = await saveUploadedImage(formData.get("image"), existingImageUrl);
  const input = {
    title: formText(formData, "title"),
    description: formText(formData, "description"),
    startsAt: datetimeLocalToIso(formText(formData, "startsAt")),
    endsAt: datetimeLocalToIso(formText(formData, "endsAt")),
    locationContext: formText(formData, "locationContext"),
    imageUrl,
    publicationStatus: formPublicationStatus(formData)
  };

  const event = eventId ? await updatePracticeEvent(store, eventId, input) : await createPracticeEvent(store, input);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  redirect(`/admin/events/${event.id}`);
}

async function saveUploadedImage(fileValue: FormDataEntryValue | null, fallbackUrl: string): Promise<string> {
  if (!(fileValue instanceof File) || fileValue.size === 0) {
    return fallbackUrl;
  }

  const safeExtension = extname(fileValue.name).toLowerCase() || ".jpg";
  const filename = `${randomUUID()}${safeExtension}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`practice-events/${filename}`, fileValue, { access: "public" });
    return blob.url;
  }

  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await fileValue.arrayBuffer());
  await writeFile(join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}
