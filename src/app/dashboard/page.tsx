import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { addClient, deleteClient, signOut } from "./actions";

function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L3 20h3.6l1.5-3h7.8l1.5 3H21L12 2zm-2.6 12L12 8.5 14.6 14H9.4z"
        fill="#d9b864"
      />
    </svg>
  );
}

function formatBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0 });
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    paid: "Pago",
    pending: "A vencer",
    overdue: "Vencido",
  };
  return map[s] || s;
}

type ClientRow = {
  id: string;
  name: string;
  handle: string | null;
  color: string | null;
  monthly_value: string | number | null;
  due_day: number | null;
  payment_status: string;
};

export default async function DashboardPage() {
  if (!supabaseConfigured()) redirect("/setup");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, agency_id, agency:agencies(name)")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) redirect("/onboarding");

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, handle, color, monthly_value, due_day, payment_status")
    .order("created_at", { ascending: false });

  const list: ClientRow[] = (clients as ClientRow[] | null) || [];
  const agencyName =
    (Array.isArray(profile.agency)
      ? profile.agency[0]?.name
      : (profile.agency as { name?: string } | null)?.name) || "Sua Agência";

  const totalMonthly = list.reduce(
    (sum, c) => sum + Number(c.monthly_value || 0),
    0,
  );
  const overdueCount = list.filter((c) => c.payment_status === "overdue").length;

  return (
    <div className="dash">
      <header className="dash-top">
        <div className="dash-brand">
          <Logo />
          <span className="dash-brand-name">Aurion</span>
        </div>
        <div className="dash-user">
          <span>{profile.full_name || user.email}</span>
          <form action={signOut}>
            <button className="btn-link" type="submit">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-hello">
          <div className="kicker">{agencyName}</div>
          <h1>Seus clientes</h1>
          <p className="sub">
            Cadastre cada cliente com o valor mensal e o dia de vencimento.
          </p>
        </div>

        <div className="stats">
          <div className="stat card">
            <div className="k">Clientes ativos</div>
            <div className="v">{list.length}</div>
          </div>
          <div className="stat card">
            <div className="k">A receber no mês</div>
            <div className="v">{formatBRL(totalMonthly)}</div>
          </div>
          <div className="stat card">
            <div className="k">Vencidos</div>
            <div className="v" style={{ color: overdueCount ? "var(--changes)" : undefined }}>
              {overdueCount}
            </div>
          </div>
        </div>

        <section className="card" style={{ padding: 20, marginTop: 24 }}>
          <h3 style={{ marginBottom: 14, fontSize: 18 }}>Novo cliente</h3>
          <form action={addClient} className="add-form">
            <div className="field">
              <label>Nome</label>
              <input name="name" required placeholder="Ex.: Café Aurora" />
            </div>
            <div className="field">
              <label>@ do Instagram</label>
              <input name="handle" placeholder="@cafeaurora" />
            </div>
            <div className="field">
              <label>Valor mensal (R$)</label>
              <input name="monthly_value" type="number" min="0" step="0.01" placeholder="1800" />
            </div>
            <div className="field">
              <label>Dia do vencimento</label>
              <input name="due_day" type="number" min="1" max="31" placeholder="10" />
            </div>
            <button type="submit" className="btn btn-gold">
              Adicionar cliente
            </button>
          </form>
        </section>

        <section style={{ marginTop: 28 }}>
          <h3 style={{ marginBottom: 12, fontSize: 18 }}>Lista ({list.length})</h3>
          {list.length === 0 ? (
            <div
              className="card"
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              Ainda não há clientes. Use o formulário acima para começar.
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              {list.map((c) => {
                const initials = c.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <div key={c.id} className="client-row">
                    <div className="client-info">
                      <div
                        className="avatar"
                        style={{ background: c.color || "#3a5bbf" }}
                      >
                        {initials}
                      </div>
                      <div>
                        <b>{c.name}</b>
                        <div className="muted">{c.handle || "—"}</div>
                      </div>
                    </div>
                    <div className="client-meta">
                      <div className="kv">
                        <span>Vencimento</span>
                        <b>{c.due_day ? `dia ${c.due_day}` : "—"}</b>
                      </div>
                      <div className="kv">
                        <span>Valor</span>
                        <b>
                          {c.monthly_value
                            ? formatBRL(Number(c.monthly_value))
                            : "—"}
                        </b>
                      </div>
                      <div className="kv">
                        <span>Status</span>
                        <b className={`st-${c.payment_status}`}>
                          {statusLabel(c.payment_status)}
                        </b>
                      </div>
                    </div>
                    <form action={deleteClient}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="btn-link danger" type="submit">
                        Remover
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
