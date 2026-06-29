/**
 * Tutor dashboard selectors
 *
 * POR QUE: la página no debe mezclar fetch, reglas de dominio y markup.
 * Estos selectores transforman la respuesta cruda del backend en datos listos
 * para pintar sin acoplar la UI al shape original del endpoint.
 */

const DEFAULT_GROUP_DESCRIPTION = "Sin descripción pedagógica configurada.";

const isSesionActiva = (value) =>
  value === true || value === "true" || value === "t" || value === 1;

const normalizeGroup = (group) => ({
  id: group.id ?? group.id_grupo ?? crypto.randomUUID(),
  nombre: group.nombre?.trim() || "Grupo sin nombre",
  descripcion: group.descripcion?.trim() || DEFAULT_GROUP_DESCRIPTION,
  sesionActiva: isSesionActiva(group.sesion_activa),
  predeterminado: Boolean(group.predeterminado),
});

export function buildTutorDashboardView(rawGroups = []) {
  const groups = rawGroups.map(normalizeGroup);
  const totalGroups = groups.length;
  const activeGroups = groups.filter((group) => group.sesionActiva).length;
  const inactiveGroups = totalGroups - activeGroups;
  const readinessRate =
    totalGroups === 0 ? 0 : Math.round((activeGroups / totalGroups) * 100);

  const statusTone =
    totalGroups === 0 ? "idle" : activeGroups > 0 ? "active" : "paused";

  const statusTitleByTone = {
    idle: "Aún no has creado grupos",
    active: "Hay clases en marcha",
    paused: "Todo listo para comenzar",
  };

  const statusMessageByTone = {
    idle: "Crea tu primer grupo para empezar a organizar estudiantes, sesiones y resultados.",
    active:
      activeGroups === 1
        ? "Tienes 1 grupo con sesión abierta. Ya puedes revisar resultados y acompañar el juego."
        : `Tienes ${activeGroups} grupos con sesión abierta. El tablero ya está recibiendo movimiento real.`,
    paused:
      totalGroups === 1
        ? "Tu grupo está preparado, pero la sesión sigue cerrada. Ábrela desde Mis Grupos cuando quieras jugar."
        : `Tienes ${totalGroups} grupos creados, pero ninguno tiene sesión activa. Ábrela desde Mis Grupos cuando quieras empezar.`,
  };

  return {
    summary: {
      totalGroups,
      activeGroups,
      inactiveGroups,
      readinessRate,
    },
    heroTags: [
      { label: `${totalGroups}`, helper: "grupos" },
      { label: `${activeGroups}`, helper: "activos" },
      { label: `${inactiveGroups}`, helper: "en pausa" },
    ],
    status: {
      tone: statusTone,
      title: statusTitleByTone[statusTone],
      message: statusMessageByTone[statusTone],
    },
    highlightedGroups: groups.slice(0, 4),
    hasGroups: totalGroups > 0,
  };
}
