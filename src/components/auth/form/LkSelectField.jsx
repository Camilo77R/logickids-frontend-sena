/** Select con estilo alineado al resto de campos auth. */
export default function LkSelectField({
  id,
  name,
  label,
  value,
  onChange,
  disabled,
  error,
  placeholderOption,
  children,
}) {
  return (
    <div className="lk-field">
      <label htmlFor={id} className="lk-label">
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`lk-select${error ? " lk-input--err" : ""}`}
      >
        {placeholderOption}
        {children}
      </select>
      {error && <span className="lk-ferr">{error}</span>}
    </div>
  );
}
