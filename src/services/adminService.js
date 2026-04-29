import { request } from "./httpClient";

const adminService = {
  async listUsers() {
    const payload = await request("/admin/usuarios");
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

  async deleteInstitution(institutionId) {
    const payload = await request(`/admin/instituciones/${institutionId}`, {
      method: "DELETE",
    });

    return payload?.data ?? { eliminada: true };
  },

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
};

export default adminService;
