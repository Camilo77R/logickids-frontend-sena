import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import LogicKidsLogo from "../../components/branding/LogicKidsLogo";
import { useAuth } from "../../hooks/useAuth";
import { HttpError } from "../../services/httpClient";
import { getHomePathByRole } from "../../utils/paths";

const INITIAL_FORM = {
  email: "",
  contrasena: "",
};

const validateLoginForm = (form) => {
  const nextErrors = {};

  if (!form.email.trim()) {
    nextErrors.email = "El correo es obligatorio.";
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    nextErrors.email = "El correo no tiene un formato válido.";
  }

  if (!form.contrasena) {
    nextErrors.contrasena = "La contraseña es obligatoria.";
  }

  return nextErrors;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signOut } = useAuth();
  const successMsg = location.state?.msg;

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setServerError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateLoginForm(form);

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await signIn({
        email: form.email.trim().toLowerCase(),
        contrasena: form.contrasena,
      });

      // Redirige al panel correcto según el rol del usuario autenticado.
      // getHomePathByRole centraliza esta lógica para todos los roles:
      //   superadmin → /superadmin/instituciones
      //   admin      → /admin/dashboard
      //   tutor      → /tutor/dashboard
      const homePath = getHomePathByRole(user?.rol);

      if (homePath === "/login") {
        // Rol desconocido o no soportado en este portal
        signOut();
        setServerError("Rol de usuario no reconocido. Contacta al administrador.");
      } else {
        navigate(homePath, { replace: true });
      }
    } catch (error) {
      setServerError(
        error instanceof HttpError
          ? error.message
          : "No fue posible iniciar sesión. Intente de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lk-auth-page">
      <div className="lk-auth-shell lk-auth-shell--single">
        <section className="lk-auth-card">
          <div className="lk-auth-brand" style={{ marginBottom: "1.25rem" }}>
            <LogicKidsLogo size={44} />
            <div className="lk-auth-brand-copy">
              <strong>LogicKids</strong>
              <span>Portal de Acceso</span>
            </div>
          </div>

          <header className="lk-auth-card-header">
            <h1>Iniciar sesión</h1>
          </header>

          <form className="lk-form-grid" onSubmit={handleSubmit} noValidate>
            {successMsg ? <div className="lk-alert lk-alert--success" style={{backgroundColor:"#d1e7dd", color:"#0f5132", padding:"10px", borderRadius:"6px", fontSize:"0.85rem"}}>{successMsg}</div> : null}
            {serverError ? <div className="lk-alert lk-alert--error">{serverError}</div> : null}

            <div className={`lk-field ${errors.email ? "lk-field--error" : ""}`}>
              <label htmlFor="login-email">Correo electrónico</label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
                autoComplete="email"
              />
              {errors.email ? <span className="lk-field-error">{errors.email}</span> : null}
            </div>

            <div className={`lk-field ${errors.contrasena ? "lk-field--error" : ""}`}>
              <label htmlFor="login-password">Contraseña</label>
              <div className="lk-input-with-action">
                <input
                  id="login-password"
                  name="contrasena"
                  type={showPassword ? "text" : "password"}
                  value={form.contrasena}
                  onChange={handleChange}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lk-input-action"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
              {errors.contrasena ? (
                <span className="lk-field-error">{errors.contrasena}</span>
              ) : null}
            </div>

            <button type="submit" className="lk-btn lk-btn--primary lk-btn--full" disabled={isSubmitting}>
              {isSubmitting ? "Ingresando..." : "Entrar"}
            </button>

            <div className="text-center" style={{ fontSize: "0.85rem" }}>
              <Link to="/recuperar-acceso" style={{ color: "#1796ed", fontWeight: 700 }}>
                ¿Olvidaste tu acceso?
              </Link>
            </div>

            <div className="text-center mt-3" style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              <span>¿Eres tutor y no tienes cuenta? </span>
              <Link to="/registro" style={{ color: "#7C6FFF", fontWeight: "bold", textDecoration: "none" }}>Regístrate aquí</Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
