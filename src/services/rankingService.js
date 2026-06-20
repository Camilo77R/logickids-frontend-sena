import { request } from "./httpClient";

const unwrapEntity = (payload) => payload?.data ?? payload ?? null;

const rankingService = {
  async obtenerRankingGrupo(grupoId) {
    const payload = await request(`/grupos/${grupoId}/ranking`);
    return unwrapEntity(payload);
  },
};

export default rankingService;
