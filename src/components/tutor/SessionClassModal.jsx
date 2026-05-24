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

  const helperCopy = useMemo(() => {
    if (draft.modo === "path") {
      return "Configura la ruta paso a paso. Si quieres varios niveles del mismo juego, puedes repetir el minijuego en pasos distintos.";
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
    <Modal show={show} onHide={isSubmitting ? undefined : onClose} centered size="lg">
      <Modal.Header closeButton={!isSubmitting}>
        <Modal.Title>Abrir actividad pedagógica</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="text-muted mb-3">
          Configura cómo quieres abrir la clase del grupo <strong>{groupName}</strong>.
        </p>

        {errorMessage ? (
          <Alert variant="danger" className="py-2">
            {errorMessage}
          </Alert>
        ) : null}

        {validationMessage ? (
          <Alert variant="warning" className="py-2">
            {validationMessage}
          </Alert>
        ) : null}

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Modo de sesión</Form.Label>
          <div className="d-flex flex-column gap-2">
            <Form.Check
              type="radio"
              id="session-mode-single"
              name="session-mode"
              label="Single: una actividad puntual con un solo minijuego"
              checked={draft.modo === "single"}
              onChange={() => handleModeChange("single")}
              disabled={isSubmitting}
            />
            <Form.Check
              type="radio"
              id="session-mode-path"
              name="session-mode"
              label="Path: una ruta pedagógica con varios pasos secuenciales"
              checked={draft.modo === "path"}
              onChange={() => handleModeChange("path")}
              disabled={isSubmitting}
            />
          </div>
        </Form.Group>

        <Alert variant="light" className="border small text-muted">
          {helperCopy}
        </Alert>

        {draft.modo === "single" ? (
          <Form.Group>
            <Form.Label className="fw-semibold">Minijuego inicial</Form.Label>
            <Form.Select
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
          <div className="d-flex flex-column gap-3">
            {draft.pasos.map((paso, index) => (
              <div key={paso.localId} className="border rounded-3 p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <strong>Paso {index + 1}</strong>
                    <div className="small text-muted">
                      Este paso se desbloquea cuando el estudiante complete el anterior.
                    </div>
                  </div>

                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removePathStep(paso.localId)}
                    disabled={isSubmitting || draft.pasos.length <= 2}
                  >
                    Quitar
                  </Button>
                </div>

                <Form.Select
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

            <div className="d-flex justify-content-between align-items-center">
              <span className="small text-muted">
                Máximo 25 pasos por sesión. Puedes repetir un minijuego para crear varios niveles.
              </span>
              <Button
                variant="outline-primary"
                onClick={addPathStep}
                disabled={isSubmitting || !canAddMoreSteps}
              >
                Agregar paso
              </Button>
            </div>
          </div>
        )}

        <div className="border rounded-3 p-3 mt-4 bg-light-subtle">
          <div className="fw-semibold mb-2">Resumen de la actividad</div>

          {draft.modo === "single" ? (
            <div className="small text-muted">
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
            <div className="small text-muted">
              <div className="mb-2">
                <strong>Modo:</strong> Ruta pedagógica de {routePreview.length} paso
                {routePreview.length === 1 ? "" : "s"}
              </div>
              <ol className="mb-0 ps-3">
                {routePreview.map((paso) => (
                  <li key={`${paso.orden}-${paso.titulo}`} className={paso.isConfigured ? "" : "text-danger"}>
                    {paso.titulo}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={isSubmitting}>
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
