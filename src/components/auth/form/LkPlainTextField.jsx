/** Campo de texto sin ícono (padding simétrico tipo pill). */
export default function LkPlainTextField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  error,
}) {
  return (
    <div className="lk-field">
      <label htmlFor={id} className="lk-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`lk-input${error ? " lk-input--err" : ""}`}
      />
      {error && <span className="lk-ferr">{error}</span>}
    </div>
  );
}
