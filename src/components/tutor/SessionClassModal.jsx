import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";

const DEFAULT_SINGLE_LEVELS = 1;

const resolveMinigameTitle = (minijuego) =>
  minijuego?.titulo ?? minijuego?.nombre ?? minijuego?.nombre_minijuego ?? minijuego?.slug ?? "Minijuego";

const resolveMinigameDescription = (minijuego) =>
  minijuego?.descripcion ?? "Selecciona un minijuego para revisar el enfoque pedagógico de esta actividad.";

const getFirstCatalogId = (items) => (items[0]?.id ? String(items[0].id) : "");

const buildInitialDraft = (minijuegos, rutasPedagogicas) => {
  const hasSingleCatalog = minijuegos.length > 0;
  const defaultMode = hasSingleCatalog ? "single" : "path";

  return {
    modo: defaultMode,
    minijuegoId: getFirstCatalogId(minijuegos),
    niveles: String(DEFAULT_SINGLE_LEVELS),
    rutaId: getFirstCatalogId(rutasPedagogicas),
  };
};

const parsePositiveInt = (value) => {
  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
};

const validateDraft = (draft, { hasSingleCatalog, hasRouteCatalog }) => {
  if (draft.modo === "path") {
    if (!hasRouteCatalog) {
      return "No hay rutas pedagógicas publicadas para abrir esta clase.";
    }

    if (!draft.rutaId) {
      return "Debes seleccionar una ruta pedagógica para abrir la clase.";
    }

    return "";
  }

  if (!hasSingleCatalog) {
    return "No hay minijuegos publicados para abrir una actividad individual.";
  }

  if (!draft.minijuegoId) {
    return "Debes seleccionar un minijuego para abrir la clase.";
  }

  if (!parsePositiveInt(draft.niveles)) {
    return "Debes indicar una cantidad de niveles mayor a cero.";
  }

  return "";
};

const getSelectedMinigame = (minijuegos, minijuegoId) =>
  minijuegos.find((minijuego) => String(minijuego.id) === String(minijuegoId)) ?? null;

const getSelectedRoute = (rutasPedagogicas, rutaId) =>
  rutasPedagogicas.find((ruta) => String(ruta.id) === String(rutaId)) ?? null;

const formatLevelsCopy = (levels) => `${levels} nivel${levels === 1 ? "" : "es"}`;
const LEVEL_PRESETS = [1, 2, 3, 4];

export default function SessionClassModal({
  show,
  groupName,
  minijuegos,
  rutasPedagogicas,
  onClose,
  onConfirm,
  isSubmitting,
  errorMessage,
}) {
  const [draft, setDraft] = useState(() => buildInitialDraft(minijuegos, rutasPedagogicas));
  const [validationMessage, setValidationMessage] = useState("");

  const hasSingleCatalog = minijuegos.length > 0;
  const hasRouteCatalog = rutasPedagogicas.length > 0;

  useEffect(() => {
    if (!show) {
      return;
    }

    setDraft(buildInitialDraft(minijuegos, rutasPedagogicas));
    setValidationMessage("");
  }, [show, minijuegos, rutasPedagogicas]);

  const selectedMinigame = useMemo(
    () => getSelectedMinigame(minijuegos, draft.minijuegoId),
    [minijuegos, draft.minijuegoId]
  );

  const selectedRoute = useMemo(
    () => getSelectedRoute(rutasPedagogicas, draft.rutaId),
    [rutasPedagogicas, draft.rutaId]
  );

  const selectedLevels = parsePositiveInt(draft.niveles) ?? DEFAULT_SINGLE_LEVELS;

  const helperCopy = useMemo(() => {
    if (draft.modo === "path") {
      return "La ruta oficial ya viene definida desde backend. El estudiante avanza bloque por bloque y el sistema decide la configuración real de cada nivel cuando le toque jugarlo.";
    }

    return "Elige un solo minijuego y cuántos niveles jugará esta clase. Si es su primera vez, el backend arranca desde un nivel base y luego ajusta los siguientes con el desempeño real.";
  }, [draft.modo]);

  const handleModeChange = (nextMode) => {
    const canUseMode =
      nextMode === "path" ? hasRouteCatalog : hasSingleCatalog;

    if (!canUseMode) {
      return;
    }

    setDraft((prev) => ({ ...prev, modo: nextMode }));
    setValidationMessage("");
  };

  const handleConfirm = () => {
    const validationError = validateDraft(draft, {
      hasSingleCatalog,
      hasRouteCatalog,
    });

    if (validationError) {
      setValidationMessage(validationError);
      return;
    }

    if (draft.modo === "path") {
      onConfirm({
        modo: "path",
        rutaId: Number(draft.rutaId),
        rutaNombre: selectedRoute?.nombre ?? "Ruta pedagógica",
        totalPasos: Number(selectedRoute?.total_pasos ?? 0),
      });
      return;
    }

    onConfirm({
      modo: "single",
      minijuegoId: Number(draft.minijuegoId),
      minijuegoTitulo: resolveMinigameTitle(selectedMinigame),
      niveles: selectedLevels,
    });
  };

  return (
    <Modal
      show={show}
      onHide={isSubmitting ? undefined : onClose}
      centered
      size="lg"
      dialogClassName="tg-session-modal"
    >
      <Modal.Header closeButton={!isSubmitting} className="tg-session-modal__header">
        <Modal.Title className="tg-session-modal__title">Configurar actividad pedagógica</Modal.Title>
      </Modal.Header>

      <Modal.Body className="tg-session-modal__body">
        <p className="tg-session-modal__intro">
          Configura cómo quieres abrir la clase del grupo <strong>{groupName}</strong>.
        </p>

        {errorMessage ? (
          <Alert variant="danger" className="py-2 tg-session-modal__alert">
            {errorMessage}
          </Alert>
        ) : null}

        {validationMessage ? (
          <Alert variant="warning" className="py-2 tg-session-modal__alert">
            {validationMessage}
          </Alert>
        ) : null}

        <Form.Group className="mb-3">
          <Form.Label className="tg-session-modal__label">Tipo de actividad</Form.Label>
          <div className="tg-session-modal__mode-list">
            <label
              className={`tg-session-modal__mode-card${draft.modo === "single" ? " is-selected" : ""}${
                !hasSingleCatalog ? " is-disabled" : ""
              }`}
            >
              <Form.Check
                type="radio"
                id="session-mode-single"
                name="session-mode"
                label="Actividad de un juego"
                checked={draft.modo === "single"}
                onChange={() => handleModeChange("single")}
                disabled={isSubmitting || !hasSingleCatalog}
              />
              <span className="tg-session-modal__mode-copy">
                Un solo minijuego con varios niveles consecutivos.
              </span>
              {!hasSingleCatalog ? (
                <span className="tg-session-modal__mode-hint">No hay minijuegos visibles en catálogo.</span>
              ) : null}
            </label>

            <label
              className={`tg-session-modal__mode-card${draft.modo === "path" ? " is-selected" : ""}${
                !hasRouteCatalog ? " is-disabled" : ""
              }`}
            >
              <Form.Check
                type="radio"
                id="session-mode-path"
                name="session-mode"
                label="Ruta pedagógica"
                checked={draft.modo === "path"}
                onChange={() => handleModeChange("path")}
                disabled={isSubmitting || !hasRouteCatalog}
              />
              <span className="tg-session-modal__mode-copy">
                Una secuencia oficial de bloques y niveles en orden.
              </span>
              {!hasRouteCatalog ? (
                <span className="tg-session-modal__mode-hint">No hay rutas publicadas todavía.</span>
              ) : null}
            </label>
          </div>
        </Form.Group>

        <div className="tg-session-modal__helper">{helperCopy}</div>

        {draft.modo === "single" ? (
          <>
            <div className="tg-session-modal__field-grid">
              <Form.Group>
                <Form.Label className="tg-session-modal__label">Minijuego</Form.Label>
                <Form.Select
                  className="tg-session-modal__select"
                  value={draft.minijuegoId}
                  onChange={(event) => {
                    setDraft((prev) => ({ ...prev, minijuegoId: event.target.value }));
                    setValidationMessage("");
                  }}
                  disabled={isSubmitting || !hasSingleCatalog}
                >
                  <option value="">Selecciona un minijuego</option>
                  {minijuegos.map((minijuego) => (
                    <option key={minijuego.id} value={minijuego.id}>
                      {resolveMinigameTitle(minijuego)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label className="tg-session-modal__label">Cantidad de niveles</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  step="1"
                  className="tg-session-modal__number"
                  value={draft.niveles}
                  onChange={(event) => {
                    setDraft((prev) => ({ ...prev, niveles: event.target.value }));
                    setValidationMessage("");
                  }}
                  disabled={isSubmitting || !hasSingleCatalog}
                />
                <div className="tg-session-modal__preset-row">
                  {LEVEL_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`tg-session-modal__preset-pill${
                        selectedLevels === preset ? " is-selected" : ""
                      }`}
                      onClick={() => {
                        setDraft((prev) => ({ ...prev, niveles: String(preset) }));
                        setValidationMessage("");
                      }}
                      disabled={isSubmitting || !hasSingleCatalog}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </Form.Group>
            </div>

            <div className="tg-session-modal__preview-card">
              <div className="tg-session-modal__preview-head">
                <div>
                  <strong className="tg-session-modal__preview-title">
                    {selectedMinigame ? resolveMinigameTitle(selectedMinigame) : "Sin minijuego seleccionado"}
                  </strong>
                  <p className="tg-session-modal__preview-description">
                    {resolveMinigameDescription(selectedMinigame)}
                  </p>
                </div>
                <div className="tg-session-modal__meta-list">
                  <span className="tg-session-modal__meta-pill">
                    {formatLevelsCopy(selectedLevels)}
                  </span>
                  {selectedMinigame?.habilidad ? (
                    <span className="tg-session-modal__meta-pill is-soft">
                      {selectedMinigame.habilidad}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="tg-session-modal__path-shell">
            <Form.Group>
              <Form.Label className="tg-session-modal__label">Ruta oficial</Form.Label>
              <Form.Select
                className="tg-session-modal__select"
                value={draft.rutaId}
                onChange={(event) => {
                  setDraft((prev) => ({ ...prev, rutaId: event.target.value }));
                  setValidationMessage("");
                }}
                disabled={isSubmitting || !hasRouteCatalog}
              >
                <option value="">Selecciona una ruta pedagógica</option>
                {rutasPedagogicas.map((ruta) => (
                  <option key={ruta.id} value={ruta.id}>
                    {ruta.nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="tg-session-modal__path-note">
              El estudiante inicia en el primer bloque y avanza hasta el último sin saltarse ninguno. Cada bloque puede contener uno o más niveles del mismo minijuego.
            </div>

            <div className="tg-session-modal__preview-card">
              <div className="tg-session-modal__preview-head">
                <div>
                  <strong className="tg-session-modal__preview-title">
                    {selectedRoute?.nombre ?? "Sin ruta seleccionada"}
                  </strong>
                  <p className="tg-session-modal__preview-description">
                    {selectedRoute?.descripcion ??
                      "Selecciona una ruta publicada para revisar el orden de minijuegos y niveles."}
                  </p>
                </div>

                {selectedRoute ? (
                  <div className="tg-session-modal__meta-list">
                    <span className="tg-session-modal__meta-pill">
                      {selectedRoute.total_bloques} bloque{selectedRoute.total_bloques === 1 ? "" : "s"}
                    </span>
                    <span className="tg-session-modal__meta-pill is-soft">
                      {formatLevelsCopy(Number(selectedRoute.total_pasos ?? 0))}
                    </span>
                  </div>
                ) : null}
              </div>

              {selectedRoute?.bloques?.length ? (
                <div className="tg-session-modal__route-blocks">
                  {selectedRoute.bloques.map((bloque) => (
                    <div key={bloque.id} className="tg-session-modal__route-block">
                      <div className="tg-session-modal__route-block-head">
                        <strong>Bloque {bloque.orden}</strong>
                        <span>{formatLevelsCopy(Number(bloque.niveles ?? 1))}</span>
                      </div>
                      <div className="tg-session-modal__route-block-title">
                        {bloque.minijuego_titulo}
                      </div>
                      <p className="tg-session-modal__route-block-copy">
                        {bloque.habilidad ? `Enfoque: ${bloque.habilidad}. ` : ""}
                        Se habilita cuando el estudiante complete el bloque anterior.
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}

        <div className="tg-session-modal__summary">
          <div className="tg-session-modal__summary-title">Resumen de la actividad</div>

          {draft.modo === "single" ? (
            <div className="tg-session-modal__summary-copy">
              <div className="mb-1">
                <strong>Tipo:</strong> Actividad de un juego
              </div>
              <div className="mb-1">
                <strong>Juego:</strong> {selectedMinigame ? resolveMinigameTitle(selectedMinigame) : "Sin seleccionar"}
              </div>
              <div className="mb-1">
                <strong>Recorrido:</strong> {formatLevelsCopy(selectedLevels)}
              </div>
              <div>
                El backend traducirá esta actividad a niveles secuenciales del mismo minijuego y decidirá la configuración real de cada uno.
              </div>
            </div>
          ) : (
            <div className="tg-session-modal__summary-copy">
              <div className="mb-1">
                <strong>Tipo:</strong> Ruta pedagógica
              </div>
              <div className="mb-1">
                <strong>Ruta:</strong> {selectedRoute?.nombre ?? "Sin seleccionar"}
              </div>
              <div className="mb-1">
                <strong>Alcance:</strong>{" "}
                {selectedRoute
                  ? `${selectedRoute.total_bloques} bloque${selectedRoute.total_bloques === 1 ? "" : "s"} · ${formatLevelsCopy(
                      Number(selectedRoute.total_pasos ?? 0)
                    )}`
                  : "Sin ruta configurada"}
              </div>
              <div>
                La clase seguirá el orden oficial de la ruta hasta completar el último bloque disponible.
              </div>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer className="tg-session-modal__footer">
        <Button
          variant="outline-secondary"
          className="tg-session-modal__footer-btn tg-session-modal__footer-btn--secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          className="tg-session-modal__footer-btn tg-session-modal__footer-btn--primary"
          onClick={handleConfirm}
          disabled={isSubmitting || (!hasSingleCatalog && !hasRouteCatalog)}
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="me-2" />
              Abriendo...
            </>
          ) : (
            "Confirmar apertura"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
