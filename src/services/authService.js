import { request } from "./httpClient";

const mapLoginSession = (payload) => ({
  token: payload?.data?.token ?? null,
  user: payload?.data?.usuario ?? null,
});

const authService = {
  async listInstitutions() {
    const payload = await request("/auth/instituciones", { auth: false });
    return payload?.data ?? [];
  },

  async login(credentials) {
    const payload = await request("/auth/login", {
      method: "POST",
      auth: false,
      body: {
        email: credentials.email,
        contrasena: credentials.contrasena,
      },
    });

    return mapLoginSession(payload);
  },

  async register(data) {
    const payload = await request("/auth/registro", {
      method: "POST",
      auth: false,
      body: data,
    });
    return payload?.data ?? null;
  },

  async getProfile() {
    const payload = await request("/auth/perfil");
    return payload?.data ?? null;
  },

  async updateProfile(data) {
    const payload = await request("/auth/perfil", {
      method: "PUT",
      body: data,
    });

    return payload?.data ?? null;
  },

  async changePassword(credentials) {
    const payload = await request("/auth/cambiar-contrasena", {
      method: "PUT",
      body: credentials,
    });

    return payload?.data ?? { actualizada: true };
  },
};

export default authService;
