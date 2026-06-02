import { createClient } from "@/lib/supabase/server";

function formatBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0 });
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, payment_status, monthly_value");

  const list = clients || [];
  const total = list.reduce((s, c) => s + Number(c.monthly_value || 0), 0);
  const paid = list
    .filter((c) => c.payment_status === "paid")
    .reduce((s, c) => s + Number(c.monthly_value || 0), 0);
  const taxa = total > 0 ? Math.round((paid / total) * 100) : 0;

  // Posts agregados (defensivo)
  let totalPosts = 0;
  let publishedPosts = 0;
  const r = await supabase.from("posts").select("id, status", { count: "exact" });
  if (!r.error && r.data) {
    totalPosts = r.data.length;
    publishedPosts = r.data.filter((p) => p.status === "published").length;
  }

  return (
    <div className="page-container">
      <header className="page-head">
        <div>
          <div className="kicker">Resultados</div>
          <h1>Relatórios</h1>
          <p className="page-sub">
            Visão geral de cobrança e produção. Métricas reais de redes sociais (Instagram, etc.) chegam em breve.
          </p>
        </div>
      </header>

      <div className="stats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="stat card">
          <div className="k">Clientes ativos</div>
          <div className="v">{list.length}</div>
        </div>
        <div className="stat card">
          <div className="k">Receita prevista (mês)</div>
          <div className="v">{formatBRL(total)}</div>
        </div>
        <div className="stat card">
          <div className="k">Taxa de pagamento</div>
          <div className="v">{taxa}%</div>
        </div>
        <div className="stat card">
          <div className="k">Posts publicados</div>
          <div className="v">
            {publishedPosts}
            <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 400 }}>
              {" "}
              / {totalPosts}
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <p style={{ color: "var(--muted-2)", fontSize: 13, lineHeight: 1.6 }}>
          📊 Em breve: gráfico de alcance, engajamento e crescimento por cliente
          puxando direto da API do Instagram/Meta. Aqui aparece o resumo enquanto
          essa integração não está conectada.
        </p>
      </div>
    </div>
  );
}
