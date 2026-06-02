import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteClient } from "../../actions";

function formatBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0 });
}

export default async function ClientDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  // posts (defensivo)
  let posts: { id: string; caption: string; status: string; scheduled_for: string | null; type: string }[] = [];
  const r = await supabase
    .from("posts")
    .select("id, caption, status, scheduled_for, type")
    .eq("client_id", id)
    .order("scheduled_for", { ascending: true });
  if (!r.error && r.data) posts = r.data;

  const initials = client.name
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="page-container">
      <Link href="/dashboard" className="back-link">
        ← Voltar para clientes
      </Link>
      <header className="page-head" style={{ alignItems: "center", display: "flex", gap: 16 }}>
        <div
          className="avatar"
          style={{ background: client.color || "#3a5bbf", width: 56, height: 56, fontSize: 18 }}
        >
          {initials}
        </div>
        <div>
          <div className="kicker">Cliente</div>
          <h1>{client.name}</h1>
          <p className="page-sub">{client.handle || ""}</p>
        </div>
      </header>

      <div className="stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat card">
          <div className="k">Valor mensal</div>
          <div className="v">
            {client.monthly_value ? formatBRL(Number(client.monthly_value)) : "—"}
          </div>
        </div>
        <div className="stat card">
          <div className="k">Vencimento</div>
          <div className="v">{client.due_day ? `dia ${client.due_day}` : "—"}</div>
        </div>
        <div className="stat card">
          <div className="k">Status do pagamento</div>
          <div className={`v st-${client.payment_status}`}>
            {{
              paid: "Pago",
              pending: "A vencer",
              overdue: "Vencido",
            }[client.payment_status as string] || client.payment_status}
          </div>
        </div>
      </div>

      <section className="section">
        <h3 className="section-h">Publicações ({posts.length})</h3>
        {posts.length === 0 ? (
          <div className="card empty-state">
            Nenhuma publicação cadastrada ainda para este cliente.
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {posts.map((p) => (
              <div key={p.id} className="post-row">
                <div className="post-thumb" style={{ background: client.color || "#3a5bbf" }}>
                  {p.type.charAt(0).toUpperCase()}
                </div>
                <div className="post-main">
                  <div className="cap">{p.caption}</div>
                  <div className="meta">
                    <span className="chip">{p.type}</span>
                    {p.scheduled_for && <span>· {p.scheduled_for}</span>}
                  </div>
                </div>
                <span className={`badge-status st-${p.status}`}>
                  <span className="dot" />
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h3 className="section-h" style={{ color: "var(--changes)" }}>Zona perigosa</h3>
        <form action={deleteClient} className="card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <input type="hidden" name="id" value={client.id} />
          <span style={{ fontSize: 14, color: "var(--muted)" }}>
            Remover este cliente e todos os seus dados.
          </span>
          <button type="submit" className="btn btn-sm" style={{ background: "var(--changes-bg)", color: "var(--changes)" }}>
            Remover cliente
          </button>
        </form>
      </section>
    </div>
  );
}
