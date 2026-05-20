import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { BookOpen, Play, Square } from "lucide-react";
import SessionMinigameModal from "../../components/tutor/SessionMinigameModal";
import tutorGroupsService from "../../services/tutorGroupsService";

const isSesionActiva = (value) => value === true || value === "true" || value === "t" || value === 1;

export default function TutorGruposPage() {
  const [grupos, setGrupos] = useState([]);
  const [minijuegos, setMinijuegos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [accionGrupoId, setAccionGrupoId] = useState(null);
  const [picker, setPicker] = useState({
    show: false,
    group: null,
    minijuegoId: "",
    error: "",
  });

  const cargarTodo = async () => {
    try {
      setCargando(true);
      const [groups, games] = await Promise.all([
        tutorGroupsService.getGroups(),
        tutorGroupsService.listarMinijuegosActivos(),
      ]);

      setGrupos(groups);
      setMinijuegos(games);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "No fue posible cargar los grupos asignados.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const closePicker = () => {
    setPicker({
      show: false,
      group: null,
      minijuegoId: "",
      error: "",
    });
  };

  const showFeedback = (message) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 3500);
  };

  const abrirSelector = (group) => {
    if (minijuegos.length === 0) {
      setError("No hay minijuegos activos disponibles para abrir la clase.");
      return;
    }

    setPicker({
      show: true,
      group,
      minijuegoId: String(group.sesion_minijuego_id ?? minijuegos[0]?.id ?? ""),
      error: "",
    });
  };

  const handleToggleSesion = async (group) => {
    if (!isSesionActiva(group.sesion_activa)) {
      abrirSelector(group);
      return;
    }

    setAccionGrupoId(group.id);

    try {
      await tutorGroupsService.cerrarSesionClase(group.id);
      setGrupos((prev) =>
        prev.map((item) =>
          item.id === group.id
            ? {
                ...item,
                sesion_activa: false,
                sesion_minijuego_id: null,
                sesion_minijuego_slug: null,
                sesion_minijuego_titulo: null,
              }
            : item
        )
      );
      showFeedback(`La clase de "${group.nombre}" quedó cerrada.`);
    } catch (toggleError) {
      setError(toggleError.message || "No fue posible cerrar la clase.");
    } finally {
      setAccionGrupoId(null);
    }
  };

  const handleConfirmOpenSession = async () => {
    if (!picker.group) {
      closePicker();
      return;
    }

    if (!picker.minijuegoId) {
      setPicker((prev) => ({
        ...prev,
        error: "Debes elegir un minijuego para abrir la clase.",
      }));
      return;
    }

    setAccionGrupoId(picker.group.id);

    try {
      await tutorGroupsService.abrirSesionClase(picker.group.id, Number(picker.minijuegoId));

      const selectedMinigame = minijuegos.find(
        (minijuego) => String(minijuego.id) === String(picker.minijuegoId)
      );

      setGrupos((prev) =>
        prev.map((group) =>
          group.id === picker.group.id
            ? {
                ...group,
                sesion_activa: true,
                sesion_minijuego_id: Number(picker.minijuegoId),
                sesion_minijuego_slug: selectedMinigame?.slug ?? null,
                sesion_minijuego_titulo: selectedMinigame?.titulo ?? null,
              }
            : group
        )
      );

      showFeedback(
        `La clase de "${picker.group.nombre}" quedó abierta con ${selectedMinigame?.titulo ?? "el minijuego seleccionado"}.`
      );
      closePicker();
    } catch (toggleError) {
      setPicker((prev) => ({
        ...prev,
        error: toggleError.message || "No fue posible abrir la clase.",
      }));
    } finally {
      setAccionGrupoId(null);
    }
  };

  if (cargando) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3 mb-0">Cargando grupos asignados...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h1 className="h3 mb-1">Mis grupos</h1>
        <p className="text-muted mb-0">Consulta el estado de tus clases y activa sesiones cuando lo necesites.</p>
      </div>

      {feedback ? <Alert variant="success">{feedback}</Alert> : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}

      {grupos.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <BookOpen size={42} className="text-muted mb-3" />
            <h2 className="h5">No tienes grupos asignados</h2>
            <p className="text-muted mb-0">Aún no tienes grupos disponibles.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {grupos.map((group) => {
            const activa = isSesionActiva(group.sesion_activa);
            const loadingAction = accionGrupoId === group.id;

            return (
              <Col xs={12} md={6} lg={4} key={group.id}>
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <Card.Title className="mb-1">{group.nombre}</Card.Title>
                        <span className={`badge ${activa ? "bg-success" : "bg-secondary"}`}>
                          {activa ? "Clase abierta" : "Clase cerrada"}
                        </span>
                      </div>
                    </div>

                    <Card.Text className="text-muted">
                      {group.descripcion || "Sin descripción registrada."}
                    </Card.Text>

                    <div className="small text-muted mb-4">
                      <div>
                        <strong>Minijuego de sesión:</strong>{" "}
                        {group.sesion_minijuego_titulo || "Se define al abrir la clase"}
                      </div>
                      <div>
                        <strong>Tutor asignado:</strong> {group.tutor_nombre || "Sin nombre visible"}
                      </div>
                    </div>

                    <Button
                      className="mt-auto d-flex align-items-center justify-content-center gap-2"
                      variant={activa ? "outline-danger" : "primary"}
                      onClick={() => handleToggleSesion(group)}
                      disabled={loadingAction}
                    >
                      {loadingAction ? (
                        <>
                          <Spinner size="sm" />
                          Procesando...
                        </>
                      ) : activa ? (
                        <>
                          <Square size={16} />
                          Cerrar clase
                        </>
                      ) : (
                        <>
                          <Play size={16} />
                          Abrir clase
                        </>
                      )}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <SessionMinigameModal
        show={picker.show}
        groupName={picker.group?.nombre ?? "grupo"}
        minijuegos={minijuegos}
        selectedMinigameId={picker.minijuegoId}
        onSelect={(value) =>
          setPicker((prev) => ({
            ...prev,
            minijuegoId: value,
            error: "",
          }))
        }
        onClose={closePicker}
        onConfirm={handleConfirmOpenSession}
        isSubmitting={Boolean(accionGrupoId)}
        errorMessage={picker.error}
      />
    </Container>
  );
}
