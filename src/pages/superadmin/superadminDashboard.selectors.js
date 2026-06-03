const percentage = (value, total) => {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
};

/**
 * buildSuperadminDashboardView
 *
 * Transforma datos globales en un view-model del panel superadmin.
 */
export const buildSuperadminDashboardView = ({
  institutions,
}) => {
  const totalInstitutions = institutions.length;
  const activeInstitutions = institutions.filter((institution) => institution.activo);
  const inactiveInstitutions = institutions.filter((institution) => !institution.activo);
  const totalActiveTutors = institutions.reduce(
    (sum, institution) => sum + Number(institution.tutores_activos ?? 0),
    0
  );
  const citiesCovered = new Set(
    institutions
      .map((institution) => institution.ciudad?.trim())
      .filter(Boolean)
  ).size;

  const activeInstitutionRate = percentage(activeInstitutions.length, totalInstitutions);
  const inactiveInstitutionRate = percentage(inactiveInstitutions.length, totalInstitutions || 1);

  return {
    heroTags: [
      { label: "Instituciones", value: totalInstitutions },
      { label: "Ciudades", value: citiesCovered },
      { label: "Tutores activos", value: totalActiveTutors },
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
        value: activeInstitutions.length,
        description: "Hoy pueden operar normalmente dentro de la plataforma.",
        tone: "gold",
      },
      {
        key: "tutores",
        label: "Tutores activos",
        value: totalActiveTutors,
        description: "Suma global de docentes habilitados en la red.",
        tone: "orange",
      },
      {
        key: "ciudades",
        label: "Ciudades cubiertas",
        value: citiesCovered,
        description: "Expansión territorial visible con el contrato actual.",
        tone: "rose",
      },
    ],
    progress: [
      {
        key: "activeInstitutions",
        label: "Instituciones habilitadas",
        value: `${activeInstitutions.length} de ${totalInstitutions || 0}`,
        percent: activeInstitutionRate,
        tone: "gold",
      },
      {
        key: "inactiveInstitutions",
        label: "Instituciones desactivadas",
        value: `${inactiveInstitutions.length} del total`,
        percent: inactiveInstitutionRate,
        tone: "purple",
      },
      {
        key: "coveredCities",
        label: "Cobertura territorial",
        value: `${citiesCovered} ciudad(es)`,
        percent: percentage(citiesCovered, totalInstitutions || citiesCovered || 1),
        tone: "rose",
      },
    ],
    attentionInstitutions: inactiveInstitutions.slice(0, 4),
    institutionsPreview: institutions.slice(0, 3),
    totalActiveTutors,
  };
};
