/** Columna derecha: fondo lavanda y centrado del formulario. */
export default function AuthFormColumn({ children, className = "" }) {
  return <div className={`lk-auth-right w-100 ${className}`.trim()}>{children}</div>;
}
