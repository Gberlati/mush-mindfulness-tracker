import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { exportResponsesToCsv } from "@/lib/domain";
import { getLocalDataStore } from "@/lib/store";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const store = getLocalDataStore();
  const csv = exportResponsesToCsv({
    events: await store.listEvents(),
    responses: await store.listResponses()
  });

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=\"mush-responses.csv\""
    }
  });
}
