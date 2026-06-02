import type { ReactNode } from "react";

function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L3 20h3.6l1.5-3h7.8l1.5 3H21L12 2zm-2.6 12L12 8.5 14.6 14H9.4z"
        fill="#d9b864"
      />
    </svg>
  );
}

export function AuthShell({
  children,
  subtitle,
}: {
  children: ReactNode;
  subtitle?: string;
}) {
  return (
    <main className="login">
      <div className="brand-side">
        <div className="logo-row">
          <Logo />
          <span className="tag">Aurion Clientes</span>
        </div>
        <div>
          <h1>O portal onde sua agência e seus clientes se encontram.</h1>
          <p>
            {subtitle ||
              "Planejamento, aprovação de posts, envio de materiais e resultados — tudo em um só lugar."}
          </p>
        </div>
        <div className="foot">Sua área de organização</div>
      </div>
      <div className="auth-side">{children}</div>
    </main>
  );
}
