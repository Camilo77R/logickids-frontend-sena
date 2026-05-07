import { useEffect, useMemo, useState } from "react";
import { Alert, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { Award, Medal, Sparkles, Trophy } from "lucide-react";
import estudianteService from "../../services/estudianteService";
import logrosService from "../../services/logrosService";
import tutorGroupsService from "../../services/tutorGroupsService";

const normalizeId = (value) => String(value ?? "");

export default function TutorLogrosPage() {
  const [grupos, setGrupos] = useState([]);
  const [grupoId, setGrupoId] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudianteId, setEstudianteId] = useState("");
  const [catalogo, setCatalogo] = useState([]);
  const [logros, setLogros] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
        setGrupoId(normalizeId(normalizedGroups[0]?.id));
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
        setEstudianteId("");
        return;
      }

      try {
        const students = await estudianteService.listEstudiantes(Number(grupoId));
        const normalizedStudents = students.map((student) => ({
          ...student,
          id: student.id ?? student.id_estudiante,
        }));

        setEstudiantes(normalizedStudents);
        setEstudianteId((current) =>
          current && normalizedStudents.some((student) => normalizeId(student.id) === current)
            ? current
            : normalizeId(normalizedStudents[0]?.id)
        );
      } catch (loadError) {
        setError(loadError.message || "No fue posible cargar los estudiantes.");
        setEstudiantes([]);
      }
    };

    cargarEstudiantes();
  }, [grupoId]);

  useEffect(() => {
    const cargarLogros = async () => {
      if (!estudianteId) {
        setCatalogo([]);
        setLogros([]);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const [catalogData, unlockedData] = await Promise.all([
          logrosService.listCatalog(Number(estudianteId)),
          logrosService.listByStudent(Number(estudianteId)),
        ]);

        setCatalogo(catalogData);
        setLogros(unlockedData);
      } catch (loadError) {
        setError(loadError.message || "No fue posible cargar los logros.");
        setCatalogo([]);
        setLogros([]);
      } finally {
        setIsLoading(false);
      }
    };

    cargarLogros();
  }, [estudianteId]);

  const studentName = useMemo(
    () => estudiantes.find((student) => normalizeId(student.id) === estudianteId)?.nombre ?? "",
    [estudianteId, estudiantes]
  );

  const logrosByKey = useMemo(
    () =>
      new Map(logros.map((logro) => [logro.clave_logro, logro])),
    [logros]
  );

  const resumen = useMemo(() => {
    const desbloqueados = catalogo.filter((logro) => logro.desbloqueado).length;

    return {
      total: catalogo.length,
      desbloqueados,
      pendientes: Math.max(catalogo.length - desbloqueados, 0),
      progreso: catalogo.length ? Math.round((desbloqueados / catalogo.length) * 100) : 0,
    };
  }, [catalogo]);

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-2">
          <Trophy size={28} className="text-warning" />
          <h1 className="m-0">Logros y Gamificación</h1>
        </div>
        <p className="text-muted mb-0">
          Consulta el progreso real de cada estudiante sobre el catálogo de trofeos del backend.
        </p>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex flex-wrap gap-3">
            <select value={grupoId} onChange={(event) => setGrupoId(event.target.value)}>
              <option value="">Selecciona un grupo</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nombre}
                </option>
              ))}
            </select>

            <select
              value={estudianteId}
              onChange={(event) => setEstudianteId(event.target.value)}
              disabled={!estudiantes.length}
            >
              <option value="">Selecciona un estudiante</option>
              {estudiantes.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.nombre}
                </option>
              ))}
            </select>
          </div>
        </Card.Body>
      </Card>

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted mb-0">Cargando logros...</p>
        </div>
      ) : !estudianteId ? (
        <Card>
          <Card.Body className="text-center py-5">
            <Trophy size={44} className="text-muted mb-3" />
            <p className="text-muted mb-0">
              Selecciona un estudiante para revisar su progreso.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row className="g-4 mb-4">
            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <small className="text-muted">Estudiante</small>
                  <h2 className="mt-2 mb-0">{studentName || "Sin nombre"}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <small className="text-muted">Logros desbloqueados</small>
                  <h2 className="mt-2 mb-0 text-success">{resumen.desbloqueados}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <small className="text-muted">Pendientes</small>
                  <h2 className="mt-2 mb-0 text-warning">{resumen.pendientes}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <small className="text-muted">Progreso</small>
                  <h2 className="mt-2 mb-0">{resumen.progreso}%</h2>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4">
            <Col lg={8}>
              <Card>
                <Card.Body>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <Sparkles size={18} className="text-primary" />
                    <h2 className="h5 mb-0">Catálogo</h2>
                  </div>

                  {!catalogo.length ? (
                    <p className="text-muted mb-0">
                      Este estudiante aún no tiene logros visibles en el catálogo.
                    </p>
                  ) : (
                    <Row className="g-3">
                      {catalogo.map((item) => {
                        const unlocked = logrosByKey.get(item.clave);

                        return (
                          <Col md={6} key={item.id_catalogo_logro}>
                            <div
                              className="border rounded p-3 h-100"
                              style={{
                                backgroundColor: item.desbloqueado ? "#ecfdf3" : "#f8fafc",
                                borderColor: item.desbloqueado ? "#22c55e" : "#e2e8f0",
                              }}
                            >
                              <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                                <div className="d-flex align-items-center gap-2">
                                  <span style={{ fontSize: "1.4rem" }}>{item.icono || "🏆"}</span>
                                  <strong>{item.nombre}</strong>
                                </div>
                                <span className={`badge ${item.desbloqueado ? "bg-success" : "bg-secondary"}`}>
                                  {item.desbloqueado ? "Desbloqueado" : "Pendiente"}
                                </span>
                              </div>

                              <p className="text-muted small mb-2">{item.descripcion}</p>

                              {unlocked ? (
                                <small className="text-success">
                                  Desbloqueado el{" "}
                                  {new Date(unlocked.desbloqueado_en).toLocaleDateString("es-CO")}
                                </small>
                              ) : (
                                <small className="text-muted">Aún no alcanzado.</small>
                              )}
                            </div>
                          </Col>
                        );
                      })}
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <Award size={18} className="text-warning" />
                    <h2 className="h5 mb-0">Últimos desbloqueos</h2>
                  </div>

                  {!logros.length ? (
                    <p className="text-muted mb-0">
                      Este estudiante todavía no ha desbloqueado logros.
                    </p>
                  ) : (
                    logros.map((logro) => (
                      <div
                        key={logro.id}
                        className="border rounded p-3 mb-2"
                        style={{ backgroundColor: "#fffdf5" }}
                      >
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Medal size={16} className="text-warning" />
                          <strong>{logro.nombre_logro}</strong>
                        </div>
                        <small className="text-muted d-block">{logro.descripcion}</small>
                        <small className="text-success d-block mt-2">
                          {new Date(logro.desbloqueado_en).toLocaleDateString("es-CO")}
                        </small>
                      </div>
                    ))
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
