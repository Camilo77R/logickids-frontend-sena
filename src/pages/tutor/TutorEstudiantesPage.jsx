import { useEffect, useMemo, useState } from "react";
import { Image, Alert } from "react-bootstrap";
import { MonitorSmartphone, QrCode, Search, Users, ChevronRight, UserPlus } from "lucide-react";
import StudentQrPreview from "../../components/account/StudentQrPreview";
import StudentDeviceSessionModal from "../../components/students/StudentDeviceSessionModal";
import estudianteService from "../../services/estudianteService";
import tutorGroupsService from "../../services/tutorGroupsService";
import "../../styles/tutor-ov.css";
import "../../styles/tutorEstudiantes.css";

const ESTUDIANTES_POR_PAGINA = 3;

const getEstado = (estudiante) => estudiante.estado || "activo";
const getGroupId = (grupo) => String(grupo?.id_grupo ?? grupo?.id ?? "");

const panelStyle = {
  background: "var(--lk-brand-soft)",
  border: "1px solid var(--lk-border)",
  borderRadius: "var(--lk-radius-xl)",
  padding: "1.5rem",
};

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
      if (!selectedGrupoId && groups.length > 0) setSelectedGrupoId(getGroupId(groups[0]));
      else if (groups.length === 0) setIsLoading(false);
    } catch (error) {
      showFeedback("error", error.message || "No fue posible cargar tus grupos.");
      setIsLoading(false);
    }
  };

  const loadEstudiantes = async (grupoId, incluirInactivos = false) => {
    if (!grupoId) { setEstudiantes([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const data = incluirInactivos
        ? await estudianteService.listAllEstudiantes(Number(grupoId))
        : await estudianteService.listEstudiantes(Number(grupoId));
      setEstudiantes(data);
    } catch (error) {
      showFeedback("error", error.message || "No fue posible cargar los estudiantes.");
      setEstudiantes([]);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { loadGrupos(); }, []);
  useEffect(() => { loadEstudiantes(selectedGrupoId, estadoFilter !== "activo"); }, [selectedGrupoId, estadoFilter]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, estadoFilter, selectedGrupoId]);

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
    } finally { setLoadingQr(false); }
  };

  const estudiantesFiltrados = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return estudiantes.filter((estudiante) => {
      const estado = getEstado(estudiante);
      const matchesEstado = estadoFilter === "todos" || estado === estadoFilter;
      const matchesSearch = !search || estudiante.nombre?.toLowerCase().includes(search) || String(estudiante.edad || "").includes(search);
      return matchesEstado && matchesSearch;
    });
  }, [estudiantes, searchTerm, estadoFilter]);

  const totalPages = Math.max(1, Math.ceil(estudiantesFiltrados.length / ESTUDIANTES_POR_PAGINA));
  const estudiantesPaginados = estudiantesFiltrados.slice((currentPage - 1) * ESTUDIANTES_POR_PAGINA, currentPage * ESTUDIANTES_POR_PAGINA);
  const selectedGrupo = grupos.find((grupo) => getGroupId(grupo) === String(selectedGrupoId));
  const fromStudent = estudiantesFiltrados.length === 0 ? 0 : (currentPage - 1) * ESTUDIANTES_POR_PAGINA + 1;
  const toStudent = Math.min(currentPage * ESTUDIANTES_POR_PAGINA, estudiantesFiltrados.length);
  const activeStudents = estudiantes.filter((e) => getEstado(e) === "activo").length;
  const totalStudents = estudiantes.length;

  return (
    <div className="tov">
      {feedback.message && (
        <Alert variant={feedback.type === "success" ? "success" : "danger"} style={{ marginBottom: "1rem" }}>
          {feedback.message}
        </Alert>
      )}

      <section className="tov-hero">
        <div className="tov-hero__text">
          <span className="tov-hero__status">
            <span className="tov-hero__status-dot" />
            {selectedGrupoId ? `Grupo: ${selectedGrupo?.nombre || "Seleccionado"}` : "Gestión de estudiantes"}
          </span>
          <h1 className="tov-hero__h1">Estudiantes</h1>
          <div className="tov-hero__summary">
            <div><span>Total estudiantes</span><strong>{totalStudents}</strong></div>
            <div><span>Activos</span><strong>{activeStudents}</strong></div>
            <div><span>Grupos</span><strong>{grupos.length}</strong></div>
          </div>
          <div className="tov-hero__actions">
            <button className="tov-hero__primary" onClick={() => {}}><UserPlus size={16} /> Agregar estudiante <ChevronRight size={17} /></button>
            <button className="tov-hero__secondary">Gestionar grupos</button>
          </div>
        </div>
      </section>

      <div style={panelStyle}>
        <div className="tov-board-head">
          <h2><Users size={18} /> Listado de estudiantes</h2>
        </div>

        {!selectedGrupoId ? (
          <div className="tov-board-empty">
            <Users size={32} />
            <strong>Selecciona un grupo</strong>
            <span>Elige un grupo para ver sus estudiantes.</span>
          </div>
        ) : isLoading ? (
          <div className="tov-loading">
            <div className="tov-loading__ring" />
            <span>Cargando estudiantes...</span>
          </div>
        ) : (
          <>
            <div className="lk-est-controls" style={{ marginBottom: "1rem" }}>
              <div className="lk-est-search">
                <Search size={16} style={{ color: "#6B6B8A", flexShrink: 0 }} />
                <input type="text" placeholder="Buscar estudiante..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select className="lk-est-filter-select" value={selectedGrupoId} onChange={(e) => { setSelectedGrupoId(e.target.value); setCurrentPage(1); }}>
                {grupos.map((g) => <option key={getGroupId(g)} value={getGroupId(g)}>{g.nombre}</option>)}
              </select>
              <select className="lk-est-filter-select" value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
                <option value="activo">Activos</option>
                <option value="todos">Todos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>

            {estudiantesFiltrados.length === 0 ? (
              <div className="tov-board-empty">
                <Users size={32} />
                <strong>No se encontraron estudiantes</strong>
                <span>Busca otro estudiante o ajusta los filtros.</span>
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
                        return (
                          <tr key={est.id}>
                            <td>
                              <div className="lk-est-avatar">
                                <Image src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${est.nombre || est.id}`} roundedCircle className="lk-student-avatar-img" alt={est.nombre} width={40} height={40} />
                                <span className="lk-est-avatar-dot" />
                              </div>
                            </td>
                            <td><strong>{est.nombre}</strong></td>
                            <td style={{ color: "var(--lk-text-soft)" }}>{selectedGrupo?.nombre || "—"}</td>
                            <td>
                              {estado === "activo"
                                ? <span className="lk-est-badge-active">Activo</span>
                                : <span className="lk-est-badge-inactive">Inactivo</span>}
                            </td>
                            <td>{est.edad ? `${est.edad} años` : "—"}</td>
                            <td>
                              <span style={{ fontSize: "0.75rem", color: est.sesion_activa ? "var(--lk-green)" : "var(--lk-text-muted)" }}>
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

                {totalPages > 1 && (
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.75rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--lk-text-muted)" }}>Mostrando {fromStudent}–{toStudent} de {estudiantesFiltrados.length}</span>
                    <button className="tg-btn-arrow" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>←</button>
                    <button className="tg-btn-arrow" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>→</button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

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
