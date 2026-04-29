const normalizeVariant = (variant) => {
  if (variant === "activo" || variant === "abierta") return "activo";
  if (variant === "predeterminado" || variant === "pendiente") return "predeterminado";
  return "suspendido";
};

export default function StatusBadge({ label, variant }) {
  const normalizedVariant = normalizeVariant(variant);

  return (
    <span className={`lk-status-badge lk-status-badge--${normalizedVariant}`}>
      {label}
    </span>
  );
}
