"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addClient(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const handle = String(formData.get("handle") || "").trim() || null;
  const monthlyValueRaw = formData.get("monthly_value");
  const dueDayRaw = formData.get("due_day");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();
  if (!profile?.agency_id) redirect("/onboarding");

  await supabase.from("clients").insert({
    name,
    handle,
    monthly_value: monthlyValueRaw ? Number(monthlyValueRaw) : null,
    due_day: dueDayRaw ? Number(dueDayRaw) : null,
    agency_id: profile.agency_id,
  });

  revalidatePath("/dashboard");
}

export async function deleteClient(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", id);
  revalidatePath("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
