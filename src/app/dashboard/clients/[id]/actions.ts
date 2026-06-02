"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addPost(formData: FormData) {
  const clientId = String(formData.get("client_id") || "");
  const caption = String(formData.get("caption") || "").trim();
  const type = String(formData.get("type") || "image");
  const scheduledFor = String(formData.get("scheduled_for") || "") || null;
  if (!clientId || !caption) return;

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

  await supabase.from("posts").insert({
    agency_id: profile.agency_id,
    client_id: clientId,
    caption,
    type,
    scheduled_for: scheduledFor,
    status: "pending",
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/approvals");
}

export async function updatePostStatus(formData: FormData) {
  const postId = String(formData.get("post_id") || "");
  const status = String(formData.get("status") || "");
  if (!postId || !status) return;
  const supabase = await createClient();
  await supabase.from("posts").update({ status }).eq("id", postId);
  revalidatePath("/dashboard");
}

export async function deletePost(formData: FormData) {
  const postId = String(formData.get("post_id") || "");
  if (!postId) return;
  const supabase = await createClient();
  await supabase.from("posts").delete().eq("id", postId);
  revalidatePath("/dashboard");
}
