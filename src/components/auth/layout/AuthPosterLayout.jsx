import { Container, Row, Col } from "react-bootstrap";

/**
 * Layout oficial de auth para LogicKids.
 *
 * POR QUE: login y registro ya no usan panel dividido; ambos viven
 * sobre un poster de fondo con el formulario superpuesto.
 */
export default function AuthPosterLayout({ backgroundSrc, children }) {
  return (
    <Container
      fluid
      className="lk-auth-page lk-auth-page--poster-auth px-0"
      style={{ ["--lk-auth-bg"]: `url(${backgroundSrc})` }}
    >
      <Row className="g-0 min-vh-100 align-items-stretch m-0 w-100">
        <Col xs={12} className="p-0 d-flex">
          {children}
        </Col>
      </Row>
    </Container>
  );
}
