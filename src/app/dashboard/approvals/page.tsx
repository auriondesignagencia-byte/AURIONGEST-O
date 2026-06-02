import { createClient } from "@/lib/supabase/server";

type Post = {
  id: string;
  caption: string;
  type: string;
  status: string;
  scheduled_for: string | null;
  client: { name: string; color: string | null } | { name: string; color: string | null }[] | null;
};

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const res = await supabase
    .from("posts")
    .select("id, caption, type, status, scheduled_for, client:clients(name, color)")
    .in("status", ["pending", "changes"])
    .order("scheduled_for", { ascending: true });

  const list: Post[] = res.error ? [] : (res.data as unknown as Post[]);

  return (
    <div className="page-container">
      <header className="page-head">
        <div>
          <div className="kicker">Fluxo de aprovação</div>
          <h1>Aprovações</h1>
          <p className="page-sub">Posts aguardando o cliente ou com ajustes solicitados.</p>
        </div>
      </header>

      {list.length === 0 ? (
        <div className="card empty-state">
          <h3 style={{ fontSize: 18, marginBottom: 6 }}>Tudo em dia ✓</h3>
          <p>Nenhum post pendente de aprovação no momento.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {list.map((p) => {
            const client = Array.isArray(p.client) ? p.client[0] : p.client;
            return (
              <div key={p.id} className="post-row">
                <div
                  className="post-thumb"
                  style={{ background: client?.color || "#3a5bbf" }}
                >
                  {p.type.charAt(0).toUpperCase()}
                </div>
                <div className="post-main">
                  <div className="cap">{p.caption}</div>
                  <div className="meta">
                    <span className="chip">{client?.name}</span>
                    <span className="chip">{p.type}</span>
                    {p.scheduled_for && <span>· {p.scheduled_for}</span>}
                  </div>
                </div>
                <span
                  className={`badge-status ${p.status === "changes" ? "st-overdue" : "st-pending"}`}
                >
                  <span className="dot" />
                  {p.status === "changes" ? "Ajustes solicitados" : "Aguardando aprovação"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
