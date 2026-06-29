/**
 * Custom Hook: useEstadisticas
 *
 * Encapsula la lógica de carga de estadísticas de un estudiante o grupo.
 * Maneja automáticamente los estados de carga y error.
 *
 * CONCEPTO: Un custom hook es una función que empieza con "use" y
 * agrupa useState + useEffect para que los componentes no repitan lógica.
 *
 * EJEMPLO DE USO:
 *   const { stats, loading, error } = useEstadisticasEstudiante(estudianteId);
 *
 * @module hooks/useEstadisticas
 */
import { useEffect, useState } from "react";
import estadisticasService from "../services/estadisticasService";

/**
 * Carga las estadísticas acumuladas de un estudiante específico.
 *
 * @param {number|null} estudianteId - ID del estudiante (null = no carga)
 * @returns {{ stats: Array, loading: boolean, error: string|null }}
 */
export function useEstadisticasEstudiante(estudianteId, refreshKey = 0) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si no hay ID, no hacemos nada
    if (!estudianteId) return;

    let cancelled = false; // Evita actualizar estado si el componente se desmontó

    const cargar = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await estadisticasService.porEstudiante(estudianteId);
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "No se pudieron cargar las estadísticas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    cargar();

    // Cleanup: evita memory leaks si el componente se desmonta antes de que termine
    return () => { cancelled = true; };
  }, [estudianteId, refreshKey]);

  return { stats, loading, error };
}

/**
 * Carga los promedios estadísticos de un grupo completo.
 *
 * @param {number|null} grupoId - ID del grupo (null = no carga)
 * @returns {{ stats: Array, loading: boolean, error: string|null }}
 */
export function useEstadisticasGrupo(grupoId, refreshKey = 0) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!grupoId) return;

    let cancelled = false;

    const cargar = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await estadisticasService.porGrupo(grupoId);
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "No se pudieron cargar las estadísticas del grupo.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    cargar();

    return () => { cancelled = true; };
  }, [grupoId, refreshKey]);

  return { stats, loading, error };
}
