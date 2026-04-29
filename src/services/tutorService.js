import { request } from "./httpClient";

const tutorService = {
  async listStudentsByTutor() {
    const payload = await request("/estudiantes");
    return payload?.data || (Array.isArray(payload) ? payload : []);
  },

  async listActivitiesByTutor() {
    // Backend apparently doesn't have an activities endpoint yet, returning empty arrays for now
    return [];
  },

  async getProfile() {
    const payload = await request("/auth/perfil");
    return payload?.data ?? null;
  },

  async updateProfile(profileData) {
    const payload = await request("/auth/perfil", {
      method: "PUT",
      body: profileData,
    });
    return payload?.data ?? null;
  },

  async createGroup(groupData) {
    const payload = await request("/grupos", {
      method: "POST",
      body: groupData,
    });
    return payload?.data ?? null;
  },

  async listGroups() {
    const payload = await request("/grupos");
    return payload?.data || (Array.isArray(payload) ? payload : []);
  },
};

export default tutorService;
