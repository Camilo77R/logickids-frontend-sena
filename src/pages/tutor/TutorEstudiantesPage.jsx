import { useEffect, useState } from "react";
import { QrCode, RefreshCw, Users } from "lucide-react";
import { Alert, Button, Card, Col, Container, Form, Modal, Row, Spinner } from "react-bootstrap";
import StudentQrPreview from "../../components/account/StudentQrPreview";
import estudianteService from "../../services/estudianteService";
import tutorGroupsService from "../../services/tutorGroupsService";

export default function TutorEstudiantesPage() {
  const [grupos, setGrupos] = useState([]);
  const [selectedGrupoId, setSelectedGrupoId] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [showInactivos, setShowInactivos] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [selectedQrStudentName, setSelectedQrStudentName] = useState("");

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
  };

  const loadGrupos = async () => {
    try {
      const groups = await tutorGroupsService.getGroups();
      setGrupos(groups);

      if (!selectedGrupoId && groups.length > 0) {
        setSelectedGrupoId(String(groups[0].id));
      }
    } catch (error) {
      showFeedback("error", error.message || "No fue posible cargar tus grupos.");
    }
  };

  const loadEstudiantes = async (grupoId, incluirInactivos = false) => {
    if (!grupoId) {
      setEstudiantes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const data = incluirInactivos
        ? await estudianteService.listAllEstudiantes(Number(grupoId))
        : await estudianteService.listEstudiantes(Number(grupoId));

      setEstudiantes(data);
    } catch (error) {
      showFeedback("error", error.message || "No fue posible cargar los estudiantes.");
      setEstudiantes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGrupos();
  }, []);

  useEffect(() => {
    loadEstudiantes(selectedGrupoId, showInactivos);
  }, [selectedGrupoId, showInactivos]);

  const handleObtenerQr = async (estudiante) => {
    setLoadingQr(true);
    setQrData(null);
    setSelectedQrStudentName(estudiante.nombre || "estudiante");
    setShowQrModal(true);

    try {
      const data = await estudianteService.obtenerQr(estudiante.id);
      setQrData(data);
    } catch (error) {
      showFeedback("error", "No fue posible obtener el código QR.");
    } finally {
      setLoadingQr(false);
    }
  };

  return (
    <Container fluid className="py-4">
      {feedback.message ? (
        <Alert variant={feedback.type === "success" ? "success" : "danger"} className="mb-4">
          {feedback.message}
        </Alert>
      ) : null}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Estudiantes</h1>
          <p className="text-muted mb-0">
            Observa el grupo asignado, consulta su estado y comparte el QR cuando haga falta.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant={showInactivos ? "primary" : "outline-secondary"}
            onClick={() => setShowInactivos((current) => !current)}
          >
            {showInactivos ? "Ocultar inactivos" : "Ver inactivos"}
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => loadEstudiantes(selectedGrupoId, showInactivos)}
          >
            <RefreshCw size={18} className="me-1" />
            Recargar
          </Button>
        </div>
      </div>

      <Row>
        <Col md={4} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Contexto del grupo</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Grupo asignado</Form.Label>
                <Form.Select
                  value={selectedGrupoId}
                  onChange={(event) => setSelectedGrupoId(event.target.value)}
                >
                  <option value="">Selecciona un grupo</option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <div className="small text-muted">
                <p className="mb-2">
                  <strong>Total visibles:</strong> {estudiantes.length}
                </p>
                <p className="mb-0">
                  La sesión de juego se abre desde <strong>Mis grupos</strong> para respetar el flujo de
                  clase completa.
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="d-flex align-items-center">
              <Users size={20} className="me-2" />
              <h5 className="mb-0">Estudiantes del grupo</h5>
            </Card.Header>
            <Card.Body>
              {!selectedGrupoId ? (
                <div className="text-center py-5 text-muted">
                  <Users size={48} className="mb-3 opacity-50" />
                  <p className="mb-0">Selecciona un grupo para ver sus estudiantes.</p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Cargando estudiantes...</p>
                </div>
              ) : estudiantes.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <Users size={48} className="mb-3 opacity-50" />
                  <p className="mb-0">No hay estudiantes en este grupo.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Estudiante</th>
                        <th>Edad</th>
                        <th>Estado</th>
                        <th>Sesión</th>
                        <th>QR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudiantes.map((estudiante) => (
                        <tr key={estudiante.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <span
                                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-2"
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  backgroundColor: estudiante.color_avatar || "#3B82F6",
                                }}
                              >
                                {(estudiante.nombre || "").charAt(0).toUpperCase()}
                              </span>
                              <span>{estudiante.nombre}</span>
                            </div>
                          </td>
                          <td>{estudiante.edad} años</td>
                          <td>
                            <span
                              className={`badge ${
                                estudiante.estado === "activo" || !estudiante.estado
                                  ? "bg-success"
                                  : "bg-secondary"
                              }`}
                            >
                              {estudiante.estado || "activo"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                estudiante.sesion_activa ? "bg-success" : "bg-secondary"
                              }`}
                            >
                              {estudiante.sesion_activa ? "Clase abierta" : "Clase cerrada"}
                            </span>
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleObtenerQr(estudiante)}
                              title="Ver QR"
                            >
                              <QrCode size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showQrModal} onHide={() => setShowQrModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Código QR</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          {loadingQr ? (
            <Spinner animation="border" variant="primary" />
          ) : qrData ? (
            <StudentQrPreview
              token={qrData.qr_token}
              studentName={selectedQrStudentName}
            />
          ) : (
            <p className="text-muted">No se pudo cargar el QR.</p>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}
