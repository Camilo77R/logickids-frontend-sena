
import { useEffect, useState } from "react";
import { Edit2, Trash2, QrCode, Users, RefreshCw } from "lucide-react";
import { Container, Row, Col, Card, Button, Alert, Spinner, Modal, Form } from "react-bootstrap";
import StudentQrPreview from "../../components/account/StudentQrPreview";
import estudianteService from "../../services/estudianteService";
import tutorGroupsService from "../../services/tutorGroupsService";

// Colores disponibles para avatars
const COLORES = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
    "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

// Validación del formulario
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
    color_avatar: "#3B82F6",
};

export default function TutorEstudiantesPage() {
    // Estados para grupos y estudiantes
    const [grupos, setGrupos] = useState([]);
    const [allGrupos, setAllGrupos] = useState([]);
    const [selectedGrupoId, setSelectedGrupoId] = useState("");
    const [estudiantes, setEstudiantes] = useState([]);
    
    // Estados para el formulario
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [editingEstudiante, setEditingEstudiante] = useState(null);
    
    // Estados de carga y feedback
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState({ type: "", message: "" });
    
    // Estado para modal de QR
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [loadingQr, setLoadingQr] = useState(false);
    const [selectedQrStudentName, setSelectedQrStudentName] = useState("");
    
    // Estado para modal de cambiar grupo
    const [showGrupoModal, setShowGrupoModal] = useState(false);
    const [selectedEstudianteForGroup, setSelectedEstudianteForGroup] = useState(null);
    const [newGrupoId, setNewGrupoId] = useState("");
    
    // Estado para mostrar inactivos
    const [showInactivos, setShowInactivos] = useState(false);

    // Función helper para normalizar datos
    const normalizeArray = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        if (data?.success && Array.isArray(data?.data)) return data.data;
        return [];
    };

    // Cargar grupos al iniciar
    useEffect(() => {
        loadGrupos();
    }, []);

    // Cargar estudiantes cuando cambia el grupo seleccionado
    useEffect(() => {
        if (selectedGrupoId) {
            loadEstudiantes(selectedGrupoId, showInactivos);
        } else {
            setEstudiantes([]);
        }
    }, [selectedGrupoId, showInactivos]);

    // Función para cargar grupos
    const loadGrupos = async () => {
        try {
            const respuesta = await tutorGroupsService.listarGrupos();
            const data = normalizeArray(respuesta);
            
            setGrupos(data);
            setAllGrupos(data);
            
            if (data.length > 0 && !selectedGrupoId) {
                setSelectedGrupoId(data[0].id_grupo || data[0].id);
            }
        } catch (error) {
            showFeedback("error", "No fue posible cargar los grupos.");
        }
    };

    // Función para cargar estudiantes
    const loadEstudiantes = async (grupoId, incluirInactivos = false) => {
        if (!grupoId) return;
        
        setIsLoading(true);
        try {
            const respuesta = incluirInactivos 
                ? await estudianteService.listAllEstudiantes(grupoId)
                : await estudianteService.listEstudiantes(grupoId);
            
            const data = normalizeArray(respuesta);
            setEstudiantes(data);
        } catch (error) {
            showFeedback("error", "No fue posible cargar los estudiantes.");
        } finally {
            setIsLoading(false);
        }
    };

    // Mostrar feedback temporal
    const showFeedback = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
    };

    // Manejar cambios en el formulario
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    // Seleccionar color de avatar
    const handleColorSelect = (color) => {
        setForm((prev) => ({ ...prev, color_avatar: color }));
    };

    // Obtener el color actual del formulario
    const getCurrentColor = () => {
        return form.color_avatar || "#3B82F6";
    };

    // Enviar formulario (crear o actualizar)
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
                color_avatar: form.color_avatar,
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
            await loadEstudiantes(selectedGrupoId, showInactivos);
        } catch (error) {
            showFeedback("error", error.message || "No fue posible guardar el estudiante.");
        } finally {
            setIsSaving(false);
        }
    };

    // Cancelar edición
    const handleCancel = () => {
        setForm(INITIAL_FORM);
        setIsEditing(false);
        setEditingEstudiante(null);
        setErrors({});
    };

    // Editar estudiante
    const handleEdit = (estudiante) => {
        setEditingEstudiante(estudiante);
        setForm({
            nombre: estudiante.nombre || "",
            edad: estudiante.edad?.toString() || "",
            color_avatar: estudiante.color_avatar || "#3B82F6",
        });
        setIsEditing(true);
        setErrors({});
    };

    // Desactivar estudiante
    const handleDesactivar = async (estudiante) => {
        if (!window.confirm(`¿Seguro que quieres desactivar al estudiante "${estudiante.nombre}"?`)) {
            return;
        }

        try {
            await estudianteService.desactivarEstudiante(estudiante.id);
            showFeedback("success", "Estudiante desactivado correctamente.");
            await loadEstudiantes(selectedGrupoId, showInactivos);
        } catch (error) {
            showFeedback("error", error.message || "No fue posible desactivar el estudiante.");
        }
    };

    // Reactivar estudiante
    const handleReactivar = async (estudiante) => {
        if (!window.confirm(`¿Seguro que quieres reactivar al estudiante "${estudiante.nombre}"?`)) {
            return;
        }

        try {
            await estudianteService.reactivarEstudiante(estudiante.id);
            showFeedback("success", "Estudiante reactivado correctamente.");
            await loadEstudiantes(selectedGrupoId, showInactivos);
        } catch (error) {
            showFeedback("error", error.message || "No fue posible reactivar el estudiante.");
        }
    };

    // Obtener QR del estudiante
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

    // Abrir modal para cambiar grupo
    const handleOpenCambiarGrupo = (estudiante) => {
        setSelectedEstudianteForGroup(estudiante);
        setNewGrupoId("");
        setShowGrupoModal(true);
    };

    // Confirmar cambio de grupo
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
            await loadEstudiantes(selectedGrupoId, showInactivos);
        } catch (error) {
            showFeedback("error", error.message || "No fue posible cambiar el grupo.");
        }
    };

    return (
        <Container fluid className="py-4">
            {/* Feedback Alert */}
            {feedback.message && (
                <Alert variant={feedback.type === "success" ? "success" : "danger"} className="mb-4">
                    {feedback.message}
                </Alert>
            )}

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-1">Estudiantes</h1>
                    <p className="text-muted mb-0">Gestiona los estudiantes de tu grupo</p>
                    <small className="text-muted">
                        La sesión de juego se abre desde "Mis Grupos" para respetar la regla de clase completa.
                    </small>
                </div>
                <div className="d-flex gap-2">
                    <Button 
                        variant={showInactivos ? "primary" : "outline-secondary"}
                        onClick={() => setShowInactivos(!showInactivos)}
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
                {/* Panel de formulario */}
                <Col md={4} className="mb-4">
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">
                                {isEditing ? "Editar estudiante" : "Nuevo estudiante"}
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                {/* Selector de grupo */}
                                <Form.Group className="mb-3">
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

                                {/* Nombre */}
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={form.nombre}
                                        onChange={handleChange}
                                        placeholder="Juan Pérez"
                                        isInvalid={!!errors.nombre}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.nombre}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                {/* Edad */}
                                <Form.Group className="mb-3">
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

                                {/* Color de avatar */}
                                <Form.Group className="mb-3">
                                    <Form.Label>Color de avatar</Form.Label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {COLORES.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`btn btn-sm p-3 ${getCurrentColor() === color ? 'border-2 border-dark' : ''}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => handleColorSelect(color)}
                                                aria-label={`Color ${color}`}
                                            />
                                        ))}
                                    </div>
                                </Form.Group>

                                {/* Botones */}
                                <div className="d-grid gap-2">
                                    <Button 
                                        type="submit" 
                                        variant="primary"
                                        disabled={isSaving || !selectedGrupoId}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Spinner size="sm" className="me-2" />
                                                Guardando...
                                            </>
                                        ) : isEditing ? "Actualizar" : "Crear estudiante"}
                                    </Button>
                                    
                                    {isEditing && (
                                        <Button 
                                            type="button" 
                                            variant="outline-secondary"
                                            onClick={handleCancel}
                                        >
                                            Cancelar
                                        </Button>
                                    )}
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Panel de lista de estudiantes */}
                <Col md={8} className="mb-4">
                    <Card>
                        <Card.Header className="d-flex align-items-center">
                            <Users size={20} className="me-2" />
                            <h5 className="mb-0">Estudiantes del grupo</h5>
                        </Card.Header>
                        <Card.Body>
                            {!selectedGrupoId ? (
                                <div className="text-center py-5 text-muted">
                                    <Users size={48} className="mb-3 opacity-50" />
                                    <p className="mb-0">Selecciona un grupo para ver sus estudiantes</p>
                                </div>
                            ) : isLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2 text-muted">Cargando estudiantes...</p>
                                </div>
                            ) : estudiantes.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <Users size={48} className="mb-3 opacity-50" />
                                    <p className="mb-0">No hay estudiantes en este grupo</p>
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
                                                <th>Acciones</th>
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
                                                                    backgroundColor: estudiante.color_avatar || "#3B82F6" 
                                                                }}
                                                            >
                                                                {(estudiante.nombre || "").charAt(0).toUpperCase()}
                                                            </span>
                                                            <span>{estudiante.nombre}</span>
                                                        </div>
                                                    </td>
                                                    <td>{estudiante.edad} años</td>
                                                    <td>
                                                        <span className={`badge ${estudiante.estado === "activo" || !estudiante.estado ? "bg-success" : "bg-secondary"}`}>
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
                                                        <div className="d-flex gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline-primary"
                                                                onClick={() => handleObtenerQr(estudiante)}
                                                                title="Ver QR"
                                                            >
                                                                <QrCode size={16} />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline-secondary"
                                                                onClick={() => handleEdit(estudiante)}
                                                                title="Editar"
                                                            >
                                                                <Edit2 size={16} />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline-info"
                                                                onClick={() => handleOpenCambiarGrupo(estudiante)}
                                                                title="Cambiar grupo"
                                                            >
                                                                <Users size={16} />
                                                            </Button>
                                                            {estudiante.estado === 'inactivo' ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-success"
                                                                    onClick={() => handleReactivar(estudiante)}
                                                                    title="Reactivar"
                                                                >
                                                                    <RefreshCw size={16} />
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-danger"
                                                                    onClick={() => handleDesactivar(estudiante)}
                                                                    title="Desactivar"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </Button>
                                                            )}
                                                        </div>
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

            {/* Modal de QR */}
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

            {/* Modal de cambiar grupo */}
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
                            .filter((g) => (g.id_grupo || g.id) !== selectedGrupoId)
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

