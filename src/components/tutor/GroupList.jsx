import React from "react";
import { Users, Star, ChevronRight } from "lucide-react";

export default function GroupList({ groups, onSelect }) {
  if (!groups || groups.length === 0) {
    return (
      <div className="lk-empty" style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Users size={32} style={{ color: "var(--lk-color-text-muted)", marginBottom: "0.5rem" }} />
        <p style={{ margin: 0, color: "var(--lk-color-text-soft)" }}>No tienes grupos creados en este momento.</p>
      </div>
    );
  }
  return (
    <ul className="lk-group-list">
      {groups.map((group) => (
        <li 
          key={group.id} 
          onClick={() => onSelect?.(group)} 
          style={{ 
            cursor: onSelect ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <div style={{ 
              width: 42, 
              height: 42, 
              borderRadius: '50%', 
              background: 'var(--lk-color-primary-soft)', 
              color: 'var(--lk-color-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Users size={20} />
            </div>
            <div style={{ display: 'grid', gap: '0.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '1.1rem', color: 'var(--lk-color-text)' }}>{group.nombre}</strong>
                {group.predeterminado ? (
                  <span className="lk-role-badge" title="Grupo predeterminado" style={{ padding: '0.2rem 0.5rem' }}>
                    <Star size={12} fill="currentColor" /> Predeterminado
                  </span>
                ) : null}
              </div>
              {group.descripcion && <span className="lk-muted" style={{ fontSize: '0.9rem' }}>{group.descripcion}</span>}
            </div>
          </div>
          
          {onSelect && (
            <div style={{ color: 'var(--lk-color-text-muted)' }}>
              <ChevronRight size={20} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
