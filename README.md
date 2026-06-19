# LogicKids Frontend

Frontend React + Vite para LogicKids.

## Variables de entorno

En desarrollo local, usa el backend local:

```env
VITE_API_URL=http://localhost:3000/api
```

En Vercel, incluyendo previews de ramas, la mejor practica para este despliegue es usar el proxy same-origin definido en `vercel.json`:

```env
VITE_API_URL=/api
```

Tambien puedes omitir `VITE_API_URL` en produccion; el frontend usa `/api` por defecto cuando se compila con Vite en modo production. Si Vercel todavia tiene configurada la URL directa de Render, el cliente la normaliza a `/api` para evitar CORS en previews.

## CORS y despliegue

El navegador no debe llamar directamente a `https://logickids-backend-sena.onrender.com` desde Vercel. Las llamadas de produccion pasan por:

```txt
https://logickids-frontend-sena.vercel.app/api/*
```

Vercel reenvia esas solicitudes a:

```txt
https://logickids-backend-sena.onrender.com/api/*
```

Esto evita errores de CORS en el navegador. El backend, de todas formas, deberia permitir explicitamente el origen `https://logickids-frontend-sena.vercel.app` como defensa adicional.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```
