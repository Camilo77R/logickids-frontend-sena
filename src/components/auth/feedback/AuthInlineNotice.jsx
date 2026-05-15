import { CircleAlert, CircleCheckBig, Info } from "lucide-react";

const NOTICE_META = {
  success: {
    Icon: CircleCheckBig,
    role: "status",
  },
  error: {
    Icon: CircleAlert,
    role: "alert",
  },
  info: {
    Icon: Info,
    role: "status",
  },
};

/**
 * AuthInlineNotice
 *
 * POR QUE: login y registro necesitan feedback consistente sin repetir
 * bloques de markup ni acoplar cada pantalla a una variante visual distinta.
 */
export default function AuthInlineNotice({
  tone = "info",
  title,
  message,
  className = "",
}) {
  const meta = NOTICE_META[tone] ?? NOTICE_META.info;
  const { Icon, role } = meta;

  return (
    <div
      className={`lk-auth-notice lk-auth-notice--${tone} ${className}`.trim()}
      role={role}
    >
      <span className="lk-auth-notice__icon" aria-hidden="true">
        <Icon size={18} strokeWidth={2.3} />
      </span>
      <div className="lk-auth-notice__content">
        {title ? <strong className="lk-auth-notice__title">{title}</strong> : null}
        {message ? <p className="lk-auth-notice__message">{message}</p> : null}
      </div>
    </div>
  );
}
