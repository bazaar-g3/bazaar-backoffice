# Bazaar — Backoffice

Panel de administración web de la plataforma Bazaar. Exclusivo para administradores del sistema. Permite gestionar usuarios, productos, órdenes y visualizar métricas de actividad.

## Stack tecnológico

| Tecnología | Rol |
|---|---|
| **React 18** | Framework de UI |
| **Vite** | Bundler y servidor de desarrollo |
| **Axios** | Llamadas HTTP al API Gateway de AWS |
| **Recharts** | Gráficos y visualización de métricas |

## Funcionalidades

### Usuarios
- **Listar usuarios** — Visualizar todos los usuarios registrados en la plataforma con sus datos principales.
- **Bloquear / desbloquear usuario** — Controlar el acceso de un usuario ante situaciones de abuso o incumplimiento de políticas.

### Productos
- **Listar productos** — Ver todos los productos publicados en el marketplace.
- **Moderar productos** — Aprobar, pausar o eliminar publicaciones para garantizar la calidad y el cumplimiento de las políticas de Bazaar.

### Órdenes
- **Listar órdenes** — Consultar y buscar órdenes del sistema para dar soporte ante reclamos y tener visibilidad operativa del flujo de compras.

### Métricas
- **Métricas generales** — Dashboard con indicadores clave de actividad de la plataforma para evaluar el estado del negocio y detectar anomalías.
- **Métricas por categoría** — Desglose de actividad por categoría de producto para identificar los segmentos más dinámicos del catálogo.
- **Exportar datos** — Descarga de métricas en formato CSV para análisis externo con otras herramientas.

## Setup local

```bash
cp .env.example .env
# se debe editar el .env con las urls correspondientes
npm install
npm run dev
```

App disponible en: `http://localhost:3000`

## Variables de entorno

Las variables usan el prefijo `VITE_` (requerido por Vite para exponerlas en el browser). Ver `.env.example` para referencia.

| Variable | Descripción |
|---|---|
| `VITE_API_GATEWAY_URL` | URL base de user-api (autenticación y usuarios) |
| `VITE_CATALOG_API_URL` | URL base de catalog-api (productos y categorías) |
| `VITE_ORDERS_API_URL` | URL base de orders-api (órdenes y métricas) |

## Deploy

El backoffice se despliega automáticamente en **Vercel** al hacer push a la rama `main`. No se requiere intervención manual.

- **URL de producción:** https://bazaar-backoffice-64v8.vercel.app/

Para levantar un preview del build de producción localmente:

```bash
npm run build
npm run preview
```
