import { useEffect, useState } from "react";
import { Users, Play, Square, Edit, Trash2, Plus, FolderOpen, Route } from "lucide-react";
import { Container, Row, Col, Card, Button, Alert, Spinner, Modal, Form } from "react-bootstrap";
import SessionClassModal from "../../components/tutor/SessionClassModal";
import tutorGroupsService from "../../services/tutorGroupsService";
import {
  getSessionModeLabel,
  getSessionStepsLabel,
  getSessionSummaryText,
  isSessionActive,
} from "../../utils/sessionClassUi";

const INITIAL_GROUP_FORM = {
  nombre: "",
  descripcion: "",
  predeterminado: false,
};

export default function TutorGruposPage() {
  const [grupos, setGrupos] = useState([]);
  const [minijuegos, setMinijuegos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [cargandoAccion, setCargandoAccion] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_GROUP_FORM);

  const [sessionModal, setSessionModal] = useState({
    open: false,
    group: null,
    error: "",
  });

  const setSuccessFeedback = (message) => setFeedback({ type: "success", message });
  const setErrorFeedback = (message) => setFeedback({ type: "danger", message });

  const cargarTodo = async () => {
    try {
      setCargando(true);
      const [groups, games] = await Promise.all([
        tutorGroupsService.getGroups(),
        tutorGroupsService.listarMinijuegosActivos(),
      ]);

      setGrupos(groups);
      setMinijuegos(games);
      setError(null);
    } catch (err) {
      setError(err.message || "Error al cargar los grupos del tutor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const abrirModalCrear = () => {
    setEditandoId(null);
    setFormData(INITIAL_GROUP_FORM);
    setShowModal(true);
  };

  const abrirModalEditar = (grupo) => {
    setEditandoId(grupo.id);
    setFormData({
      nombre: grupo.nombre,
      descripcion: grupo.descripcion || "",
      predeterminado: grupo.predeterminado || false,
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
  };

  const closeSessionModal = () => {
    setSessionModal({
      open: false,
      group: null,
      error: "",
    });
  };

  const handleGuardarGrupo = async (event) => {
    event.preventDefault();

    if (formData.nombre.trim().length < 2) {
      setErrorFeedback("El nombre del grupo debe tener al menos 2 caracteres.");
      return;
    }

    try {
      setGuardando(true);

      if (editandoId) {
        await tutorGroupsService.actualizarGrupo(editandoId, formData);
        setSuccessFeedback(`El grupo "${formData.nombre}" quedó actualizado.`);
      } else {
        await tutorGroupsService.crearGrupo(formData);
        setSuccessFeedback(`El grupo "${formData.nombre}" quedó creado correctamente.`);
      }

      await cargarTodo();
      cerrarModal();
    } catch (err) {
      setErrorFeedback(err.message || "No fue posible guardar el grupo.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarGrupo = async (grupo) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el grupo "${grupo.nombre}"?`)) {
      return;
    }

    try {
      setCargandoAccion(grupo.id);
      await tutorGroupsService.eliminarGrupo(grupo.id);
      await cargarTodo();
      setSuccessFeedback(`El grupo "${grupo.nombre}" fue eliminado.`);
    } catch (err) {
      setErrorFeedback(err.message || "No fue posible eliminar el grupo.");
    } finally {
      setCargandoAccion(null);
    }
  };

  const openSessionModal = (grupo) => {
    if (!minijuegos.length) {
      setErrorFeedback("No hay minijuegos activos disponibles para abrir la clase.");
      return;
    }

    setSessionModal({
      open: true,
      group: grupo,
      error: "",
    });
  };

  const handleToggleSesion = async (grupo) => {
    if (!isSessionActive(grupo.sesion_activa)) {
      openSessionModal(grupo);
      return;
    }

    try {
      setCargandoAccion(grupo.id);
      await tutorGroupsService.cerrarSesionClase(grupo.id);
      await cargarTodo();
      setSuccessFeedback(`La actividad pedagógica de "${grupo.nombre}" quedó cerrada.`);
    } catch (err) {
      setErrorFeedback(err.message || "No fue posible cerrar la clase.");
    } finally {
      setCargandoAccion(null);
    }
  };

  const handleConfirmOpenSession = async (sessionPlan) => {
    if (!sessionModal.group) {
      closeSessionModal();
      return;
    }

    try {
      setCargandoAccion(sessionModal.group.id);
      await tutorGroupsService.abrirSesionClase(sessionModal.group.id, sessionPlan);
      await cargarTodo();

      const isPath = sessionPlan.modo === "path";
      const count = isPath ? sessionPlan.pasos.length : 1;

      setSuccessFeedback(
        isPath
          ? `La ruta pedagógica de "${sessionModal.group.nombre}" quedó abierta con ${count} pasos.`
          : `La sesión individual de "${sessionModal.group.nombre}" quedó abierta correctamente.`
      );
      closeSessionModal();
    } catch (err) {
      setSessionModal((prev) => ({
        ...prev,
        error: err.message || "No fue posible abrir la clase.",
      }));
    } finally {
      setCargandoAccion(null);
    }
  };

  if (cargando && grupos.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3 text-muted">Cargando tus grupos...</span>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <Users size={32} className="text-primary me-2" />
          <h1 className="m-0 fs-3 fw-bold" style={{ color: "var(--lk-tutor-text)" }}>
            Mis Grupos
          </h1>
        </div>
        <Button
          variant="primary"
          className="d-flex align-items-center gap-2 fw-bold shadow-sm"
          style={{ borderRadius: "8px" }}
          onClick={abrirModalCrear}
        >
          <Plus size={20} /> Crear Nuevo Grupo
        </Button>
      </div>

      <p className="text-muted mb-4">
        Aquí gestionas la estructura del grupo y abres actividades pedagógicas en modo individual o en ruta.
      </p>

      {feedback ? <Alert variant={feedback.type}>{feedback.message}</Alert> : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Row className="g-4">
        {grupos.length === 0 && !cargando ? (
          <Col xs={12}>
            <div
              className="d-flex flex-column justify-content-center align-items-center"
              style={{
                minHeight: "50vh",
                backgroundColor: "var(--lk-tutor-surface)",
                borderRadius: "24px",
                border: "2px dashed var(--lk-tutor-primary)",
                padding: "40px",
                textAlign: "center",
                opacity: 0.9,
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(135deg, rgba(79,70,229,0.1), rgba(14,165,233,0.1))",
                  color: "var(--lk-tutor-primary)",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "24px",
                }}
              >
                <FolderOpen size={40} />
              </div>
              <h2 className="fw-bold mb-3" style={{ color: "var(--lk-tutor-text)" }}>
                Aún no tienes grupos
              </h2>
              <p className="text-muted mb-4" style={{ maxWidth: "450px" }}>
                Comienza creando tu primer grupo de estudiantes para administrar sesiones pedagógicas y revisar su progreso.
              </p>
              <Button
                variant="primary"
                className="d-flex align-items-center gap-2 fw-bold px-4 py-3 shadow-sm"
                style={{ borderRadius: "12px", background: "var(--lk-tutor-primary)", border: "none" }}
                onClick={abrirModalCrear}
              >
                <Plus size={20} /> Crear mi primer grupo
              </Button>
            </div>
          </Col>
        ) : (
          grupos.map((grupo) => {
            const groupId = grupo.id ?? grupo.id_grupo;
            const sesionAbierta = isSessionActive(grupo.sesion_activa);

            return (
              <Col xs={12} md={6} lg={4} key={groupId}>
                <Card
                  className="h-100 shadow-sm border-0 position-relative"
                  style={{ borderRadius: "16px", backgroundColor: "var(--lk-tutor-surface)" }}
                >
                  <div className="position-absolute top-0 end-0 p-3 d-flex gap-2">
                    <button
                      className="btn btn-sm btn-light rounded-circle shadow-sm text-secondary d-flex align-items-center justify-content-center"
                      style={{ width: "32px", height: "32px" }}
                      onClick={() => abrirModalEditar(grupo)}
                      title="Editar Grupo"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-sm btn-light rounded-circle shadow-sm text-danger d-flex align-items-center justify-content-center"
                      style={{ width: "32px", height: "32px" }}
                      onClick={() => handleEliminarGrupo(grupo)}
                      title="Eliminar Grupo"
                      disabled={cargandoAccion === groupId}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <Card.Body className="d-flex flex-column p-4 mt-2">
                    <Card.Title className="fw-bold fs-5 mb-2 pe-5" style={{ color: "var(--lk-tutor-text)" }}>
                      {grupo.nombre}
                    </Card.Title>
                    <Card.Text className="text-muted small mb-3">
                      {grupo.descripcion || "Sin descripción"}
                    </Card.Text>

                    <div className="small text-muted mb-4">
                      <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                        <Route size={14} />
                        <strong>{getSessionModeLabel(grupo)}</strong>
                        <span className="badge bg-light text-dark border">{getSessionStepsLabel(grupo)}</span>
                      </div>
                      <div>{getSessionSummaryText(grupo)}</div>
                    </div>

                    <Button
                      className="mt-auto d-flex justify-content-center align-items-center gap-2 fw-bold border-0 text-white"
                      style={{
                        borderRadius: "8px",
                        padding: "12px",
                        background: sesionAbierta
                          ? "var(--lk-color-danger)"
                          : "linear-gradient(135deg, #13b56b, #39d98a)",
                        boxShadow: sesionAbierta
                          ? "0 4px 12px rgba(255, 130, 77, 0.3)"
                          : "0 4px 12px rgba(19, 181, 107, 0.3)",
                      }}
                      onClick={() => handleToggleSesion(grupo)}
                      disabled={cargandoAccion === groupId}
                    >
                      {cargandoAccion === groupId ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                          Procesando...
                        </>
                      ) : sesionAbierta ? (
                        <>
                          <Square size={18} fill="currentColor" /> Cerrar clase
                        </>
                      ) : (
                        <>
                          <Play size={18} fill="currentColor" /> Abrir actividad
                        </>
                      )}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })
        )}
      </Row>

      <SessionClassModal
        show={sessionModal.open}
        groupName={sessionModal.group?.nombre ?? "grupo"}
        minijuegos={minijuegos}
        onClose={closeSessionModal}
        onConfirm={handleConfirmOpenSession}
        isSubmitting={Boolean(cargandoAccion)}
        errorMessage={sessionModal.error}
      />

      <Modal show={showModal} onHide={cerrarModal} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-4" style={{ color: "var(--lk-tutor-text)" }}>
            {editandoId ? "Editar Grupo" : "Crear Nuevo Grupo"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleGuardarGrupo}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-secondary small">Nombre del Grupo *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej. Grado 3ro A"
                value={formData.nombre}
                onChange={(event) => setFormData({ ...formData, nombre: event.target.value })}
                required
                className="shadow-none border-secondary-subtle"
                style={{ borderRadius: "8px" }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-secondary small">Descripción (Opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Agrega una breve descripción..."
                value={formData.descripcion}
                onChange={(event) => setFormData({ ...formData, descripcion: event.target.value })}
                className="shadow-none border-secondary-subtle"
                style={{ borderRadius: "8px" }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="light"
              onClick={cerrarModal}
              className="fw-bold"
              style={{ borderRadius: "8px" }}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="fw-bold"
              style={{ borderRadius: "8px" }}
              disabled={guardando}
            >
              {guardando ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Guardando...
                </>
              ) : (
                "Guardar Grupo"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
