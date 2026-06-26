import { useEffect, useMemo, useState } from "react";
import { MonitorSmartphone, QrCode, RefreshCw, Search, Users } from "lucide-react";
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
import StudentDeviceSessionModal from "../../components/students/StudentDeviceSessionModal";
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
  const [deviceSessionStudent, setDeviceSessionStudent] = useState(null);
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
    <div className="lk-students-page">
      <div className="lk-est-page-header">
        <h1>Mis Estudiantes</h1>
      </div>

      {feedback.message && (
        <div className={`tutor-alert ${feedback.type === "success" ? "tutor-alert--success" : "tutor-alert--error"}`} style={{ marginBottom: "1rem" }}>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Controles */}
      <div className="lk-est-controls">
        <div className="lk-est-search">
          <Search size={16} style={{ color: "#6B6B8A", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar estudiante por nombre or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="lk-est-filter-select" value={selectedGrupoId} onChange={(e) => { setSelectedGrupoId(e.target.value); setCurrentPage(1); }}>
          <option value="">Filtrar por Grupo</option>
          {grupos.map((g) => <option key={getGroupId(g)} value={getGroupId(g)}>{g.nombre}</option>)}
        </select>
        <select className="lk-est-filter-select" value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
          <option value="activo">Activos</option>
          <option value="todos">Todos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {/* Tabla */}
      {!selectedGrupoId ? (
        <div className="lk-est-empty">
          <Users size={46} style={{ color: "#C4AEE0", marginBottom: "0.75rem" }} />
          <h3>Selecciona un grupo</h3>
          <p>Elige un grupo en el filtro de arriba para ver sus estudiantes.</p>
        </div>
      ) : isLoading ? (
        <div className="lk-est-empty">
          <p>Cargando estudiantes...</p>
        </div>
      ) : estudiantesFiltrados.length === 0 ? (
        <div className="lk-est-empty">
          <Users size={46} style={{ color: "#C4AEE0", marginBottom: "0.75rem" }} />
          <h3>No se encontraron estudiantes</h3>
          <p>Busca otro estudiante or ajusta los filtros.</p>
        </div>
      ) : (
        <>
          <div className="lk-est-table-wrap">
            <table className="lk-est-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Nombre</th>
                  <th>Grupo</th>
                  <th>Estado</th>
                  <th>Edad</th>
                  <th>Sesión</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {estudiantesPaginados.map((est) => {
                  const estado = getEstado(est);
                  const initials = (est.nombre || "??").split(" ").slice(0,2).map((w) => w[0]?.toUpperCase()).join("");
                  return (
                    <tr key={est.id}>
                      <td>
                        <div className="lk-est-avatar">
                          {initials}
                          <span className="lk-est-avatar-dot" />
                        </div>
                      </td>
                      <td><strong>{est.nombre}</strong></td>
                      <td style={{ color: "#6B6B8A" }}>{selectedGrupo?.nombre || "Grupo A"}</td>
                      <td>
                        {estado === "activo"
                          ? <span className="lk-est-badge-active">Active</span>
                          : <span className="lk-est-badge-inactive">Inactive</span>}
                      </td>
                      <td>{est.edad ? `${est.edad} años` : "—"}</td>
                      <td>
                        <span style={{ fontSize: "0.75rem", color: est.sesion_activa ? "#16A34A" : "#6B6B8A" }}>
                          {est.sesion_activa ? "Clase abierta" : "Cerrada"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                          <button className="lk-est-btn-detail" onClick={() => handleObtenerQr(est)} title="Ver QR">
                            <QrCode size={13} />
                          </button>
                          <button className="lk-est-btn-detail" style={{ background: "#5B2D8E" }} onClick={() => setDeviceSessionStudent(est)} title="Ver sesión">
                            <MonitorSmartphone size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación simple */}
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.75rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "#6B6B8A" }}>Mostrando {fromStudent}–{toStudent} de {estudiantesFiltrados.length}</span>
              <button className="tg-btn-arrow" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>←</button>
              <button className="tg-btn-arrow" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>→</button>
            </div>
          )}
        </>
      )}

      {/* Modales con nombres correctos del estado real */}
      {showQrModal && (
        <StudentQrPreview
          show={showQrModal}
          estudiante={{ nombre: selectedQrStudentName }}
          qrUrl={qrData}
          isLoading={loadingQr}
          onClose={() => { setShowQrModal(false); setQrData(null); }}
        />
      )}
      {deviceSessionStudent && (
        <StudentDeviceSessionModal
          show={Boolean(deviceSessionStudent)}
          estudiante={deviceSessionStudent}
          onClose={() => setDeviceSessionStudent(null)}
        />
      )}
    </div>
  );
}
