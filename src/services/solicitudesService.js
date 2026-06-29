import { request } from "./httpClient";

const unwrapCollection = (payload) => payload?.data ?? (Array.isArray(payload) ? payload : []);
const unwrapEntity = (payload) => payload?.data ?? payload ?? null;

const solicitudesService = {
  async solicitarReactivacion(data) {
    const payload = await request("/solicitudes/reactivacion", {
      method: "POST",
      auth: false,
      body: data,
    });

    return unwrapEntity(payload);
  },

  async listSolicitudes() {
    const payload = await request("/solicitudes/admin/solicitudes");
    return unwrapCollection(payload);
  },

  async getSolicitud(solicitudId) {
    const payload = await request(`/solicitudes/admin/solicitudes/${solicitudId}`);
    return unwrapEntity(payload);
  },

  async aprobarSolicitud(solicitudId) {
    const payload = await request(`/solicitudes/admin/solicitudes/${solicitudId}/aprobar`, {
      method: "PUT",
    });

    return unwrapEntity(payload);
  },

  async rechazarSolicitud(solicitudId, motivoRechazo) {
    const payload = await request(`/solicitudes/admin/solicitudes/${solicitudId}/rechazar`, {
      method: "PUT",
      body: { motivo_rechazo: motivoRechazo },
    });

    return unwrapEntity(payload);
  },
};

export default solicitudesService;
