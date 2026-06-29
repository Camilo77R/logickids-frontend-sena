import { useEffect, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import QRCode from "qrcode";

export default function StudentQrPreview({ token, studentName }) {
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (!token) {
      setQrImageUrl("");
      return;
    }

    let ignore = false;

    const renderQr = async () => {
      try {
        setIsRendering(true);
        const nextQrImageUrl = await QRCode.toDataURL(token, {
          margin: 2,
          width: 280,
          color: {
            dark: "#1d2737",
            light: "#ffffff",
          },
        });

        if (!ignore) {
          setQrImageUrl(nextQrImageUrl);
        }
      } finally {
        if (!ignore) {
          setIsRendering(false);
        }
      }
    };

    renderQr();

    return () => {
      ignore = true;
    };
  }, [token]);

  const handleCopyToken = async () => {
    await navigator.clipboard.writeText(token);
    setCopyFeedback("Token copiado.");
    window.setTimeout(() => setCopyFeedback(""), 2000);
  };

  const handleDownload = () => {
    if (!qrImageUrl) return;

    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `${(studentName || "estudiante").replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    link.click();
  };

  if (!token) {
    return <p className="text-muted mb-0">No se recibió un token QR válido.</p>;
  }

  return (
    <div className="text-center">
      {copyFeedback ? <Alert variant="success">{copyFeedback}</Alert> : null}

      <div className="bg-light rounded p-4 mb-3 d-flex align-items-center justify-content-center">
        {isRendering ? (
          <Spinner animation="border" variant="primary" />
        ) : (
          <img
            src={qrImageUrl}
            alt={`QR de acceso para ${studentName || "el estudiante"}`}
            style={{ maxWidth: "100%", width: "240px", height: "auto" }}
          />
        )}
      </div>

      <p className="small text-muted mb-2">
        Este QR representa el token real del estudiante para el acceso infantil.
      </p>
      <code className="d-block bg-light rounded p-2 text-break mb-3">{token}</code>

      <div className="d-flex justify-content-center gap-2 flex-wrap">
        <Button variant="outline-secondary" onClick={handleCopyToken}>
          Copiar token
        </Button>
        <Button variant="primary" onClick={handleDownload} disabled={!qrImageUrl}>
          Descargar QR
        </Button>
      </div>
    </div>
  );
}
