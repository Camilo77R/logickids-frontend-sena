# Reporte de credenciales, QR y pruebas

Fecha: 2026-05-06

## Objetivo

Cerrar desde frontend, sin tocar el backend, estos frentes:

- ciclo serio de credenciales web
- cambio de contraseña para todos los usuarios web autenticados
- recuperación de acceso sin inventar endpoints inexistentes
- QR final del estudiante
- evidencia reproducible de pruebas

## Qué se implementó

### 1. Centro de cuenta para todos los usuarios web

Se creó un `Centro de cuenta` reutilizable con:

- actualización de perfil
- cambio de contraseña
- lectura del contexto actual del usuario

Aplica para:

- tutor
- admin
- superadmin

## 2. Recuperación de acceso pública

Se agregó una pantalla pública de recuperación:

- ruta: `/recuperar-acceso`
- enlazada desde login

Esta pantalla no finge un reset automático que el backend no ofrece.
En su lugar, guía la recuperación real según reglas de negocio y rol:

- tutor -> admin institucional
- admin -> superadmin
- superadmin -> responsable técnico

## 3. QR final del estudiante

El backend ya entregaba el `qr_token`.
El frontend ahora:

- genera una imagen QR real
- permite copiar el token
- permite descargar el QR como PNG

Todo esto sin modificar backend.

## 4. Evidencia de pruebas

Se agregó:

- script `npm run smoke:credenciales`
- documento `docs/PRUEBAS_CREDENCIALES_Y_QR.md`

## Reglas de negocio respetadas

1. El tutor registrado sigue quedando inactivo hasta activación institucional.
2. El cambio de contraseña solo ocurre en sesión autenticada.
3. La recuperación pública no promete capacidades que el backend no tiene.
4. El QR mostrado en frontend sale del token real del backend.
5. El ciclo autenticado de credenciales ahora existe para todos los usuarios web.

## Verificaciones ejecutadas

### Smoke público

- `GET /auth/instituciones` exitoso

### Smoke autenticado real

Se ejecutó login real con `superadmin`, lectura de perfil, actualización temporal de nombre y restauración.

Resultado:

- exitoso

### Build

Se ejecutó:

```bash
npm run build
```

Resultado:

- compila correctamente

## Qué ya no exigió tocar backend

- cambio de contraseña
- actualización de perfil
- recuperación guiada de acceso
- QR visual final
- evidencia de smoke

## Qué seguiría requiriendo backend nuevo si algún día lo quieren

- envío de correo para reset automático
- tokens temporales de recuperación
- endpoint para regenerar contraseña olvidada
- auditoría formal de recuperación

## Archivos clave tocados

- `src/services/authService.js`
- `src/context/AuthContext.jsx`
- `src/components/account/AccountCenterModal.jsx`
- `src/components/account/StudentQrPreview.jsx`
- `src/pages/auth/RecuperarAccesoPage.jsx`
- `src/pages/auth/LoginPage.jsx`
- `src/pages/auth/RegistroPage.jsx`
- `src/pages/tutor/TutorEstudiantesPage.jsx`
- `src/components/layout/AppShell.jsx`
- `src/components/layout/superadmin/SuperadminLayout.jsx`
- `src/components/layout/tutor/TutorTopbar.jsx`
- `src/routes/AppRouter.jsx`
- `scripts/credential-smoke.mjs`
- `docs/PRUEBAS_CREDENCIALES_Y_QR.md`

## Conclusión

El frontend quedó más sólido y más honesto técnicamente.

No se maquilló la ausencia de backend para reset automático.
En cambio:

- se cerró el flujo autenticado
- se dio salida UX real a recuperación
- se resolvió el QR final
- se dejó evidencia reproducible

Esto mejora bastante la defensa técnica del proyecto sin obligarlos a reabrir backend.
