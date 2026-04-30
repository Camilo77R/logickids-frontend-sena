import { request } from "./httpClient";

const estudianteService = {
    async listEstudiantes(grupoId) {
        // El backend requiere grupo_id como query param
        const url = grupoId ? `/estudiantes?grupo_id=${grupoId}` : "/estudiantes";
        const payload = await request(url);
        return payload?.data || (Array.isArray(payload) ? payload : []);
    },

    // Lista todos los estudiantes (incluyendo inactivos)
    async listAllEstudiantes(grupoId) {
        const url = grupoId ? `/estudiantes/all?grupo_id=${grupoId}` : "/estudiantes/all";
        const payload = await request(url);
        return payload?.data || (Array.isArray(payload) ? payload : []);
    },

    async getEstudiante(estudianteId) {
        const payload = await request(`/estudiantes/${estudianteId}`);
        return payload?.data ?? null;
    },

    async crearEstudiante(estudianteData) {
        const payload = await request("/estudiantes", {
            method: "POST",
            body: estudianteData,
        });

        return payload?.data ?? null;
    },

    async actualizarEstudiante(estudianteId, estudianteData) {
        const payload = await request(`/estudiantes/${estudianteId}`, {
            method: "PUT",
            body: estudianteData,
        });

        return payload?.data ?? null;
    },

    async desactivarEstudiante(estudianteId) {
        const payload = await request(`/estudiantes/${estudianteId}`, {
            method: "DELETE",
        });

        return payload?.data ?? null;
    },

    // Reactivar un estudiante inactivo
    async reactivarEstudiante(estudianteId) {
        const payload = await request(`/estudiantes/${estudianteId}/reactivar`, {
            method: "PATCH",
        });

        return payload?.data ?? null;
    },

    // Obtener código QR del estudiante
    async obtenerQr(estudianteId) {
        const payload = await request(`/estudiantes/${estudianteId}/qr`);
        return payload?.data ?? null;
    },

    // Activar/desactivar sesión de un estudiante
    async toggleSesion(estudianteId, sesionActiva) {
        const payload = await request(`/estudiantes/${estudianteId}/sesion`, {
            method: "PATCH",
            body: { sesion_activa: sesionActiva },
        });
        return payload?.data ?? null;
    },

    // Activar/desactivar sesión en un grupo específico
    async toggleSesionGrupo(estudianteId, grupoId, sesionActiva) {
        const payload = await request(`/estudiantes/${estudianteId}/grupos/${grupoId}/sesion`, {
            method: "PATCH",
            body: { sesion_activa: sesionActiva },
        });
        return payload?.data ?? null;
    },

    // Cambiar grupo de un estudiante
    async cambiarGrupo(estudianteId, nuevoGrupoId) {
        const payload = await request(`/estudiantes/${estudianteId}/grupo`, {
            method: "PATCH",
            body: { grupo_id: nuevoGrupoId },
        });
        return payload?.data ?? null;
    },
};

export default estudianteService;