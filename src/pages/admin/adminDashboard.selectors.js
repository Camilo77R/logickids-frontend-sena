const percentage = (value, total) => {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
};

/**
 * buildAdminDashboardView
 *
 * Convierte datos crudos del backend en un view-model
 * listo para pintar en el dashboard admin.
 */
export const buildAdminDashboardView = ({ users, pendingRequests, institutionName }) => {
  const tutors = users.filter((user) => user.rol === "tutor");
  const activeTutors = tutors.filter((user) => user.estado === "activo");
  const inactiveTutors = tutors.filter((user) => user.estado === "inactivo");
  const suspendedTutors = tutors.filter((user) => user.estado === "suspendido");
  const tutorPreview = [...tutors]
    .sort((left, right) => {
      const leftPriority = left.estado === "activo" ? 0 : left.estado === "inactivo" ? 1 : 2;
      const rightPriority = right.estado === "activo" ? 0 : right.estado === "inactivo" ? 1 : 2;

      return leftPriority - rightPriority;
    })
    .slice(0, 4);

  const totalTutors = tutors.length;
  const activeRate = percentage(activeTutors.length, totalTutors);
  const pendingRate = percentage(pendingRequests, totalTutors || pendingRequests || 1);
  const suspendedRate = percentage(suspendedTutors.length, totalTutors);

  return {
    heroTags: [
      { label: "Institución", value: institutionName || "Sin nombre" },
      { label: "Tutores", value: totalTutors },
      { label: "Activos", value: `${activeRate}%` },
    ],
    metrics: [
      {
        key: "tutores",
        label: "Tutores registrados",
        value: totalTutors,
        description: "Cuentas docentes visibles dentro de tu institución.",
        tone: "purple",
      },
      {
        key: "activos",
        label: "Tutores activos",
        value: activeTutors.length,
        description: "Ya pueden iniciar sesión y operar sus aulas.",
        tone: "gold",
      },
      {
        key: "pendientes",
        label: "Pendientes por activar",
        value: inactiveTutors.length,
        description: "Nuevas cuentas o accesos aún sin habilitar.",
        tone: "orange",
      },
      {
        key: "suspendidos",
        label: "Suspendidos",
        value: suspendedTutors.length,
        description: "Requieren intervención institucional.",
        tone: "rose",
      },
    ],
    progress: [
      {
        key: "active",
        label: "Cuentas activas",
        value: `${activeTutors.length} de ${totalTutors}`,
        percent: activeRate,
        tone: "gold",
      },
      {
        key: "pending",
        label: "Solicitudes por revisar",
        value: `${pendingRequests} en cola`,
        percent: pendingRate,
        tone: "orange",
      },
      {
        key: "suspended",
        label: "Bloqueos temporales",
        value: `${suspendedTutors.length} casos`,
        percent: suspendedRate,
        tone: "rose",
      },
    ],
    tutorPreview,
  };
};
