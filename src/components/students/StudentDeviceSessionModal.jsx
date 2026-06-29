import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Clock3,
  MonitorSmartphone,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import realtimeService from "../../services/realtimeService";
import studentDeviceSessionService, {
  DEVICE_RECOVERY_ACTIONS,
} from "../../services/studentDeviceSessionService";
import RoleModal from "../common/RoleModal";
import "../../styles/student-device-session.css";

export const normalizeDeviceSession = (payload) => {
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    typeof payload.tiene_dispositivo_activo !== "boolean" ||
    typeof payload.puede_recuperar !== "boolean" ||
    payload.tiene_dispositivo_activo === false
  ) {
    return null;
  }

  const session = payload.dispositivo_activo;
  if (!session || typeof session !== "object" || Array.isArray(session)) {
    return null;
  }

  if (session.estado !== "activo") {
    return null;
  }

  return {
    status: session.estado,
    activityLabel: session.actividad_actual?.minijuego_titulo ?? null,
    activityAt: session.ultima_actividad_en ?? null,
    connectedAt: session.conectado_desde ?? null,
    canRecover: payload.puede_recuperar,
  };
};

const formatDateTime = (value) => {
  if (!value) return "Sin datos";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin datos";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const eventTargetsStudent = (payload, studentId) => {
  const eventStudentId =
    payload?.estudiante_id ??
    payload?.student_id ??
    payload?.studentId ??
    payload?.estudiante?.id ??
    payload?.student?.id;

  return eventStudentId == null || String(eventStudentId) === String(studentId);
};

export default function StudentDeviceSessionModal({ open, student, onClose, onRecovered }) {
  const { token } = useAuth();
  const [deviceSession, setDeviceSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const requestSequence = useRef(0);
  const loadSession = useCallback(async ({ silent = false } = {}) => {
    if (!student?.id) return;

    const requestId = requestSequence.current + 1;
    requestSequence.current = requestId;

    if (!silent) setIsLoading(true);
    setError("");

    try {
      const data = await studentDeviceSessionService.getActiveSession(student.id);
      if (requestSequence.current === requestId) {
        setDeviceSession(normalizeDeviceSession(data));
      }
    } catch (requestError) {
      if (requestSequence.current === requestId) {
        setDeviceSession(null);
        setError(requestError.message || "No fue posible consultar el dispositivo activo.");
      }
    } finally {
      if (!silent && requestSequence.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [student?.id]);

  useEffect(() => {
    if (!open || !student?.id) return undefined;

    setIsConfirming(false);
    setSuccessMessage("");
    void loadSession();

    return () => {
      requestSequence.current += 1;
    };
  }, [loadSession, open, student?.id]);

  useEffect(() => {
    if (!open || !student?.id || !token) return undefined;

    return realtimeService.subscribe({
      token,
      onStudentAccessChanged: (payload) => {
        if (eventTargetsStudent(payload, student.id)) {
          void loadSession({ silent: true });
        }
      },
    });
  }, [loadSession, open, student?.id, token]);

  const handleClose = () => {
    if (!isRecovering) onClose();
  };

  const handleRecover = async () => {
    if (!student?.id || !deviceSession?.canRecover) return;

    setIsRecovering(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await studentDeviceSessionService.recover(
        student.id,
        DEVICE_RECOVERY_ACTIONS.RESTART_CURRENT_ACTIVITY
      );
      setSuccessMessage(result.message);
      setIsConfirming(false);
      await loadSession({ silent: true });
      await onRecovered?.();
    } catch (requestError) {
      setError(requestError.message || "No fue posible autorizar la recuperación.");
    } finally {
      setIsRecovering(false);
    }
  };

  const actions = isConfirming ? (
    <>
      <button
        type="button"
        className="lk-btn lk-btn--secondary"
        onClick={() => setIsConfirming(false)}
        disabled={isRecovering}
      >
        Volver
      </button>
      <button
        type="button"
        className="lk-btn lk-btn--primary"
        onClick={handleRecover}
        disabled={isRecovering}
      >
        <RotateCcw size={16} className={isRecovering ? "is-spinning" : ""} />
        {isRecovering ? "Autorizando..." : "Confirmar recuperación"}
      </button>
    </>
  ) : (
    <>
      <button type="button" className="lk-btn lk-btn--secondary" onClick={handleClose}>
        Cerrar
      </button>
      <button
        type="button"
        className="lk-btn lk-btn--secondary"
        onClick={() => loadSession()}
        disabled={isLoading}
      >
        <RefreshCw size={16} className={isLoading ? "is-spinning" : ""} />
        Actualizar
      </button>
      {deviceSession ? (
        <button
          type="button"
          className="lk-btn lk-btn--primary"
          onClick={() => setIsConfirming(true)}
          disabled={!deviceSession.canRecover}
        >
          <RotateCcw size={16} />
          Recuperar actividad
        </button>
      ) : null}
    </>
  );

  return (
    <RoleModal
      open={open}
      onClose={handleClose}
      eyebrow="Sesión de dispositivo"
      title={student?.nombre || "Estudiante"}
      width={640}
      overlayClassName="lk-device-session-modal"
      actions={actions}
    >
      <div className="lk-device-session" aria-live="polite">
        {error ? <div className="lk-device-session__alert is-error">{error}</div> : null}
        {successMessage ? (
          <div className="lk-device-session__alert is-success">{successMessage}</div>
        ) : null}

        {isConfirming ? (
          <section className="lk-device-session__confirmation">
            <div className="lk-device-session__icon is-warning">
              <ShieldCheck size={24} aria-hidden="true" />
            </div>
            <div>
              <span className="lk-device-session__eyebrow">Confirmación requerida</span>
              <h4>¿Autorizar el reinicio de la actividad actual?</h4>
              <p>
                El backend validará su rol y la institución antes de enviar la recuperación al
                dispositivo activo de {student?.nombre || "este estudiante"}.
              </p>
            </div>
          </section>
        ) : isLoading ? (
          <div className="lk-device-session__loading">
            <span className="lk-device-session__spinner" aria-hidden="true" />
            <p>Consultando el estado más reciente...</p>
          </div>
        ) : deviceSession ? (
          <>
            <section className="lk-device-session__status">
              <div className="lk-device-session__icon is-online">
                <MonitorSmartphone size={24} aria-hidden="true" />
              </div>
              <div>
                <span className="lk-device-session__eyebrow">Dispositivo activo</span>
                <h4>{deviceSession.status}</h4>
                <p>La vista se actualiza al recibir cambios de acceso en tiempo real.</p>
              </div>
              <span className="lk-device-session__live-indicator">En línea</span>
            </section>

            <dl className="lk-device-session__facts">
              <div>
                <dt><Activity size={17} aria-hidden="true" /> Última actividad</dt>
                <dd>{deviceSession.activityLabel || "Sin datos"}</dd>
              </div>
              <div>
                <dt><Clock3 size={17} aria-hidden="true" /> Último registro</dt>
                <dd>{formatDateTime(deviceSession.activityAt)}</dd>
              </div>
              <div>
                <dt><MonitorSmartphone size={17} aria-hidden="true" /> Conectado desde</dt>
                <dd>{formatDateTime(deviceSession.connectedAt)}</dd>
              </div>
            </dl>

            {!deviceSession.canRecover ? (
              <p className="lk-device-session__notice">
                Esta sesión puede consultarse, pero el backend no autoriza su recuperación.
              </p>
            ) : null}
          </>
        ) : (
          <section className="lk-device-session__empty">
            <div className="lk-device-session__icon">
              <WifiOff size={24} aria-hidden="true" />
            </div>
            <div>
              <h4>Sin dispositivo activo</h4>
              <p>No hay una sesión de dispositivo disponible para recuperar en este momento.</p>
            </div>
          </section>
        )}
      </div>
    </RoleModal>
  );
}
