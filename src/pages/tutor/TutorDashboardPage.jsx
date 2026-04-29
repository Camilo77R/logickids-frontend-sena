import React, { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import GroupList from "../../components/tutor/GroupList";
import GroupForm from "../../components/tutor/GroupForm";
import tutorService from "../../services/tutorService";

export default function TutorGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchGroups = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await tutorService.listGroups();
      setGroups(data);
    } catch (err) {
      setError("No se pudieron cargar los grupos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (groupData) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await tutorService.createGroup(groupData);
      setSuccess("Grupo creado correctamente.");
      fetchGroups();
    } catch (err) {
      setError("No se pudo crear el grupo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Mis Grupos" description="Gestiona los grupos de estudiantes asignados">
      <div className="lk-page-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 500px)', gap: '2rem' }}>
        
        <div className="lk-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.4rem' }}>
            Listado de grupos
          </h2>
          {loading ? (
            <div className="lk-empty" style={{ textAlign: 'center' }}>Cargando información...</div>
          ) : (
            <GroupList groups={groups} />
          )}
        </div>

        <div className="lk-card" style={{ alignSelf: 'start' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>Crear nuevo grupo</h2>
          <GroupForm onCreate={handleCreateGroup} loading={loading} />
          
          <div style={{ marginTop: '1rem' }}>
            {success && <div className="lk-alert lk-alert--success">{success}</div>}
            {error && <div className="lk-alert lk-alert--error">{error}</div>}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
