import { Eye, EyeOff, Lock } from "lucide-react";

export default function LkPasswordField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  showPassword,
  onToggleVisibility,
  error,
}) {
  return (
    <div className="lk-field">
      <label htmlFor={id} className="lk-label">
        {label}
      </label>
      <div className="lk-input-wrap">
        <Lock size={20} className="lk-ico-l" aria-hidden="true" />
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`lk-input lk-input--plr${error ? " lk-input--err" : ""}`}
        />
        <button
          type="button"
          className="lk-eye"
          onClick={onToggleVisibility}
          aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && <span className="lk-ferr">{error}</span>}
    </div>
  );
}
