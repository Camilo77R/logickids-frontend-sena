/**
 * Campo de texto con ícono a la izquierda (estilo pill del diseño auth).
 */
export default function LkIconTextField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  icon: Icon,
  error,
}) {
  return (
    <div className="lk-field">
      <label htmlFor={id} className="lk-label">
        {label}
      </label>
      <div className="lk-input-wrap">
        {Icon && (
          <Icon size={20} className="lk-ico-l" aria-hidden="true" />
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`lk-input lk-input--pl${error ? " lk-input--err" : ""}`}
        />
      </div>
      {error && <span className="lk-ferr">{error}</span>}
    </div>
  );
}
