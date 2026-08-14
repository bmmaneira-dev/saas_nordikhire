import { NextResponse, type NextRequest } from "next/server";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { synthesizeSpeech } from "@/lib/tts";
import type { TranscriptTurn } from "@/lib/ai-interview";

// O texto a sintetizar vem sempre da transcrição já gravada nesta sessão de
// prática (nunca de input do cliente) — impede que este endpoint seja usado
// como um proxy de TTS grátis para texto arbitrário.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const candidate = await getCurrentCandidate();
  if (!candidate) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const turnParam = request.nextUrl.searchParams.get("turn");
  const turnIndex = turnParam ? Number(turnParam) : NaN;
  if (!Number.isInteger(turnIndex) || turnIndex < 0) {
    return NextResponse.json({ error: "invalid turn" }, { status: 400 });
  }

  const { allowed } = await checkRateLimit("practice_tts", candidate.id, {
    maxAttempts: 60,
    windowMinutes: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: practice } = await admin
    .from("candidate_interview_practice")
    .select("candidate_id, transcript")
    .eq("id", id)
    .maybeSingle();

  if (!practice || practice.candidate_id !== candidate.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const transcript = (practice.transcript ?? []) as TranscriptTurn[];
  const turn = transcript[turnIndex];
  if (!turn || turn.role !== "ai") {
    return NextResponse.json({ error: "invalid turn" }, { status: 400 });
  }

  try {
    const audio = await synthesizeSpeech(turn.text);
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Erro ao gerar áudio:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "tts failed" }, { status: 502 });
  }
}
