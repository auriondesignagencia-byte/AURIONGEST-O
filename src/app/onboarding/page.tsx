import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { createAgency } from "./actions";

export default async function OnboardingPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!supabaseConfigured()) redirect("/setup");
  const { error } = await props.searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (profile?.agency_id) redirect("/dashboard");

  return (
    <AuthShell subtitle="Quase pronto. Dê um nome à sua agência.">
      <h2>Sua agência</h2>
      <p className="sub">Esse será o nome exibido para você e para os clientes.</p>

      {error && <div className="alert alert-error">{decodeURIComponent(error)}</div>}

      <form action={createAgency}>
        <div className="field">
          <label htmlFor="name">Nome da agência</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ex.: Aurion Design"
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-gold" style={{ width: "100%" }}>
          Continuar
        </button>
      </form>
    </AuthShell>
  );
}
