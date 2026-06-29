const percentage = (value, total) => {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
};

/**
 * buildSuperadminDashboardView
 *
 * Transforma datos globales en un view-model del panel superadmin.
 */
export const buildSuperadminDashboardView = ({ institutions = [], resumen = {} }) => {
  const activeInstitutions = institutions.filter((institution) => institution.activo);
  const inactiveInstitutions = institutions.filter((institution) => !institution.activo);

  const totalInstitutions = Number(resumen.instituciones_totales ?? institutions.length);
  const activeInstitutionsCount = Number(resumen.instituciones_activas ?? activeInstitutions.length);
  const inactiveInstitutionsCount = Number(resumen.instituciones_inactivas ?? inactiveInstitutions.length);
  const totalAdmins = Number(resumen.admins_totales ?? 0);
  const totalActiveTutors = Number(
    resumen.tutores_activos ??
      institutions.reduce((sum, institution) => sum + Number(institution.tutores_activos ?? 0), 0)
  );
  const totalStudents = Number(resumen.estudiantes_totales ?? 0);
  const recentSessions = Number(resumen.sesiones_ultimos_7_dias ?? 0);

  const citiesCovered = new Set(
    institutions.map((institution) => institution.ciudad?.trim()).filter(Boolean)
  ).size;

  const activeInstitutionRate = percentage(activeInstitutionsCount, totalInstitutions);
  const inactiveInstitutionRate = percentage(inactiveInstitutionsCount, totalInstitutions || 1);

  return {
    heroTags: [
      { label: "Instituciones", value: totalInstitutions },
      { label: "Admins", value: totalAdmins },
      { label: "Tutores activos", value: totalActiveTutors },
      { label: "Estudiantes", value: totalStudents },
    ],
    metrics: [
      {
        key: "instituciones",
        label: "Instituciones",
        value: totalInstitutions,
        description: "Colegios registrados a nivel de plataforma.",
        tone: "purple",
      },
      {
        key: "activas",
        label: "Instituciones activas",
        value: activeInstitutionsCount,
        description: "Hoy pueden operar normalmente dentro de la plataforma.",
        tone: "gold",
      },
      {
        key: "admins",
        label: "Admins activos",
        value: totalAdmins,
        description: "Cuentas de administradores de instituciones registradas.",
        tone: "orange",
      },
      {
        key: "estudiantes",
        label: "Estudiantes",
        value: totalStudents,
        description: "Ninos registrados en la base global de la plataforma.",
        tone: "rose",
      },
    ],
    progress: [
      {
        key: "activeInstitutions",
        label: "Instituciones habilitadas",
        value: `${activeInstitutionsCount} de ${totalInstitutions || 0}`,
        percent: activeInstitutionRate,
        tone: "gold",
      },
      {
        key: "inactiveInstitutions",
        label: "Instituciones desactivadas",
        value: `${inactiveInstitutionsCount} del total`,
        percent: inactiveInstitutionRate,
        tone: "purple",
      },
      {
        key: "recentSessions",
        label: "Sesiones recientes",
        value: `${recentSessions} en 7 dias`,
        percent: percentage(recentSessions, Math.max(recentSessions, totalStudents, 1)),
        tone: "rose",
      },
    ],
    attentionInstitutions: inactiveInstitutions.slice(0, 4),
    institutionsPreview: institutions.slice(0, 3),
    totalActiveTutors,
    totalAdmins,
    totalStudents,
    recentSessions,
    citiesCovered,
  };
};
