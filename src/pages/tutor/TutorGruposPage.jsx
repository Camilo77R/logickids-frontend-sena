import { useEffect, useState } from "react";
import { Users, Play, Square, Edit, Trash2, Plus, FolderOpen } from "lucide-react";
import { Container, Row, Col, Card, Button, Alert, Spinner, Modal, Form } from "react-bootstrap";
import tutorGroupsService from "../../services/tutorGroupsService";

export default function TutorGruposPage() {
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [cargandoAccion, setCargandoAccion] = useState(null);

  // Estados para el Modal CRUD
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    predeterminado: false
  });

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    try {
      setCargando(true);
      const respuesta = await tutorGroupsService.listarGrupos();
      setGrupos(respuesta.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Error al cargar los grupos");
    } finally {
      setCargando(false);
    }
  };

  // ---- CRUD Lógica ----

  const abrirModalCrear = () => {
    setEditandoId(null);
    setFormData({ nombre: "", descripcion: "", predeterminado: false });
    setShowModal(true);
  };

  const abrirModalEditar = (grupo) => {
    setEditandoId(grupo.id);
    setFormData({
      nombre: grupo.nombre,
      descripcion: grupo.descripcion || "",
      predeterminado: grupo.predeterminado || false
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
  };

  const handleGuardarGrupo = async (e) => {
    e.preventDefault();
    if (formData.nombre.trim().length < 2) {
      alert("El nombre del grupo debe tener al menos 2 caracteres.");
      return;
    }

    try {
      setGuardando(true);
      if (editandoId) {
        // Actualizar
        const res = await tutorGroupsService.actualizarGrupo(editandoId, formData);
        setGrupos(prev => prev.map(g => g.id === editandoId ? { ...g, ...formData } : g));
      } else {
        // Crear
        const res = await tutorGroupsService.crearGrupo(formData);
        // Recargamos o agregamos al state
        cargarGrupos(); // Forma simple y segura de traer el nuevo grupo con su ID autogenerado
      }
      cerrarModal();
    } catch (err) {
      alert("Error al guardar: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarGrupo = async (grupo) => {
    // Alerta simple solicitada en el plan
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el grupo "${grupo.nombre}"?`)) return;
    
    try {
      setCargandoAccion(grupo.id);
      await tutorGroupsService.eliminarGrupo(grupo.id);
      setGrupos(prev => prev.filter(g => g.id !== grupo.id));
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    } finally {
      setCargandoAccion(null);
    }
  };

  // ---- Lógica de Sesión ----
  const isActivo = (val) => val === true || val === "true" || val === "t" || val === 1;

  const handleToggleSesion = async (grupo) => {
    setCargandoAccion(grupo.id);
    try {
      const actualmenteActivo = isActivo(grupo.sesion_activa);
      if (actualmenteActivo) {
        await tutorGroupsService.cerrarSesionClase(grupo.id);
      } else {
        await tutorGroupsService.abrirSesionClase(grupo.id);
      }
      setGrupos(prev => prev.map(g => g.id === grupo.id ? { ...g, sesion_activa: !actualmenteActivo } : g));
    } catch (err) {
      alert("Error al cambiar el estado de la clase: " + err.message);
    } finally {
      setCargandoAccion(null);
    }
  };

  // ---- RENDER ----

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
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <Users size={32} className="text-primary me-2" />
          <h1 className="m-0 fs-3 fw-bold" style={{ color: "var(--lk-tutor-text)" }}>Mis Grupos</h1>
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
        Aquí puedes gestionar tus clases, editarlas y permitir que los estudiantes inicien los minijuegos.
      </p>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Grid de Grupos */}
      <Row className="g-4">
        {grupos.length === 0 && !cargando ? (
          <Col xs={12}>
            <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "50vh", backgroundColor: "var(--lk-tutor-surface)", borderRadius: "24px", border: "2px dashed var(--lk-tutor-primary)", padding: "40px", textAlign: "center", opacity: 0.9 }}>
              <div style={{ width: "80px", height: "80px", background: "linear-gradient(135deg, rgba(79,70,229,0.1), rgba(14,165,233,0.1))", color: "var(--lk-tutor-primary)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
                <FolderOpen size={40} />
              </div>
              <h2 className="fw-bold mb-3" style={{ color: "var(--lk-tutor-text)" }}>Aún no tienes grupos</h2>
              <p className="text-muted mb-4" style={{ maxWidth: "450px" }}>
                Comienza creando tu primer grupo de estudiantes para administrar sus sesiones de juego y acceder a las estadísticas.
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

            return (
            <Col xs={12} md={6} lg={4} key={groupId}>
              <Card className="h-100 shadow-sm border-0 position-relative" style={{ borderRadius: "16px", backgroundColor: "var(--lk-tutor-surface)" }}>
                
                {/* Botones de acción pequeña (Editar / Eliminar) */}
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
                  <Card.Text className="text-muted small mb-4">
                    {grupo.descripcion || "Sin descripción"}
                  </Card.Text>

                  <Button
                    className="mt-auto d-flex justify-content-center align-items-center gap-2 fw-bold border-0 text-white"
                    style={{ 
                      borderRadius: "8px", 
                      padding: "12px",
                      background: isActivo(grupo.sesion_activa) 
                        ? "var(--lk-color-danger)" 
                        : "linear-gradient(135deg, #13b56b, #39d98a)",
                      boxShadow: isActivo(grupo.sesion_activa) 
                        ? "0 4px 12px rgba(255, 130, 77, 0.3)" 
                        : "0 4px 12px rgba(19, 181, 107, 0.3)"
                    }}
                    onClick={() => handleToggleSesion(grupo)}
                    disabled={cargandoAccion === groupId}
                  >
                    {cargandoAccion === groupId ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        Procesando...
                      </>
                    ) : isActivo(grupo.sesion_activa) ? (
                      <>
                        <Square size={18} fill="currentColor" /> Cerrar Sesión
                      </>
                    ) : (
                      <>
                        <Play size={18} fill="currentColor" /> Abrir Sesión de Clase
                      </>
                    )}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          )})
        )}
      </Row>

      {/* Modal Crear/Editar Grupo */}
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
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
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
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                className="shadow-none border-secondary-subtle"
                style={{ borderRadius: "8px" }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={cerrarModal} className="fw-bold" style={{ borderRadius: "8px" }} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" className="fw-bold" style={{ borderRadius: "8px" }} disabled={guardando}>
              {guardando ? (
                <><Spinner animation="border" size="sm" className="me-2" />Guardando...</>
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
