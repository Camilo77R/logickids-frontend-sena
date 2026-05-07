/**
 * RegistroPage — Registro de nuevos tutores
 *
 * Reglas de Negocio implementadas:
 *  - RN-01: El tutor recién registrado queda en estado INACTIVO.
 *           No puede acceder hasta que el admin de su institución lo active.
 *  - RN-04: El tutor debe pertenecer a una institución.
 *           El select se carga desde GET /auth/instituciones (endpoint público).
 *
 * Flujo:
 *  1. La página carga las instituciones disponibles al montarse
 *  2. El tutor llena el formulario y selecciona su institución
 *  3. Al enviar, se llama a POST /auth/registro con { nombre, email, contrasena, institucion_id }
 *  4. El backend crea el usuario en estado INACTIVO
 *  5. Se muestra un banner informando que debe esperar activación (NO redirige al login)
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LogicKidsLogo from "../../components/branding/LogicKidsLogo";
import authService from "../../services/authService";
import { HttpError } from "../../services/httpClient";

/** Estado inicial del formulario */
const INITIAL_FORM = {
  nombre: "",
  email: "",
  contrasena: "",
  confirmarContrasena: "",
  institucion_id: "",
};

/**
 * Valida los campos del formulario de registro.
 * @param {object} form - Valores actuales del formulario
 * @returns {object} Mapa de errores por campo (vacío si no hay errores)
 */
const validateForm = (form) => {
  const errors = {};

  if (!form.nombre.trim()) {
    errors.nombre = "El nombre es obligatorio.";
  }

  if (!form.email.trim()) {
    errors.email = "El correo es obligatorio.";
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = "El correo no tiene un formato válido.";
  }

  if (!form.contrasena) {
    errors.contrasena = "La contraseña es obligatoria.";
  } else if (form.contrasena.length < 6) {
    errors.contrasena = "La contraseña debe tener al menos 6 caracteres.";
  }

  if (!form.confirmarContrasena) {
    errors.confirmarContrasena = "Debes confirmar tu contraseña.";
  } else if (form.contrasena !== form.confirmarContrasena) {
    errors.confirmarContrasena = "Las contraseñas no coinciden.";
  }

  if (!form.institucion_id) {
    errors.institucion_id = "Debes seleccionar tu institución.";
  }

  return errors;
};

export default function RegistroPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // RN-01: La cuenta queda inactiva. Cuando registroCorrecto es true,
  // mostramos el banner de "espera activación" en vez de redirigir.
  const [registroCorrecto, setRegistroCorrecto] = useState(false);

  // Instituciones disponibles para el select (endpoint público)
  const [instituciones, setInstituciones] = useState([]);
  const [loadingInstituciones, setLoadingInstituciones] = useState(true);

  /** Carga las instituciones al montar la página */
  useEffect(() => {
    const cargarInstituciones = async () => {
      try {
        const data = await authService.listInstitutions();
        setInstituciones(data);
      } catch {
        // Si falla, el select queda vacío — el usuario ve el error al intentar enviar
        setInstituciones([]);
      } finally {
        setLoadingInstituciones(false);
      }
    };

    cargarInstituciones();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setServerError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm(form);
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
        institucion_id: Number(form.institucion_id), // RN-01: requerido por el backend
      });

      // RN-01: No redirigimos al login — la cuenta está INACTIVA.
      // Mostramos el banner de "espera activación".
      setRegistroCorrecto(true);
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

  // ─── PANTALLA DE ÉXITO (RN-01) ───────────────────────────────────────────
  // El tutor ya se registró pero su cuenta está inactiva. Lo informamos claramente.
  if (registroCorrecto) {
    return (
      <div className="lk-auth-page">
        <div className="lk-auth-shell lk-auth-shell--single">
          <section className="lk-auth-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>✅</div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "12px" }}>
              ¡Registro exitoso!
            </h1>
            <p style={{ color: "#4b5563", lineHeight: 1.7, marginBottom: "20px" }}>
              Tu cuenta fue creada correctamente, pero{" "}
              <strong>está pendiente de activación</strong> por el administrador
              de tu institución.
            </p>
            <div
              style={{
                background: "#fef9c3",
                border: "1px solid #fde047",
                borderRadius: "10px",
                padding: "14px 18px",
                fontSize: "0.9rem",
                color: "#713f12",
                marginBottom: "24px",
                textAlign: "left",
              }}
            >
              📌 <strong>¿Qué sigue?</strong>
              <ul style={{ marginTop: "8px", paddingLeft: "18px", marginBottom: 0 }}>
                <li>El administrador de tu colegio recibirá tu solicitud.</li>
                <li>Una vez que active tu cuenta, podrás iniciar sesión normalmente.</li>
                <li>Si no recibes acceso en 24h, contacta al administrador.</li>
              </ul>
            </div>
            <Link
              to="/login"
              className="lk-btn lk-btn--primary lk-btn--full"
              style={{ display: "block", textAlign: "center", textDecoration: "none" }}
            >
              Volver al inicio de sesión
            </Link>
          </section>
        </div>
      </div>
    );
  }

  // ─── FORMULARIO DE REGISTRO ───────────────────────────────────────────────
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
            <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "4px" }}>
              Tu cuenta quedará inactiva hasta que el admin de tu institución la active.
            </p>
          </header>

          <form className="lk-form-grid" onSubmit={handleSubmit} noValidate>
            {serverError ? (
              <div className="lk-alert lk-alert--error">{serverError}</div>
            ) : null}

            {/* Nombre */}
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
              {errors.nombre ? (
                <span className="lk-field-error">{errors.nombre}</span>
              ) : null}
            </div>

            {/* Email */}
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
              {errors.email ? (
                <span className="lk-field-error">{errors.email}</span>
              ) : null}
            </div>

            {/* Institución — cargada desde el backend (RN-04) */}
            <div className={`lk-field ${errors.institucion_id ? "lk-field--error" : ""}`}>
              <label htmlFor="reg-institucion">Institución</label>
              <select
                id="reg-institucion"
                name="institucion_id"
                value={form.institucion_id}
                onChange={handleChange}
                disabled={loadingInstituciones}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: errors.institucion_id ? "1px solid #ef4444" : "1px solid #d1d5db",
                  fontSize: "14px",
                  background: "white",
                }}
              >
                <option value="">
                  {loadingInstituciones ? "Cargando instituciones..." : "-- Selecciona tu institución --"}
                </option>
                {instituciones.map((inst) => (
                  <option key={inst.id_institucion ?? inst.id} value={inst.id_institucion ?? inst.id}>
                    {inst.nombre}
                  </option>
                ))}
              </select>
              {errors.institucion_id ? (
                <span className="lk-field-error">{errors.institucion_id}</span>
              ) : null}
            </div>

            {/* Contraseña */}
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

            {/* Confirmar contraseña */}
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

            <button
              type="submit"
              className="lk-btn lk-btn--primary lk-btn--full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registrando..." : "Solicitar acceso"}
            </button>

            <div
              className="text-center mt-3"
              style={{ fontSize: "0.85rem", color: "#6b7280" }}
            >
              <span>¿Ya tienes cuenta? </span>
              <Link
                to="/login"
                style={{ color: "#7C6FFF", fontWeight: "bold", textDecoration: "none" }}
              >
                Inicia sesión
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
