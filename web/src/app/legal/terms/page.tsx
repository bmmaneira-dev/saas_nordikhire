import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Termos de Serviço",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageShell title="Termos de Serviço" updatedAt="5 de agosto de 2026">
      <p className="rounded-xl border border-warning bg-warning-bg px-4 py-3 text-sm text-warning">
        Rascunho de base gerado para desbloquear o lançamento. Antes de
        publicar este site para utilizadores reais, este texto deve ser
        revisto por um advogado e os campos entre parênteses retos devem ser
        preenchidos com os dados legais reais da empresa.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-foreground">1. Quem somos</h2>
        <p className="mt-2">
          O NordikHire é operado por [nome legal da empresa], com sede em
          [morada da empresa], número de identificação fiscal [NIF]. Para
          qualquer questão sobre estes Termos, contacta-nos através de
          [email de contacto].
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">2. O que é o NordikHire</h2>
        <p className="mt-2">
          O NordikHire é uma plataforma de recrutamento que disponibiliza,
          entre outras funcionalidades: publicação de vagas, análise e
          pontuação de candidaturas com recurso a inteligência artificial,
          entrevistas e testes técnicos simulados por IA, gestão de pipeline
          de candidatos, e ferramentas de otimização de perfil e prática de
          entrevistas para candidatos.
        </p>
        <p className="mt-2">
          As avaliações geradas por IA (pontuações de CV, resultados de
          testes, avaliações de entrevistas, relatórios de desenvolvimento)
          são apoios à decisão, não decisões automáticas de contratação. A
          responsabilidade final por qualquer decisão de recrutamento é
          sempre da empresa que utiliza a plataforma.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">3. Contas e responsabilidades</h2>
        <p className="mt-2">
          És responsável por manter a confidencialidade da tua password e por
          toda a atividade realizada na tua conta. Deves fornecer informação
          verdadeira no registo e mantê-la atualizada. Contas de empresa são
          responsáveis por garantir que têm base legal para tratar os dados
          pessoais dos candidatos que introduzem na plataforma.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">4. Utilização aceitável</h2>
        <p className="mt-2">
          Não podes usar o NordikHire para publicar vagas discriminatórias ou
          ilegais, para recolher dados de candidatos fora do âmbito de um
          processo de recrutamento genuíno, para tentar contornar os limites
          técnicos da plataforma, ou para enviar conteúdo malicioso através
          dos formulários de candidatura ou de upload de CV.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">5. Planos e faturação</h2>
        <p className="mt-2">
          Novas contas de empresa começam com um período de avaliação
          gratuito. Após esse período, a continuação do acesso a
          funcionalidades pagas depende de um plano ativo. Nesta fase, a
          faturação é feita manualmente em coordenação direta com a nossa
          equipa, não existe cobrança automática por cartão de crédito.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">6. Dados e propriedade de conteúdo</h2>
        <p className="mt-2">
          Os dados que introduzes (vagas, candidaturas, CVs, respostas a
          testes e entrevistas) permanecem propriedade tua ou do candidato,
          consoante o caso. Usamos esses dados apenas para prestar o serviço,
          conforme detalhado na nossa{" "}
          <a href="/legal/privacy" className="text-primary underline">
            Política de Privacidade
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">7. Encerramento de conta</h2>
        <p className="mt-2">
          Podes encerrar a tua conta a qualquer momento. Podemos suspender ou
          encerrar contas que violem estes Termos, mediante aviso prévio
          sempre que razoavelmente possível.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">8. Limitação de responsabilidade</h2>
        <p className="mt-2">
          O NordikHire é fornecido tal como está, sem garantias de resultado
          de contratação ou de emprego. Na medida permitida por lei, não
          somos responsáveis por decisões de recrutamento tomadas com base
          nas avaliações geradas pela plataforma.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">9. Alterações a estes Termos</h2>
        <p className="mt-2">
          Podemos atualizar estes Termos periodicamente. Alterações
          relevantes serão comunicadas dentro da plataforma antes de entrarem
          em vigor.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">10. Lei aplicável</h2>
        <p className="mt-2">
          Estes Termos regem-se pela lei de [jurisdição a confirmar].
        </p>
      </section>
    </LegalPageShell>
  );
}
