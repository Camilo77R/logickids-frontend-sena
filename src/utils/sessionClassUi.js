const TRUTHY_SESSION_VALUES = new Set([true, "true", "t", 1, "1"]);

export const isSessionActive = (value) => TRUTHY_SESSION_VALUES.has(value);

export const getSessionModeLabel = (group) => {
  if (!isSessionActive(group?.sesion_activa)) {
    return "Sin actividad abierta";
  }

  return group?.sesion_modo === "path" ? "Ruta pedagógica" : "Sesión individual";
};

export const getSessionStepsLabel = (group) => {
  if (!isSessionActive(group?.sesion_activa)) {
    return "Sin pasos activos";
  }

  const totalSteps = Number(group?.sesion_total_pasos ?? 0);
  return `${totalSteps || 1} paso${totalSteps === 1 ? "" : "s"}`;
};

export const getSessionSummaryText = (group) => {
  if (!isSessionActive(group?.sesion_activa)) {
    return "No hay actividad pedagógica abierta en este momento.";
  }

  const totalSteps = Number(group?.sesion_total_pasos ?? 0);
  const stepCopy =
    totalSteps > 0
      ? `${totalSteps} paso${totalSteps === 1 ? "" : "s"}`
      : "sin pasos reportados";
  const initialGame = group?.sesion_minijuego_titulo || "Actividad inicial";

  return `${getSessionModeLabel(group)} · ${stepCopy} · Inicio: ${initialGame}`;
};
