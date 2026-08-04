"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendPracticeMessage } from "../actions";
import type { TranscriptTurn } from "@/lib/ai-interview";
import { Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

// Preferimos vozes que tendem a soar menos robóticas (motores "Natural" /
// "Neural" / "Google" costumam ser bem melhores que a voz por omissão do
// sistema), e priorizamos português quando existir.
function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const preferredNameHints = ["Natural", "Neural", "Google", "Online"];
  const scoreOf = (v: SpeechSynthesisVoice) =>
    (preferredNameHints.some((hint) => v.name.includes(hint)) ? 2 : 0) +
    (v.lang.toLowerCase().startsWith("pt") ? 1 : 0);
  return [...voices].sort((a, b) => scoreOf(b) - scoreOf(a))[0];
}

export function PracticeVoiceChat({
  practiceId,
  transcript,
}: {
  practiceId: string;
  transcript: TranscriptTurn[];
}) {
  const boundAction = sendPracticeMessage.bind(null, practiceId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Web Speech API's SpeechRecognition has no standard TS lib types.
  const recognitionRef = useRef<any>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const spokenCountRef = useRef(0);

  // Câmara do próprio candidato — só para se ver a responder, como numa
  // videochamada real. Nunca é gravada nem enviada para o servidor.
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => {
        setCameraError("Câmara não disponível — a prática continua sem vídeo.");
      });
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Fala a última pergunta da IA em voz alta assim que aparece no histórico.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (transcript.length <= spokenCountRef.current) return;
    const last = transcript[transcript.length - 1];
    spokenCountRef.current = transcript.length;
    if (last.role !== "ai") return;

    const utterance = new SpeechSynthesisUtterance(last.text);
    utterance.lang = "pt-PT";
    utterance.rate = 0.98;
    utterance.pitch = 1.03;
    const speak = () => {
      const voice = pickVoice(window.speechSynthesis.getVoices());
      if (voice) utterance.voice = voice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };
    // As vozes só ficam disponíveis de forma assíncrona em alguns browsers.
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speak;
    } else {
      speak();
    }
  }, [transcript]);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  function toggleListening() {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setSpeechSupported(false);
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "pt-PT";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      if (textareaRef.current) textareaRef.current.value = text;
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {transcript.map((turn, i) => (
          <div
            key={i}
            className={`flex ${turn.role === "ai" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                turn.role === "ai"
                  ? "bg-surface-muted text-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {turn.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-4">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-32 w-44 shrink-0 rounded-xl bg-surface-muted object-cover"
        />
        <p className="text-xs text-muted-foreground">
          {cameraError ??
            "A tua câmara é só para te veres a responder — nunca é gravada nem enviada."}
        </p>
      </div>

      <form ref={formRef} action={formAction} className="flex flex-col gap-2">
        <Textarea
          ref={textareaRef}
          name="message"
          rows={3}
          required
          placeholder="Escreve ou usa o microfone para responder..."
        />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant={listening ? "danger" : "secondary"}
            size="sm"
            onClick={toggleListening}
          >
            {listening ? "⏹ Parar" : "🎤 Falar resposta"}
          </Button>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "A enviar..." : "Enviar resposta"}
          </Button>
        </div>
        {!speechSupported && (
          <p className="text-xs text-muted-foreground">
            O teu browser não suporta reconhecimento de voz — usa o texto.
          </p>
        )}
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      </form>
    </div>
  );
}
