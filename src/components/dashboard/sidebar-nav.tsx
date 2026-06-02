"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/dashboard/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Clientes", icon: "clients" as const, badgeKey: null },
  { href: "/dashboard/calendar", label: "Calendário", icon: "cal" as const, badgeKey: null },
  { href: "/dashboard/approvals", label: "Aprovações", icon: "check" as const, badgeKey: "pendingApprovals" as const },
  { href: "/dashboard/payments", label: "Pagamentos", icon: "billing" as const, badgeKey: "overdueCount" as const },
  { href: "/dashboard/reports", label: "Relatórios", icon: "chart" as const, badgeKey: null },
];

function Icon({ name }: { name: string }) {
  switch (name) {
    case "clients":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "cal":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "check":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "billing":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="5" width="22" height="14" rx="2" />
          <path d="M1 10h22M6 15h4" />
        </svg>
      );
    case "chart":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" />
        </svg>
      );
    default:
      return null;
  }
}

function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 20h3.6l1.5-3h7.8l1.5 3H21L12 2zm-2.6 12L12 8.5 14.6 14H9.4z" fill="#d9b864" />
    </svg>
  );
}

export function SidebarNav({
  agencyName,
  displayName,
  pendingApprovals,
  overdueCount,
}: {
  agencyName: string;
  displayName: string;
  pendingApprovals: number;
  overdueCount: number;
}) {
  const pathname = usePathname() || "";
  const badges: Record<string, number> = {
    pendingApprovals,
    overdueCount,
  };

  return (
    <aside className="dash-sidebar">
      <div className="logo-row">
        <Logo />
        <span className="brand-name">Aurion</span>
      </div>
      <div className="nav-label">{agencyName}</div>
      <nav>
        {NAV_ITEMS.map((it) => {
          const active =
            it.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(it.href);
          const badge = it.badgeKey ? badges[it.badgeKey] || 0 : 0;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`nav-item ${active ? "active" : ""}`}
            >
              <Icon name={it.icon} />
              <span>{it.label}</span>
              {badge > 0 && <span className="nav-badge">{badge}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-user">
        <div className="avatar" style={{ background: "#c19a3f", width: 34, height: 34 }}>
          {(displayName.charAt(0) || "U").toUpperCase()}
        </div>
        <div className="info">
          <b>{displayName}</b>
          <span>Administrador</span>
        </div>
        <form action={signOut} className="logout-form">
          <button type="submit" title="Sair" className="logout-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </form>
      </div>
    </aside>
  );
}
