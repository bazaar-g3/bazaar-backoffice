# Bazaar — Backoffice

Panel de administración de la plataforma Bazaar. Solo para admins.

## Stack
- React 18 + Vite
- react-router-dom para navegación
- axios para llamadas al API Gateway
- recharts para gráficos de métricas

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/login` | Login con JWT |
| `/dashboard` | Métricas y gráficos de ventas |
| `/users` | Gestión de usuarios (bloquear/desbloquear) |
| `/orders` | Ver órdenes para soporte técnico |
| `/products` | Moderación de productos |

## Setup local
```bash
cp .env.example .env
npm install
npm run dev
```

App en: http://localhost:3000

## Deploy
Se hostea en **AWS S3** como sitio estático.
```bash
npm run build
# Subir carpeta dist/ al bucket S3
```

## Variables de entorno
Ver `.env.example`.
