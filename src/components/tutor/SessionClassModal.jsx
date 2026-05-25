import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";

let localStepSeed = 0;

const createLocalStepId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  localStepSeed += 1;
  return `session-step-${Date.now()}-${localStepSeed}`;
};

const createStepDraft = (minijuegoId = "") => ({
  localId: createLocalStepId(),
  minijuegoId: String(minijuegoId || ""),
});

const buildDefaultPathSteps = (minijuegos) => {
  const firstId = minijuegos[0]?.id ? String(minijuegos[0].id) : "";
  const secondId = minijuegos[1]?.id ? String(minijuegos[1].id) : firstId;

  return [createStepDraft(firstId), createStepDraft(secondId)];
};

const buildInitialDraft = (minijuegos) => ({
  modo: "single",
  minijuegoId: minijuegos[0]?.id ? String(minijuegos[0].id) : "",
  pasos: buildDefaultPathSteps(minijuegos),
});

const validateDraft = (draft) => {
  if (draft.modo === "path") {
    if (!Array.isArray(draft.pasos) || draft.pasos.length < 2) {
      return "Una ruta pedagógica necesita al menos dos pasos.";
    }

    if (draft.pasos.some((paso) => !paso.minijuegoId)) {
      return "Cada paso de la ruta debe tener un minijuego seleccionado.";
    }

    return "";
  }

  if (!draft.minijuegoId) {
    return "Debes seleccionar un minijuego para abrir la clase.";
  }

  return "";
};

const getSelectedMinigameTitle = (minijuegos, minijuegoId) =>
  minijuegos.find((minijuego) => String(minijuego.id) === String(minijuegoId))?.titulo ??
  "Sin seleccionar";

export default function SessionClassModal({
  show,
  groupName,
  minijuegos,
  onClose,
  onConfirm,
  isSubmitting,
  errorMessage,
}) {
  const [draft, setDraft] = useState(() => buildInitialDraft(minijuegos));
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    if (!show) {
      return;
    }

    setDraft(buildInitialDraft(minijuegos));
    setValidationMessage("");
  }, [show, minijuegos]);

  const canAddMoreSteps = draft.pasos.length < 25;
  const routePreview = draft.pasos.map((paso, index) => ({
    orden: index + 1,
    titulo: getSelectedMinigameTitle(minijuegos, paso.minijuegoId),
    isConfigured: Boolean(paso.minijuegoId),
  }));
  const firstPathStepTitle = routePreview[0]?.titulo ?? "Sin seleccionar";
  const lastPathStepTitle = routePreview[routePreview.length - 1]?.titulo ?? "Sin seleccionar";

  const helperCopy = useMemo(() => {
    if (draft.modo === "path") {
      return "La ruta se juega en orden, del paso 1 al último. Si necesitas varios niveles del mismo juego, repítelo en pasos consecutivos.";
    }

    return "Abre una actividad puntual con un solo minijuego. La adaptación posterior la decidirá el backend según desempeño.";
  }, [draft.modo]);

  const handleModeChange = (nextMode) => {
    setDraft((prev) => ({
      ...prev,
      modo: nextMode,
      pasos:
        nextMode === "path" && prev.pasos.length < 2
          ? buildDefaultPathSteps(minijuegos)
          : prev.pasos,
    }));
    setValidationMessage("");
  };

  const updatePathStep = (localId, minijuegoId) => {
    setDraft((prev) => ({
      ...prev,
      pasos: prev.pasos.map((paso) =>
        paso.localId === localId ? { ...paso, minijuegoId } : paso
      ),
    }));
    setValidationMessage("");
  };

  const addPathStep = () => {
    setDraft((prev) => ({
      ...prev,
      pasos: [
        ...prev.pasos,
        createStepDraft(prev.pasos[prev.pasos.length - 1]?.minijuegoId ?? ""),
      ],
    }));
    setValidationMessage("");
  };

  const removePathStep = (localId) => {
    setDraft((prev) => ({
      ...prev,
      pasos: prev.pasos.filter((paso) => paso.localId !== localId),
    }));
    setValidationMessage("");
  };

  const handleConfirm = () => {
    const validationError = validateDraft(draft);
    if (validationError) {
      setValidationMessage(validationError);
      return;
    }

    onConfirm({
      modo: draft.modo,
      minijuegoId: draft.minijuegoId ? Number(draft.minijuegoId) : null,
      pasos: draft.pasos.map((paso) => ({
        minijuegoId: Number(paso.minijuegoId),
      })),
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
        <Modal.Title className="tg-session-modal__title">Abrir actividad pedagógica</Modal.Title>
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
          <Form.Label className="tg-session-modal__label">Modo de sesión</Form.Label>
          <div className="tg-session-modal__mode-list">
            <label className={`tg-session-modal__mode-card${draft.modo === "single" ? " is-selected" : ""}`}>
              <Form.Check
                type="radio"
                id="session-mode-single"
                name="session-mode"
                label="Single"
                checked={draft.modo === "single"}
                onChange={() => handleModeChange("single")}
                disabled={isSubmitting}
              />
              <span className="tg-session-modal__mode-copy">
                Una actividad puntual con un solo minijuego.
              </span>
            </label>
            <label className={`tg-session-modal__mode-card${draft.modo === "path" ? " is-selected" : ""}`}>
              <Form.Check
                type="radio"
                id="session-mode-path"
                name="session-mode"
                label="Path"
                checked={draft.modo === "path"}
                onChange={() => handleModeChange("path")}
                disabled={isSubmitting}
              />
              <span className="tg-session-modal__mode-copy">
                Una ruta pedagógica con varios pasos secuenciales.
              </span>
            </label>
          </div>
        </Form.Group>

        <div className="tg-session-modal__helper">
          {helperCopy}
        </div>

        {draft.modo === "single" ? (
          <Form.Group>
            <Form.Label className="tg-session-modal__label">Minijuego inicial</Form.Label>
            <Form.Select
              className="tg-session-modal__select"
              value={draft.minijuegoId}
              onChange={(event) => {
                setDraft((prev) => ({ ...prev, minijuegoId: event.target.value }));
                setValidationMessage("");
              }}
              disabled={isSubmitting}
            >
              <option value="">Selecciona un minijuego</option>
              {minijuegos.map((minijuego) => (
                <option key={minijuego.id} value={minijuego.id}>
                  {minijuego.titulo}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        ) : (
          <div className="tg-session-modal__path-shell">
            <div className="tg-session-modal__path-note">
              El estudiante empezará en el <strong>paso 1</strong> y avanzará hasta el último sin saltarse ninguno.
            </div>

            <div className="tg-session-modal__steps">
              {draft.pasos.map((paso, index) => (
                <div key={paso.localId} className="tg-session-modal__step">
                  <div className="tg-session-modal__step-head">
                    <div>
                      <strong className="tg-session-modal__step-title">Paso {index + 1}</strong>
                      <div className="tg-session-modal__step-copy">
                        Se habilita cuando el estudiante complete el paso anterior.
                      </div>
                    </div>

                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="tg-session-modal__ghost-btn"
                      onClick={() => removePathStep(paso.localId)}
                      disabled={isSubmitting || draft.pasos.length <= 2}
                    >
                      Quitar
                    </Button>
                  </div>

                  <Form.Select
                    className="tg-session-modal__select"
                    value={paso.minijuegoId}
                    onChange={(event) => updatePathStep(paso.localId, event.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Selecciona un minijuego</option>
                    {minijuegos.map((minijuego) => (
                      <option key={minijuego.id} value={minijuego.id}>
                        {minijuego.titulo}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              ))}
            </div>

            <div className="tg-session-modal__step-footer">
              <span className="tg-session-modal__footnote">
                Máximo 25 pasos por sesión. Puedes repetir un minijuego para crear varios niveles.
              </span>
              <Button
                variant="outline-secondary"
                className="tg-session-modal__ghost-btn"
                onClick={addPathStep}
                disabled={isSubmitting || !canAddMoreSteps}
              >
                Agregar paso
              </Button>
            </div>
          </div>
        )}

        <div className="tg-session-modal__summary">
          <div className="tg-session-modal__summary-title">Resumen de la actividad</div>

          {draft.modo === "single" ? (
            <div className="tg-session-modal__summary-copy">
              <div className="mb-1">
                <strong>Modo:</strong> Sesión individual
              </div>
              <div className="mb-1">
                <strong>Juego seleccionado:</strong>{" "}
                {getSelectedMinigameTitle(minijuegos, draft.minijuegoId)}
              </div>
              <div>
                El estudiante jugará este único minijuego y el backend decidirá la configuración final de la partida.
              </div>
            </div>
          ) : (
            <div className="tg-session-modal__summary-copy">
              <div className="mb-2">
                <strong>Modo:</strong> Ruta pedagógica de {routePreview.length} paso
                {routePreview.length === 1 ? "" : "s"}
              </div>
              <div className="mb-1">
                <strong>Inicio:</strong> {firstPathStepTitle}
              </div>
              <div className="mb-1">
                <strong>Cierre:</strong> {lastPathStepTitle}
              </div>
              <div>
                La ruta se jugará de forma secuencial hasta completar el último paso.
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="me-2" />
              Abriendo...
            </>
          ) : (
            "Abrir clase"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
