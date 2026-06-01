import { request } from "./httpClient";

const unwrapCollection = (payload) => payload?.data ?? (Array.isArray(payload) ? payload : []);
const unwrapEntity = (payload) => payload?.data ?? payload ?? null;

const adminStudentsService = {
  async listGroups() {
    const payload = await request("/grupos");
    return unwrapCollection(payload);
  },

  async listStudents({ groupId, includeInactive = false } = {}) {
    const path = includeInactive ? "/estudiantes/all" : "/estudiantes";
    const query = groupId ? `?grupo_id=${groupId}` : "";
    const payload = await request(`${path}${query}`);
    return unwrapCollection(payload);
  },

  async getStudent(studentId) {
    const payload = await request(`/estudiantes/${studentId}`);
    return unwrapEntity(payload);
  },

  async createStudent(studentData) {
    const payload = await request("/estudiantes", {
      method: "POST",
      body: studentData,
    });

    return unwrapEntity(payload);
  },

  async updateStudent(studentId, studentData) {
    const payload = await request(`/estudiantes/${studentId}`, {
      method: "PUT",
      body: studentData,
    });

    return unwrapEntity(payload);
  },

  async changeStudentGroup(studentId, groupId) {
    const payload = await request(`/estudiantes/${studentId}/grupo`, {
      method: "PATCH",
      body: { grupo_id: groupId },
    });

    return unwrapEntity(payload);
  },

  async deactivateStudent(studentId) {
    const payload = await request(`/estudiantes/${studentId}`, {
      method: "DELETE",
    });

    return unwrapEntity(payload);
  },

  async reactivateStudent(studentId) {
    const payload = await request(`/estudiantes/${studentId}/reactivar`, {
      method: "PATCH",
    });

    return unwrapEntity(payload);
  },

  async getStudentQr(studentId) {
    const payload = await request(`/estudiantes/${studentId}/qr`);
    return unwrapEntity(payload);
  },
};

export default adminStudentsService;
