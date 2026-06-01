import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, FileText, Mail, MessageSquare } from "lucide-react";
import AuthPosterLayout from "../components/auth/layout/AuthPosterLayout";
import AuthFormColumn from "../components/auth/form/AuthFormColumn";
import AuthFormHeader from "../components/auth/form/AuthFormHeader";
import LkIconTextField from "../components/auth/form/LkIconTextField";
import LkPrimaryButton from "../components/auth/form/LkPrimaryButton";
import { request } from "../services/httpClient";
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.motivo.trim()) {
      nextErrors.motivo = "El motivo es obligatorio.";
    } else if (formData.motivo.trim().length < 5) {
      nextErrors.motivo = "El motivo debe tener al menos 5 caracteres.";
    }

    if (
      formData.correo_respuesta &&
      !/\S+@\S+\.\S+/.test(formData.correo_respuesta)
    ) {
      nextErrors.correo_respuesta = "Ingresa un correo válido.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setServerError("");

    try {
      await request("/solicitudes/reactivacion", {
        method: "POST",
        auth: false,
        body: {
          email: formData.email,
          correo_respuesta: formData.correo_respuesta,
          motivo: formData.motivo,
          descripcion: formData.descripcion,
        },
      });

      setSuccess(true);
    } catch (error) {
      setServerError(error.message || "No fue posible enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthPosterLayout backgroundSrc={loginPoster}>
        <AuthFormColumn>
          <div className="lk-auth-card lk-auth-card--poster-auth" style={{ textAlign: "center" }}>
            <AuthFormHeader
              iconSrc={logoWordmark}
              iconAlt="LogicKids"
              title="¡Solicitud enviada!"
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
              <span
                className="lk-cta-label"
                style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
              >
                <ArrowLeft size={18} /> Volver al inicio de sesión
              </span>
            </button>
          </div>
        </AuthFormColumn>
      </AuthPosterLayout>
    );
  }

  return (
    <AuthPosterLayout backgroundSrc={loginPoster}>
      <AuthFormColumn>
        <div className="lk-auth-card lk-auth-card--poster-auth">
          <AuthFormHeader
            iconSrc={logoWordmark}
            iconAlt="LogicKids"
            title="Cuenta suspendida"
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

          {serverError ? (
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
          ) : null}

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
              <span className="lk-field-hint">Esta es la cuenta que será reactivada</span>
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
