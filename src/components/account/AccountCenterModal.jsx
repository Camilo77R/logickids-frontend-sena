import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const getRoleLabel = (role) => {
  if (role === "superadmin") return "Superadmin";
  if (role === "admin") return "Administrador";
  if (role === "tutor") return "Tutor";
  return "Usuario";
};

const mapErrorMessage = (error, fallback) => {
  if (!error) return fallback;

  if (Array.isArray(error.details) && error.details.length > 0) {
    return error.details.map((detail) => detail.message).join(" ");
  }

  return error.message || fallback;
};

export default function AccountCenterModal({ show, onHide }) {
  const { user, updateProfile, changePassword } = useAuth();

  const [profileForm, setProfileForm] = useState({ nombre: "" });
  const [passwordForm, setPasswordForm] = useState({
    contrasena_actual: "",
    contrasena_nueva: "",
    confirmar_contrasena: "",
  });
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!show) return;

    setProfileForm({ nombre: user?.nombre ?? "" });
    setPasswordForm({
      contrasena_actual: "",
      contrasena_nueva: "",
      confirmar_contrasena: "",
    });
    setProfileFeedback(null);
    setPasswordFeedback(null);
  }, [show, user]);

  const roleLabel = useMemo(() => getRoleLabel(user?.rol), [user?.rol]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    if (!profileForm.nombre.trim()) {
      setProfileFeedback({ type: "error", message: "El nombre es obligatorio." });
      return;
    }

    if (profileForm.nombre.trim().length < 2) {
      setProfileFeedback({
        type: "error",
        message: "El nombre debe tener al menos 2 caracteres.",
      });
      return;
    }

    try {
      setIsSavingProfile(true);
      setProfileFeedback(null);
      await updateProfile({ nombre: profileForm.nombre.trim() });
      setProfileFeedback({ type: "success", message: "Perfil actualizado correctamente." });
    } catch (error) {
      setProfileFeedback({
        type: "error",
        message: mapErrorMessage(error, "No fue posible actualizar el perfil."),
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!passwordForm.contrasena_actual) {
      setPasswordFeedback({
        type: "error",
        message: "Debes escribir la contraseña actual.",
      });
      return;
    }

    if (!passwordForm.contrasena_nueva || passwordForm.contrasena_nueva.length < 8) {
      setPasswordFeedback({
        type: "error",
        message: "La nueva contraseña debe tener al menos 8 caracteres.",
      });
      return;
    }

    if (passwordForm.contrasena_nueva !== passwordForm.confirmar_contrasena) {
      setPasswordFeedback({
        type: "error",
        message: "La confirmación de contraseña no coincide.",
      });
      return;
    }

    try {
      setIsSavingPassword(true);
      setPasswordFeedback(null);
      await changePassword({
        contrasena_actual: passwordForm.contrasena_actual,
        contrasena_nueva: passwordForm.contrasena_nueva,
      });
      setPasswordForm({
        contrasena_actual: "",
        contrasena_nueva: "",
        confirmar_contrasena: "",
      });
      setPasswordFeedback({
        type: "success",
        message: "Contraseña actualizada correctamente.",
      });
    } catch (error) {
      setPasswordFeedback({
        type: "error",
        message: mapErrorMessage(error, "No fue posible actualizar la contraseña."),
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Centro de cuenta</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="border rounded-4 p-4 h-100 bg-light">
              <div className="d-flex align-items-center gap-2 mb-3">
                <UserRound size={18} className="text-primary" />
                <h2 className="h5 mb-0">Identidad actual</h2>
              </div>

              <dl className="mb-0">
                <dt className="small text-muted mb-1">Nombre</dt>
                <dd className="fw-semibold">{user?.nombre || "Sin nombre"}</dd>

                <dt className="small text-muted mb-1">Correo</dt>
                <dd className="fw-semibold text-break">{user?.email || "Sin correo"}</dd>

                <dt className="small text-muted mb-1">Rol</dt>
                <dd className="fw-semibold">{roleLabel}</dd>

                <dt className="small text-muted mb-1">Institución</dt>
                <dd className="fw-semibold">{user?.institucion || "No asignada"}</dd>
              </dl>

              <div className="alert alert-warning mt-4 mb-0 small">
                Si ingresaste con una credencial temporal, cambia la contraseña antes de cerrar sesión.
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="border rounded-4 p-4 mb-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <ShieldCheck size={18} className="text-success" />
                <h2 className="h5 mb-0">Actualizar perfil</h2>
              </div>

              {profileFeedback ? (
                <Alert variant={profileFeedback.type === "success" ? "success" : "danger"}>
                  {profileFeedback.message}
                </Alert>
              ) : null}

              <Form onSubmit={handleProfileSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre visible</Form.Label>
                  <Form.Control
                    type="text"
                    value={profileForm.nombre}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, nombre: event.target.value }))
                    }
                    placeholder="Tu nombre completo"
                  />
                </Form.Group>

                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar perfil"
                  )}
                </Button>
              </Form>
            </div>

            <div className="border rounded-4 p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <KeyRound size={18} className="text-warning" />
                <h2 className="h5 mb-0">Cambiar contraseña</h2>
              </div>

              {passwordFeedback ? (
                <Alert variant={passwordFeedback.type === "success" ? "success" : "danger"}>
                  {passwordFeedback.message}
                </Alert>
              ) : null}

              <Form onSubmit={handlePasswordSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Contraseña actual</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordForm.contrasena_actual}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        contrasena_actual: event.target.value,
                      }))
                    }
                    autoComplete="current-password"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nueva contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordForm.contrasena_nueva}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        contrasena_nueva: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirmar nueva contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordForm.confirmar_contrasena}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        confirmar_contrasena: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                  />
                </Form.Group>

                <Button variant="warning" type="submit" disabled={isSavingPassword}>
                  {isSavingPassword ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Actualizando...
                    </>
                  ) : (
                    "Actualizar contraseña"
                  )}
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
