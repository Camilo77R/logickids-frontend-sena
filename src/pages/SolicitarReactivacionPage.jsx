import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Mail, FileText, MessageSquare, CheckCircle, ArrowLeft } from "lucide-react";
import AuthPosterLayout from "../components/auth/layout/AuthPosterLayout";
import AuthFormColumn from "../components/auth/form/AuthFormColumn";
import AuthFormHeader from "../components/auth/form/AuthFormHeader";
import LkIconTextField from "../components/auth/form/LkIconTextField";
import LkPrimaryButton from "../components/auth/form/LkPrimaryButton";
import logoWordmark from "../assets/imgs/logoLogickids transparente.png";
import loginPoster from "../assets/imgs/logickIdsfofndoo.jpg";
import "../styles/auth.css";

export default function SolicitarReactivacionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailParam = location.state?.email || "";

  const [formData, setFormData] = useState({
    email: emailParam,
    correo_respuesta: "",
    motivo: "",
    descripcion: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.motivo.trim()) {
      newErrors.motivo = "El motivo es obligatorio.";
    }
    if (formData.motivo.trim().length < 5) {
      newErrors.motivo = "El motivo debe tener al menos 5 caracteres.";
    }
    if (
      formData.correo_respuesta &&
      !/\S+@\S+\.\S+/.test(formData.correo_respuesta)
    ) {
      newErrors.correo_respuesta = "Ingresa un correo válido.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setServerError("");

    try {
      const response = await fetch(
        "http://localhost:3000/api/solicitudes/reactivacion",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            correo_respuesta: formData.correo_respuesta,
            motivo: formData.motivo,
            descripcion: formData.descripcion,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No se pudo conectar con el servidor. Verifica que el backend esté corriendo.");
        }
        if (response.status === 400 && data.message?.includes("pendiente")) {
          throw new Error("⏳ Ya tienes una solicitud pendiente. Espera la respuesta del administrador.");
        }
        if (data.errors) {
          const motivoError = data.errors.find(e => e.field === "motivo");
          if (motivoError) {
            throw new Error("📝 El motivo debe tener al menos 5 caracteres.");
          }
          throw new Error(data.errors[0]?.message || "Error en los datos del formulario.");
        }
        throw new Error(data.details || data.message || data.error || "Error al enviar la solicitud");
      }

      setSuccess(true);
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Pantalla de éxito ──
  if (success) {
    return (
      <AuthPosterLayout backgroundSrc={loginPoster}>
        <AuthFormColumn>
          <div className="lk-auth-card lk-auth-card--poster-auth" style={{ textAlign: "center" }}>
            <AuthFormHeader
              iconSrc={logoWordmark}
              iconAlt="LogicKids"
              title="¡Solicitud Enviada!"
              subtitle={`Recibirás la respuesta en: ${formData.correo_respuesta || formData.email}`}
              variant="poster"
              iconVariant="wordmark"
            />

            <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#F59E0B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle size={32} color="white" strokeWidth={2} />
              </div>
            </div>

            <div
              style={{
                background: "#FEF3C7",
                borderRadius: "10px",
                padding: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <p style={{ margin: 0, color: "#B45309", fontWeight: 500, fontSize: "0.9rem" }}>
                Solicitud enviada correctamente
              </p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#D97706" }}>
                El administrador revisará tu caso y te contactará pronto.
              </p>
            </div>

            {/* Botón IDÉNTICO al del login con flecha inversa */}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="lk-cta"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                position: "relative",
              }}
            >
              <span className="lk-cta-label" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <ArrowLeft size={18} /> Volver al inicio de sesión
              </span>
            </button>
          </div>
        </AuthFormColumn>
      </AuthPosterLayout>
    );
  }

  // ── Formulario principal ──
  return (
    <AuthPosterLayout backgroundSrc={loginPoster}>
      <AuthFormColumn>
        <div className="lk-auth-card lk-auth-card--poster-auth">
          <AuthFormHeader
            iconSrc={logoWordmark}
            iconAlt="LogicKids"
            title="Cuenta Suspendida"
            subtitle="Solicita la reactivación de tu cuenta completando el formulario."
            variant="poster"
            iconVariant="wordmark"
          />

          <div
            style={{
              background: "#FEF3C7",
              border: "1px solid #FDE68A",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#B45309", fontWeight: 500 }}>
              Tu cuenta ha sido suspendida
            </p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#D97706" }}>
              Completa el siguiente formulario para solicitar la reactivación.
            </p>
          </div>

          {serverError && (
            <div
              style={{
                background: "#FEE2E2",
                border: "1px solid #FECACA",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginBottom: "1.5rem",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#991B1B", fontWeight: 500 }}>
                {serverError}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="lk-field">
              <label htmlFor="email">Email de tu cuenta *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                readOnly
                disabled
                style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
              />
              <span className="lk-field-hint">
                Esta es la cuenta que será reactivada
              </span>
            </div>

            <LkIconTextField
              id="correo_respuesta"
              name="correo_respuesta"
              label="Correo para recibir la respuesta (opcional)"
              type="email"
              value={formData.correo_respuesta}
              onChange={handleChange}
              placeholder="tucorreo@ejemplo.com"
              icon={Mail}
              error={errors.correo_respuesta}
              hint={`Si no especificas, usaremos tu email de cuenta (${formData.email})`}
            />

            <LkIconTextField
              id="motivo"
              name="motivo"
              label="Motivo de la solicitud *"
              type="text"
              value={formData.motivo}
              onChange={handleChange}
              placeholder="Ej: Olvidé cerrar sesión, malentendido, etc."
              icon={FileText}
              error={errors.motivo}
            />

            <div className="lk-field">
              <label htmlFor="descripcion">
                <MessageSquare size={16} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Descripción (opcional)
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="4"
                placeholder="Explica con más detalle tu situación..."
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <LkPrimaryButton id="btn-solicitar" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar solicitud"}
            </LkPrimaryButton>
          </form>

          <p className="lk-foot">
            <Link to="/login">Volver al inicio de sesión</Link>
          </p>
        </div>
      </AuthFormColumn>
    </AuthPosterLayout>
  );
}