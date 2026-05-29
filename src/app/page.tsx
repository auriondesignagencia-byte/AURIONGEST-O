"use client";

import { useRouter } from "next/navigation";

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

export default function LoginPage() {
  const router = useRouter();

  function enter(role: "agency" | "client") {
    router.push(`/dashboard?role=${role}`);
  }

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
            Planejamento, aprovação de posts, envio de materiais e resultados —
            tudo em um só lugar, com a cara da sua agência.
          </p>
        </div>
        <div className="foot">Versão inicial · em construção</div>
      </div>

      <div className="auth-side">
        <h2>Entrar</h2>
        <p className="sub">Escolha como deseja acessar.</p>

        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            defaultValue="voce@suaagencia.com.br"
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            defaultValue="demo1234"
            autoComplete="current-password"
          />
        </div>

        <div className="divider">acesso de demonstração</div>

        <div className="role-pick">
          <button className="role-btn" onClick={() => enter("agency")}>
            <span className="ic a">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
              </svg>
            </span>
            <span>
              <b>Entrar como Agência</b>
              <span className="desc">
                Visão de administrador — todos os clientes
              </span>
            </span>
          </button>

          <button className="role-btn" onClick={() => enter("client")}>
            <span className="ic c">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </span>
            <span>
              <b>Entrar como Cliente</b>
              <span className="desc">
                Visão do cliente — vê apenas a própria conta
              </span>
            </span>
          </button>
        </div>
      </div>

      <div className="demo-pill">Demo</div>
    </main>
  );
}
