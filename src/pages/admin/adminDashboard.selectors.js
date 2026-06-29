const percentage = (value, total) => {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
};

const sortByName = (left, right) =>
  (left.nombre || "").localeCompare(right.nombre || "", "es");

const sortAdmins = (left, right) => {
  if (left.es_admin_principal && !right.es_admin_principal) return -1;
  if (!left.es_admin_principal && right.es_admin_principal) return 1;
  return sortByName(left, right);
};

/**
 * buildAdminDashboardView
 *
 * Convierte datos crudos del backend en un view-model
 * listo para pintar en el dashboard admin.
 */
export const buildAdminDashboardView = ({
  tutors = [],
  admins = [],
  students = [],
  pendingRequests = 0,
  institutionName,
}) => {
  const activeTutors = tutors.filter((user) => user.estado === "activo");
  const inactiveTutors = tutors.filter((user) => user.estado === "inactivo");
  const suspendedTutors = tutors.filter((user) => user.estado === "suspendido");
  const activeAdmins = admins.filter((admin) => admin.estado === "activo");
  const inactiveAdmins = admins.filter((admin) => admin.estado === "inactivo");
  const activeStudents = students.filter((student) => (student.estado || "activo") === "activo");
  const inactiveStudents = students.filter((student) => (student.estado || "activo") === "inactivo");
  const studentsInClass = students.filter((student) => student.sesion_activa === true);

  const totalTutors = tutors.length;
  const totalAdmins = admins.length;
  const totalStudents = students.length;
  const activeTutorRate = percentage(activeTutors.length, totalTutors);
  const pendingRate = percentage(pendingRequests, totalTutors || pendingRequests || 1);
  const suspendedRate = percentage(suspendedTutors.length, totalTutors);

  return {
    heroTags: [
      { label: "Institucion", value: institutionName || "Sin nombre" },
      { label: "Admins", value: totalAdmins },
      { label: "Estudiantes", value: totalStudents },
    ],
    metrics: [
      {
        key: "admins",
        label: "Admins activos",
        value: activeAdmins.length,
        description: "Responsables administrativos con acceso habilitado.",
        tone: "gray",
      },
      {
        key: "tutores",
        label: "Tutores activos",
        value: activeTutors.length,
        description: "Cuentas docentes listas para operar sus aulas.",
        tone: "gray",
      },
      {
        key: "estudiantes",
        label: "Estudiantes activos",
        value: activeStudents.length,
        description: "Alumnado listo para participar en sesiones de clase.",
        tone: "gray",
      },
      {
        key: "solicitudes",
        label: "Solicitudes pendientes",
        value: pendingRequests,
        description: "Reactivaciones que esperan revision administrativa.",
        tone: "gray",
      },
    ],
    progress: [
      {
        key: "active",
        label: "Tutores activos",
        value: `${activeTutors.length} de ${totalTutors}`,
        percent: activeTutorRate,
        tone: "gray",
      },
      {
        key: "pending",
        label: "Solicitudes por revisar",
        value: `${pendingRequests} en cola`,
        percent: pendingRate,
        tone: "gray",
      },
      {
        key: "suspended",
        label: "Bloqueos temporales",
        value: `${suspendedTutors.length} casos`,
        percent: suspendedRate,
        tone: "gray",
      },
    ],
    totals: {
      admins: totalAdmins,
      tutors: totalTutors,
      students: totalStudents,
      inactiveAdmins: inactiveAdmins.length,
      inactiveTutors: inactiveTutors.length,
      inactiveStudents: inactiveStudents.length,
      studentsInClass: studentsInClass.length,
    },
    activeAdminPreview: [...activeAdmins].sort(sortAdmins),
    activeTutorPreview: [...activeTutors].sort(sortByName),
    activeStudentPreview: [...activeStudents].sort(sortByName),
  };
};
