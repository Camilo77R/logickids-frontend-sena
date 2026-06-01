import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";

export default function SessionMinigameModal({
  show,
  groupName,
  minijuegos,
  selectedMinigameId,
  onSelect,
  onClose,
  onConfirm,
  isSubmitting,
  errorMessage,
}) {
  return (
    <Modal show={show} onHide={isSubmitting ? undefined : onClose} centered>
      <Modal.Header closeButton={!isSubmitting}>
        <Modal.Title>Abrir sesión de clase</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="text-muted mb-3">
          Selecciona el minijuego con el que quieres abrir la clase del grupo{" "}
          <strong>{groupName}</strong>.
        </p>

        {errorMessage ? (
          <Alert variant="danger" className="py-2">
            {errorMessage}
          </Alert>
        ) : null}

        <Form.Group>
          <Form.Label className="fw-semibold">Minijuego</Form.Label>
          <Form.Select
            value={selectedMinigameId}
            onChange={(event) => onSelect(event.target.value)}
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
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={isSubmitting || !selectedMinigameId}
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
