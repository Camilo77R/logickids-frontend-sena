// src/components/common/StatusBadge.jsx
const STATUS_CONFIG = {
  activo:     { label: 'Activo',     color: '#10B981', bg: '#D1FAE5' },
  inactivo:   { label: 'Inactivo',   color: '#6B7280', bg: '#F3F4F6' },
  suspendido: { label: 'Suspendido', color: '#EF4444', bg: '#FEE2E2' },
  pendiente:  { label: 'Pendiente',  color: '#F59E0B', bg: '#FEF3C7' },
  principal:  { label: 'Principal',  color: '#8B5CF6', bg: '#EDE9FE' },
  abierta:    { label: 'Abierta',    color: '#10B981', bg: '#D1FAE5' },
  aprobado:   { label: 'Aprobado',   color: '#10B981', bg: '#D1FAE5' },
  predeterminado: { label: 'Pendiente', color: '#F59E0B', bg: '#FEF3C7' },
};

const normalizeVariant = (variant) => {
  const v = String(variant).toLowerCase();
  if (v === 'activo' || v === 'abierta' || v === 'aprobado') return 'activo';
  if (v === 'inactivo') return 'inactivo';
  if (v === 'suspendido') return 'suspendido';
  if (v === 'principal') return 'principal';
  return 'pendiente'; // default
};

export default function StatusBadge({ label, variant }) {
  const normalized = normalizeVariant(variant);
  const config = STATUS_CONFIG[normalized] || STATUS_CONFIG.pendiente;

  return (
    <span
      className="lk-status-badge"
      style={{
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {label || config.label}
    </span>
  );
}