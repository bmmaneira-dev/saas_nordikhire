"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { scoreApplication } from "@/lib/cv-scoring";

const CV_BUCKET = "cvs";

async function ensureCvBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data: bucket } = await admin.storage.getBucket(CV_BUCKET);
  if (!bucket) {
    await admin.storage.createBucket(CV_BUCKET, { public: false });
  }
}

export async function applyToJob(
  jobId: string,
  companyId: string,
  _prevState: unknown,
  formData: FormData
) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const consent = formData.get("consent") === "on";
  const cvFile = formData.get("cv") as File | null;

  if (!fullName || !email) {
    return { error: "Nome e email são obrigatórios." };
  }
  if (!consent) {
    return {
      error:
        "É necessário aceitar o tratamento de dados pessoais para te candidatares.",
    };
  }

  const admin = createAdminClient();

  const { data: existingCandidate } = await admin
    .from("candidates")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let candidateId = existingCandidate?.id as string | undefined;

  if (!candidateId) {
    const { data: newCandidate, error: candidateError } = await admin
      .from("candidates")
      .insert({
        full_name: fullName,
        email,
        phone,
        consent_data_processing: true,
        consent_date: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (candidateError || !newCandidate) {
      return { error: "Erro ao guardar candidato: " + candidateError?.message };
    }
    candidateId = newCandidate.id;
  }

  let cvFileUrl: string | null = null;
  let cvBytes: Uint8Array | null = null;
  if (cvFile && cvFile.size > 0) {
    cvBytes = new Uint8Array(await cvFile.arrayBuffer());
    try {
      await ensureCvBucket(admin);
      const path = `${companyId}/${jobId}/${candidateId}-${cvFile.name}`;
      const { error: uploadError } = await admin.storage
        .from(CV_BUCKET)
        .upload(path, cvBytes, {
          upsert: true,
          contentType: cvFile.type || "application/pdf",
        });
      if (!uploadError) {
        cvFileUrl = path;
      }
    } catch {
      // CV upload is best-effort; the application still goes through without it.
    }
  }

  const { data: application, error: applicationError } = await admin
    .from("applications")
    .insert({
      company_id: companyId,
      job_id: jobId,
      candidate_id: candidateId,
      source: "site",
      cv_file_url: cvFileUrl,
      status: "received",
    })
    .select("id")
    .single();

  if (applicationError || !application) {
    if (applicationError?.code === "23505") {
      return { error: "Já te candidataste a esta vaga." };
    }
    return {
      error: "Erro ao submeter candidatura: " + applicationError?.message,
    };
  }

  if (cvBytes && cvFile?.type === "application/pdf") {
    // Awaited so the demo can show the score immediately after applying.
    // Best-effort: scoring failures should never block the application itself.
    try {
      await scoreApplication(application.id, jobId, cvBytes);
    } catch (err) {
      console.error("Falha ao pontuar candidatura com IA:", err);
    }
  }

  return { success: true };
}
