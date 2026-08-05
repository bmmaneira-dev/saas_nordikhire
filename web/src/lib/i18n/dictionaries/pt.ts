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
};

export default pt;
