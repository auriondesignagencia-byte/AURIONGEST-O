import Link from "next/link";

export default async function DashboardPage(props: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await props.searchParams;
  const isAgency = role !== "client";

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "32px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "44ch" }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--gold)",
            fontWeight: 600,
          }}
        >
          {isAgency ? "Visão da Agência" : "Visão do Cliente"}
        </div>
        <h1 style={{ fontSize: 34, margin: "12px 0" }}>Painel em construção</h1>
        <p style={{ color: "var(--muted)", fontSize: 15 }}>
          Esta é a base do app já no ar localmente. Os próximos passos ligam o
          login de verdade e trazem o calendário, as aprovações, os uploads e a
          área de pagamentos.
        </p>
        <Link
          href="/"
          className="btn btn-gold"
          style={{ marginTop: 24, textDecoration: "none" }}
        >
          ← Voltar para a entrada
        </Link>
      </div>
    </main>
  );
}
