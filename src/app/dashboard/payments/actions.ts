"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markPaid(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("clients")
    .update({ payment_status: "paid" })
    .eq("id", id);
  revalidatePath("/dashboard/payments");
}

export async function markPending(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("clients")
    .update({ payment_status: "pending" })
    .eq("id", id);
  revalidatePath("/dashboard/payments");
}

export async function setDueDay(formData: FormData) {
  const id = String(formData.get("id") || "");
  const dueDay = Number(formData.get("due_day") || 0);
  if (!id || !dueDay || dueDay < 1 || dueDay > 31) return;
  const supabase = await createClient();
  await supabase
    .from("clients")
    .update({ due_day: dueDay, contract_due_detected: true })
    .eq("id", id);
  revalidatePath("/dashboard/payments");
}

// Save info about the uploaded contract + (optionally) the auto-detected due day
// The actual file upload to Storage happens client-side; this just records metadata.
export async function saveContract(formData: FormData) {
  const id = String(formData.get("id") || "");
  const fileName = String(formData.get("file_name") || "");
  const filePath = String(formData.get("file_path") || "");
  const detectedDay = Number(formData.get("detected_day") || 0);
  if (!id || !fileName) return;
  const supabase = await createClient();
  const update: Record<string, unknown> = {
    contract_file_name: fileName,
    contract_url: filePath,
  };
  if (detectedDay >= 1 && detectedDay <= 31) {
    update.due_day = detectedDay;
    update.contract_due_detected = true;
  }
  await supabase.from("clients").update(update).eq("id", id);
  revalidatePath("/dashboard/payments");
  return { ok: true, detectedDay: detectedDay || null };
}
