import { request } from "./httpClient";

export const DEVICE_RECOVERY_ACTIONS = Object.freeze({
  RESTART_CURRENT_ACTIVITY: "restart_current_activity",
});

const ensureSuccessfulPayload = (payload) => {
  if (payload?.success === false) {
    throw new Error(payload.message || "No fue posible completar la solicitud.");
  }

  return payload;
};

const studentDeviceSessionService = {
  async getActiveSession(studentId) {
    const payload = ensureSuccessfulPayload(
      await request(`/estudiantes/${studentId}/dispositivo-activo`)
    );

    return payload?.data ?? null;
  },

  async recover(studentId, action = DEVICE_RECOVERY_ACTIONS.RESTART_CURRENT_ACTIVITY) {
    const payload = ensureSuccessfulPayload(
      await request(`/estudiantes/${studentId}/recuperar-sesion-dispositivo`, {
        method: "POST",
        body: { action },
      })
    );

    return {
      data: payload?.data ?? null,
      message: payload?.message || "La recuperación fue autorizada correctamente.",
    };
  },
};

export default studentDeviceSessionService;
