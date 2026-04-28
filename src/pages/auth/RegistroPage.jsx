import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import LogicKidsLogo from "../../components/branding/LogicKidsLogo";
import authService from "../../services/authService";
import { HttpError } from "../../services/httpClient";

const INITIAL_FORM = {
  nombre: "",
  email: "",
  contrasena: "",
  confirmarContrasena: "",
};

export default function RegistroPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setServerError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.nombre.trim()) nextErrors.nombre = "El nombre es obligatorio.";
    
    if (!form.email.trim()) {
      nextErrors.email = "El correo es obligatorio.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = "El correo no tiene un formato válido.";
    }

    if (!form.contrasena) {
      nextErrors.contrasena = "La contraseña es obligatoria.";
    } else if (form.contrasena.length < 6) {
      nextErrors.contrasena = "La contraseña debe tener al menos 6 caracteres.";
    }

    if (!form.confirmarContrasena) {
      nextErrors.confirmarContrasena = "Debes confirmar tu contraseña.";
    } else if (form.contrasena !== form.confirmarContrasena) {
      nextErrors.confirmarContrasena = "Las contraseñas no coinciden.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.register({
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        contrasena: form.contrasena,
      });

      navigate("/login", { state: { msg: "Cuenta de tutor creada exitosamente. Ahora puedes iniciar sesión." } });
    } catch (error) {
      setServerError(
        error instanceof HttpError
          ? error.message
          : "No fue posible registrar la cuenta. Intente de nuevo."
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
              <span>Registro de Tutor</span>
            </div>
          </div>

          <header className="lk-auth-card-header">
            <h1>Crear cuenta</h1>
          </header>

          <form className="lk-form-grid" onSubmit={handleSubmit} noValidate>
            {serverError ? <div className="lk-alert lk-alert--error">{serverError}</div> : null}

            <div className={`lk-field ${errors.nombre ? "lk-field--error" : ""}`}>
              <label htmlFor="reg-nombre">Nombre completo</label>
              <input
                id="reg-nombre"
                name="nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Laura Gómez"
              />
              {errors.nombre ? <span className="lk-field-error">{errors.nombre}</span> : null}
            </div>

            <div className={`lk-field ${errors.email ? "lk-field--error" : ""}`}>
              <label htmlFor="reg-email">Correo electrónico</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tutor@colegio.com"
              />
              {errors.email ? <span className="lk-field-error">{errors.email}</span> : null}
            </div>

            <div className={`lk-field ${errors.contrasena ? "lk-field--error" : ""}`}>
              <label htmlFor="reg-password">Contraseña</label>
              <div className="lk-input-with-action">
                <input
                  id="reg-password"
                  name="contrasena"
                  type={showPassword ? "text" : "password"}
                  value={form.contrasena}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
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

            <div className={`lk-field ${errors.confirmarContrasena ? "lk-field--error" : ""}`}>
              <label htmlFor="reg-confirm-password">Confirmar contraseña</label>
              <div className="lk-input-with-action">
                <input
                  id="reg-confirm-password"
                  name="confirmarContrasena"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmarContrasena}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                />
                <button
                  type="button"
                  className="lk-input-action"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                >
                  {showConfirmPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
              {errors.confirmarContrasena ? (
                <span className="lk-field-error">{errors.confirmarContrasena}</span>
              ) : null}
            </div>

            <div className="lk-field">
              <label>Perfil</label>
              <input type="text" value="Tutor" disabled style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }} />
            </div>

            <button type="submit" className="lk-btn lk-btn--primary lk-btn--full" disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Registrarse"}
            </button>

            <div className="text-center mt-3" style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              <span>¿Ya tienes cuenta? </span>
              <Link to="/login" style={{ color: "#7C6FFF", fontWeight: "bold", textDecoration: "none" }}>Inicia sesión</Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
