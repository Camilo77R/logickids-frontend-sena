import { useEffect, useMemo, useState } from "react";
import {
    Edit2,
    Filter,
    MoreVertical,
    Plus,
    QrCode,
    RefreshCw,
    Search,
    Trash2,
    Users,
} from "lucide-react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Dropdown,
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

// Mantiene la validación existente antes de llamar al servicio.
const validateForm = (form) => {
    const errors = {};
    if (!form.nombre?.trim()) {
        errors.nombre = "El nombre es obligatorio.";
    } else if (form.nombre.trim().length < 2) {
        errors.nombre = "El nombre debe tener al menos 2 caracteres.";
    }
    if (!form.edad?.trim()) {
        errors.edad = "La edad es obligatoria.";
    } else if (isNaN(Number(form.edad)) || Number(form.edad) < 1 || Number(form.edad) > 18) {
        errors.edad = "La edad debe ser entre 1 y 18 años.";
    }
    return errors;
};

const INITIAL_FORM = {
    nombre: "",
    edad: "",
};

const getEstado = (estudiante) => estudiante.estado || "activo";
const getEstadoLabel = (estado) => {
    if (estado === "activo") return "Activo";
    if (estado === "inactivo") return "Inactivo";
    return "En progreso";
};

export default function TutorEstudiantesPage() {
    // Estados originales: se conservan para cargar grupos y estudiantes desde servicios reales.
    const [grupos, setGrupos] = useState([]);
    const [allGrupos, setAllGrupos] = useState([]);
    const [selectedGrupoId, setSelectedGrupoId] = useState("");
    const [estudiantes, setEstudiantes] = useState([]);
    
    // Estados originales del formulario de crear/editar estudiante.
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [editingEstudiante, setEditingEstudiante] = useState(null);
    
    // Estados originales de carga y feedback.
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState({ type: "", message: "" });
    
    // Estado original para modal de QR.
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [loadingQr, setLoadingQr] = useState(false);
    const [selectedQrStudentName, setSelectedQrStudentName] = useState("");
    
    // Estado original para modal de cambiar grupo.
    const [showGrupoModal, setShowGrupoModal] = useState(false);
    const [selectedEstudianteForGroup, setSelectedEstudianteForGroup] = useState(null);
    const [newGrupoId, setNewGrupoId] = useState("");
    
    // Estado para modal del formulario de agregar estudiante.
    const [showFormModal, setShowFormModal] = useState(false);

    // Nuevos estados visuales: buscador, filtro de estado y paginación local sobre los datos ya cargados.
    const [searchTerm, setSearchTerm] = useState("");
    const [estadoFilter, setEstadoFilter] = useState("todos");
    const [currentPage, setCurrentPage] = useState(1);

    // Función helper original para normalizar respuestas del backend.
    const normalizeArray = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        if (data?.success && Array.isArray(data?.data)) return data.data;
        return [];
    };

    useEffect(() => {
        loadGrupos();
    }, []);

    useEffect(() => {
        if (selectedGrupoId) {
            loadEstudiantes(selectedGrupoId);
        } else {
            setEstudiantes([]);
            setIsLoading(false);
        }
    }, [selectedGrupoId]);

    // Reinicia la paginación cuando cambian filtros o datos, sin tocar la consulta al backend.
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, estadoFilter, selectedGrupoId]);

    const loadGrupos = async () => {
        try {
            const respuesta = await tutorGroupsService.listarGrupos();
            const data = normalizeArray(respuesta);
            
            setGrupos(data);
            setAllGrupos(data);
            
            if (data.length > 0 && !selectedGrupoId) {
                setSelectedGrupoId(data[0].id_grupo || data[0].id);
            } else {
                setIsLoading(false);
            }
        } catch (error) {
            showFeedback("error", "No fue posible cargar los grupos.");
            setIsLoading(false);
        }
    };

    const loadEstudiantes = async (grupoId) => {
        if (!grupoId) return;
        
        setIsLoading(true);
        try {
            const respuesta = await estudianteService.listEstudiantes(grupoId);
            
            const data = normalizeArray(respuesta);
            setEstudiantes(data);
        } catch (error) {
            showFeedback("error", "No fue posible cargar los estudiantes.");
        } finally {
            setIsLoading(false);
        }
    };

    const showFeedback = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationErrors = validateForm(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        if (!selectedGrupoId) {
            showFeedback("error", "Selecciona un grupo primero.");
            return;
        }

        setIsSaving(true);
        try {
            const estudianteData = {
                nombre: form.nombre.trim(),
                edad: Number(form.edad),
            };

            if (isEditing && editingEstudiante) {
                await estudianteService.actualizarEstudiante(editingEstudiante.id, estudianteData);
                showFeedback("success", "Estudiante actualizado correctamente.");
            } else {
                await estudianteService.crearEstudiante({
                    ...estudianteData,
                    grupo_id: Number(selectedGrupoId),
                });
                showFeedback("success", "Estudiante creado correctamente.");
            }

            setForm(INITIAL_FORM);
            setIsEditing(false);
            setEditingEstudiante(null);
            setShowFormModal(false);
            await loadEstudiantes(selectedGrupoId);
        } catch (error) {
            showFeedback("error", error.message || "No fue posible guardar el estudiante.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setForm(INITIAL_FORM);
        setIsEditing(false);
        setEditingEstudiante(null);
        setErrors({});
        setShowFormModal(false);
    };

    const handleEdit = (estudiante) => {
        setEditingEstudiante(estudiante);
        setForm({
            nombre: estudiante.nombre || "",
            edad: estudiante.edad?.toString() || "",
        });
        setIsEditing(true);
        setErrors({});
        setShowFormModal(true);
    };

    const handleDesactivar = async (estudiante) => {
        if (!window.confirm(`¿Seguro que quieres desactivar al estudiante "${estudiante.nombre}"?`)) {
            return;
        }

        try {
            await estudianteService.desactivarEstudiante(estudiante.id);
            showFeedback("success", "Estudiante desactivado correctamente.");
            await loadEstudiantes(selectedGrupoId);
        } catch (error) {
            showFeedback("error", error.message || "No fue posible desactivar el estudiante.");
        }
    };

    const handleReactivar = async (estudiante) => {
        if (!window.confirm(`¿Seguro que quieres reactivar al estudiante "${estudiante.nombre}"?`)) {
            return;
        }

        try {
            await estudianteService.reactivarEstudiante(estudiante.id);
            showFeedback("success", "Estudiante reactivado correctamente.");
            await loadEstudiantes(selectedGrupoId);
        } catch (error) {
            showFeedback("error", error.message || "No fue posible reactivar el estudiante.");
        }
    };

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

    const handleOpenCambiarGrupo = (estudiante) => {
        setSelectedEstudianteForGroup(estudiante);
        setNewGrupoId("");
        setShowGrupoModal(true);
    };

    const handleCambiarGrupo = async () => {
        if (!newGrupoId || newGrupoId === String(selectedGrupoId)) {
            showFeedback("error", "Selecciona un grupo diferente.");
            return;
        }

        try {
            await estudianteService.cambiarGrupo(selectedEstudianteForGroup.id, Number(newGrupoId));
            showFeedback("success", "Grupo actualizado correctamente.");
            setShowGrupoModal(false);
            setSelectedEstudianteForGroup(null);
            await loadEstudiantes(selectedGrupoId);
        } catch (error) {
            showFeedback("error", error.message || "No fue posible cambiar el grupo.");
        }
    };

    // Nuevo filtrado local: conserva los datos reales obtenidos del backend.
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
    const selectedGrupo = grupos.find((grupo) => String(grupo.id_grupo || grupo.id) === String(selectedGrupoId));
    const fromStudent = estudiantesFiltrados.length === 0 ? 0 : (currentPage - 1) * ESTUDIANTES_POR_PAGINA + 1;
    const toStudent = Math.min(currentPage * ESTUDIANTES_POR_PAGINA, estudiantesFiltrados.length);

    return (
        <Container fluid className="lk-students-page">
            <div className="lk-students-page-head">
                <h1>Estudiantes</h1>
            </div>

            {feedback.message && (
                <Alert variant={feedback.type === "success" ? "success" : "danger"} className="lk-students-alert">
                    {feedback.message}
                </Alert>
            )}

            {/* Cambio visual: banner superior estilo SaaS sin tocar la lógica de carga o guardado. */}
            <section className="lk-students-hero">
                <div>
                    <span className="lk-students-kicker">Modulo Estudiantes</span>
                    <h1>Gestiona tus estudiantes</h1>
                    <p>Gestiona y acompaña el progreso de tus estudiantes desde un panel claro y moderno.</p>
                    <div className="lk-students-hero-actions">
                        <Button
                            className="lk-btn-warning"
                            onClick={() => {
                                setForm(INITIAL_FORM);
                                setIsEditing(false);
                                setEditingEstudiante(null);
                                setErrors({});
                                setShowFormModal(true);
                            }}
                        >
                            <Plus size={17} />
                            Agregar Estudiante
                        </Button>
                        <Button
                            className="lk-btn-light"
                            onClick={() => loadEstudiantes(selectedGrupoId)}
                            disabled={!selectedGrupoId || isLoading}
                        >
                            <RefreshCw size={17} />
                            Recargar
                        </Button>
                    </div>
                </div>
                <div className="lk-students-hero-image">
                    {/* Espacio reservado para imagen del perfil del tutor */}
                    <div className="lk-tutor-profile-placeholder">
                        <img src={profesorImage} alt="Profesor" />
                    </div>
                </div>
                <div className="lk-students-hero-card">
                    <Users size={32} />
                    <strong>{estudiantes.length}</strong>
                    <span>estudiantes cargados</span>
                </div>
            </section>

            <Row className="g-2">
                {/* Tabla de estudiantes - solo esta columna se muestra */}
                <Col xl={12}>

                    <Card className="lk-students-card lk-students-table-card">
                        <Card.Body>
                            <div className="lk-table-toolbar">
                                <div className="lk-section-heading mb-0">
                                    <div>
                                        <span>{selectedGrupo?.nombre || "Grupo seleccionado"}</span>
                                        <h2>Lista de Estudiantes</h2>
                                    </div>
                                </div>

                                <InputGroup className="lk-search-control">
                                    <InputGroup.Text>
                                        <Search size={16} />
                                    </InputGroup.Text>
                                    <Form.Control
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar estudiante..."
                                    />
                                </InputGroup>

                                <div className="lk-table-filters">
                                    <Form.Select
                                        value={selectedGrupoId}
                                        onChange={(e) => setSelectedGrupoId(e.target.value)}
                                        className="lk-filter-select"
                                    >
                                        {grupos.map((grupo) => (
                                            <option
                                                key={grupo.id_grupo || grupo.id}
                                                value={grupo.id_grupo || grupo.id}
                                            >
                                                {grupo.nombre}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <Form.Select
                                        value={estadoFilter}
                                        onChange={(e) => setEstadoFilter(e.target.value)}
                                        className="lk-filter-select"
                                    >
                                        <option value="todos">Estados todos</option>
                                        <option value="activo">Activos</option>
                                        <option value="inactivo">Inactivos</option>
                                    </Form.Select>
                                    <Button
                                        type="button"
                                        variant="outline-secondary"
                                        className="lk-filter-button"
                                    >
                                        <Filter size={14} />
                                        Filtros
                                    </Button>
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
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {estudiantesPaginados.map((estudiante) => {
                                                    const estado = getEstado(estudiante);
                                                    const progress = estudiante.progreso || estudiante.progress || 0;

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
                                                            <td>{estudiante.edad} años</td>
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
                                                                <Dropdown align="end">
                                                                    <Dropdown.Toggle className="lk-actions-toggle">
                                                                        <MoreVertical size={18} />
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu>
                                                                        <Dropdown.Item onClick={() => handleObtenerQr(estudiante)}>
                                                                            <QrCode size={15} className="me-2" />
                                                                            Ver QR
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item onClick={() => handleEdit(estudiante)}>
                                                                            <Edit2 size={15} className="me-2" />
                                                                            Editar
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item onClick={() => handleOpenCambiarGrupo(estudiante)}>
                                                                            <Users size={15} className="me-2" />
                                                                            Cambiar grupo
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Divider />
                                                                        {estado === "inactivo" ? (
                                                                            <Dropdown.Item onClick={() => handleReactivar(estudiante)}>
                                                                                <RefreshCw size={15} className="me-2" />
                                                                                Reactivar
                                                                            </Dropdown.Item>
                                                                        ) : (
                                                                            <Dropdown.Item className="text-danger" onClick={() => handleDesactivar(estudiante)}>
                                                                                <Trash2 size={15} className="me-2" />
                                                                                Desactivar
                                                                            </Dropdown.Item>
                                                                        )}
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
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

            {/* Modal original: se conserva la obtención real del QR. */}
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
                        <p className="text-muted">No se pudo cargar el QR</p>
                    )}
                </Modal.Body>
            </Modal>

            {/* Modal del formulario para agregar/editar estudiante */}
            <Modal
                show={showFormModal}
                onHide={() => setShowFormModal(false)}
                centered
                dialogClassName="lk-student-form-dialog"
                contentClassName="lk-student-form-modal"
            >
                <Modal.Header closeButton>
                    <div>
                        <Modal.Title>
                            {isEditing ? "Editar estudiante" : "Agregar estudiante"}
                        </Modal.Title>
                        <p className="lk-student-form-subtitle">
                            Completa los datos del niño para vincularlo al grupo seleccionado.
                        </p>
                    </div>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit} className="lk-student-form">
                        <Form.Group className="mb-2">
                            <Form.Label>Grupo</Form.Label>
                            <Form.Select
                                value={selectedGrupoId}
                                onChange={(e) => setSelectedGrupoId(e.target.value)}
                                disabled={isSaving}
                            >
                                <option value="">Selecciona un grupo</option>
                                {grupos.map((grupo) => (
                                    <option 
                                        key={grupo.id_grupo || grupo.id} 
                                        value={grupo.id_grupo || grupo.id}
                                    >
                                        {grupo.nombre}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Nombre</Form.Label>
                            <Form.Control
                                type="text"
                                name="nombre"
                                value={form.nombre}
                                onChange={handleChange}
                                placeholder="Juan Perez"
                                isInvalid={!!errors.nombre}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.nombre}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Edad</Form.Label>
                            <Form.Control
                                type="number"
                                name="edad"
                                value={form.edad}
                                onChange={handleChange}
                                placeholder="10"
                                min="1"
                                max="18"
                                isInvalid={!!errors.edad}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.edad}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <div className="d-flex gap-2">
                            <Button 
                                type="submit" 
                                className="lk-submit-button flex-grow-1"
                                disabled={isSaving || !selectedGrupoId}
                            >
                                {isSaving ? (
                                    <>
                                        <Spinner size="sm" className="me-2" />
                                        Guardando...
                                    </>
                                ) : isEditing ? "Actualizar estudiante" : "Agregar Estudiante"}
                            </Button>
                            <Button 
                                variant="outline-secondary" 
                                onClick={handleCancel}
                                className="flex-grow-1"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Modal original: se conserva el cambio de grupo con los grupos reales. */}
            <Modal show={showGrupoModal} onHide={() => setShowGrupoModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Cambiar Grupo</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Mover a <strong>{selectedEstudianteForGroup?.nombre}</strong> a otro grupo:
                    </p>
                    <Form.Select
                        value={newGrupoId}
                        onChange={(e) => setNewGrupoId(e.target.value)}
                    >
                        <option value="">Selecciona un grupo</option>
                        {(allGrupos.length > 0 ? allGrupos : grupos)
                            .filter((g) => String(g.id_grupo || g.id) !== String(selectedGrupoId))
                            .map((grupo) => (
                                <option 
                                    key={grupo.id_grupo || grupo.id} 
                                    value={grupo.id_grupo || grupo.id}
                                >
                                    {grupo.nombre}
                                </option>
                            ))}
                    </Form.Select>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowGrupoModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleCambiarGrupo}>
                        Confirmar cambio
                    </Button>
                </Modal.Footer>
            </Modal>

        </Container>
    );
}
