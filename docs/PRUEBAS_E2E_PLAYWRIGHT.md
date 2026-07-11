# Pruebas E2E con Playwright

## Que se automatizo

Se agrego una suite inicial de pruebas end to end del frontend web:

1. Redireccion publica hacia login.
2. Validaciones basicas del formulario de login.
3. Login real de tutor.
4. Bloqueo de rutas protegidas sin sesion.
5. Navegacion por rol para superadmin, admin y tutor.
6. Redireccion por permisos cuando un tutor intenta abrir una ruta de admin.

## Como ejecutar

Desde la carpeta del frontend:

```powershell
cd logickids-frontend-sena
npm run test:e2e
```

Para depurar visualmente:

```powershell
npm run test:e2e:ui
```

Para abrir el reporte HTML despues de una ejecucion:

```powershell
npm run test:e2e:report
```

## Prerrequisitos

1. Backend local en `http://localhost:3000`.
2. Base de datos con `database/seed.sql`.
3. Credenciales semilla activas:
   - `superadmin@logickids.dev` / `SuperAdmin2025!`
   - `admin.colegioprueba@logickids.dev` / `Admin123!`
   - `tutor@logickids.dev` / `Tutor123!`

Playwright levanta automaticamente el servidor Vite del frontend en `http://127.0.0.1:5173`.

