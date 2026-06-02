"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createAgency(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) {
    redirect("/onboarding?error=" + encodeURIComponent("Informe o nome da agência"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: agency, error } = await supabase
    .from("agencies")
    .insert({ name, owner_id: user.id })
    .select()
    .single();

  if (error || !agency) {
    redirect(
      "/onboarding?error=" +
        encodeURIComponent(error?.message || "Erro ao criar agência"),
    );
  }

  const { error: profErr } = await supabase
    .from("profiles")
    .update({ agency_id: agency.id })
    .eq("id", user.id);

  if (profErr) {
    redirect("/onboarding?error=" + encodeURIComponent(profErr.message));
  }

  redirect("/dashboard");
}
