import { AdminEventForm } from "@/components/AdminEventForm";
import { Topbar } from "@/components/Topbar";
import { requireAdmin } from "@/lib/admin-session";

export default async function NewAdminEventPage() {
  await requireAdmin();
  return (
    <main className="page">
      <Topbar admin />
      <section className="shell hero">
        <p className="eyebrow">New event</p>
        <h1>Create scheduled practice event</h1>
      </section>
      <section className="shell">
        <AdminEventForm />
      </section>
    </main>
  );
}
