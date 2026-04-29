import React, { useState } from "react";
import { PlusCircle } from "lucide-react";

export default function GroupForm({ onCreate, loading }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre del grupo es obligatorio.");
      return;
    }
    setError("");
    onCreate({ nombre: nombre.trim(), descripcion: descripcion.trim() || undefined });
    setNombre("");
    setDescripcion("");
  };

  return (
    <form onSubmit={handleSubmit} className="lk-form-grid" style={{ maxWidth: 450 }}>
      <div className="lk-field">
        <label>Nombre del grupo</label>
        <input 
          value={nombre} 
          onChange={e => setNombre(e.target.value)} 
          disabled={loading} 
          required 
          placeholder="Ej: Matemáticas 1A"
        />
      </div>
      <div className="lk-field">
        <label>Descripción (opcional)</label>
        <input 
          value={descripcion} 
          onChange={e => setDescripcion(e.target.value)} 
          disabled={loading} 
          placeholder="Ej: Grupo para la mañana"
        />
      </div>
      {error && <div className="lk-alert lk-alert--error">{error}</div>}
      <button type="submit" className="lk-btn lk-btn--primary" disabled={loading}>
        <PlusCircle size={18} /> Crear grupo
      </button>
    </form>
  );
}
