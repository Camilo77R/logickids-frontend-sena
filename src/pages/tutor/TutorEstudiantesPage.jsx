import { useEffect, useMemo, useState } from "react";
import { QrCode, RefreshCw, Search, Users } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Image,
  InputGroup,
  Modal,
  Pagination,
  ProgressBar,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import StudentQrPreview from "../../components/account/StudentQrPreview";
import estudianteService from "../../services/estudianteService";
import tutorGroupsService from "../../services/tutorGroupsService";
import profesorImage from "../../assets/imgs/imagen profe.png";
import "../../styles/tutorEstudiantes.css";

const ESTUDIANTES_POR_PAGINA = 3;

const getEstado = (estudiante) => estudiante.estado || "activo";

const getEstadoLabel = (estado) => {
  if (estado === "activo") return "Activo";
  if (estado === "inactivo") return "Inactivo";
  return "En progreso";
};

const getGroupId = (grupo) => String(grupo?.id_grupo ?? grupo?.id ?? "");

const getProgress = (estudiante) => Number(estudiante.progreso ?? estudiante.progress ?? 0);

export default function TutorEstudiantesPage() {
  const [grupos, setGrupos] = useState([]);
  const [selectedGrupoId, setSelectedGrupoId] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [selectedQrStudentName, setSelectedQrStudentName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("activo");
  const [currentPage, setCurrentPage] = useState(1);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
  };

  const loadGrupos = async () => {
    try {
      const groups = await tutorGroupsService.getGroups();
      setGrupos(groups);

      if (!selectedGrupoId && groups.length > 0) {
        setSelectedGrupoId(getGroupId(groups[0]));
      } else if (groups.length === 0) {
        setIsLoading(false);
      }
    } catch (error) {
      showFeedback("error", error.message || "No fue posible cargar tus grupos.");
      setIsLoading(false);
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
    loadEstudiantes(selectedGrupoId, estadoFilter !== "activo");
  }, [selectedGrupoId, estadoFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter, selectedGrupoId]);

  const handleObtenerQr = async (estudiante) => {
    setLoadingQr(true);
    setQrData(null);
    setSelectedQrStudentName(estudiante.nombre || "estudiante");
    setShowQrModal(true);

    try {
      const data = await estudianteService.obtenerQr(estudiante.id);
      setQrData(data);
    } catch (error) {
      showFeedback("error", "No fue posible obtener el codigo QR.");
    } finally {
      setLoadingQr(false);
    }
  };

  const estudiantesFiltrados = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return estudiantes.filter((estudiante) => {
      const estado = getEstado(estudiante);
      const matchesEstado = estadoFilter === "todos" || estado === estadoFilter;
      const matchesSearch =
        !search ||
        estudiante.nombre?.toLowerCase().includes(search) ||
        String(estudiante.edad || "").includes(search);

      return matchesEstado && matchesSearch;
    });
  }, [estudiantes, searchTerm, estadoFilter]);

  const totalPages = Math.max(1, Math.ceil(estudiantesFiltrados.length / ESTUDIANTES_POR_PAGINA));
  const estudiantesPaginados = estudiantesFiltrados.slice(
    (currentPage - 1) * ESTUDIANTES_POR_PAGINA,
    currentPage * ESTUDIANTES_POR_PAGINA
  );
  const selectedGrupo = grupos.find((grupo) => getGroupId(grupo) === String(selectedGrupoId));
  const fromStudent = estudiantesFiltrados.length === 0 ? 0 : (currentPage - 1) * ESTUDIANTES_POR_PAGINA + 1;
  const toStudent = Math.min(currentPage * ESTUDIANTES_POR_PAGINA, estudiantesFiltrados.length);

  return (
    <Container fluid className="lk-students-page">
      <div className="lk-students-page-head">
        <h1>Estudiantes</h1>
      </div>

      {feedback.message ? (
        <Alert variant={feedback.type === "success" ? "success" : "danger"} className="lk-students-alert">
          {feedback.message}
        </Alert>
      ) : null}

      <section className="lk-students-hero">
        <div>
          <span className="lk-students-kicker">Modulo Estudiantes</span>
          <h1>Consulta tu grupo</h1>
          <p>Revisa el estado de la clase y comparte el QR cuando un estudiante lo necesite.</p>
          <div className="lk-students-hero-actions">
            <Button
              className="lk-btn-light"
              onClick={() => loadEstudiantes(selectedGrupoId, estadoFilter !== "activo")}
              disabled={!selectedGrupoId || isLoading}
            >
              <RefreshCw size={17} />
              Recargar
            </Button>
          </div>
        </div>
        <div className="lk-students-hero-image">
          <div className="lk-tutor-profile-placeholder">
            <img src={profesorImage} alt="Tutor" />
          </div>
        </div>
        <div className="lk-students-hero-card">
          <Users size={32} />
          <strong>{estudiantesFiltrados.length}</strong>
          <span>estudiantes visibles</span>
        </div>
      </section>

      <Row className="g-2">
        <Col xl={12}>
          <Card className="lk-students-card lk-students-table-card">
            <Card.Body>
              <div className="lk-table-toolbar">
                <div className="lk-section-heading mb-0">
                  <div>
                    <span>{selectedGrupo?.nombre || "Grupo seleccionado"}</span>
                    <h2>Lista de estudiantes</h2>
                  </div>
                </div>

                <InputGroup className="lk-search-control">
                  <InputGroup.Text>
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar estudiante..."
                  />
                </InputGroup>

                <div className="lk-table-filters">
                  <Form.Select
                    value={selectedGrupoId}
                    onChange={(event) => setSelectedGrupoId(event.target.value)}
                    className="lk-filter-select"
                  >
                    <option value="">Selecciona un grupo</option>
                    {grupos.map((grupo) => (
                      <option key={getGroupId(grupo)} value={getGroupId(grupo)}>
                        {grupo.nombre}
                      </option>
                    ))}
                  </Form.Select>

                  <Form.Select
                    value={estadoFilter}
                    onChange={(event) => setEstadoFilter(event.target.value)}
                    className="lk-filter-select"
                  >
                    <option value="activo">Activos</option>
                    <option value="todos">Todos</option>
                    <option value="inactivo">Inactivos</option>
                  </Form.Select>
                </div>
              </div>

              {!selectedGrupoId ? (
                <div className="lk-empty-state">
                  <Users size={46} />
                  <p>Selecciona un grupo para ver sus estudiantes.</p>
                </div>
              ) : isLoading ? (
                <div className="lk-empty-state">
                  <Spinner animation="border" variant="primary" />
                  <p>Cargando estudiantes...</p>
                </div>
              ) : estudiantesFiltrados.length === 0 ? (
                <div className="lk-empty-state">
                  <Users size={46} />
                  <p>No hay estudiantes que coincidan con los filtros.</p>
                </div>
              ) : (
                <>
                  <div className="lk-table-responsive">
                    <Table hover responsive className="lk-students-table">
                      <thead>
                        <tr>
                          <th>Estudiante</th>
                          <th>Edad</th>
                          <th>Progreso</th>
                          <th>Estado</th>
                          <th>Sesion</th>
                          <th>QR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estudiantesPaginados.map((estudiante) => {
                          const estado = getEstado(estudiante);
                          const progress = getProgress(estudiante);

                          return (
                            <tr key={estudiante.id}>
                              <td>
                                <div className="lk-student-cell">
                                  <Image
                                    src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${estudiante.nombre || estudiante.id}`}
                                    roundedCircle
                                    className="lk-student-avatar-img"
                                    alt={estudiante.nombre}
                                    width={40}
                                    height={40}
                                  />
                                  <div>
                                    <strong>{estudiante.nombre}</strong>
                                    <span>ID #{estudiante.id}</span>
                                  </div>
                                </div>
                              </td>
                              <td>{estudiante.edad} anos</td>
                              <td>
                                <div className="lk-progress-cell">
                                  <ProgressBar now={progress} />
                                  <span>{progress}%</span>
                                </div>
                              </td>
                              <td>
                                <Badge className={`lk-status-badge lk-status-${estado}`}>
                                  {getEstadoLabel(estado)}
                                </Badge>
                              </td>
                              <td>
                                <Badge className={estudiante.sesion_activa ? "lk-session-open" : "lk-session-closed"}>
                                  {estudiante.sesion_activa ? "Clase abierta" : "Clase cerrada"}
                                </Badge>
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
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>

                  <div className="lk-table-footer">
                    <span>
                      Mostrando {fromStudent} a {toStudent} de {estudiantesFiltrados.length} estudiantes
                    </span>
                    <Pagination className="lk-pagination">
                      <Pagination.Prev
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      />
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                        <Pagination.Item
                          key={page}
                          active={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      />
                    </Pagination>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showQrModal} onHide={() => setShowQrModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Codigo QR</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          {loadingQr ? (
            <Spinner animation="border" variant="primary" />
          ) : qrData ? (
            <StudentQrPreview token={qrData.qr_token} studentName={selectedQrStudentName} />
          ) : (
            <p className="text-muted">No se pudo cargar el QR.</p>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}
