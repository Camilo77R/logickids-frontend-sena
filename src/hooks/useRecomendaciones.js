/**
 * Custom Hook: useRecomendaciones
 *
 * Encapsula la lógica de carga, generación y archivado de recomendaciones IA.
 * Expone funciones para interactuar con Gemini desde cualquier componente.
 *
 * EJEMPLO DE USO:
 *   const { recomendaciones, loading, generando, generar, archivar } =
 *     useRecomendacionesEstudiante(estudianteId);
 *
 * @module hooks/useRecomendaciones
 */
import { useCallback, useEffect, useState } from "react";
import recomendacionesService from "../services/recomendacionesService";

/**
 * Hook para recomendaciones de un estudiante específico.
 *
 * @param {number|null} estudianteId
 * @returns {{
 *   recomendaciones: Array,
 *   loading: boolean,
 *   generando: boolean,
 *   error: string|null,
 *   generar: () => Promise<void>,
 *   archivar: (id: number) => Promise<void>
 * }}
 */
export function useRecomendacionesEstudiante(estudianteId) {
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false); // Estado separado para el botón de IA
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    if (!estudianteId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await recomendacionesService.porEstudiante(estudianteId);
      setRecomendaciones(data);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las recomendaciones.");
    } finally {
      setLoading(false);
    }
  }, [estudianteId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /**
   * Llama a la IA para generar una nueva recomendación.
   * Al terminar, recarga la lista automáticamente.
   */
  const generar = async () => {
    if (!estudianteId) return;

    setGenerando(true);
    setError(null);

    try {
      await recomendacionesService.generarParaEstudiante(estudianteId);
      await cargar(); // Recarga la lista con la nueva recomendación
    } catch (err) {
      setError(err.message || "No se pudo generar la recomendación.");
    } finally {
      setGenerando(false);
    }
  };

  /**
   * Archiva una recomendación y la quita de la lista sin recargar desde el servidor.
   * Optimistic update: actualiza la UI inmediatamente.
   *
   * @param {number} recomendacionId
   */
  const archivar = async (recomendacionId) => {
    try {
      await recomendacionesService.archivar(recomendacionId);
      // Elimina la recomendación del estado local sin hacer otro fetch
      setRecomendaciones((prev) => prev.filter((r) => r.id !== recomendacionId));
    } catch (err) {
      setError(err.message || "No se pudo archivar la recomendación.");
    }
  };

  return { recomendaciones, loading, generando, error, generar, archivar };
}

/**
 * Hook para recomendaciones de un grupo completo.
 *
 * @param {number|null} grupoId
 */
export function useRecomendacionesGrupo(grupoId) {
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    if (!grupoId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await recomendacionesService.porGrupo(grupoId);
      setRecomendaciones(data);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las recomendaciones del grupo.");
    } finally {
      setLoading(false);
    }
  }, [grupoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const generar = async () => {
    if (!grupoId) return;

    setGenerando(true);
    setError(null);

    try {
      await recomendacionesService.generarParaGrupo(grupoId);
      await cargar();
    } catch (err) {
      setError(err.message || "No se pudo generar la recomendación grupal.");
    } finally {
      setGenerando(false);
    }
  };

  const archivar = async (recomendacionId) => {
    try {
      await recomendacionesService.archivar(recomendacionId);
      setRecomendaciones((prev) => prev.filter((r) => r.id !== recomendacionId));
    } catch (err) {
      setError(err.message || "No se pudo archivar la recomendación.");
    }
  };

  return { recomendaciones, loading, generando, error, generar, archivar };
}
