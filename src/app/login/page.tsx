import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { supabaseConfigured } from "@/lib/supabase/env";
import { signIn } from "./actions";

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!supabaseConfigured()) redirect("/setup");
  const { error } = await props.searchParams;

  return (
    <AuthShell>
      <h2>Entrar</h2>
      <p className="sub">Acesse sua conta Aurion.</p>

      {error && <div className="alert alert-error">{decodeURIComponent(error)}</div>}

      <form action={signIn}>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="voce@suaagencia.com.br"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
          Entrar
        </button>
      </form>

      <p className="auth-alt">
        Ainda não tem conta? <Link href="/signup">Criar conta</Link>
      </p>
    </AuthShell>
  );
}
