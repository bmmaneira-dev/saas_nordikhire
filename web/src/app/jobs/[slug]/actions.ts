"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  scoreApplication,
  ensureCvBucket,
  isPdfHeader,
  MAX_CV_BYTES,
  CV_BUCKET,
} from "@/lib/cv-scoring";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getOrCreateSubscription, getUsageCounts } from "@/lib/billing";

const VIDEO_BUCKET = "application-videos";
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB — tecto do projecto Supabase

async function ensureVideoBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data: bucket } = await admin.storage.getBucket(VIDEO_BUCKET);
  if (!bucket) {
    await admin.storage.createBucket(VIDEO_BUCKET, {
      public: false,
      fileSizeLimit: MAX_VIDEO_BYTES,
    });
    return;
  }
  if (bucket.file_size_limit !== MAX_VIDEO_BYTES) {
    await admin.storage.updateBucket(VIDEO_BUCKET, {
      public: false,
      fileSizeLimit: MAX_VIDEO_BYTES,
    });
  }
}

// O vídeo vai directamente do browser para o Supabase Storage via signed
// upload URL — nunca passa pelo corpo do pedido a esta Server Action, que
// tem um limite de tamanho muito abaixo do de um ficheiro de vídeo.
export async function createVideoUploadTicket(
  jobId: string,
  companyId: string,
  fileName: string
) {
  const ip = await getClientIp();
  const { allowed } = await checkRateLimit("video_upload_ticket", ip, {
    maxAttempts: 20,
    windowMinutes: 60,
  });
  if (!allowed) {
    return { error: "Demasiados pedidos recentes. Tenta novamente mais tarde." };
  }

  const admin = createAdminClient();

  // jobId/companyId chegam como argumentos de uma Server Action invocável
  // directamente — sem isto, qualquer pedido conseguia um URL assinado de
  // upload para um prefixo `${companyId}/${jobId}/` arbitrário no bucket
  // privado, incluindo de empresas/vagas que não existem.
  const { data: job } = await admin
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("company_id", companyId)
    .eq("status", "open")
    .maybeSingle();
  if (!job) {
    return { error: "Esta vaga já não está disponível." };
  }

  await ensureVideoBucket(admin);

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  const path = `${companyId}/${jobId}/${crypto.randomUUID()}-${safeName}`;

  const { data, error } = await admin.storage
    .from(VIDEO_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return { error: "Erro ao preparar o envio do vídeo: " + error?.message };
  }

  return { path: data.path, token: data.token };
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
  const videoPath = String(formData.get("videoUrl") ?? "").trim() || null;

  if (!fullName || !email) {
    return { error: "Nome e email são obrigatórios." };
  }
  if (!consent) {
    return {
      error:
        "É necessário aceitar o tratamento de dados pessoais para te candidatares.",
    };
  }

  const ip = await getClientIp();
  // Só por IP era trivial de contornar (basta rodar o endereço) e não
  // limitava nada por candidato — junta-se um segundo limite por email, que
  // não muda a cada pedido, para travar o mesmo atacante a variar de IP.
  const [byIp, byEmail] = await Promise.all([
    checkRateLimit("job_application", ip, { maxAttempts: 20, windowMinutes: 60 }),
    checkRateLimit("job_application_email", email, {
      maxAttempts: 10,
      windowMinutes: 60,
    }),
  ]);
  if (!byIp.allowed || !byEmail.allowed) {
    return {
      error: "Demasiadas candidaturas enviadas recentemente. Tenta novamente mais tarde.",
    };
  }

  const admin = createAdminClient();

  // jobId/companyId chegam como argumentos de uma Server Action invocável
  // diretamente, por isso não podemos confiar que o par corresponde
  // realmente a uma vaga publicada dessa empresa.
  const { data: job } = await admin
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("company_id", companyId)
    .eq("status", "open")
    .maybeSingle();
  if (!job) {
    return { error: "Esta vaga já não está disponível." };
  }

  // O limite de candidaturas activas do plano da empresa nunca era aplicado
  // neste caminho (só em jobs/team) — sem isto, candidaturas anónimas podiam
  // ultrapassar indefinidamente a quota paga da empresa, cada uma disparando
  // scoring real por IA.
  const subscription = await getOrCreateSubscription(admin, companyId);
  const applicationLimit = subscription?.plan.max_active_applications ?? null;
  if (applicationLimit != null) {
    const usage = await getUsageCounts(admin, companyId);
    if (usage.activeApplications >= applicationLimit) {
      return {
        error: "Esta empresa atingiu o limite de candidaturas do seu plano. Tenta novamente mais tarde.",
      };
    }
  }

  // videoPath vem directo do formulário — só aceitamos um caminho que
  // respeite o prefixo emitido por createVideoUploadTicket para ESTA vaga
  // e empresa, para impedir que alguém associe à sua candidatura um
  // caminho de vídeo de outra empresa/candidatura no bucket privado.
  const expectedVideoPrefix = `${companyId}/${jobId}/`;
  const safeVideoPath =
    videoPath && videoPath.startsWith(expectedVideoPrefix) ? videoPath : null;

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
  let cvIsValidPdf = false;
  if (cvFile && cvFile.size > 0 && cvFile.size <= MAX_CV_BYTES) {
    const bytes = new Uint8Array(await cvFile.arrayBuffer());
    cvIsValidPdf = isPdfHeader(bytes);
    if (cvIsValidPdf) {
      cvBytes = bytes;
      try {
        await ensureCvBucket(admin);
        const safeName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
        const path = `${companyId}/${jobId}/${candidateId}-${safeName}`;
        const { error: uploadError } = await admin.storage
          .from(CV_BUCKET)
          .upload(path, cvBytes, {
            upsert: true,
            contentType: "application/pdf",
          });
        if (!uploadError) {
          cvFileUrl = path;
        }
      } catch {
        // CV upload is best-effort; the application still goes through without it.
      }
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
      video_url: safeVideoPath,
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

  if (cvBytes && cvIsValidPdf) {
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
