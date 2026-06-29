import { request } from "./httpClient";
const unwrapCollection = (payload) => payload?.data ?? (Array.isArray(payload) ? payload : []);
const unwrapEntity = (payload) => payload?.data ?? payload ?? null;
const adminGroupsService = {
  // 1. Obtener listado de todos los grupos de la institución
  async listGroups() {
    const payload = await request("/grupos");
    return unwrapCollection(payload);
  },
  // 2. Obtener el detalle específico de un grupo incluyendo alumnos 
  async getGroup(groupId) {
    const payload = await request(`/grupos/${groupId}`);
    return unwrapEntity(payload);
  },
  // 3. Crear un nuevo grupo 
  async createGroup(groupData) {
    const payload = await request("/grupos", {
      method: "POST",
      body: groupData,
    });
    return unwrapEntity(payload);
  },
  // 4. Modificar datos básicos del grupo nombre y descripción
  async updateGroup(groupId, groupData) {
    const payload = await request(`/grupos/${groupId}`, {
      method: "PUT",
      body: groupData,
    });
    return unwrapEntity(payload);
  },
  // 5. Asignar un tutor al grupo
  async assignTutor(groupId, tutorId) {
    const payload = await request(`/grupos/${groupId}/tutor`, {
      method: "PATCH",
      body: { tutor_id: tutorId },
    });
    return unwrapEntity(payload);
  },
  // 6. Quitar tutor asignado dejar el grupo sin docente temporalmente
  async unassignTutor(groupId) {
    const payload = await request(`/grupos/${groupId}/tutor`, {
      method: "PATCH",
      body: { tutor_id: null },
    });
    return unwrapEntity(payload);
  },
  // 7. Archivar el grupo sale de operación activa
  async archiveGroup(groupId) {
    const payload = await request(`/grupos/${groupId}/archivar`, {
      method: "PATCH",
    });
    return unwrapEntity(payload);
  },
  // 8. Reactivar grupo archivado
  async reactivateGroup(groupId) {
    const payload = await request(`/grupos/${groupId}/restaurar`, {
      method: "PATCH",
    });
    return unwrapEntity(payload);
  },
};
export default adminGroupsService;