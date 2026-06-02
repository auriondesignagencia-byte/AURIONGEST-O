"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveContract } from "@/app/dashboard/payments/actions";

type PdfJs = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (opts: { data: ArrayBuffer }) => {
    promise: Promise<{
      numPages: number;
      getPage: (n: number) => Promise<{
        getTextContent: () => Promise<{ items: { str: string }[] }>;
      }>;
    }>;
  };
};

declare global {
  interface Window {
    pdfjsLib?: PdfJs;
  }
}

async function loadPdfJs(): Promise<PdfJs | null> {
  if (typeof window === "undefined") return null;
  if (window.pdfjsLib) return window.pdfjsLib;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar leitor de PDF"));
    document.head.appendChild(s);
  });
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  return window.pdfjsLib || null;
}

async function extractPdfText(file: File): Promise<string> {
  const lib = await loadPdfJs();
  if (!lib) return "";
  const buf = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((x) => x.str).join(" ") + "\n";
  }
  return text;
}

function findDueDay(text: string): number | null {
  if (!text) return null;
  const t = (" " + text.toLowerCase() + " ")
    .replace(/\s+/g, " ")
    .replace(/dia\s*º?/g, "dia ");
  const patterns = [
    /(?:vencimento|vencer[áa]?|vence|pagamento|cobran[çc]a|quita[çc][aã]o|pag[ao]s?)[^.;\n]{0,80}?\bdia\s+(\d{1,2})\b/,
    /\btodo\s+dia\s+(\d{1,2})\b/,
    /\bdia\s+(\d{1,2})\s+de\s+cada\s+m[eê]s/,
    /\bdia\s+(\d{1,2})\b[^.;\n]{0,50}?(?:de\s+cada\s+m[eê]s|vencimento|vence|pagamento)/,
    /\b(?:at[ée]\s+o\s+)?dia\s+(\d{1,2})\b/,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const d = parseInt(m[1], 10);
      if (d >= 1 && d <= 31) return d;
    }
  }
  return null;
}

export function ContractUploader({
  clientId,
  agencyId,
  hasContract,
  contractName,
}: {
  clientId: string;
  agencyId: string;
  hasContract: boolean;
  contractName: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(file: File) {
    setBusy(true);
    setFeedback("Enviando…");
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^\w.\- ]/g, "_");
      const path = `${agencyId}/${clientId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("contracts")
        .upload(path, file, { upsert: false });
      if (upErr) {
        setFeedback("Erro: " + upErr.message);
        return;
      }
      setFeedback("Lendo conteúdo…");
      let text = "";
      try {
        if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
          text = await extractPdfText(file);
        } else if (file.type.startsWith("text") || /\.(txt|md)$/i.test(file.name)) {
          text = await file.text();
        }
      } catch (e) {
        console.warn("Falha ao ler texto:", e);
      }
      const detected = findDueDay(text);
      const fd = new FormData();
      fd.set("id", clientId);
      fd.set("file_name", file.name);
      fd.set("file_path", path);
      if (detected) fd.set("detected_day", String(detected));
      await saveContract(fd);
      router.refresh();
    } finally {
      setBusy(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  }

  return (
    <div className="contract-uploader">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {hasContract && contractName ? (
        <button
          type="button"
          className="contract-link"
          onClick={() => inputRef.current?.click()}
          title="Substituir contrato"
          disabled={busy}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M9 13h6M9 17h4" />
          </svg>
          <span className="nm">{contractName}</span>
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "..." : "Enviar contrato"}
        </button>
      )}
      {feedback && <div className="contract-feedback">{feedback}</div>}
    </div>
  );
}
