import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Política de Privacidade",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Política de Privacidade" updatedAt="5 de agosto de 2026">
      <p className="rounded-xl border border-warning bg-warning-bg px-4 py-3 text-sm text-warning">
        Rascunho de base gerado para desbloquear o lançamento. Antes de
        publicar este site para utilizadores reais, este texto deve ser
        revisto por um advogado e os campos entre parênteses retos devem ser
        preenchidos com os dados legais reais da empresa.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-foreground">1. Quem trata os teus dados</h2>
        <p className="mt-2">
          O responsável pelo tratamento dos dados pessoais recolhidos através
          do NordikHire é [nome legal da empresa], com sede em [morada da
          empresa]. Para qualquer questão sobre esta política ou para
          exercer os teus direitos, contacta-nos através de [email de
          contacto de privacidade].
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">2. Que dados recolhemos</h2>
        <p className="mt-2">Dependendo de como usas a plataforma, podemos recolher:</p>
        <ul className="mt-2 flex flex-col gap-1 pl-5 list-disc">
          <li>Dados de conta: nome, email, password (encriptada), idioma escolhido.</li>
          <li>
            Dados de candidatura: CV, carta de motivação, respostas a
            perguntas de triagem, vídeo de apresentação, telefone e LinkedIn.
          </li>
          <li>
            Conteúdo gerado durante o uso: transcrições de entrevistas
            simuladas por IA, respostas a testes técnicos e comportamentais,
            feedback trocado entre empresa e candidato.
          </li>
          <li>
            Dados técnicos básicos necessários ao funcionamento do serviço
            (por exemplo, registos de acesso e erros).
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">3. Para que usamos os dados</h2>
        <p className="mt-2">
          Usamos os teus dados exclusivamente para operar o serviço de
          recrutamento: apresentar candidaturas às empresas, gerar
          pontuações e avaliações com apoio de inteligência artificial,
          conduzir entrevistas e testes simulados, e permitir que
          candidatos e empresas comuniquem dentro da plataforma. Não
          vendemos os teus dados pessoais a terceiros.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">4. Inteligência artificial</h2>
        <p className="mt-2">
          Partes do teu CV, respostas de entrevista e respostas de testes
          são processadas por modelos de inteligência artificial da
          Anthropic, para gerar pontuações, avaliações e sugestões de
          melhoria. Este processamento serve apenas para apoiar a decisão
          humana de recrutamento e não temos acesso, por parte da Anthropic,
          a fins de treino dos seus modelos com estes dados sob os termos
          comerciais aplicáveis a esta integração.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">5. Com quem partilhamos dados</h2>
        <p className="mt-2">
          Partilhamos dados apenas com prestadores de serviços necessários
          para operar a plataforma: a Supabase, para alojamento de base de
          dados e autenticação, e a Anthropic, para processamento de
          inteligência artificial. Dados de candidatura são também
          partilhados com a empresa à qual te candidataste, na medida
          necessária ao processo de recrutamento.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">6. Quanto tempo guardamos os dados</h2>
        <p className="mt-2">
          Mantemos os teus dados enquanto a tua conta estiver activa. Podes
          pedir a eliminação da tua conta e dos dados associados a qualquer
          momento, sujeito a obrigações legais de conservação que possam
          aplicar-se a registos de candidatura já partilhados com uma
          empresa.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">7. Os teus direitos</h2>
        <p className="mt-2">
          Tens direito a aceder, corrigir, eliminar ou pedir a portabilidade
          dos teus dados pessoais, e a retirar o consentimento dado no
          registo a qualquer momento. Para exercer estes direitos, contacta-nos
          através de [email de contacto de privacidade].
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">8. Segurança</h2>
        <p className="mt-2">
          Os dados são encriptados em trânsito, o acesso à base de dados é
          protegido por regras de segurança ao nível da linha (RLS) que
          restringem cada empresa aos seus próprios dados, e o acesso interno
          é limitado a quem precisa dele para operar o serviço.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">9. Alterações a esta política</h2>
        <p className="mt-2">
          Podemos actualizar esta política periodicamente. Alterações
          relevantes serão comunicadas dentro da plataforma antes de entrarem
          em vigor.
        </p>
      </section>
    </LegalPageShell>
  );
}
