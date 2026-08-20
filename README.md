# Exercise Catalog API

API REST para el catálogo de ejercicios de FitnessAr. Permite consultar y filtrar ejercicios del catálogo global.

## Stack

- **Runtime**: Node.js
- **Framework**: Next.js 15 (App Router)
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase)
- **Deploy**: Vercel

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y configura:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/exercise_catalog"

# API Key (la que compartes con tus gyms)
CATALOG_API_KEY="tu-api-key-secreta"

# CORS (dominios permitidos)
ALLOWED_ORIGINS="http://localhost:3000,https://tudominio.com"
```

### 3. Configurar base de datos

```bash
# Generar cliente Prisma
npx prisma generate

# Crear tablas
npx prisma db push
```

### 4. Importar ejercicios

```bash
# Ejecutar seed script
npx tsx prisma/seed.ts
```

Esto importará ~1000+ ejercicios del dataset JSON a PostgreSQL.

## API Endpoints

> 📖 **Referencia completa de todos los endpoints:** [API.md](./API.md)

### Headers requeridos

Todos los endpoints (excepto `/api/health`) requieren:

```
x-api-key: tu-api-key-secreta
```

### GET /api/exercises

Lista todos los ejercicios con filtros opcionales.

**Query Parameters:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `category` | string | Filtrar por categoría (ej: waist, chest, back) |
| `body_part` | string | Filtrar por parte del cuerpo |
| `equipment` | string | Filtrar por equipo (ej: body weight, dumbbell) |
| `muscle_group` | string | Filtrar por grupo muscular |
| `target` | string | Filtrar por músculo objetivo |
| `q` | string | Búsqueda por nombre, case-insensitive (contiene) |
| `ids` | string | Batch por ids separados por coma (max 100, ej: `0001,0002`) |
| `lang` | string | Idioma de instrucciones (en, es, it, tr, ru, zh, hi, pl, ko, fr) |
| `offset` | number | Paginación (default: 0) |
| `limit` | number | Resultados por página (default: 20, max: 100) |

**Ejemplo:**

```bash
curl -H "x-api-key: tu-api-key" \
  "http://localhost:3000/api/exercises?category=waist&limit=5"
```

**Respuesta:**

```json
{
  "data": [...],
  "total": 150,
  "offset": 0,
  "limit": 5
}
```

### GET /api/exercises/:id

Obtiene un ejercicio por su ID.

**Ejemplo:**

```bash
curl -H "x-api-key: tu-api-key" \
  "http://localhost:3000/api/exercises/0001"
```

**Respuesta:**

```json
{
  "data": {
    "id": "0001",
    "name": "3/4 sit-up",
    "category": "waist",
    "bodyPart": "waist",
    "equipment": "body weight",
    "instructions": {
      "en": "...",
      "es": "...",
      ...
    },
    ...
  }
}
```

### GET /api/exercises/meta

Valores disponibles de cada filtro con su cantidad de ejercicios (ideal para dropdowns).

```bash
curl -H "x-api-key: tu-api-key" \
  "http://localhost:3000/api/exercises/meta"
```

```json
{
  "data": {
    "category": [{ "value": "cintura", "count": 37 }],
    "body_part": [],
    "equipment": [],
    "muscle_group": [],
    "target": []
  }
}
```

### GET /api/exercises/random

Ejercicios aleatorios.

| Param | Tipo | Descripción |
|-------|------|-------------|
| `limit` | number | Cantidad (default: 5, clamp 1–20) |
| `lang` | string | Idioma de instrucciones |

```bash
curl -H "x-api-key: tu-api-key" \
  "http://localhost:3000/api/exercises/random?limit=3&lang=es"
```

**Respuesta:** `{ "data": [...], "count": 3 }`

### GET /api/health

Health check (no requiere API key).

```bash
curl http://localhost:3000/api/health
```

## Errores

| Código | Descripción |
|--------|-------------|
| 400 | Parámetro inválido (ej: más de 100 ids, idioma no soportado) |
| 401 | API key inválida o faltante |
| 404 | Ejercicio no encontrado |
| 500 | Error interno del servidor |

## Deploy en Vercel

1. Conecta el repo a Vercel
2. Configura las variables de entorno en el dashboard
3. Vercel detecta automáticamente Next.js

## Dataset

Los ejercicios provienen de `exercises-dataset-main/data/exercises.json` con:
- ~1000+ ejercicios
- 9 idiomas (en, es, it, tr, ru, zh, hi, pl, ko, fr)
- Imágenes y GIFs de demostración
