import { createClient } from "@/lib/supabase/server";

type Post = {
  id: string;
  caption: string;
  type: string;
  status: string;
  scheduled_for: string | null;
  client_id: string;
  client?: { name: string; color: string | null } | { name: string; color: string | null }[] | null;
};

const STATUS_COLOR: Record<string, string> = {
  draft: "#928d9e",
  pending: "#b8860b",
  approved: "#2f8a5b",
  changes: "#c0563b",
  scheduled: "#7a52b3",
  published: "#3a5bbf",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  pending: "Aguardando",
  approved: "Aprovado",
  changes: "Ajustes",
  scheduled: "Agendado",
  published: "Publicado",
};

export default async function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const firstWeekday = monthStart.getDay(); // 0 = Sun

  const supabase = await createClient();
  let posts: Post[] = [];
  const res = await supabase
    .from("posts")
    .select("id, caption, type, status, scheduled_for, client_id, client:clients(name, color)")
    .gte("scheduled_for", monthStart.toISOString().slice(0, 10))
    .lte("scheduled_for", monthEnd.toISOString().slice(0, 10));
  if (!res.error && res.data) posts = res.data as unknown as Post[];

  const byDay: Record<number, Post[]> = {};
  posts.forEach((p) => {
    if (!p.scheduled_for) return;
    const d = parseInt(p.scheduled_for.slice(8, 10), 10);
    (byDay[d] = byDay[d] || []).push(p);
  });

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const today = now.getDate();
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push(<div key={`out-${i}`} className="cal-cell out" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today;
    const evs = byDay[d] || [];
    cells.push(
      <div key={d} className={`cal-cell ${isToday ? "today" : ""}`}>
        <div className="num">{d}</div>
        {evs.map((p) => {
          const client = Array.isArray(p.client) ? p.client[0] : p.client;
          const color = client?.color || STATUS_COLOR[p.status] || "#888";
          return (
            <div
              key={p.id}
              className="cal-ev"
              style={{ background: color + "1a", color }}
              title={`${client?.name || ""} · ${STATUS_LABEL[p.status]}`}
            >
              <span className="dot" style={{ background: color }} />
              {p.caption}
            </div>
          );
        })}
      </div>,
    );
  }

  return (
    <div className="page-container">
      <header className="page-head">
        <div>
          <div className="kicker">Planejamento</div>
          <h1>Calendário</h1>
          <p className="page-sub">
            {monthNames[month]} {year} — tudo que está planejado, agendado ou publicado.
          </p>
        </div>
      </header>

      {posts.length === 0 ? (
        <div className="card empty-state">
          Nenhuma publicação planejada neste mês. Posts cadastrados aparecerão aqui.
        </div>
      ) : null}

      <div className="cal">
        <div className="cal-head">
          {weekdays.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="cal-grid">{cells}</div>
      </div>
    </div>
  );
}
