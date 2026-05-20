import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { requireAdmin } from "@/lib/admin-session";
import { formatShanghaiDateTime } from "@/lib/domain";
import { getLocalDataStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminResponseDetailPage({ params }: { params: Promise<{ responseId: string }> }) {
  await requireAdmin();
  const { responseId } = await params;
  const store = getLocalDataStore();
  const responses = await store.listResponses();
  const response = responses.find((candidate) => candidate.id === responseId);
  if (!response) {
    notFound();
  }
  const event = await store.getEvent(response.practiceEventId);

  return (
    <main className="page">
      <Topbar admin />
      <section className="shell hero">
        <p className="eyebrow">{response.logType} response</p>
        <h1>{event?.title ?? "Unknown event"}</h1>
      </section>
      <section className="shell table-wrap">
        <table>
          <tbody>
            <Detail label="Response ID" value={response.id} />
            <Detail label="Submitted" value={formatShanghaiDateTime(response.submittedAt)} />
            <Detail label="Hashed session key" value={response.anonymousSessionHash} />
            <Detail label="Hawkins" value={response.hawkinsLabel} />
            <Detail label="Glucose" value={response.glucoseValue ? `${response.glucoseValue} mg/dL` : ""} />
            <Detail label="Food/drink" value={response.hadFoodDrinkBefore === undefined ? "" : String(response.hadFoodDrinkBefore)} />
            <Detail label="Food/drink detail" value={response.foodDrinkDetail} />
            <Detail label="Heart rate" value={response.heartRateBpm ? `${response.heartRateBpm} bpm` : ""} />
            <Detail label="Stress score" value={response.stressScore} />
            <Detail label="Note" value={response.note} />
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <th>{label}</th>
      <td>{value || "n/a"}</td>
    </tr>
  );
}
