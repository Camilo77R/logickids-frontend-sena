# Pruebas de credenciales y QR

## Objetivo

Dejar evidencia reproducible de que el frontend web ya cubre un ciclo serio de credenciales sin volver a tocar el backend:

- login
- consulta de perfil
- actualización de perfil
- cambio de contraseña
- recuperación guiada de acceso
- visualización final del QR del estudiante

## Reglas de negocio respetadas

1. Un tutor nuevo sigue quedando inactivo hasta activación institucional.
2. El cambio de contraseña solo existe para usuarios autenticados.
3. La recuperación pública no finge un reset automático inexistente en backend.
4. El QR final se genera en frontend desde el `qr_token` real entregado por backend.
5. El flujo de credenciales es común para `tutor`, `admin` y `superadmin` en sesión autenticada.

## Smoke automatizable

Script disponible:

```bash
npm run smoke:credenciales
```

### Variables opcionales

```bash
LK_SMOKE_BASE_URL=http://localhost:3000/api
LK_SMOKE_EMAIL=usuario@correo.com
LK_SMOKE_PASSWORD=claveActual
LK_SMOKE_MUTATION=true
LK_SMOKE_PASSWORD_ROTATION=true
LK_SMOKE_PASSWORD_NEW=ClaveTemporalNueva123
```

### Qué valida

1. `GET /auth/instituciones`
2. `POST /auth/login`
3. `GET /auth/perfil`
4. `PUT /auth/perfil` si `LK_SMOKE_MUTATION=true`
5. `PUT /auth/cambiar-contrasena` y restauración si `LK_SMOKE_PASSWORD_ROTATION=true`

## Checklist manual de UI

### Login y recuperación

1. Entrar a `/login`
2. Ver el enlace `¿Olvidaste tu acceso?`
3. Entrar a `/recuperar-acceso`
4. Seleccionar rol y validar que el flujo cambie según el tipo de usuario

### Centro de cuenta

1. Iniciar sesión como `tutor`, `admin` o `superadmin`
2. Abrir `Centro de cuenta`
3. Actualizar nombre visible
4. Cambiar contraseña
5. Confirmar feedback de éxito o error

### QR del estudiante

1. Entrar como tutor
2. Ir a `Estudiantes`
3. Abrir el modal de QR de un estudiante
4. Ver imagen QR real
5. Copiar token
6. Descargar PNG

## Alcance real

### Sí quedó cubierto sin backend nuevo

- cambio de contraseña
- actualización de perfil
- recuperación guiada de acceso
- QR visual final
- smoke reproducible

### No quedó automatizado porque requiere backend nuevo

- envío de correos de recuperación
- token temporal de reset
- regeneración autónoma de contraseña olvidada

Esto no es un bug del frontend. Es una capacidad nueva de producto que necesitaría endpoints adicionales.
