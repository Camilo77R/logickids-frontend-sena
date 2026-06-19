import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { HttpError } from "../../services/httpClient";
import { getHomePathByRole } from "../../utils/paths";
import { validateLoginForm } from "../../utils/validation/loginFormValidation";
import logoWordmark from "../../assets/imgs/logoLogickids transparente.png";
import loginPoster from "../../assets/imgs/logickIdsfofndoo.jpg";
import AuthPosterLayout from "../../components/auth/layout/AuthPosterLayout";
import AuthFormColumn from "../../components/auth/form/AuthFormColumn";
import AuthFormHeader from "../../components/auth/form/AuthFormHeader";
import AuthInlineNotice from "../../components/auth/feedback/AuthInlineNotice";
import LkIconTextField from "../../components/auth/form/LkIconTextField";
import LkPasswordField from "../../components/auth/form/LkPasswordField";
import LkPrimaryButton from "../../components/auth/form/LkPrimaryButton";
import "../../styles/auth.css";

const INITIAL_FORM = { email: "", contrasena: "" };

const isSuspendedAccountError = (err) =>
  err instanceof HttpError &&
  err.status === 403 &&
  (err.meta?.estado === "suspendido" || err.message?.toLowerCase().includes("suspendida"));

const isInactiveAccountError = (err) =>
  err instanceof HttpError &&
  err.status === 403 &&
  (err.meta?.estado === "inactivo" || err.message?.toLowerCase().includes("inactiva"));

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signOut } = useAuth();
  const authNotice = location.state?.notice ?? null;

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [serverErr, setServerErr] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
    setServerErr("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateLoginForm(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    try {
      setSubmitting(true);
      const user = await signIn({
        email: form.email.trim().toLowerCase(),
        contrasena: form.contrasena,
      });
      const path = getHomePathByRole(user?.rol);
      if (path === "/login") {
        signOut();
        setServerErr("Rol no reconocido.");
      } else navigate(path, { replace: true });
    } catch (err) {
      if (isSuspendedAccountError(err)) {
        navigate("/solicitar-reactivacion", {
          state: {
            email: form.email.trim().toLowerCase(),
            notice: {
              tone: "info",
              title: "Tu cuenta necesita revisión",
              message:
                err.message ||
                "La cuenta no tiene acceso activo. Solicita la reactivación para que un administrador la revise.",
            },
          },
        });
        return;
      }
      if (isInactiveAccountError(err)) {
        setServerErr(
          err.message ||
            "Tu cuenta está pendiente de activación. Un administrador debe habilitarla antes de iniciar sesión."
        );
        return;
      }
      setServerErr(
        err instanceof HttpError ? err.message : "Error al iniciar sesión."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPosterLayout backgroundSrc={loginPoster}>
      <AuthFormColumn>
        <div className="lk-auth-card lk-auth-card--poster-auth">
          <AuthFormHeader
            iconSrc={logoWordmark}
            iconAlt="LogicKids"
            title="¡Bienvenido!"
            subtitle="Inicia sesión para acceder a tu panel de profesor."
            variant="poster"
            iconVariant="wordmark"
          />

          {authNotice ? (
            <AuthInlineNotice
              tone={authNotice.tone}
              title={authNotice.title}
              message={authNotice.message}
            />
          ) : null}
          {serverErr && (
            <AuthInlineNotice
              tone="error"
              title="No pudimos iniciar sesión"
              message={serverErr}
            />
          )}

          <form onSubmit={handleSubmit} noValidate>
            <LkIconTextField
              id="lg-email"
              name="email"
              label="Correo electrónico"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ejemplo@logickids.com"
              autoComplete="email"
              icon={Mail}
              error={errors.email}
            />

            <LkPasswordField
              id="lg-pwd"
              name="contrasena"
              label="Contraseña"
              value={form.contrasena}
              onChange={handleChange}
              placeholder="••••••••"
              showPassword={showPwd}
              onToggleVisibility={() => setShowPwd((v) => !v)}
              error={errors.contrasena}
            />

            <div className="lk-row-between">
              <label className="lk-remember">
                <input type="checkbox" name="remember" /> Recordarme
              </label>
              <Link to="/recuperar-acceso" className="lk-recover">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <LkPrimaryButton id="btn-login-submit" disabled={submitting}>
              {submitting ? "Ingresando..." : "Iniciar sesión"}
            </LkPrimaryButton>
          </form>

          <p className="lk-foot">
            ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
          </p>
        </div>
      </AuthFormColumn>
    </AuthPosterLayout>
  );
}
