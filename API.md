# Exercise Catalog API — Referencia de Endpoints

Referencia completa de todos los endpoints usables de la API.

- **Base URL (local)**: `https://exercise-catalog-coral.vercel.app/`
- **Formato**: JSON
- **Fuente de datos**: ~1324 ejercicios (datos en español)
- **Api key**: 1234

## Autenticación

Todos los endpoints (excepto `/api/health`) requieren el header:

```
x-api-key: <CATALOG_API_KEY>
```

Si falta o es inválida → `401` (no llega al handler).

## Idiomas soportados

`en`, `es`, `it`, `tr`, `ru`, `zh`, `hi`, `pl`, `ko`, `fr`

El parámetro `lang` (disponible en lista, detalle y random) reemplaza los campos i18n
`instructions` e `instructionSteps` por el texto del idioma pedido. Si un ejercicio no
tiene el idiama pedido, se resuelve por campo con la cadena de fallback:
**`lang` → `es` → `en` → primer idioma disponible** (si nada, `null`).
Un idioma fuera de la lista → `400`.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check (sin auth) |
| GET | `/api/exercises` | Lista con filtros, búsqueda, batch e idioma |
| GET | `/api/exercises/:id` | Detalle de un ejercicio por id |
| GET | `/api/exercises/meta` | Valores disponibles de cada filtro + conteos |
| GET | `/api/exercises/random` | Ejercicios aleatorios |

---

### GET /api/health

Health check. No requiere API key.

```bash
curl http://localhost:3000/api/health
```

```json
{ "status": "ok", "timestamp": "2026-08-20T22:09:58.969Z" }
```

---

### GET /api/exercises

Lista paginada de ejercicios con filtros combinables (se AND-an).

**Query Parameters:**

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `category` | string | — | Filtra por categoría |
| `body_part` | string | — | Filtra por parte del cuerpo |
| `equipment` | string | — | Filtra por equipo |
| `muscle_group` | string | — | Filtra por grupo muscular |
| `target` | string | — | Filtra por músculo objetivo |
| `q` | string | — | Búsqueda por nombre, case-insensitive (contiene) |
| `ids` | string | — | Batch: ids separados por coma (ej: `0001,0002`). Máx **100** → si hay más, `400`. Los ids inexistentes se omiten silenciosamente |
| `lang` | string | — | Idioma de `instructions`/`instructionSteps` |
| `offset` | number | `0` | Paginación |
| `limit` | number | `20` | Resultados por página (máx 100) |

**Ejemplos:**

```bash
# Filtro + paginación
curl -H "x-api-key: $KEY" "http://localhost:3000/api/exercises?category=cintura&limit=5"

# Búsqueda por nombre (case-insensitive)
curl -H "x-api-key: $KEY" "http://localhost:3000/api/exercises?q=abdom&limit=100"
# → { "data": [...26 ejercicios...], "total": 26, "offset": 0, "limit": 100 }

# Batch por ids
curl -H "x-api-key: $KEY" "http://localhost:3000/api/exercises?ids=0001,0002"
# → { "data": [0001, 0002], "total": 2, ... }

# Con idioma
curl -H "x-api-key: $KEY" "http://localhost:3000/api/exercises?limit=1&lang=es"
```

**Respuesta** (sin `lang`; con `lang` los campos i18n vienen recortados):

```json
{
  "data": [
    {
      "id": "0001",
      "name": "Abdominal 3/4",
      "category": "cintura",
      "bodyPart": "cintura",
      "equipment": "peso corporal",
      "muscleGroup": "flexores de cadera",
      "target": "abdominales",
      "secondaryMuscles": ["flexores de cadera", "zona lumbar"],
      "instructions": { "en": "...", "es": "...", "...": "..." },
      "instructionSteps": { "en": ["..."], "es": ["..."], "...": ["..."] },
      "image": "...",
      "gifUrl": "...",
      "attribution": "...",
      "createdAt": "..."
    }
  ],
  "total": 1324,
  "offset": 0,
  "limit": 5
}
```

Con `lang=es`, cada item pasa a tener `"instructions": "<texto>"` y
`"instructionSteps": ["paso 1", ...]` en lugar del objeto multi-idioma.

---

### GET /api/exercises/:id

Detalle de un ejercicio. Si no existe → `404`.

| Param | Tipo | Descripción |
|-------|------|-------------|
| `lang` | string | Idioma de `instructions`/`instructionSteps` |

```bash
curl -H "x-api-key: $KEY" "http://localhost:3000/api/exercises/0001?lang=es"
```

```json
{
  "data": {
    "id": "0001",
    "name": "Abdominal 3/4",
    "instructions": "Túmbate sobre tu espalda con las rodillas flexionadas y los...",
    "instructionSteps": ["Túmbate...", "..."]
  }
}
```

Sin `lang` devuelve el ejercicio completo con los objetos i18n.

---

### GET /api/exercises/meta

Valores disponibles de cada filtro con su cantidad de ejercicios, ordenados
alfabéticamente (collation de la base de datos). Ideal para poblar dropdowns.

```bash
curl -H "x-api-key: $KEY" "http://localhost:3000/api/exercises/meta"
```

```json
{
  "data": {
    "category":   [{ "value": "antebrazos", "count": 37 }, { "value": "brazos", "count": 292 }],
    "body_part":  [{ "value": "antebrazos", "count": 37 }, { "value": "brazos", "count": 292 }],
    "equipment":  [{ "value": "asistido", "count": 15 }, { "value": "balón medicinal", "count": 13 }],
    "muscle_group":[{ "value": "abdominales", "count": 2 }, { "value": "antebrazos", "count": 165 }],
    "target":     [{ "value": "abdominales", "count": 169 }, { "value": "abductores", "count": 5 }]
  }
}
```

Claves en snake_case, iguales a los nombres de los query params de filtro.

---

### GET /api/exercises/random

Ejercicios aleatorios (salto aleatorio sobre el total). Devuelve hasta `limit`
items; `count` indica cuántos vinieron realmente.

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `limit` | number | `5` | Cantidad (clamp **1–20**; inválidos → default) |
| `lang` | string | — | Idioma de `instructions`/`instructionSteps` |

```bash
curl -H "x-api-key: $KEY" "http://localhost:3000/api/exercises/random?limit=3&lang=es"
```

```json
{
  "data": [ { "id": "0739", "...": "..." } ],
  "count": 3
}
```

---

## Errores

| Código | Cuándo | Body |
|--------|--------|------|
| 400 | Más de 100 `ids` | `{"error":"Too many ids (max 100)"}` |
| 400 | `lang` no soportado | `{"error":"Unsupported language: zz. Valid: en, es, it, tr, ru, zh, hi, pl, ko, fr"}` |
| 401 | API key faltante o inválida | — |
| 404 | Ejercicio inexistente en `/:id` | `{"error":"Exercise not found"}` |
| 500 | Error interno | `{"error":"Internal server error"}` |

## Notas de compatibilidad

- Todos los parámetros nuevos (`q`, `ids`, `lang`) son opcionales: sin ellos las
  respuestas son idénticas a las previas.
- Ningún id de ejercicio colisiona con las rutas estáticas (`meta`, `random`):
  los ids son numéricos de 4 dígitos (`0001`…`1324`).
