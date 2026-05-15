import { ArrowRight } from "lucide-react";

export default function LkPrimaryButton({
  type = "submit",
  disabled,
  id,
  children,
}) {
  return (
    <button type={type} id={id} className="lk-cta" disabled={disabled}>
      <span className="lk-cta-label">{children}</span>
      <span className="lk-cta-icon-circle" aria-hidden="true">
        <ArrowRight size={17} strokeWidth={2.6} />
      </span>
    </button>
  );
}
