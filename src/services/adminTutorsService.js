import { request } from "./httpClient";

const unwrapCollection = (payload) => payload?.data ?? (Array.isArray(payload) ? payload : []);
const unwrapEntity = (payload) => payload?.data ?? payload ?? null;

const adminTutorsService = {
  async listTutors() {
    const payload = await request("/admin/usuarios?rol=tutor");
    return unwrapCollection(payload);
  },

  async getTutor(tutorId) {
    const payload = await request(`/admin/usuarios/${tutorId}`);
    return unwrapEntity(payload);
  },

  async createTutor(tutorData) {
    const payload = await request("/admin/usuarios/tutores", {
      method: "POST",
      body: tutorData,
    });

    return unwrapEntity(payload);
  },

  async updateTutorState(tutorId, estado) {
    const payload = await request(`/admin/usuarios/${tutorId}/estado`, {
      method: "PATCH",
      body: { estado },
    });

    return unwrapEntity(payload);
  },
};

export default adminTutorsService;
