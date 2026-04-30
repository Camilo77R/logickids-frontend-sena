import { useState, useEffect } from 'react';
import adminService from '../services/adminService';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await adminService.listUsers();  // ✅ solo UNA vez
        const users = response;  // ✅ o usa response directamente
        
        const recentUsers = [...users]
          .sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
          .slice(0, 5)
          .map(user => ({
            id: user.id,
            message: `New user registered: ${user.nombre} (${user.email})`,
            date: user.creado_en,
          }));
        
        setNotifications(recentUsers);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    
    loadNotifications();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
      {notifications.length === 0 ? (
        <p className="text-gray-500">No recent notifications</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map(notif => (
            <li key={notif.id} className="border-b pb-2 text-sm">
              <p className="text-gray-800">{notif.message}</p>
              <span className="text-xs text-gray-400">
                {new Date(notif.date).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}