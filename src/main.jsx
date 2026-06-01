import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 1. Tokens primero — sobreescribe variables --bs-* de Bootstrap
import './styles/tokens.css'
// 2. Bootstrap base (adopta nuestras variables gracias a tokens.css)
import 'bootstrap/dist/css/bootstrap.min.css'
// 3. Reset/base global mínimo
import './index.css'
// 4. Shell/layout tutor
import './styles/shared-layout.css'
// 5. Bloques de marca compartidos
import './styles/branding-shared.css'
// 6. Shell moderno admin/superadmin + dashboards por rol
import './styles/portal-shell.css'
import './styles/role-dashboard.css'
import './styles/role-management.css'
// 7. Auth pages (login, registro)
import './styles/auth.css'
// 8. Shell y UI administrativa existentes
import './styles/admin-shell.css'
import './styles/admin-ui.css'
import './styles/admin-grupos.css'


import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
