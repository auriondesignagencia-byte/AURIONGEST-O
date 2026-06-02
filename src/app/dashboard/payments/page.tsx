import { createClient } from "@/lib/supabase/server";
import { ContractUploader } from "@/components/dashboard/contract-uploader";
import { markPaid, markPending, setDueDay } from "./actions";

function formatBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0 });
}

function nextDueLabel(day: number, status: string) {
  const month =
    status === "paid" ? new Date().getMonth() + 2 : new Date().getMonth() + 1;
  const m = ((month - 1) % 12) + 1;
  return `${String(day).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

type Row = {
  id: string;
  name: string;
  handle: string | null;
  color: string | null;
  monthly_value: string | number | null;
  due_day: number | null;
  payment_status: string;
  contract_file_name: string | null;
  contract_url: string | null;
  contract_due_detected: boolean;
};

export default async function PaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user!.id)
    .single();
  const agencyId = profile!.agency_id as string;

  const { data: clients } = await supabase
    .from("clients")
    .select(
      "id, name, handle, color, monthly_value, due_day, payment_status, contract_file_name, contract_url, contract_due_detected",
    )
    .order("name");

  const list: Row[] = (clients as Row[] | null) || [];
  const totalMonthly = list.reduce((s, c) => s + Number(c.monthly_value || 0), 0);
  const received = list
    .filter((c) => c.payment_status === "paid")
    .reduce((s, c) => s + Number(c.monthly_value || 0), 0);
  const pending = list
    .filter((c) => c.payment_status === "pending")
    .reduce((s, c) => s + Number(c.monthly_value || 0), 0);
  const overdue = list
    .filter((c) => c.payment_status === "overdue")
    .reduce((s, c) => s + Number(c.monthly_value || 0), 0);

  return (
    <div className="page-container">
      <header className="page-head">
        <div>
          <div className="kicker">Financeiro</div>
          <h1>Pagamentos</h1>
          <p className="page-sub">
            Cobranças do mês e contratos. Suba um contrato (PDF ou TXT) e o
            sistema tenta identificar o dia de vencimento automaticamente.
          </p>
        </div>
      </header>

      <div className="stats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="stat card">
          <div className="k">A receber no mês</div>
          <div className="v">{formatBRL(totalMonthly)}</div>
        </div>
        <div className="stat card">
          <div className="k">Recebido</div>
          <div className="v" style={{ color: "var(--approved)" }}>
            {formatBRL(received)}
          </div>
        </div>
        <div className="stat card">
          <div className="k">A vencer</div>
          <div className="v" style={{ color: "var(--pending)" }}>
            {formatBRL(pending)}
          </div>
        </div>
        <div className="stat card">
          <div className="k">Vencido</div>
          <div
            className="v"
            style={{ color: overdue ? "var(--changes)" : undefined }}
          >
            {formatBRL(overdue)}
          </div>
        </div>
      </div>

      <section className="section">
        <h3 className="section-h">Cobranças</h3>
        {list.length === 0 ? (
          <div className="card empty-state">Cadastre clientes para gerenciar cobranças.</div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {list.map((c) => {
              const sm =
                {
                  paid: ["Pago", "st-paid"],
                  pending: ["A vencer", "st-pending"],
                  overdue: ["Vencido", "st-overdue"],
                }[c.payment_status] || ["A vencer", "st-pending"];
              const initials = c.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <div key={c.id} className="bill-row">
                  <div className="bill-client">
                    <div
                      className="avatar"
                      style={{
                        background: c.color || "#3a5bbf",
                        width: 34,
                        height: 34,
                        fontSize: 12,
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <b>{c.name}</b>
                      <div className="h">{c.handle || "—"}</div>
                    </div>
                  </div>
                  <div className="bill-due">
                    {c.due_day ? `dia ${c.due_day}` : <span className="empty-due">defina pelo contrato</span>}
                  </div>
                  <div className="bill-val">
                    {c.monthly_value ? formatBRL(Number(c.monthly_value)) : "—"}
                  </div>
                  <div style={{ color: "var(--muted)" }}>
                    {c.due_day ? nextDueLabel(c.due_day, c.payment_status) : "—"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <ContractUploader
                      clientId={c.id}
                      agencyId={agencyId}
                      hasContract={Boolean(c.contract_file_name)}
                      contractName={c.contract_file_name}
                    />
                    {c.contract_due_detected && c.contract_file_name && (
                      <span className="auto-tag">auto</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className={`badge-status ${sm[1]}`}>
                      <span className="dot" />
                      {sm[0]}
                    </span>
                    {c.payment_status === "paid" ? (
                      <form action={markPending}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="btn-link" type="submit">Reabrir</button>
                      </form>
                    ) : (
                      <form action={markPaid}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="btn btn-sm btn-approve" type="submit">
                          Marcar pago
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Manual due day input — fallback for clients without contract */}
      <section className="section">
        <h3 className="section-h">Definir vencimento manualmente</h3>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 10 }}>
          Útil quando o cliente ainda não tem contrato ou o sistema não conseguiu detectar a data.
        </p>
        <div className="card" style={{ padding: 0 }}>
          {list.map((c) => (
            <form
              key={c.id}
              action={setDueDay}
              className="bill-row"
              style={{ gridTemplateColumns: "1.5fr 1fr 1fr", gap: 16 }}
            >
              <div className="bill-client">
                <b>{c.name}</b>
              </div>
              <input type="hidden" name="id" value={c.id} />
              <input
                name="due_day"
                type="number"
                min="1"
                max="31"
                defaultValue={c.due_day || ""}
                placeholder="dia"
                style={{ height: 36, padding: "0 10px" }}
              />
              <button type="submit" className="btn btn-ghost btn-sm">
                Salvar
              </button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
