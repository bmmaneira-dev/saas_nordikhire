export interface Dictionary {
  nav: {
    dashboard: string;
    jobs: string;
    candidates: string;
    pipeline: string;
    tests: string;
    interviews: string;
    talentPool: string;
    messages: string;
    reports: string;
    company: string;
  };
  candidateNav: {
    dashboard: string;
    jobs: string;
    applications: string;
    profile: string;
    tests: string;
    interviews: string;
    practice: string;
    messages: string;
    development: string;
  };
  common: {
    signOut: string;
  };
  dashboardHome: {
    title: string;
    subtitle: string;
    activeJobs: string;
    pendingApplications: string;
    interviewsInProgress: string;
    highRedFlags: string;
    firstSteps: string;
    markAsDone: string;
    recentActivity: string;
    noRecentActivity: string;
    interviewsInProgressSection: string;
    noInterviewsInProgress: string;
    appliedTo: string;
  };
  candidateDashboardHome: {
    greeting: string;
    subtitle: string;
    activeApplications: string;
    pendingTests: string;
    interviews: string;
    feedbackReceived: string;
    recentApplications: string;
    viewAll: string;
    noApplicationsYet: string;
    recentJobs: string;
    exploreJobs: string;
    noOpenJobs: string;
  };
  signupLanguage: {
    label: string;
  };
  status: {
    received: string;
    screening: string;
    scored: string;
    shortlisted: string;
    interview: string;
    test: string;
    offer: string;
    hired: string;
    rejected: string;
    withdrawn: string;
    open: string;
    draft: string;
    closed: string;
    paused: string;
    assigned: string;
    in_progress: string;
    completed: string;
    expired: string;
    scheduled: string;
    no_show: string;
  };
  jobsList: {
    title: string;
    newJob: string;
    tabActive: string;
    tabDrafts: string;
    tabClosed: string;
    noJobsInCategory: string;
    viewCandidates: string;
    viewPublicPage: string;
    applicationsCount: string;
  };
  newJob: {
    back: string;
    title: string;
    fieldTitle: string;
    fieldDescription: string;
    fieldRequirements: string;
    fieldSkills: string;
    skillsPlaceholder: string;
    fieldSeniority: string;
    seniorityJunior: string;
    seniorityMid: string;
    senioritySenior: string;
    seniorityLead: string;
    fieldWorkMode: string;
    workModeOnsite: string;
    workModeRemote: string;
    workModeHybrid: string;
    fieldLocation: string;
    fieldSalaryMin: string;
    fieldSalaryMax: string;
    publishNow: string;
    creating: string;
    create: string;
  };
  candidatesList: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    search: string;
    noCandidatesFound: string;
    applicationsCount: string;
  };
  candidateProfile: {
    back: string;
    applications: string;
    viewInJob: string;
  };
  pipeline: {
    title: string;
    subtitle: string;
    allJobs: string;
    empty: string;
    colReceived: string;
    colShortlisted: string;
    colTest: string;
    colInterview: string;
    colOffer: string;
    colHired: string;
    colRejected: string;
  };
  testsList: {
    title: string;
    subtitle: string;
    tabAll: string;
    tabTechnical: string;
    tabBehavioral: string;
    tabPsychometric: string;
    noneInCategory: string;
  };
  interviewsList: {
    title: string;
    subtitle: string;
    noneYet: string;
    viewInJob: string;
  };
  interviewEvaluation: {
    communication: string;
    technicalDepth: string;
    problemSolving: string;
    culturalFit: string;
  };
  messagesList: {
    title: string;
    subtitle: string;
    noneSent: string;
  };
  companyLanding: {
    title: string;
    subtitle: string;
    profileTitle: string;
    profileDescription: string;
    teamTitle: string;
    teamDescription: string;
    billingTitle: string;
    billingDescription: string;
  };
  comingSoon: {
    label: string;
  };
  talentPool: {
    title: string;
    subtitle: string;
    bodyBefore: string;
    linkLabel: string;
    bodyAfter: string;
  };
  reportsPlaceholder: {
    title: string;
    subtitle: string;
    bodyBefore: string;
    dashboardLabel: string;
    bodyMiddle: string;
    pipelineLabel: string;
    bodyAfter: string;
  };
  team: {
    backToCompany: string;
    title: string;
    subtitle: string;
    inviteTeammate: string;
    inviteNote: string;
    pendingInvites: string;
    revoke: string;
    teamMembers: string;
    you: string;
    active: string;
    inactive: string;
    deactivate: string;
    reactivate: string;
  };
  inviteForm: {
    email: string;
    emailPlaceholder: string;
    fullName: string;
    role: string;
    inviting: string;
    invite: string;
    successMessage: string;
  };
  billing: {
    backToCompany: string;
    title: string;
    plan: string;
    trialDaysLeft: string;
    trialEnded: string;
    activeJobs: string;
    teamMembers: string;
    activeApplications: string;
    unlimited: string;
    plans: string;
    plansSubtitle: string;
    currentPlan: string;
    switchToThisPlan: string;
    priceOnRequest: string;
    perMonth: string;
    statusTrialing: string;
    statusActive: string;
    statusPastDue: string;
    statusCanceled: string;
    featureAiScoring: string;
    featureAiInterview: string;
    featureWhatsapp: string;
    featureMarketTrends: string;
  };
  settingsPage: {
    backToCompany: string;
    title: string;
    adminOnly: string;
  };
  settingsForm: {
    companyName: string;
    industry: string;
    country: string;
    logoUrl: string;
    updated: string;
    saving: string;
    save: string;
  };
  jobDetail: {
    back: string;
    viewPublicPage: string;
    addTranslation: string;
    chooseLanguage: string;
    translateWithAi: string;
    machineTranslatedSuffix: string;
    comparisonSummary: string;
    colCandidate: string;
    colScore: string;
    colStatus: string;
    colInterview: string;
    colBestTest: string;
    colRedFlags: string;
    noApplicationsYet: string;
    noScore: string;
    skillsLabel: string;
    experienceLabel: string;
    educationLabel: string;
    languagesLabel: string;
    presentationVideo: string;
    redFlagsHeading: string;
    testsHeading: string;
    viewAnswersEvaluation: string;
    viewInterviewEvaluation: string;
    continueAiInterview: string;
    startAiInterview: string;
    advanceTo: string;
    reject: string;
    rejectionPlaceholder: string;
    confirmRejection: string;
    sendFeedback: string;
    feedbackPlaceholder: string;
    send: string;
    assignTest: string;
    generateAndAssign: string;
    feedbackSentHeading: string;
  };
  feedbackComposer: {
    generating: string;
    generateDraftAi: string;
  };
  reportSection: {
    title: string;
    generating: string;
    update: string;
    generateReport: string;
    notEnoughData: string;
    notEnoughDataHint: string;
    generateError: string;
    viewReport: string;
    strengths: string;
    technicalGaps: string;
    behavioralGaps: string;
    trainingRecommendations: string;
  };
  sharePanel: {
    shareJob: string;
    qrAlt: string;
    copyLink: string;
    copied: string;
    selectAndCopy: string;
    downloadQr: string;
    whatsappMessagePrefix: string;
  };
  sourcedCvUpload: {
    uploadCvs: string;
    description: string;
    maxFilesBefore: string;
    maxFilesAfter: string;
    statusQueued: string;
    statusProcessing: string;
    scoreLabel: string;
    processingCvs: string;
  };
  interviewPage: {
    aiInterviewWith: string;
    evaluation: string;
    endInterview: string;
    chatPlaceholder: string;
    sending: string;
    sendAnswer: string;
  };
  candidateJobsSearch: {
    title: string;
    subtitle: string;
    fieldKeyword: string;
    keywordPlaceholder: string;
    fieldLocation: string;
    locationPlaceholder: string;
    fieldWorkMode: string;
    allOption: string;
    workModeOnsite: string;
    workModeRemote: string;
    workModeHybrid: string;
    fieldSeniority: string;
    seniorityJunior: string;
    seniorityMid: string;
    senioritySenior: string;
    seniorityLead: string;
    search: string;
    noJobsFound: string;
  };
  candidateApplications: {
    title: string;
    subtitle: string;
    noApplications: string;
    appliedOn: string;
    lastUpdateOn: string;
    yourPresentationVideo: string;
    companyFeedback: string;
    withdrawApplication: string;
  };
  candidateProfilePage: {
    title: string;
    cvHeading: string;
    cvBodyBefore: string;
    cvLinkLabel: string;
    cvBodyAfter: string;
  };
  candidateProfileForm: {
    fullName: string;
    phone: string;
    linkedin: string;
    updated: string;
    saving: string;
    save: string;
  };
}

const pt: Dictionary = {
  nav: {
    dashboard: "Dashboard",
    jobs: "Vagas",
    candidates: "Candidatos",
    pipeline: "Pipeline",
    tests: "Testes",
    interviews: "Entrevistas",
    talentPool: "Banco de Talentos",
    messages: "Mensagens",
    reports: "Relatórios",
    company: "Empresa",
  },
  candidateNav: {
    dashboard: "Dashboard",
    jobs: "Explorar Vagas",
    applications: "As Minhas Candidaturas",
    profile: "O Meu Perfil",
    tests: "Testes",
    interviews: "Entrevistas",
    practice: "Simulador IA",
    messages: "Mensagens",
    development: "Desenvolvimento Profissional",
  },
  common: {
    signOut: "Sair",
  },
  dashboardHome: {
    title: "Dashboard",
    subtitle: "Visão geral do recrutamento.",
    activeJobs: "Vagas activas",
    pendingApplications: "Candidaturas por decidir",
    interviewsInProgress: "Entrevistas em curso",
    highRedFlags: "Alertas (red flags altas)",
    firstSteps: "Primeiros passos",
    markAsDone: "Marcar como feito",
    recentActivity: "Actividade recente",
    noRecentActivity: "Ainda não há candidaturas.",
    interviewsInProgressSection: "Entrevistas em curso",
    noInterviewsInProgress: "Nenhuma entrevista em curso.",
    appliedTo: "candidatou-se a",
  },
  candidateDashboardHome: {
    greeting: "Olá,",
    subtitle: "Resumo da tua actividade no NordikHire.",
    activeApplications: "Candidaturas activas",
    pendingTests: "Testes pendentes",
    interviews: "Entrevistas",
    feedbackReceived: "Feedback recebido",
    recentApplications: "Candidaturas recentes",
    viewAll: "Ver todas →",
    noApplicationsYet: "Ainda não te candidataste a nenhuma vaga.",
    recentJobs: "Vagas recentes",
    exploreJobs: "Explorar vagas →",
    noOpenJobs: "Não há vagas abertas no momento.",
  },
  signupLanguage: {
    label: "Língua da interface",
  },
  status: {
    received: "Recebido",
    screening: "Triagem",
    scored: "Pontuado",
    shortlisted: "Pré-selecionado",
    interview: "Entrevista",
    test: "Teste",
    offer: "Oferta",
    hired: "Contratado",
    rejected: "Rejeitado",
    withdrawn: "Retirado",
    open: "Activa",
    draft: "Rascunho",
    closed: "Encerrada",
    paused: "Pausada",
    assigned: "Atribuído",
    in_progress: "Em curso",
    completed: "Concluído",
    expired: "Expirado",
    scheduled: "Agendada",
    no_show: "Não compareceu",
  },
  jobsList: {
    title: "Vagas",
    newJob: "Nova vaga",
    tabActive: "Activas",
    tabDrafts: "Rascunhos",
    tabClosed: "Encerradas",
    noJobsInCategory: "Nenhuma vaga nesta categoria.",
    viewCandidates: "Ver candidatos →",
    viewPublicPage: "Ver página pública →",
    applicationsCount: "candidatura(s)",
  },
  newJob: {
    back: "← Voltar às vagas",
    title: "Nova vaga",
    fieldTitle: "Título",
    fieldDescription: "Descrição",
    fieldRequirements: "Requisitos",
    fieldSkills: "Skills (separadas por vírgula)",
    skillsPlaceholder: "Python, SQL, Excel avançado",
    fieldSeniority: "Senioridade",
    seniorityJunior: "Júnior",
    seniorityMid: "Pleno",
    senioritySenior: "Sénior",
    seniorityLead: "Lead",
    fieldWorkMode: "Modo de trabalho",
    workModeOnsite: "Presencial",
    workModeRemote: "Remoto",
    workModeHybrid: "Híbrido",
    fieldLocation: "Localização",
    fieldSalaryMin: "Salário mín.",
    fieldSalaryMax: "Salário máx.",
    publishNow: "Publicar já (gera link público)",
    creating: "A criar...",
    create: "Criar vaga",
  },
  candidatesList: {
    title: "Candidatos",
    subtitle: "Todos os candidatos que já se candidataram a vagas da tua empresa.",
    searchPlaceholder: "Pesquisar por nome ou email...",
    search: "Pesquisar",
    noCandidatesFound: "Nenhum candidato encontrado.",
    applicationsCount: "candidatura(s)",
  },
  candidateProfile: {
    back: "← Voltar aos candidatos",
    applications: "Candidaturas",
    viewInJob: "Ver na vaga →",
  },
  pipeline: {
    title: "Pipeline",
    subtitle: "Vista visual do processo de recrutamento, por etapa.",
    allJobs: "Todas as vagas",
    empty: "Vazio",
    colReceived: "Recebidos",
    colShortlisted: "Pré-selecionados",
    colTest: "Em avaliação",
    colInterview: "Entrevistas",
    colOffer: "Oferta",
    colHired: "Contratados",
    colRejected: "Rejeitados",
  },
  testsList: {
    title: "Testes",
    subtitle: "Todos os testes atribuídos a candidatos, em todas as vagas.",
    tabAll: "Todos",
    tabTechnical: "Técnicos",
    tabBehavioral: "Comportamentais",
    tabPsychometric: "Psicométricos",
    noneInCategory: "Nenhum teste nesta categoria.",
  },
  interviewsList: {
    title: "Entrevistas",
    subtitle: "Todas as entrevistas simuladas por IA, em todas as vagas.",
    noneYet: "Ainda não há entrevistas.",
    viewInJob: "Ver na vaga →",
  },
  interviewEvaluation: {
    communication: "Comunicação",
    technicalDepth: "Profundidade técnica",
    problemSolving: "Resolução de problemas",
    culturalFit: "Adequação cultural",
  },
  messagesList: {
    title: "Mensagens",
    subtitle:
      "Histórico de feedback enviado a candidatos, em todas as vagas. Sem WhatsApp ou email real ligados ainda — as mensagens ficam registadas aqui e visíveis ao candidato na sua área.",
    noneSent: "Ainda não enviaste nenhuma mensagem.",
  },
  companyLanding: {
    title: "Empresa",
    subtitle: "Informações da empresa e da conta.",
    profileTitle: "Perfil da empresa",
    profileDescription: "Nome, sector de actividade, país e logótipo.",
    teamTitle: "Equipa de recrutamento",
    teamDescription: "Convida colegas e gere quem tem acesso ao dashboard.",
    billingTitle: "Plano de subscrição",
    billingDescription: "Plano actual, uso e opções de facturação.",
  },
  comingSoon: {
    label: "Em breve",
  },
  talentPool: {
    title: "Banco de Talentos",
    subtitle: "Candidatos que podem ser reutilizados em futuras vagas.",
    bodyBefore:
      "Pesquisa por competências, talent pools organizados por área, e recomendações da IA de candidatos anteriores adequados a novas vagas. Entretanto, usa a secção",
    linkLabel: "Candidatos",
    bodyAfter: "para pesquisar todos os candidatos que já se candidataram.",
  },
  reportsPlaceholder: {
    title: "Relatórios",
    subtitle: "Métricas e desempenho do recrutamento.",
    bodyBefore:
      "Tempo médio de contratação, conversão por etapa do pipeline, origem dos candidatos, performance por vaga, e exportações. Entretanto, o",
    dashboardLabel: "Dashboard",
    bodyMiddle: "já mostra os KPIs principais e a",
    pipelineLabel: "Pipeline",
    bodyAfter: "dá uma vista visual do funil por etapa.",
  },
  team: {
    backToCompany: "← Voltar à empresa",
    title: "Equipa",
    subtitle: "Gere quem tem acesso ao dashboard da tua empresa.",
    inviteTeammate: "Convidar colega",
    inviteNote:
      "Ainda não temos envio de email — copia o link gerado e envia directamente ao colega.",
    pendingInvites: "Convites pendentes",
    revoke: "Revogar",
    teamMembers: "Membros da equipa",
    you: "(tu)",
    active: "activo",
    inactive: "inactivo",
    deactivate: "Desactivar",
    reactivate: "Reactivar",
  },
  inviteForm: {
    email: "Email",
    emailPlaceholder: "colega@empresa.com",
    fullName: "Nome (opcional)",
    role: "Papel",
    inviting: "A convidar...",
    invite: "Convidar",
    successMessage: "Convite criado — copia o link abaixo e envia ao colega.",
  },
  billing: {
    backToCompany: "← Voltar à empresa",
    title: "Facturação",
    plan: "Plano",
    trialDaysLeft: "dia(s) restantes no período de teste.",
    trialEnded: "O período de teste terminou.",
    activeJobs: "Vagas activas",
    teamMembers: "Membros da equipa",
    activeApplications: "Candidaturas activas",
    unlimited: "ilimitado",
    plans: "Planos",
    plansSubtitle:
      "Facturação manual nesta fase — mudar de plano actualiza o limite de imediato, a factura é tratada directamente com a equipa NordikHire.",
    currentPlan: "Plano actual",
    switchToThisPlan: "Mudar para este plano",
    priceOnRequest: "Sob consulta",
    perMonth: "/mês",
    statusTrialing: "Em período de teste",
    statusActive: "Activa",
    statusPastDue: "Pagamento em atraso",
    statusCanceled: "Cancelada",
    featureAiScoring: "Scoring de CV por IA",
    featureAiInterview: "Entrevista simulada por IA",
    featureWhatsapp: "Candidaturas via WhatsApp",
    featureMarketTrends: "Tendências de mercado",
  },
  settingsPage: {
    backToCompany: "← Voltar à empresa",
    title: "Perfil da empresa",
    adminOnly: "Só administradores podem editar o perfil da empresa.",
  },
  settingsForm: {
    companyName: "Nome da empresa",
    industry: "Sector de actividade",
    country: "País (código ISO)",
    logoUrl: "URL do logótipo (opcional)",
    updated: "Perfil actualizado.",
    saving: "A guardar...",
    save: "Guardar",
  },
  jobDetail: {
    back: "← Voltar às vagas",
    viewPublicPage: "Ver página pública →",
    addTranslation: "+ Adicionar tradução",
    chooseLanguage: "Escolhe um idioma",
    translateWithAi: "Traduzir com IA",
    machineTranslatedSuffix: " · IA",
    comparisonSummary: "Resumo comparativo",
    colCandidate: "Candidato",
    colScore: "Score",
    colStatus: "Estado",
    colInterview: "Entrevista",
    colBestTest: "Melhor teste",
    colRedFlags: "Red flags",
    noApplicationsYet: "Ainda não há candidaturas.",
    noScore: "sem score",
    skillsLabel: "Skills",
    experienceLabel: "Experiência",
    educationLabel: "Formação",
    languagesLabel: "Idiomas",
    presentationVideo: "Vídeo de apresentação",
    redFlagsHeading: "Red flags",
    testsHeading: "Testes",
    viewAnswersEvaluation: "Ver respostas e avaliação",
    viewInterviewEvaluation: "Ver entrevista e avaliação →",
    continueAiInterview: "Continuar entrevista IA →",
    startAiInterview: "Iniciar entrevista com IA",
    advanceTo: "Avançar para:",
    reject: "Rejeitar",
    rejectionPlaceholder: "Motivo / feedback para o candidato (opcional)",
    confirmRejection: "Confirmar rejeição",
    sendFeedback: "Enviar feedback",
    feedbackPlaceholder: "Mensagem para o candidato",
    send: "Enviar",
    assignTest: "Atribuir teste",
    generateAndAssign: "Gerar e atribuir",
    feedbackSentHeading: "Feedback enviado",
  },
  feedbackComposer: {
    generating: "A gerar...",
    generateDraftAi: "✨ Gerar rascunho com IA",
  },
  reportSection: {
    title: "Relatório de desenvolvimento",
    generating: "A gerar...",
    update: "Actualizar",
    generateReport: "Gerar relatório",
    notEnoughData: "Sem dados suficientes",
    notEnoughDataHint:
      "Precisa de pelo menos um score de CV, red flags, uma entrevista concluída ou um teste concluído antes de gerar um relatório.",
    generateError: "Erro ao gerar o relatório. Tenta novamente.",
    viewReport: "Ver relatório",
    strengths: "Pontos fortes",
    technicalGaps: "Lacunas técnicas",
    behavioralGaps: "Lacunas comportamentais",
    trainingRecommendations: "Recomendações de formação",
  },
  sharePanel: {
    shareJob: "Partilhar vaga",
    qrAlt: "QR code da vaga",
    copyLink: "Copiar link",
    copied: "Copiado ✓",
    selectAndCopy: "Seleciona e copia (Ctrl+C)",
    downloadQr: "Descarregar QR",
    whatsappMessagePrefix: "Vê esta vaga:",
  },
  sourcedCvUpload: {
    uploadCvs: "Carregar CVs (sourcing directo)",
    description:
      "Carrega CVs de candidatos que já tens (LinkedIn, banco de talentos, referências) sem esperar que se candidatem pelo site. Nome e email são extraídos automaticamente do CV — ficheiros sem email identificável são ignorados.",
    maxFilesBefore: "Até",
    maxFilesAfter: "PDFs de cada vez.",
    statusQueued: "em fila...",
    statusProcessing: "a processar...",
    scoreLabel: "score",
    processingCvs: "A processar CVs...",
  },
  interviewPage: {
    aiInterviewWith: "Entrevista com IA —",
    evaluation: "Avaliação",
    endInterview: "Terminar entrevista e gerar avaliação",
    chatPlaceholder: "Escreve a tua resposta...",
    sending: "A enviar...",
    sendAnswer: "Enviar resposta",
  },
  candidateJobsSearch: {
    title: "Explorar Vagas",
    subtitle: "Pesquisa oportunidades abertas em todas as empresas do NordikHire.",
    fieldKeyword: "Palavra-chave",
    keywordPlaceholder: "Ex: engenheiro backend",
    fieldLocation: "Localização",
    locationPlaceholder: "Ex: Luanda",
    fieldWorkMode: "Modalidade",
    allOption: "Todas",
    workModeOnsite: "Presencial",
    workModeRemote: "Remoto",
    workModeHybrid: "Híbrido",
    fieldSeniority: "Senioridade",
    seniorityJunior: "Júnior",
    seniorityMid: "Pleno",
    senioritySenior: "Sénior",
    seniorityLead: "Lead",
    search: "Pesquisar",
    noJobsFound: "Nenhuma vaga encontrada com estes critérios.",
  },
  candidateApplications: {
    title: "As Minhas Candidaturas",
    subtitle: "Acompanha o estado de todas as tuas candidaturas.",
    noApplications: "Ainda não te candidataste a nenhuma vaga.",
    appliedOn: "Candidataste-te em",
    lastUpdateOn: "última actualização em",
    yourPresentationVideo: "O teu vídeo de apresentação",
    companyFeedback: "Feedback da empresa",
    withdrawApplication: "Retirar candidatura",
  },
  candidateProfilePage: {
    title: "O Meu Perfil",
    cvHeading: "CV",
    cvBodyBefore:
      "Envias um CV de cada vez que te candidatas a uma vaga — consulta o histórico em",
    cvLinkLabel: "As Minhas Candidaturas",
    cvBodyAfter:
      ". Um CV único e persistente no perfil, competências, formação, experiência e portefólio estruturados ficam para uma próxima fase.",
  },
  candidateProfileForm: {
    fullName: "Nome completo",
    phone: "Telefone",
    linkedin: "LinkedIn",
    updated: "Perfil actualizado.",
    saving: "A guardar...",
    save: "Guardar",
  },
};

export default pt;
