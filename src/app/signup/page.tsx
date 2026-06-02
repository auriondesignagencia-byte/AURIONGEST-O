import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { supabaseConfigured } from "@/lib/supabase/env";
import { signUp } from "./actions";

export default async function SignupPage(props: {
  searchParams: Promise<{ error?: string; check?: string }>;
}) {
  if (!supabaseConfigured()) redirect("/setup");
  const sp = await props.searchParams;

  if (sp.check === "email") {
    return (
      <AuthShell>
        <h2>Confirme seu e-mail</h2>
        <p className="sub">
          Enviamos um link de confirmação para você. Abra a caixa de entrada e
          clique no link para ativar sua conta.
        </p>
        <p className="auth-alt">
          <Link href="/login">Voltar para entrar</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle="Crie sua conta de agência em 30 segundos.">
      <h2>Criar conta</h2>
      <p className="sub">Comece a organizar sua agência agora.</p>

      {sp.error && <div className="alert alert-error">{decodeURIComponent(sp.error)}</div>}

      <form action={signUp}>
        <div className="field">
          <label htmlFor="full_name">Seu nome</label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            placeholder="Como devemos te chamar"
          />
        </div>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn btn-gold" style={{ width: "100%" }}>
          Criar conta
        </button>
      </form>

      <p className="auth-alt">
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </AuthShell>
  );
}
