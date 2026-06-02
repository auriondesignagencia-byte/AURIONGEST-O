export default function SetupPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 32,
      }}
    >
      <div style={{ maxWidth: "56ch", textAlign: "center" }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--gold)",
            fontWeight: 600,
          }}
        >
          Configuração pendente
        </div>
        <h1 style={{ fontSize: 32, margin: "12px 0" }}>
          Falta conectar ao Supabase
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6 }}>
          Defina as variáveis de ambiente <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> nas configurações do projeto
          (na Vercel: <b>Settings → Environment Variables</b>) e este app
          passará a funcionar normalmente.
        </p>
      </div>
    </main>
  );
}
