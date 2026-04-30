import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { Users, PlayCircle, Clock } from "lucide-react";
import tutorGroupsService from "../../services/tutorGroupsService";

export default function TutorDashboardOverview() {
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const respuesta = await tutorGroupsService.listarGrupos();
        setGrupos(respuesta.data || []);
      } catch (err) {
        setError(err.message || "No fue posible cargar el resumen");
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  if (cargando) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3 text-muted">Cargando tu resumen...</span>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  // Cálculos de métricas asegurando que el booleano sea estricto
  const isActivo = (val) => val === true || val === "true" || val === "t" || val === 1;
  const totalGrupos = grupos.length;
  const gruposActivos = grupos.filter(g => isActivo(g.sesion_activa)).length;
  const gruposInactivos = totalGrupos - gruposActivos;

  return (
    <Container fluid className="py-4">
      {/* Encabezado */}
      <div className="mb-4">
        <div className="lk-page-eyebrow mb-2">Panel de Control</div>
        <h1 className="fw-bold m-0" style={{ fontSize: "2.2rem", letterSpacing: "-0.04em", color: "var(--lk-color-text)" }}>
          Resumen de Actividad
        </h1>
        <p className="text-muted mt-2">
          Visión general del estado actual de tus grupos y sesiones de clase.
        </p>
      </div>

      {/* Tarjetas de Estadísticas (Idénticas al Admin) */}
      <div className="lk-dashboard-grid mb-5">
        
        <div className="lk-span-4">
          <Card className="lk-stat-card lk-stat-card--blue h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span>Total de Grupos</span>
                <strong className="d-block mt-1">{totalGrupos}</strong>
                <small className="d-block mt-2">Grupos bajo tu administración</small>
              </div>
              <div style={{ background: "rgba(255,255,255,0.2)", padding: "12px", borderRadius: "12px" }}>
                <Users size={24} color="#ffffff" />
              </div>
            </div>
          </Card>
        </div>

        <div className="lk-span-4">
          <Card className="lk-stat-card lk-stat-card--green h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span>Sesiones Activas</span>
                <strong className="d-block mt-1">{gruposActivos}</strong>
                <small className="d-block mt-2">Grupos jugando en este momento</small>
              </div>
              <div style={{ background: "rgba(255,255,255,0.2)", padding: "12px", borderRadius: "12px" }}>
                <PlayCircle size={24} color="#ffffff" />
              </div>
            </div>
          </Card>
        </div>

        <div className="lk-span-4">
          <Card className="lk-stat-card lk-stat-card--orange h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span>Sesiones Inactivas</span>
                <strong className="d-block mt-1">{gruposInactivos}</strong>
                <small className="d-block mt-2">Grupos en espera</small>
              </div>
              <div style={{ background: "rgba(255,255,255,0.2)", padding: "12px", borderRadius: "12px" }}>
                <Clock size={24} color="#ffffff" />
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Sección adicional sugerida (Acciones Rápidas o Estado) */}
      <Row>
        <Col xs={12}>
          <Card className="lk-card border-0 shadow-sm" style={{ borderRadius: "16px" }}>
            <Card.Body className="p-4">
              <h3 className="fw-bold fs-5 mb-3" style={{ color: "var(--lk-color-text)" }}>Actividad Reciente</h3>
              {gruposActivos > 0 ? (
                <div className="d-flex align-items-center p-3" style={{ background: "rgba(23, 178, 106, 0.08)", borderRadius: "12px", border: "1px solid rgba(23, 178, 106, 0.2)" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--lk-color-success)", marginRight: "16px", boxShadow: "0 0 8px var(--lk-color-success)" }}></div>
                  <div>
                    <h4 className="m-0 fs-6 fw-bold text-success">¡Hay estudiantes jugando!</h4>
                    <p className="m-0 text-muted small mt-1">Tienes {gruposActivos} grupo(s) con la sesión abierta actualmente. Los datos se están recopilando.</p>
                  </div>
                </div>
              ) : (
                <div className="d-flex align-items-center p-3" style={{ background: "rgba(103, 123, 160, 0.05)", borderRadius: "12px", border: "1px dashed var(--lk-color-border)" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--lk-color-text-muted)", marginRight: "16px" }}></div>
                  <div>
                    <h4 className="m-0 fs-6 fw-bold" style={{ color: "var(--lk-color-text-soft)" }}>Todo tranquilo por ahora</h4>
                    <p className="m-0 text-muted small mt-1">Ningún grupo tiene la sesión activa en este momento. Dirígete a la pestaña "Grupos" para abrir una sesión.</p>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

    </Container>
  );
}
