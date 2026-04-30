import { request } from "./httpClient";

const authService = {
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

  // ✅ Actualizar perfil
  async updateProfile(profileData) {
    const payload = await request("/auth/perfil", {
      method: "PUT",
      body: profileData,
    });
    return payload?.data ?? null;
  },

  // ✅ CAMBIAR CONTRASEÑA - AGREGAR ESTO
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
};

export default authService;