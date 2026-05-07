import { useEffect, useMemo, useState } from "react";
import { Alert, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { History, MousePointerClick } from "lucide-react";
import SesionesCharts from "../../components/sesiones/SesionesCharts";
import SesionesFilters from "../../components/sesiones/SesionesFilters";
import SesionesTable from "../../components/sesiones/SesionesTable";
import estudianteService from "../../services/estudianteService";
import { getEventosSesion, getSesionesByEstudiante, getSesionesPorGrupo } from "../../services/sesiones.service";
import tutorGroupsService from "../../services/tutorGroupsService";

const normalizeId = (value) => String(value ?? "");

export default function SesionesPage() {
  const [tipo, setTipo] = useState("estudiante");
  const [grupos, setGrupos] = useState([]);
  const [grupoId, setGrupoId] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudianteId, setEstudiante] = useState("");
  const [data, setData] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [eventosSesion, setEventosSesion] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEventos, setIsLoadingEventos] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarGrupos = async () => {
      try {
        const groups = await tutorGroupsService.getGroups();
        const normalizedGroups = groups.map((grupo) => ({
          ...grupo,
          id: grupo.id ?? grupo.id_grupo,
        }));

        setGrupos(normalizedGroups);

        if (normalizedGroups.length > 0) {
          setGrupoId(normalizeId(normalizedGroups[0].id));
        }
      } catch (loadError) {
        setError(loadError.message || "No fue posible cargar los grupos.");
      } finally {
        setIsLoading(false);
      }
    };

    cargarGrupos();
  }, []);

  useEffect(() => {
    const cargarEstudiantes = async () => {
      if (!grupoId) {
        setEstudiantes([]);
        setEstudiante("");
        return;
      }

      try {
        const students = await estudianteService.listEstudiantes(Number(grupoId));
        const normalizedStudents = students.map((student) => ({
          ...student,
          id: student.id ?? student.id_estudiante,
        }));

        setEstudiantes(normalizedStudents);
        setEstudiante((current) =>
          current && normalizedStudents.some((student) => normalizeId(student.id) === current)
            ? current
            : normalizeId(normalizedStudents[0]?.id)
        );
      } catch (loadError) {
        setError(loadError.message || "No fue posible cargar los estudiantes del grupo.");
        setEstudiantes([]);
      }
    };

    cargarEstudiantes();
  }, [grupoId]);

  useEffect(() => {
    const cargarSesiones = async () => {
      if (!grupoId) {
        setData([]);
        setSelectedSession(null);
        setEventosSesion([]);
        return;
      }

      if (tipo === "estudiante" && !estudianteId) {
        setData([]);
        setSelectedSession(null);
        setEventosSesion([]);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const sesiones =
          tipo === "estudiante"
            ? await getSesionesByEstudiante(Number(estudianteId))
            : await getSesionesPorGrupo(estudiantes);

        setData(sesiones);
        setSelectedSession(null);
        setEventosSesion([]);
      } catch (loadError) {
        setError(loadError.message || "No fue posible cargar el historial de sesiones.");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    cargarSesiones();
  }, [tipo, grupoId, estudianteId, estudiantes]);

  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    setIsLoadingEventos(true);

    try {
      const eventos = await getEventosSesion(session.id);
      setEventosSesion(eventos);
    } catch (loadError) {
      setError(loadError.message || "No fue posible cargar el detalle de la sesión.");
      setEventosSesion([]);
    } finally {
      setIsLoadingEventos(false);
    }
  };

  const summary = useMemo(() => {
    return data.reduce(
      (acc, sesion) => {
        acc.sesiones += 1;
        acc.puntaje += Number(sesion.puntaje || 0);
        acc.aciertos += Number(sesion.aciertos || 0);
        acc.errores += Number(sesion.errores || 0);
        return acc;
      },
      { sesiones: 0, puntaje: 0, aciertos: 0, errores: 0 }
    );
  }, [data]);

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-2">
          <History size={28} className="text-primary" />
          <h1 className="m-0">Sesiones</h1>
        </div>
        <p className="text-muted mb-0">
          Revisa el historial real de partidas por estudiante o consolídalo por grupo.
        </p>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Card className="mb-4">
        <Card.Body>
          <SesionesFilters
            tipo={tipo}
            setTipo={setTipo}
            grupos={grupos}
            grupoId={grupoId}
            setGrupoId={setGrupoId}
            estudiantes={estudiantes}
            estudianteId={estudianteId}
            setEstudiante={setEstudiante}
          />
        </Card.Body>
      </Card>

      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <small className="text-muted">Sesiones encontradas</small>
              <h2 className="mt-2 mb-0">{summary.sesiones}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <small className="text-muted">Puntaje acumulado</small>
              <h2 className="mt-2 mb-0">{summary.puntaje}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <small className="text-muted">Aciertos</small>
              <h2 className="mt-2 mb-0 text-success">{summary.aciertos}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <small className="text-muted">Errores</small>
              <h2 className="mt-2 mb-0 text-danger">{summary.errores}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted mb-0">Cargando sesiones...</p>
        </div>
      ) : !data.length ? (
        <Card>
          <Card.Body className="text-center py-5">
            <History size={44} className="text-muted mb-3" />
            <p className="text-muted mb-0">
              No hay sesiones registradas para el filtro actual.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <Card.Body>
              <SesionesCharts data={data} />
            </Card.Body>
          </Card>

          <Row className="g-4">
            <Col lg={8}>
              <Card>
                <Card.Body>
                  <SesionesTable
                    data={data}
                    onSelectSession={handleSelectSession}
                    selectedSessionId={selectedSession?.id}
                    showStudentColumn={tipo === "grupo"}
                  />
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <MousePointerClick size={18} className="text-primary" />
                    <h2 className="h5 mb-0">Detalle de eventos</h2>
                  </div>

                  {!selectedSession ? (
                    <p className="text-muted mb-0">
                      Selecciona una sesión de la tabla para ver sus eventos.
                    </p>
                  ) : isLoadingEventos ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" size="sm" variant="primary" />
                      <p className="text-muted mt-2 mb-0">Cargando eventos...</p>
                    </div>
                  ) : !eventosSesion.length ? (
                    <p className="text-muted mb-0">
                      Esta sesión no tiene eventos registrados para mostrar.
                    </p>
                  ) : (
                    <div style={{ maxHeight: "480px", overflowY: "auto" }}>
                      {eventosSesion.map((evento) => (
                        <div
                          key={evento.id}
                          className="border rounded p-3 mb-2"
                          style={{ backgroundColor: "#f8fafc" }}
                        >
                          <div className="d-flex justify-content-between gap-2">
                            <strong>{evento.tipo_evento}</strong>
                            <small className="text-muted">
                              {new Date(evento.ocurrido_en).toLocaleTimeString("es-CO")}
                            </small>
                          </div>
                          <small className="d-block text-muted mt-1">
                            Habilidad: {evento.habilidad || "No aplica"}
                          </small>
                          <small className="d-block text-muted">
                            Reacción: {evento.tiempo_reaccion_ms ?? "—"} ms
                          </small>
                          <small className="d-block text-muted">
                            Puntos: {evento.puntos ?? 0} · Combo: {evento.combo_en_evento ?? 0}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}
