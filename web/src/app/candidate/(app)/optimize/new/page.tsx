import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { OptimizeForm } from "./optimize-form";

export default async function NewOptimizationPage() {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const dict = await getDictionary(toLocale(candidate.preferred_locale));

  return <OptimizeForm dict={dict} />;
}
