export default function LoadingState({ message = "Cargando..." }) {
  return (
    <div className="lk-loader-screen">
      <div className="lk-loader-card">
        <span className="lk-spinner" aria-hidden="true" />
        <span>{message}</span>
      </div>
    </div>
  );
}
