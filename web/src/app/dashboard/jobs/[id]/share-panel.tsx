"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { buttonClass } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function SharePanel({
  slug,
  jobTitle,
  dict,
}: {
  slug: string;
  jobTitle: string;
  dict: Dictionary;
}) {
  const [url, setUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const t = dict.sharePanel;

  useEffect(() => {
    const fullUrl = `${window.location.origin}/jobs/${slug}`;
    setUrl(fullUrl);
    QRCode.toDataURL(fullUrl, { width: 200, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [slug]);

  async function handleCopy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch {
      // API de clipboard pode estar bloqueada — tenta o método clássico via
      // selecção do texto, que funciona sem permissões especiais.
      const input = inputRef.current;
      let fellBack = false;
      if (input) {
        input.focus();
        input.select();
        try {
          fellBack = document.execCommand("copy");
        } catch {
          fellBack = false;
        }
      }
      setCopyState(fellBack ? "copied" : "error");
    }
    setTimeout(() => setCopyState("idle"), 2500);
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `${t.whatsappMessagePrefix} ${jobTitle} — ${url}`
  )}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    url
  )}`;

  return (
    <details className="mt-4">
      <summary className="cursor-pointer list-none text-sm font-medium text-primary underline">
        {t.shareJob}
      </summary>
      <div className="mt-3 flex flex-col gap-4 rounded-xl border border-surface-border bg-surface-muted p-4 sm:flex-row sm:items-start">
        {qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={t.qrAlt}
            className="h-32 w-32 shrink-0 rounded-lg bg-white p-2"
          />
        )}
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
              className="flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-foreground"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={buttonClass("secondary", "sm", "shrink-0")}
            >
              {copyState === "copied"
                ? t.copied
                : copyState === "error"
                  ? t.selectAndCopy
                  : t.copyLink}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary", "sm")}
            >
              WhatsApp
            </a>
            <a
              href={linkedinHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary", "sm")}
            >
              LinkedIn
            </a>
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`qr-vaga-${slug}.png`}
                className={buttonClass("ghost", "sm")}
              >
                {t.downloadQr}
              </a>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}
