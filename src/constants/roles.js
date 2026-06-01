/**
 * Roles del sistema LogicKids.
 *
 * - SUPERADMIN: acceso global — gestiona instituciones y minijuegos de toda la plataforma
 * - ADMIN:      acceso por institución — organiza tutores, grupos y estudiantes del colegio
 * - TUTOR:      acceso propio — opera sus clases y acompaña la experiencia pedagógica
 */
export const USER_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  TUTOR: "tutor",
};

/** Opciones válidas de estado para un usuario (usadas en formularios) */
export const USER_STATE_OPTIONS = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
  { value: "suspendido", label: "Suspendido" },
];
