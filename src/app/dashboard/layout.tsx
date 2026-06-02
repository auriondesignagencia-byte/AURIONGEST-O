import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!supabaseConfigured()) redirect("/setup");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, agency_id, agency:agencies(name)")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) redirect("/onboarding");

  // Badges (defensive — tabela posts pode ainda não existir antes da migration 0002)
  let pendingApprovals = 0;
  const postsRes = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "changes"]);
  if (!postsRes.error) pendingApprovals = postsRes.count ?? 0;

  const overdueRes = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("payment_status", "overdue");
  const overdueCount = overdueRes.error ? 0 : overdueRes.count ?? 0;

  const agencyName =
    (Array.isArray(profile.agency)
      ? profile.agency[0]?.name
      : (profile.agency as { name?: string } | null)?.name) || "Sua Agência";
  const displayName = profile.full_name || profile.email || user.email || "";

  return (
    <div className="dash-shell">
      <SidebarNav
        agencyName={agencyName}
        displayName={displayName}
        pendingApprovals={pendingApprovals}
        overdueCount={overdueCount}
      />
      <main className="dash-content">{children}</main>
    </div>
  );
}
