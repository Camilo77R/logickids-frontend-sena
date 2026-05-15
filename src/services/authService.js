import { request } from "./httpClient";

const authService = {
  // Listar instituciones para registro (público)
  async listInstitutions() {
    const payload = await request("/auth/instituciones", { auth: false });
    return payload?.data ?? [];
  },

  async getProfile() {
    const payload = await request("/auth/perfil");
    return payload?.data ?? null;
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
    return {
      token: payload?.data?.token ?? null,
      user: payload?.data?.usuario ?? null,
    };
  },

  async register(data) {
    const payload = await request("/auth/registro", {
      method: "POST",
      auth: false,
      body: data,
    });
    return payload?.data ?? null;
  },

  // Actualizar perfil
  async updateProfile(profileData) {
    const payload = await request("/auth/perfil", {
      method: "PUT",
      body: profileData,
    });
    return payload?.data ?? null;
  },

  // Cambiar contraseña
  async cambiarContrasena(data) {
    const payload = await request("/auth/cambiar-contrasena", {
      method: "PUT",
      body: {
        contrasena_actual: data.contrasenaActual,
        contrasena_nueva: data.contrasenaNueva,
      },
    });
    return payload?.data ?? null;
  },

  // Cambiar contraseña (versión alternativa)
  async changePassword(credentials) {
    const payload = await request("/auth/cambiar-contrasena", {
      method: "PUT",
      body: credentials,
    });
    return payload?.data ?? { actualizada: true };
  },
};

export default authService;