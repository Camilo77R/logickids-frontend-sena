import { useState, useEffect } from 'react';
import adminService from '../services/adminService';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const users = await adminService.listUsers();
        const recentUsers = [...users]
          .sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
          .slice(0, 5)
          .map(user => ({
            id: user.id,
            message: `📝 Nuevo usuario: ${user.nombre} (${user.email})`,
            date: user.creado_en,
            read: false,
          }));
        setNotifications(recentUsers);
        setUnreadCount(recentUsers.length);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    loadNotifications();
  }, []);

  const removeNotification = (id) => {
    const updatedNotifications = notifications.filter(notif => notif.id !== id);
    setNotifications(updatedNotifications);
    setUnreadCount(updatedNotifications.filter(n => !n.read).length);
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={handleOpen} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.2rem", position: "relative", padding: "0.5rem" }}>
        🔔
        {unreadCount > 0 && (
          <span style={{ position: "absolute", top: "-2px", right: "-2px", background: "#ef4444", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "0.7rem", fontWeight: "bold" }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{ position: "absolute", top: "40px", right: "0", width: "320px", background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", zIndex: 1000, maxHeight: "400px", overflowY: "auto" }}>
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0", fontWeight: "600" }}>
            Notificaciones recientes
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
              No hay notificaciones
            </div>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} style={{ 
                padding: "0.75rem 1rem", 
                borderBottom: "1px solid #f1f5f9", 
                fontSize: "0.875rem",
                background: notif.read ? "white" : "#f0f9ff",
                position: "relative",
                paddingRight: "2rem"
              }}>
                <div>{notif.message}</div>
                <small style={{ color: "#64748b", fontSize: "0.7rem" }}>
                  {new Date(notif.date).toLocaleString()}
                </small>
                <button
                  onClick={() => removeNotification(notif.id)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    color: "#999"
                  }}
                >
                  ✖️
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}