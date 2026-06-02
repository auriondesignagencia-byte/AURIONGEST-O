"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const full_name = String(formData.get("full_name") || "").trim();

  if (!email || !password) {
    redirect("/signup?error=" + encodeURIComponent("Informe e-mail e senha"));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, role: "agency_owner" } },
  });

  if (error) {
    redirect("/signup?error=" + encodeURIComponent(error.message));
  }

  if (!data.session) {
    // Confirmação de e-mail provavelmente está ativa no Supabase
    redirect("/signup?check=email");
  }

  redirect("/onboarding");
}
