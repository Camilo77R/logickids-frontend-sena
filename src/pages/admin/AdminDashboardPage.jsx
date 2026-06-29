import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Activity,
  GraduationCap,
  Mail,
  Search,
  ShieldCheck,
  UserCog2,
  Users,
  X,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import StatusBadge from "../../components/common/StatusBadge";
import RoleModal from "../../components/common/RoleModal";
import { useAuth } from "../../hooks/useAuth";
import adminService from "../../services/adminService";
import adminTutorsService from "../../services/adminTutorsService";
import adminInstitutionalAdminsService from "../../services/adminInstitutionalAdminsService";
import adminStudentsService from "../../services/adminStudentsService";
import { buildAdminDashboardView } from "./adminDashboard.selectors";
import "../../styles/admin-shell.css";

const normalizeSearch = (value) => value.trim().toLowerCase();
const includesSearch = (value, search) =>
  String(value || "").toLowerCase().includes(search);

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [tutores, setTutores] = useState([]);
  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [stats, setStats] = useState({ totalTutores: null, totalEstudiantes: null, totalGrupos: null });

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.allSettled([
      adminTutorsService.getTutors?.() ?? Promise.resolve([]),
      adminStudentsService.getStudents?.() ?? Promise.resolve([]),
      adminInstitutionalAdminsService.getAdmins?.() ?? Promise.resolve([]),
      adminService.getPendingRequests?.() ?? Promise.resolve([]),
    ]).then(([t, s, a, r]) => {
      if (cancelled) return;
      const tutList = t.status === "fulfilled" ? (t.value ?? []) : [];
      const stuList = s.status === "fulfilled" ? (s.value ?? []) : [];
      const admList = a.status === "fulfilled" ? (a.value ?? []) : [];
      const reqList = r.status === "fulfilled" ? (r.value ?? []) : [];
      setTutores(tutList);
      setStudents(stuList);
      setAdmins(admList);
      setPendingRequests(reqList);
      setStats({ totalTutores: tutList.length, totalEstudiantes: stuList.length, totalGrupos: null });
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleApproveRequest = useCallback(async (id) => {
    try {
      await adminService.approveRequest?.(id);
      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (_) {}
  }, []);

  const handleRejectRequest = useCallback(async (id) => {
    try {
      await adminService.rejectRequest?.(id);
      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (_) {}
  }, []);

  const filteredTutores = useMemo(() => {
    const q = normalizeSearch(searchQuery);
    if (!q) return tutores;
    return tutores.filter((t) => includesSearch(t.nombre, q) || includesSearch(t.email, q));
  }, [tutores, searchQuery]);

  return (
    <AppShell>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "1.5rem" }}>

        {/* Topbar */}
        <div className="lk-admin-topbar">
          <h1>Panel Administrativo</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1.5px solid #E2DCF0", borderRadius: "0.75rem", padding: "0.45rem 0.9rem", background: "#fff" }}>
              <Search size={15} style={{ color: "#6B6B8A" }} />
              <input
                style={{ border: "none", outline: "none", fontSize: "0.85rem", color: "#1A1A2E", background: "transparent", width: "180px" }}
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="lk-admin-kpi-row">
          <div className="lk-admin-kpi">
            <div className="lk-admin-kpi__icon lk-admin-kpi__icon--purple"><GraduationCap size={22} /></div>
            <div><div className="lk-admin-kpi__val">{stats.totalTutores ?? "—"}</div><div className="lk-admin-kpi__label">Total Profesores</div></div>
          </div>
          <div className="lk-admin-kpi">
            <div className="lk-admin-kpi__icon lk-admin-kpi__icon--green"><Activity size={22} /></div>
            <div><div className="lk-admin-kpi__val">{stats.totalEstudiantes ?? "—"}</div><div className="lk-admin-kpi__label">Total Estudiantes</div></div>
          </div>
          <div className="lk-admin-kpi">
            <div className="lk-admin-kpi__icon lk-admin-kpi__icon--blue"><UserCog2 size={22} /></div>
            <div><div className="lk-admin-kpi__val">{admins.length}</div><div className="lk-admin-kpi__label">Total Grupos</div></div>
          </div>
          <div className="lk-admin-kpi">
            <div className="lk-admin-kpi__icon lk-admin-kpi__icon--yellow"><ShieldCheck size={22} /></div>
            <div><div className="lk-admin-kpi__val">{pendingRequests.length}</div><div className="lk-admin-kpi__label">Solicitudes Pendientes</div></div>
          </div>
        </div>

        {/* Grid 2 columnas */}
        <div className="lk-admin-content-grid">
          {/* Tabla profesores */}
          <div className="lk-admin-panel">
            <div className="lk-admin-panel__head">Profesores Recientes</div>
            {isLoading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#6B6B8A" }}>Cargando...</div>
            ) : (
              <table className="lk-admin-table">
                <thead><tr><th>Nombre</th><th>E-mail</th><th>Estado</th></tr></thead>
                <tbody>
                  {filteredTutores.slice(0, 8).map((t) => (
                    <tr key={t.id} onClick={() => setSelectedTutor(t)} style={{ cursor: "pointer" }}>
                      <td><strong>{t.nombre}</strong></td>
                      <td style={{ color: "#6B6B8A", fontSize: "0.8rem" }}>{t.email || t.correo}</td>
                      <td>
                        {(t.estado === "activo" || t.activo)
                          ? <span className="lk-admin-badge-active">Activo</span>
                          : t.estado === "pendiente"
                          ? <span className="lk-admin-badge-pending">Pendiente</span>
                          : <span className="lk-admin-badge-inactive">Inactivo</span>}
                      </td>
                    </tr>
                  ))}
                  {filteredTutores.length === 0 && (
                    <tr><td colSpan={3} style={{ textAlign: "center", color: "#6B6B8A", padding: "1.5rem" }}>No hay profesores.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Solicitudes */}
          <div className="lk-admin-panel">
            <div className="lk-admin-panel__head">Solicitudes Recientes</div>
            {pendingRequests.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#6B6B8A" }}>No hay solicitudes pendientes.</div>
            ) : (
              pendingRequests.slice(0, 8).map((req) => {
                const name = req.nombre || req.name || req.email || "Solicitud";
                const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
                return (
                  <div key={req.id} className="lk-admin-req-item">
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#5B2D8E", color: "#fff", fontSize: "0.72rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials}</div>
                    <div className="lk-admin-req-copy">
                      <strong>{name}</strong>
                      <span>{req.tipo || req.type || "Nuevo Registro"}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button className="lk-admin-btn-approve" onClick={() => handleApproveRequest(req.id)}>Aprobar</button>
                      <button className="lk-admin-btn-reject" onClick={() => handleRejectRequest(req.id)}>Rechazar</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal de detalle */}
        {selectedTutor && (
          <RoleModal
            open={Boolean(selectedTutor)}
            onClose={() => setSelectedTutor(null)}
            title={selectedTutor.nombre}
            eyebrow="Detalle del tutor"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Mail size={15} style={{ color: "#6B6B8A" }} />
                <span>{selectedTutor.email || selectedTutor.correo || "Sin email"}</span>
              </div>
              <StatusBadge status={selectedTutor.estado} />
            </div>
          </RoleModal>
        )}
      </div>
    </AppShell>
  );
}
