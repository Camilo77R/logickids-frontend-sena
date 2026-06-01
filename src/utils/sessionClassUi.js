const TRUTHY_SESSION_VALUES = new Set([true, "true", "t", 1, "1"]);

const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const getSafeStepCount = (group) => {
  const totalSteps = Number(group?.sesion_total_pasos ?? 0);
  return totalSteps > 0 ? totalSteps : 1;
};

export const isSessionActive = (value) => TRUTHY_SESSION_VALUES.has(value);

export const getSessionModeLabel = (group) => {
  if (!isSessionActive(group?.sesion_activa)) {
    return "Sin actividad abierta";
  }

  return group?.sesion_modo === "path" ? "Ruta pedagógica" : "Actividad de un juego";
};

export const getSessionStepsLabel = (group) => {
  if (!isSessionActive(group?.sesion_activa)) {
    return "Sin niveles activos";
  }

  return pluralize(getSafeStepCount(group), "nivel");
};

export const getSessionHeadline = (group) => {
  if (!isSessionActive(group?.sesion_activa)) {
    return "Diseña la próxima actividad";
  }

  if (group?.sesion_modo === "path") {
    return group?.sesion_ruta_nombre || "Ruta pedagógica activa";
  }

  return group?.sesion_minijuego_titulo || "Actividad en curso";
};

export const getSessionSummaryText = (group) => {
  if (!isSessionActive(group?.sesion_activa)) {
    return "No hay actividad pedagógica abierta en este momento.";
  }

  const stepCopy = getSessionStepsLabel(group).toLowerCase();

  if (group?.sesion_modo === "path") {
    const routeName = group?.sesion_ruta_nombre || "Ruta oficial";
    return `${getSessionModeLabel(group)} · ${stepCopy} · Ruta: ${routeName}`;
  }

  const gameName = group?.sesion_minijuego_titulo || "Juego pendiente";
  return `${getSessionModeLabel(group)} · ${stepCopy} · Juego: ${gameName}`;
};

export const getSessionOpenSuccessMessage = (groupName, sessionPlan) => {
  if (sessionPlan?.modo === "path") {
    const routeName = sessionPlan?.rutaNombre || "Ruta pedagógica";
    const totalSteps = Number(sessionPlan?.totalPasos ?? 0);
    const stepsCopy = totalSteps > 0 ? ` con ${pluralize(totalSteps, "nivel")}` : "";
    return `${routeName} quedó abierta para "${groupName}"${stepsCopy}.`;
  }

  const gameName = sessionPlan?.minijuegoTitulo || "la actividad seleccionada";
  const totalLevels = Number(sessionPlan?.niveles ?? 0);
  const levelsCopy = totalLevels > 0 ? ` con ${pluralize(totalLevels, "nivel")}` : "";
  return `${gameName} quedó abierto para "${groupName}"${levelsCopy}.`;
};
