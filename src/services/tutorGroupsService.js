import { request } from "./httpClient";

/**
 * Servicio para manejar la lógica de grupos del Tutor
 */
const tutorGroupsService = {
  
  // 1. Obtener la lista de grupos del tutor autenticado
  listarGrupos: async () => {
    // request() ya envía el token por defecto (auth = true)
    return await request("/grupos");
  },

  // 2. Obtener un grupo específico con sus estudiantes
  obtenerGrupo: async (grupoId) => {
    return await request(`/grupos/${grupoId}`);
  },

  // 3. Crear un nuevo grupo
  crearGrupo: async (datosGrupo) => {
    return await request("/grupos", {
      method: "POST",
      body: datosGrupo
    });
  },

  // 4. Actualizar un grupo existente
  actualizarGrupo: async (grupoId, datosGrupo) => {
    return await request(`/grupos/${grupoId}`, {
      method: "PUT",
      body: datosGrupo
    });
  },

  // 5. Eliminar un grupo
  eliminarGrupo: async (grupoId) => {
    return await request(`/grupos/${grupoId}`, {
      method: "DELETE"
    });
  },

  // 6. Abrir la sesión de clase para que los niños puedan jugar
  abrirSesionClase: async (grupoId) => {
    return await request(`/grupos/${grupoId}/sesion`, {
      method: "PATCH",
      body: { sesion_activa: true }
    });
  },

  // 7. Cerrar la sesión de clase
  cerrarSesionClase: async (grupoId) => {
    return await request(`/grupos/${grupoId}/sesion`, {
      method: "PATCH",
      body: { sesion_activa: false }
    });
  }
};

export default tutorGroupsService;
