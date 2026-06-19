import { useEffect, useMemo, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import {
  Award,
  Download,
  Lock,
  Medal,
  Rocket,
  Search,
  Share2,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import estudianteService from "../../services/estudianteService";
import logrosService from "../../services/logrosService";
import tutorGroupsService from "../../services/tutorGroupsService";
import "../../styles/tutor-logros.css";

const normalizeId = (value) => String(value ?? "");

const ACHIEVEMENT_FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "completados", label: "Completados" },
  { id: "pendientes", label: "Pendientes" },
];

const formatDate = (value) => {
  if (!value) {
    return "Fecha pendiente";
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const resolveAchievementXp = (achievement) =>
  achievement?.xp ?? achievement?.puntos_xp ?? achievement?.puntos ?? null;

const resolveCatalogKey = (achievement) =>
  achievement?.clave ?? achievement?.clave_logro ?? achievement?.id_catalogo_logro;

const resolveIcon = (achievement, unlocked) => {
  return unlocked ? "star" : "lock";
};

const buildInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "LK";

export default function TutorLogrosPage() {
  const [grupos, setGrupos] = useState([]);
  const [grupoId, setGrupoId] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudianteId, setEstudianteId] = useState("");
  const [catalogo, setCatalogo] = useState([]);
  const [logros, setLogros] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

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
            : normalizeId(normalizedStudents[0]?.id),
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

  const grupoActual = useMemo(
    () => grupos.find((grupo) => normalizeId(grupo.id) === grupoId),
    [grupoId, grupos],
  );

  const estudianteActual = useMemo(
    () => estudiantes.find((student) => normalizeId(student.id) === estudianteId),
    [estudianteId, estudiantes],
  );

  const studentName = estudianteActual?.nombre ?? "";

  const logrosByKey = useMemo(
    () => new Map(logros.map((logro) => [logro.clave_logro, logro])),
    [logros],
  );

  const catalogoEnriquecido = useMemo(
    () =>
      catalogo.map((item, index) => {
        const key = resolveCatalogKey(item);
        const unlocked = logrosByKey.get(key) ?? null;
        const desbloqueado = Boolean(item.desbloqueado || unlocked);

        return {
          ...item,
          key,
          desbloqueado,
          unlocked,
          xp: resolveAchievementXp(item),
          iconoFinal: resolveIcon(item, desbloqueado),
        };
      }),
    [catalogo, logrosByKey],
  );

  const resumen = useMemo(() => {
    const desbloqueados = catalogoEnriquecido.filter((logro) => logro.desbloqueado).length;

    return {
      total: catalogoEnriquecido.length,
      desbloqueados,
      pendientes: Math.max(catalogoEnriquecido.length - desbloqueados, 0),
      progreso: catalogoEnriquecido.length
        ? Math.round((desbloqueados / catalogoEnriquecido.length) * 100)
        : 0,
    };
  }, [catalogoEnriquecido]);

  const catalogoFiltrado = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return catalogoEnriquecido.filter((item) => {
      const coincideFiltro =
        filtro === "todos" ||
        (filtro === "completados" && item.desbloqueado) ||
        (filtro === "pendientes" && !item.desbloqueado);

      const coincideBusqueda =
        !texto ||
        item.nombre?.toLowerCase().includes(texto) ||
        item.descripcion?.toLowerCase().includes(texto);

      return coincideFiltro && coincideBusqueda;
    });
  }, [busqueda, catalogoEnriquecido, filtro]);

  const actividadReciente = useMemo(
    () =>
      [...logros]
        .sort((a, b) => new Date(b.desbloqueado_en ?? 0) - new Date(a.desbloqueado_en ?? 0))
        .slice(0, 4),
    [logros],
  );

  return (
    <section className="lk-achievements-page">
      <header className="lk-achievements-topbar">
        <label className="lk-achievements-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar logros o desafios..."
          />
        </label>

        <div className="lk-achievements-toolbar">
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

          <div className="lk-achievements-user">
            <span>{studentName || "Estudiante"}</span>
            <small>
              {grupoActual?.nombre ?? "Grupo"} · {resumen.desbloqueados}/{resumen.total} logros
            </small>
            <div aria-hidden="true">{buildInitials(studentName)}</div>
          </div>
        </div>
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {isLoading ? (
        <div className="lk-achievements-loading">
          <Spinner animation="border" variant="primary" />
          <p>Cargando logros...</p>
        </div>
      ) : !estudianteId ? (
        <div className="lk-achievements-empty">
          <Trophy size={48} aria-hidden="true" />
          <strong>Selecciona un estudiante</strong>
          <span>El catálogo de logros aparecerá cuando elijas un perfil.</span>
        </div>
      ) : (
        <>
          <div className="lk-achievements-kpis">
            <article className="lk-achievements-kpi lk-achievements-kpi--highlight">
              <div className="lk-achievements-kpi__icon">
                <Trophy size={42} aria-hidden="true" />
              </div>
              <div>
                <span>Logros totales</span>
                <strong>{resumen.desbloqueados}</strong>
              </div>
            </article>

            <article className="lk-achievements-kpi">
              <div className="lk-achievements-kpi__icon lk-achievements-kpi__icon--lock">
                <Lock size={40} aria-hidden="true" />
              </div>
              <div>
                <span>Pendientes</span>
                <strong>{resumen.pendientes}</strong>
              </div>
            </article>

          </div>

          <div className="lk-achievements-layout">
            <main>
              <div className="lk-achievements-section-head">
                <div>
                  <h1>Catálogo de Logros</h1>
                  <p>{studentName || "Este estudiante"} tiene {resumen.total} desafíos disponibles.</p>
                </div>

                <div className="lk-achievements-tabs" role="tablist" aria-label="Filtro de logros">
                  {ACHIEVEMENT_FILTERS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={filtro === item.id ? "active" : ""}
                      onClick={() => setFiltro(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {!catalogoFiltrado.length ? (
                <div className="lk-achievements-empty lk-achievements-empty--inline">
                  <Star size={34} aria-hidden="true" />
                  <strong>No hay logros con ese filtro</strong>
                  <span>Prueba con otra búsqueda o cambia el estado.</span>
                </div>
              ) : (
                <div className="lk-achievements-grid">
                  {catalogoFiltrado.map((item, index) => (
                    <article
                      key={item.id_catalogo_logro ?? item.key}
                      className={`lk-achievement-card ${
                        item.desbloqueado ? "is-unlocked" : "is-locked"
                      }`}
                    >
                      <div className="lk-achievement-card__top">
                        <div className="lk-achievement-card__icon" aria-hidden="true">
                          {item.desbloqueado ? <Star size={20} /> : <Lock size={20} />}
                        </div>
                        <span>{item.desbloqueado ? "Desbloqueado" : "Pendiente"}</span>
                      </div>

                      <h2>{item.nombre}</h2>
                      <p>{item.descripcion}</p>

                      <footer>
                        <strong>{item.xp != null ? `+${item.xp} XP` : "Logro pedagógico"}</strong>
                        {item.desbloqueado ? (
                          <small>{formatDate(item.unlocked?.desbloqueado_en)}</small>
                        ) : (
                          <small>Aún no desbloqueado</small>
                        )}
                      </footer>
                    </article>
                  ))}
                </div>
              )}
            </main>

            <aside className="lk-achievements-activity">
              <h2>Actividad Reciente</h2>

              {!actividadReciente.length ? (
                <div className="lk-achievements-activity__empty">
                  <Award size={28} aria-hidden="true" />
                  <span>Sin desbloqueos todavía</span>
                </div>
              ) : (
                <div className="lk-achievements-timeline">
                  {actividadReciente.map((logro) => (
                    <article key={logro.id}>
                      <div className="lk-achievements-timeline__dot">
                        <Medal size={16} aria-hidden="true" />
                      </div>
                      <span>{formatDate(logro.desbloqueado_en)}</span>
                      <strong>{logro.nombre_logro}</strong>
                      <p>{logro.descripcion}</p>
                    </article>
                  ))}
                </div>
              )}
            </aside>
          </div>

          <section className="lk-achievements-banner">
            <div>
              <span>Potencial LogicKids</span>
              <h2>¡Tu progreso está despegando!</h2>
              <p>
                {studentName || "El estudiante"} ya desbloqueó {resumen.desbloqueados} logros.
                Usa esta lectura para celebrar avances y orientar el siguiente reto.
              </p>
              <div className="lk-achievements-banner__actions">
                <button type="button">
                  <Download size={17} aria-hidden="true" />
                  Descargar reporte
                </button>
                <button type="button">
                  <Share2 size={17} aria-hidden="true" />
                  Compartir logros
                </button>
              </div>
            </div>

            <div className="lk-achievements-rocket" aria-hidden="true">
              <Rocket size={82} />
              <Zap size={28} />
            </div>
          </section>
        </>
      )}
    </section>
  );
}
