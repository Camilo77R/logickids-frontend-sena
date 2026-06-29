import { request } from "./httpClient";

const adminService = {
  // Usuarios y roles
  async listUsers({ rol = "todos", institutionId } = {}) {
    const params = new URLSearchParams();
    if (rol) params.set("rol", rol);
    if (institutionId) params.set("institucion_id", String(institutionId));
    const query = params.toString();
    const payload = await request(`/admin/usuarios${query ? `?${query}` : ""}`);
    return payload?.data || (Array.isArray(payload) ? payload : []);
  },

  async getUser(userId) {
    const payload = await request(`/admin/usuarios/${userId}`);
    return payload?.data ?? null;
  },

  async updateUserState(userId, estado) {
    const payload = await request(`/admin/usuarios/${userId}/estado`, {
      method: "PATCH",
      body: { estado },
    });

    return payload?.data ?? null;
  },

  // Dashboard global
  async getDashboard() {
    const payload = await request("/admin/dashboard");
    return payload?.data ?? null;
  },

  // Instituciones
  async listInstitutions() {
    const payload = await request("/admin/instituciones");
    return payload?.data || (Array.isArray(payload) ? payload : []);
  },

  async createInstitution(institutionData) {
    const payload = await request("/admin/instituciones", {
      method: "POST",
      body: institutionData,
    });

    return payload?.data ?? null;
  },

  async updateInstitution(institutionId, data) {
    const payload = await request(`/admin/instituciones/${institutionId}`, {
      method: "PUT",
      body: data,
    });

    return payload?.data ?? null;
  },

  async deleteInstitution(institutionId) {
    const payload = await request(`/admin/instituciones/${institutionId}`, {
      method: "DELETE",
    });

    return payload?.data ?? { eliminada: true };
  },

  async deactivateInstitution(institutionId) {
    const payload = await request(`/admin/instituciones/${institutionId}/desactivar`, {
      method: "PATCH",
    });

    return payload?.data ?? null;
  },

  async reactivateInstitution(institutionId) {
    const payload = await request(`/admin/instituciones/${institutionId}/reactivar`, {
      method: "PATCH",
    });

    return payload?.data ?? null;
  },

  // Minijuegos
  async listMinigames() {
    const payload = await request("/admin/minijuegos");
    return payload?.data || (Array.isArray(payload) ? payload : []);
  },

  async toggleMinigame(minigameId, activo) {
    const payload = await request(`/admin/minijuegos/${minigameId}/toggle`, {
      method: "PATCH",
      body: { activo },
    });

    return payload?.data ?? null;
  },

  // Solicitudes de reactivación
  async listReactivationRequests() {
    const payload = await request("/solicitudes/admin/solicitudes");
    return payload?.data || payload?.solicitudes || [];
  },

  async approveReactivationRequest(requestId) {
    const payload = await request(`/solicitudes/admin/solicitudes/${requestId}/aprobar`, {
      method: "PUT",
    });

    return payload?.data ?? null;
  },

  async rejectReactivationRequest(requestId, motivoRechazo) {
    const payload = await request(`/solicitudes/admin/solicitudes/${requestId}/rechazar`, {
      method: "PUT",
      body: { motivo_rechazo: motivoRechazo },
    });

    return payload?.data ?? null;
  },
};

export default adminService;
