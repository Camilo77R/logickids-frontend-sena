/** Encabezado: círculo pequeño (mockup) + título + subtítulo — el nombre LogicKids va solo en el panel izquierdo. */
export default function AuthFormHeader({
  iconSrc,
  iconAlt,
  title,
  subtitle,
  showIcon = true,
  variant = "default",
  iconVariant = "default",
}) {
  return (
    <>
      {showIcon && iconSrc && (
        <div
          className={
            `lk-form-icon-wrap${
              variant !== "default" ? ` lk-form-icon-wrap--${variant}` : ""
            }${
              iconVariant !== "default"
                ? ` lk-form-icon-wrap--${iconVariant}`
                : ""
            }`
          }
        >
          <img src={iconSrc} alt={iconAlt} className="lk-form-icon-img" />
        </div>
      )}
      <div className={`lk-card-header${variant !== "default" ? ` lk-card-header--${variant}` : ""}`}>
        <h1 className="lk-card-title">{title}</h1>
        {subtitle && <p className="lk-card-sub">{subtitle}</p>}
      </div>
    </>
  );
}
