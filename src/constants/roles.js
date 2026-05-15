/**
 * Roles del sistema LogicKids.
 *
 * - SUPERADMIN: acceso global — gestiona instituciones y minijuegos de toda la plataforma
 * - ADMIN:      acceso por institución — gestiona tutores de su colegio
 * - TUTOR:      acceso propio — gestiona sus grupos y estudiantes
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
