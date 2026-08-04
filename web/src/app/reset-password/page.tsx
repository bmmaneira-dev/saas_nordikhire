"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";
import { Field, PasswordInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    // Se o link já foi processado (ex: refresh da página), confirma se há sessão.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const timeout = setTimeout(() => {
      setReady((r) => {
        if (!r) setInvalid(true);
        return r;
      });
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A password deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As passwords não coincidem.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setPending(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login?resetSuccess=1");
  }

  if (invalid) {
    return (
      <AuthShell
        title="Link inválido ou expirado"
        subtitle="Pede um novo link de reposição de password."
        footer={
          <a
            href="/forgot-password"
            className="font-medium text-primary underline"
          >
            Pedir novo link
          </a>
        }
      >
        <p className="text-sm text-muted-foreground">
          Este link já não é válido — os links de reposição expiram em 1 hora
          ou só podem ser usados uma vez.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Define uma nova password"
      subtitle="Escolhe uma password com pelo menos 8 caracteres."
      footer={<span>&nbsp;</span>}
    >
      {!ready ? (
        <p className="text-sm text-muted-foreground">A validar o link...</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Nova password">
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </Field>
          <Field label="Confirmar password">
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
          </Field>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "A guardar..." : "Guardar nova password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
