import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addClient } from "./actions";

function formatBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0 });
}

type ClientRow = {
  id: string;
  name: string;
  handle: string | null;
  color: string | null;
  monthly_value: string | number | null;
  due_day: number | null;
  payment_status: string;
  instagram_followers: number | null;
};

export default async function ClientsOverviewPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select(
      "id, name, handle, color, monthly_value, due_day, payment_status, instagram_followers",
    )
    .order("created_at", { ascending: false });

  const list: ClientRow[] = (clients as ClientRow[] | null) || [];
  const totalMonthly = list.reduce((s, c) => s + Number(c.monthly_value || 0), 0);
  const overdue = list.filter((c) => c.payment_status === "overdue").length;

  return (
    <div className="page-container">
      <header className="page-head">
        <div>
          <div className="kicker">Visão geral</div>
          <h1>Seus clientes</h1>
          <p className="page-sub">
            Cada cliente é o ponto de partida — calendário, aprovações, uploads e cobrança.
          </p>
        </div>
      </header>

      <div className="stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
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
          <div
            className="v"
            style={{ color: overdue ? "var(--changes)" : undefined }}
          >
            {overdue}
          </div>
        </div>
      </div>

      <section className="section">
        <h3 className="section-h">Adicionar cliente</h3>
        <form action={addClient} className="card add-form" style={{ padding: 20 }}>
          <div className="field">
            <label>Nome</label>
            <input name="name" required placeholder="Ex.: Café Aurora" />
          </div>
          <div className="field">
            <label>@ Instagram</label>
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
            Adicionar
          </button>
        </form>
      </section>

      <section className="section">
        <h3 className="section-h">Lista ({list.length})</h3>
        {list.length === 0 ? (
          <div className="card empty-state">
            Ainda não há clientes. Use o formulário acima para começar.
          </div>
        ) : (
          <div className="client-grid">
            {list.map((c) => {
              const initials = c.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/clients/${c.id}`}
                  className="client-card card"
                >
                  <div className="top">
                    <div
                      className="avatar"
                      style={{ background: c.color || "#3a5bbf", width: 44, height: 44, fontSize: 14 }}
                    >
                      {initials}
                    </div>
                    <div className="info">
                      <b>{c.name}</b>
                      <div className="muted">{c.handle || "—"}</div>
                    </div>
                  </div>
                  <div className="mini">
                    <div>
                      <span>Vencimento</span>
                      <b>{c.due_day ? `dia ${c.due_day}` : "—"}</b>
                    </div>
                    <div>
                      <span>Valor</span>
                      <b>
                        {c.monthly_value
                          ? formatBRL(Number(c.monthly_value))
                          : "—"}
                      </b>
                    </div>
                    <div>
                      <span>Status</span>
                      <b className={`st-${c.payment_status}`}>
                        {{
                          paid: "Pago",
                          pending: "A vencer",
                          overdue: "Vencido",
                        }[c.payment_status] || c.payment_status}
                      </b>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
