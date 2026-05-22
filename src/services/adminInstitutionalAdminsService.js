import { request } from "./httpClient";

const unwrapCollection = (payload) => payload?.data ?? (Array.isArray(payload) ? payload : []);
const unwrapEntity = (payload) => payload?.data ?? payload ?? null;

const adminInstitutionalAdminsService = {
  async listAdmins() {
    const payload = await request("/admin/usuarios?rol=admin");
    return unwrapCollection(payload);
  },

  async createInstitutionalAdmin(adminData) {
    const payload = await request("/admin/usuarios/admins", {
      method: "POST",
      body: adminData,
    });

    return unwrapEntity(payload);
  },

  async updateAdminState(adminId, estado) {
    const payload = await request(`/admin/usuarios/${adminId}/estado`, {
      method: "PATCH",
      body: { estado },
    });

    return unwrapEntity(payload);
  },
};

export default adminInstitutionalAdminsService;
