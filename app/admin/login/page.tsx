import { LogIn } from "lucide-react";
import { loginAction } from "@/app/admin/actions";
import { Topbar } from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="page">
      <Topbar admin />
      <section className="shell hero">
        <p className="eyebrow">Admin</p>
        <h1>Experiment lead sign in</h1>
      </section>
      <section className="shell">
        {error ? (
          <div className="notice warning" role="alert">
            Invalid username or password.
          </div>
        ) : null}
        <form className="form" action={loginAction}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button type="submit">
            <LogIn size={18} aria-hidden="true" />
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
