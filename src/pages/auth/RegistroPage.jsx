/**
 * RegistroPage — Registro de nuevos tutores LogicKids
 *
 * RN-01: El tutor recién registrado queda en estado INACTIVO.
 * RN-04: El tutor debe seleccionar su institución (backend).
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import authService from "../../services/authService";
import { HttpError } from "../../services/httpClient";
import { validateRegistroForm } from "../../utils/validation/registroFormValidation";
import logoWordmark from "../../assets/imgs/logoLogickids transparente.png";
import authPoster from "../../assets/imgs/logickIdsfofndoo.jpg";
import AuthPosterLayout from "../../components/auth/layout/AuthPosterLayout";
import AuthFormColumn from "../../components/auth/form/AuthFormColumn";
import AuthFormHeader from "../../components/auth/form/AuthFormHeader";
import AuthInlineNotice from "../../components/auth/feedback/AuthInlineNotice";
import LkPlainTextField from "../../components/auth/form/LkPlainTextField";
import LkIconTextField from "../../components/auth/form/LkIconTextField";
import LkSelectField from "../../components/auth/form/LkSelectField";
import LkPasswordField from "../../components/auth/form/LkPasswordField";
import LkPrimaryButton from "../../components/auth/form/LkPrimaryButton";
import "../../styles/auth.css";

const INITIAL_FORM = {
  nombre: "",
  email: "",
  contrasena: "",
  confirmarContrasena: "",
  institucion_id: "",
};

export default function RegistroPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [instituciones, setInstituciones] = useState([]);
  const [loadingInstituciones, setLoadingInstituciones] = useState(true);

  useEffect(() => {
    const cargarInstituciones = async () => {
      try {
        const data = await authService.listInstitutions();
        setInstituciones(data);
      } catch {
        setInstituciones([]);
      } finally {
        setLoadingInstituciones(false);
      }
    };
    cargarInstituciones();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateRegistroForm(form);
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
        institucion_id: Number(form.institucion_id),
      });
      navigate("/login", {
        replace: true,
        state: {
          notice: {
            tone: "success",
            title: "Solicitud enviada",
            message:
              "Tu cuenta quedó pendiente de activación. Cuando el administrador la habilite, podrás iniciar sesión.",
          },
        },
      });
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
    <AuthPosterLayout backgroundSrc={authPoster}>
      <AuthFormColumn className="lk-auth-right--register">
        <div className="lk-auth-card lk-auth-card--poster-auth lk-auth-card--poster-register">
          <AuthFormHeader
            iconSrc={logoWordmark}
            iconAlt="LogicKids"
            title="Crear cuenta"
            subtitle="Tu cuenta quedará inactiva hasta que el admin la active."
            variant="poster"
            iconVariant="wordmark"
          />

          {serverError && (
            <AuthInlineNotice
              tone="error"
              title="No pudimos crear tu cuenta"
              message={serverError}
            />
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="lk-auth-form lk-auth-form--register"
          >
            <LkPlainTextField
              id="reg-nombre"
              name="nombre"
              label="Nombre completo"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Laura Gómez"
              autoComplete="name"
              error={errors.nombre}
            />

            <LkIconTextField
              id="reg-email"
              name="email"
              label="Correo electrónico"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tutor@colegio.com"
              autoComplete="email"
              icon={Mail}
              error={errors.email}
            />

            <LkSelectField
              id="reg-institucion"
              name="institucion_id"
              label="Institución"
              value={form.institucion_id}
              onChange={handleChange}
              disabled={loadingInstituciones}
              error={errors.institucion_id}
              placeholderOption={
                <option value="">
                  {loadingInstituciones
                    ? "Cargando instituciones..."
                    : "-- Selecciona tu institución --"}
                </option>
              }
            >
              {instituciones.map((inst) => (
                <option
                  key={inst.id_institucion ?? inst.id}
                  value={inst.id_institucion ?? inst.id}
                >
                  {inst.nombre}
                </option>
              ))}
            </LkSelectField>

            <LkPasswordField
              id="reg-password"
              name="contrasena"
              label="Contraseña"
              value={form.contrasena}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              showPassword={showPassword}
              onToggleVisibility={() => setShowPassword((v) => !v)}
              error={errors.contrasena}
            />

            <LkPasswordField
              id="reg-confirm"
              name="confirmarContrasena"
              label="Confirmar contraseña"
              value={form.confirmarContrasena}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              showPassword={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((v) => !v)}
              error={errors.confirmarContrasena}
            />

            <LkPrimaryButton
              id="btn-registro-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registrando..." : "Solicitar acceso"}
            </LkPrimaryButton>
          </form>

          <p className="lk-foot">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </AuthFormColumn>
    </AuthPosterLayout>
  );
}
