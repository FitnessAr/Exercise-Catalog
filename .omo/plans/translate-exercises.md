# translate-exercises - Work Plan

## TL;DR (For humans)

**Qué vas a obtener:** el catálogo de ejercicios (`exercise-catalog`) con los 7 campos de metadatos visibles traducidos a **español argentino** dentro de la base de datos: `name`, `category`, `body_part`, `equipment`, `muscle_group`, `target` y `secondary_muscles`. La API devuelve y filtra en español. El dataset original queda intacto.

**Por qué este enfoque:** la traducción se aplica **en el seed** (decisión tuya): `prisma/seed.ts` traduce antes del `upsert` usando un archivo de mapeo `prisma/translations.ts`. Es simple, reversible (re-seed desde el dataset intacto), no toca el schema ni la estructura de la API, y el contrato de filtros pasa a español (documentado en el README).

**Qué NO hará:** no modifica `exercises-dataset-main/data/exercises.json`, no agrega columnas ni cambia el schema Prisma, no traduce `instructions`/`instruction_steps` (ya tienen `es` del dataset), no cambia la estructura de respuesta de la API, no toca la app FitnessAr.

**Esfuerzo:** 8 todos de implementación + 4 verificadores finales. El grueso es generar el mapeo de ~1000+ nombres + ~80 valores de vocabulario, y los scripts de verificación automatizada.

**Riesgos:** calidad/consistencia de las traducciones de nombres (mitigado con glosario fijo + check de completitud + verificación contra DB); smoke test de API requiere servidor dev corriendo y la API key (ya está en `.env`); el repo **no es git** → no habrá commits.

**Decisiones:** traducir en seed (no en capa API, no columnas duales); todos los metadatos visibles; instrucciones quedan en el `es` neutro del dataset; verificación automatizada (tests después + smoke test API).

## Scope

**IN:**
- Extraer el inventario completo de valores únicos de los 7 campos traducibles desde `exercises-dataset-main/data/exercises.json`.
- Crear `exercise-catalog/prisma/translations.ts`: mapas tipados EN→ES-AR para `name`, `category`, `body_part`, `equipment`, `muscle_group`, `target`, `secondary_muscles`, más la función `translateExercise()` con fallo rápido (fail-fast) si falta un valor.
- Modificar `exercise-catalog/prisma/seed.ts` para aplicar la traducción antes del `upsert` (create y update).
- Re-seed de la DB (Supabase) con `npm run db:seed`.
- Scripts de verificación automatizada:
  - `scripts/check-translation-completeness.ts` — cobertura 100% del mapeo contra el dataset.
  - `scripts/verify-translations.ts` — los valores en DB coinciden con `translate(dataset)` por `id` para los 7 campos.
- Smoke test de API: `GET /api/exercises` con filtros en español y `GET /api/exercises/:id` devuelven valores en español.
- Actualizar `exercise-catalog/README.md`: tabla de query params y ejemplos `curl` con valores en español.

**OUT (Must NOT have):**
- NO modificar `exercises-dataset-main/data/exercises.json` (solo lectura).
- NO agregar columnas ni cambiar `prisma/schema.prisma`.
- NO traducir `instructions` / `instruction_steps`.
- NO cambiar la estructura de respuesta de la API ni agregar endpoints.
- NO implementar traducción en la capa de respuesta ni negociación de idioma.
- NO tocar la app `FitnessAr/`.
- NO exponer ni imprimir valores de `.env` (secretos: `DATABASE_URL`, `DIRECT_URL`, `CATALOG_API_KEY`).
- NO inicializar git ni crear commits (repo no es git; fuera de alcance).

## Verification strategy

**Estrategia:** tests después (tests-after), QA ejecutado por el agente, cero intervención humana.

1. **Completitud del mapeo** (`scripts/check-translation-completeness.ts`, Todo 3): re-extrae valores únicos del dataset de forma independiente y asserta que cada valor de los 7 campos tiene entrada en `translations.ts`. Exit 0 = completo; exit 1 = lista los faltantes.
2. **Integridad de datos en DB** (`scripts/verify-translations.ts`, Todo 6): para cada ejercicio en la DB, asserta que los 7 campos traducidos son exactamente `translate(valor_del_dataset)` keyed por `id`. Exit 0 = sin residuos en inglés; exit 1 = lista ids/campos con mismatch.
3. **Smoke test API** (Todo 7): servidor `npm run dev` corriendo, `curl` con `x-api-key` y filtros en español (ej. `muscle_group=cuádriceps`, `category=pecho`) + `GET /api/exercises/0001`; asserta que los JSON devueltos contienen valores en español. Respuestas guardadas en `.omo/scratch/api-smoke-*.json` como evidencia.
4. **Final verification wave**: F1 (cumplimiento del plan), F2 (calidad de código), F3 (QA manual real re-ejecutando seed + verificación + API), F4 (fidelidad de alcance). Todos en paralelo, todos deben APROBAR.

**Comandos clave:** `npm run db:seed` (= `npx tsx prisma/seed.ts`), `npx tsx scripts/check-translation-completeness.ts`, `npx tsx scripts/verify-translations.ts`, `npm run dev`.

## Execution strategy

**Orden y dependencias:**

```
Todo 1 (extraer valores únicos)
   └─> Todo 2 (generar translations.ts)
          ├─> Todo 3 (check-translation-completeness.ts)   [depende de 2]
          ├─> Todo 4 (modificar seed.ts)                   [depende de 2]
          │     └─> Todo 5 (re-seed DB)                    [depende de 4]
          │           ├─> Todo 6 (verify-translations.ts)  [depende de 2,5]
          │           └─> Todo 7 (smoke test API)          [depende de 5]
          └─> Todo 8 (README)                              [depende de 2]
```

Todo 3, 6 y 7 son independientes entre sí una vez que 2 y 5 están; pueden correr en paralelo (el worker decide). La `Final verification wave` corre después de todos los todos.

**Decisiones técnicas vinculantes:**

1. **Rutas y archivos:**
   - Dataset (solo lectura): `D:\Usuario\Emiliano\Emiliano\projects\fitnessar\exercises-dataset-main\data\exercises.json` (~1000+ ejercicios, JSON pretty-printed, ~145.883 líneas).
   - Mapeo nuevo: `exercise-catalog/prisma/translations.ts`.
   - Seed a modificar: `exercise-catalog/prisma/seed.ts`.
   - Scripts nuevos: `exercise-catalog/scripts/check-translation-completeness.ts` y `exercise-catalog/scripts/verify-translations.ts`.
   - Evidencia scratch: `exercise-catalog/.omo/scratch/` (crear si no existe).

2. **Cómo lee el seed el dataset** (NO cambiar): `join(process.cwd(), '..', 'exercises-dataset-main', 'data', 'exercises.json')` (`seed.ts:29`). Todos los scripts deben ejecutarse con cwd = `exercise-catalog/` (los `npm run` ya lo garantizan).

3. **Mapas en `translations.ts`:** un `Record<string, string>` por campo: `nameTranslations`, `categoryTranslations`, `bodyPartTranslations`, `equipmentTranslations`, `muscleGroupTranslations`, `targetTranslations`, `secondaryMuscleTranslations`. Claves = valor exacto en inglés del dataset; valores = español argentino. Exportar además `translateExercise(ex: ExerciseData): ExerciseData` que aplica todos los mapas (para `secondary_muscles`: mapear cada elemento del array) y `assertCompleteTranslations(ex)` que lanza `Error` enumerando TODAS las claves faltantes en una sola pasada.

4. **Fail-fast obligatorio:** el seed y `check-translation-completeness.ts` deben fallar con exit ≠ 0 listando los valores sin mapear. Nunca guardar un valor en inglés silenciosamente.

5. **Glosario ES-AR obligatorio** (el worker debe usar exactamente estos términos; las decisiones de estilo dentro de cada término quedan a criterio del worker pero consistentes):
   - Anatomía / músculos: abs→abdominales, abductors→abductores, adductors→aductores, biceps→bíceps, calves→gemelos, chest→pectorales (músculo)/pecho (parte del cuerpo), forearms→antebrazos, glutes→glúteos, hamstrings→isquiotibiales, hip flexors→flexores de cadera, lats→dorsales, lower back→lumbares, obliques→oblicuos, quadriceps→cuádriceps, quads→cuádriceps, shoulders→hombros, traps→trapecios, triceps→tríceps, upper back→espalda alta, deltoids→deltoides, ankle stabilizers→estabilizadores de tobillo, ankles→tobillos.
   - Categorías / partes del cuerpo: waist→cintura, upper legs→muslos, lower legs→pantorrillas, back→espalda, upper arms→brazos, neck→cuello, full body→cuerpo completo, cardio→cardio, strength→fuerza, stretching→estiramiento, plyometrics→pliometría, powerlifting→powerlifting.
   - Equipamiento: body weight→peso corporal, dumbbell→mancuernas, barbell→barra, cable→polea, kettlebell→kettlebell, medicine ball→balón medicinal, leverage machine→máquina de palanca, assisted→asistido, band→banda elástica, ez curl bar→barra EZ, bench→banco, stability ball→pelota de estabilidad, sled→trineo, trap bar→barra trampa, battle ropes→cuerdas batalla.
   - Términos de ejercicio (para `name`): sit-up→abdominal, crunch→crunch, push-up→flexión de brazos, pull-up→dominada, chin-up→dominada supina, squat→sentadilla, lunge→zancada, deadlift→peso muerto, bench press→press de banca, overhead press→press militar, shoulder press→press de hombros, row→remo, pulldown→jalón al pecho, fly→apertura, curl→curl, extension→extensión, raise→elevación, kickback→patada trasera, plank→plancha, burpee→burpee, mountain climber→escalador, jump→salto, swing→balanceo, press→press, leg press→prensa de piernas, calf raise→elevación de gemelos, triceps pushdown→extensión de tríceps en polea, face pull→jalón facial, farmer's walk→caminata del granjero, turkish get-up→levantamiento turco, snatch→arranque, clean→cargada, thruster→thruster, hip thrust→empuje de cadera.
   - Reglas para `name`: conservar numerales, fracciones (3/4), grados (°), siglas y nombres propios. Usar español argentino natural de gimnasio; mantener solo los extranjerismos que SON el término estándar en AR (curl, press, crunch, burpee, kettlebell, thruster, snatch, clean, powerlifting, hip thrust→empuje de cadera se prefiere español). Ejemplos esperados: "3/4 sit-up"→"Abdominal 3/4", "45° side bend"→"Flexión lateral 45°", "90/90 hamstring"→"Isquiotibial 90/90".

6. **Modificación exacta de `seed.ts`:** agregar `import { translateExercise, assertCompleteTranslations } from './translations'`; dentro del `for`, ANTES del `upsert` (línea 42): `assertCompleteTranslations(exercise)` y `const t = translateExercise(exercise)`; usar `t.` en los bloques `create` y `update` (líneas 44-72). No cambiar la lectura del JSON ni la lógica de upsert/progreso/errores.

7. **API key para smoke test:** leer de `.env` (`CATALOG_API_KEY=1234`); usar header `x-api-key`. Servidor en `http://localhost:3000`. Si el puerto está ocupado, usar `-p` alternativo y ajustar los curls. No imprimir secretos en evidencia.

8. **README:** actualizar la tabla "Query Parameters" y los ejemplos `curl`/respuesta a valores en español reales del mapeo (ej. `?category=pecho`, `?muscle_group=cuádriceps`, `equipment=mancuernas`), y aclarar que el catálogo está en español argentino.

9. **Evidencia:** guardar en `.omo/scratch/`: `unique-values.txt` (Todo 1), salidas de los scripts (T3, T6), `api-smoke-*.json` (T7).

## Todos

### Wave 1 — Mapeo de traducción

- [ ] 1. Extraer el inventario completo de valores únicos de los 7 campos traducibles desde el dataset.
  - **Referencias:** `exercises-dataset-main/data/exercises.json`; campos: `name`, `category`, `body_part`, `equipment`, `muscle_group`, `target`, `secondary_muscles` (array).
  - **Cómo:** crear `.omo/scratch/` si no existe; correr `npx tsx` con un script inline (o `node -e`) desde `exercise-catalog/` que lea el JSON y escriba `.omo/scratch/unique-values.txt` con listas ordenadas y deduplicadas por campo (para `secondary_muscles`, la unión de todos los elementos).
  - **Criterio de aceptación:** el archivo existe y contiene 7 secciones; el conteo por campo es plausible: `name` ~1000+ (≈ longitud del dataset), y los demás conjuntos chicos (category ~8-12, body_part ~8-12, equipment ~30-50, muscle_group ~25-35, target ~30-50, secondary_muscles ⊆ target/muscle_group).
  - **QA happy:** el archivo se genera y las secciones están completas (evidencia: `.omo/scratch/unique-values.txt`).
  - **QA failure:** dataset no legible o ruta equivocada → el script falla con error claro; verificar la ruta `join(process.cwd(),'..','exercises-dataset-main','data','exercises.json')`.
  - **Commit:** N/A (repo no es git).

- [ ] 2. Crear `exercise-catalog/prisma/translations.ts` con los 7 mapas tipados EN→ES-AR + `translateExercise()` + `assertCompleteTranslations()`, cubriendo TODOS los valores de `unique-values.txt`.
  - **Referencias:** `.omo/scratch/unique-values.txt` (Todo 1); glosario obligatorio de la sección "Execution strategy" punto 5; shape de `ExerciseData` en `prisma/seed.ts:7-23`.
  - **Cómo:** definir `type TranslationMap = Record<string, string>`; un mapa por campo; `translateExercise(ex)` devuelve copia con los 7 campos traducidos (`secondary_muscles` mapeado elemento a elemento); `assertCompleteTranslations(ex)` acumula y lanza `Error` con TODAS las claves faltantes. Traducir usando el glosario; las entradas restantes (los ~1000 nombres) con las reglas del glosario punto 5.
  - **Criterio de aceptación:** el archivo compila (sin errores de TS); cada valor único de `unique-values.txt` tiene entrada en su mapa; los valores traducidos usan terminología del glosario.
  - **QA happy:** `npx tsc --noEmit` (o `npm run lint`) pasa sin errores nuevos.
  - **QA failure:** falta una clave → `assertCompleteTranslations` la reporta (se valida en Todo 3; acá basta la inspección de cobertura contra `unique-values.txt`).
  - **Commit:** N/A (repo no es git).

- [ ] 3. Escribir `exercise-catalog/scripts/check-translation-completeness.ts`: re-extrae valores únicos del dataset y asserta cobertura 100% de los 7 campos contra `translations.ts`.
  - **Referencias:** `prisma/translations.ts` (Todo 2); `exercises-dataset-main/data/exercises.json`; patrón de lectura de `prisma/seed.ts:29`.
  - **Cómo:** script `npx tsx` que (1) lee el dataset, (2) extrae valores únicos por campo (misma lógica que Todo 1, independiente), (3) para cada valor verifica presencia en el mapa correspondiente, (4) imprime los faltantes y hace `process.exit(1)` si hay alguno, `process.exit(0)` si cobertura 100%.
  - **Criterio de aceptación:** el script corre y sale 0 sin faltantes.
  - **QA happy:** `npx tsx scripts/check-translation-completeness.ts` → `exit 0`, output "100% coverage" (evidencia: salida capturada en `.omo/scratch/check-completeness.log`).
  - **QA failure:** quitar temporalmente una clave de un mapa → el script la lista y sale 1 (verificar manualmente con un `console.log`, luego restaurar).
  - **Commit:** N/A (repo no es git).

### Wave 2 — Seed y re-seed

- [ ] 4. Modificar `exercise-catalog/prisma/seed.ts` para aplicar `assertCompleteTranslations` + `translateExercise` antes de cada `upsert`.
  - **Referencias:** `prisma/translations.ts` (Todo 2); `prisma/seed.ts:39-84` (bucle), `:42-73` (upsert create/update).
  - **Cómo:** agregar el import; dentro del `for`, antes del `upsert`: `assertCompleteTranslations(exercise)` y `const t = translateExercise(exercise)`; reemplazar `exercise.` por `t.` en los campos traducidos de `create` y `update`. NO tocar la lectura del JSON (`:29`), ni `id`, `image`, `gifUrl`, `media_id`, `instructions`, `instructionSteps`, ni la lógica de progreso.
  - **Criterio de aceptación:** `npx tsc --noEmit` pasa; el seed aplica traducción a los 7 campos; un valor sin mapear aborta el seed con error claro.
  - **QA happy:** revisión de diff: los 7 campos usan `t.`; nada más cambió.
  - **QA failure:** si un valor no tiene mapeo, el seed lanza el error de `assertCompleteTranslations` listándolo (se reproduce solo en el próximo re-seed si hubiera huecos; verificado por Todo 3).
  - **Commit:** N/A (repo no es git).

- [ ] 5. Re-seed de la DB: correr `npm run db:seed` y verificar importación completa sin errores.
  - **Referencias:** `.env` (DATABASE_URL/DIRECT_URL ya configurados); `package.json` script `db:seed` (`:13`); `prisma/seed.ts:86-89` (reporte final).
  - **Cómo:** desde `exercise-catalog/`, correr `npm run db:seed`. El upsert es idempotente (re-ejecutable).
  - **Criterio de aceptación:** el output final muestra `Imported: <N>` con N ≥ 1000 y `Errors: 0`.
  - **QA happy:** salida con `✅ Seeding complete!`, `Errors: 0` (evidencia: salida capturada en `.omo/scratch/seed-output.log`).
  - **QA failure:** errores de conexión (Supabase) o de traducción → investigar y reportar; verificar `.env` y conectividad; si hay errores de mapeo, completar `translations.ts` y re-correr.
  - **Commit:** N/A (repo no es git).

### Wave 3 — Verificación

- [ ] 6. Escribir `exercise-catalog/scripts/verify-translations.ts`: verifica que los valores traducidos en la DB coinciden con `translate(dataset)` por `id` para los 7 campos.
  - **Referencias:** `src/lib/prisma.ts` (instancia Prisma compartida); `prisma/translations.ts`; `exercises-dataset-main/data/exercises.json`; `.env`.
  - **Cómo:** script `npx tsx` que (1) lee el dataset y arma `Map<id, translatedRow>` con `translateExercise`, (2) consulta `prisma.exercise.findMany({ select: { id, name, category, bodyPart, equipment, muscleGroup, target, secondaryMuscles } })`, (3) compara campo a campo contra el valor esperado, (4) imprime mismatches con id+campo+esperado+real y sale 1 si hay alguno, 0 si todo coincide.
  - **Criterio de aceptación:** corre contra la DB y sale 0 (0 mismatches, todos los ids verificados).
  - **QA happy:** `npx tsx scripts/verify-translations.ts` → `exit 0`, "All <N> exercises verified" (evidencia: `.omo/scratch/verify-db.log`).
  - **QA failure:** un mismatch reporta id/campo/esperado/real (reproducible consultando la DB con `prisma.exercise.findUnique({ where: { id } })`).
  - **Commit:** N/A (repo no es git).

- [ ] 7. Smoke test de API: servidor dev + `curl` con filtros en español y por id, assertando respuestas en español.
  - **Referencias:** `src/app/api/exercises/route.ts` (filtros exactos, `:22-26`); `.env` `CATALOG_API_KEY`; `package.json` `dev` (`:6`).
  - **Cómo:** `npm run dev` en background (puerto 3000; alternativo si ocupado); esperar a que responda `GET /api/health`; luego: (a) `curl -H "x-api-key: <CATALOG_API_KEY>" "http://localhost:3000/api/exercises?muscle_group=cuádriceps&limit=3"`, (b) `curl -H "x-api-key: <CATALOG_API_KEY>" "http://localhost:3000/api/exercises?category=pecho&limit=2"`, (c) `curl -H "x-api-key: <CATALOG_API_KEY>" "http://localhost:3000/api/exercises/0001"`. Guardar respuestas en `.omo/scratch/api-smoke-*.json`. Assertar que los nombres y campos de músculo están en español (no valores del vocabulario inglés del dataset) y que el filtro español devuelve resultados (total > 0).
  - **Criterio de aceptación:** las 3 respuestas contienen valores en español; el filtro en español devuelve resultados; el JSON por id `0001` tiene `name` traducido (ej. "Abdominal 3/4").
  - **QA happy:** las respuestas guardadas muestran español (evidencia: `.omo/scratch/api-smoke-*.json`).
  - **QA failure:** filtro español devuelve 0 resultados → chequear que la DB está seedeada y que el valor del filtro coincide exactamente con un valor traducido real; 401 → chequear header `x-api-key`.
  - **Commit:** N/A (repo no es git).

### Wave 4 — Documentación

- [ ] 8. Actualizar `exercise-catalog/README.md`: query params y ejemplos a valores en español; nota de idioma del catálogo.
  - **Referencias:** `README.md` secciones "GET /api/exercises" (tabla Query Parameters, ejemplo curl, ejemplo respuesta) y "Dataset".
  - **Cómo:** reemplazar los valores de ejemplo en inglés por los valores españoles reales del mapeo (ej. `?category=pecho`, `?muscle_group=cuádriceps`, `equipment=mancuernas`); en el ejemplo de respuesta, reemplazar `"name": "3/4 sit-up"` por el nombre traducido real del ejercicio `0001`; agregar una línea en "Dataset" indicando que el catálogo está en español argentino (nombres y músculos) con instrucciones neutras del dataset.
  - **Criterio de aceptación:** no queda ningún valor de filtro/documentación en inglés; los ejemplos usan valores que existen en la DB.
  - **QA happy:** grep de `README.md` no encuentra valores del vocabulario inglés documentados como ejemplos (evidencia: salida del grep).
  - **QA failure:** un valor de ejemplo no coincide con los valores reales en DB → corregir contra el mapeo.
  - **Commit:** N/A (repo no es git).

## Final verification wave

Corre en paralelo después de completar TODOS los todos; TODOS deben APROBAR.

- [ ] F1. Auditoría de cumplimiento del plan: cada todo 1-8 verificado contra sus criterios de aceptación y evidencia en `.omo/scratch/`; sin pasos saltados.
- [ ] F2. Revisión de calidad de código: `prisma/translations.ts`, `prisma/seed.ts`, `scripts/*.ts` — tipado limpio (`npx tsc --noEmit`), sin `any`, sin cambios fuera de alcance, glosario consistente en las traducciones.
- [ ] F3. QA manual real: re-ejecutar `npm run db:seed` + `npx tsx scripts/verify-translations.ts` + smoke test API desde cero (no confiar en logs previos); confirmar `Errors: 0`, 0 mismatches y respuestas en español.
- [ ] F4. Fidelidad de alcance: verificar que NO se modificó `exercises-dataset-main/data/exercises.json`, `prisma/schema.prisma`, la estructura de respuesta de la API ni la app `FitnessAr/`; que `instructions`/`instruction_steps` no fueron tocados.

## Commit strategy

El repo **no es git** (no hay `.git`). Por lo tanto NO hay commits: cada todo lleva `Commit: N/A`. Si el usuario inicializa git en el futuro, los cambios por todo se pueden agrupar en commits temáticos (wave 1: mapeo; wave 2: seed; wave 3: verificación; wave 4: docs).

## Success criteria

1. `exercises-dataset-main/data/exercises.json` bit a bit intacto.
2. `prisma/translations.ts` cubre el 100% de los valores únicos (verificado por `check-translation-completeness.ts`, exit 0).
3. La DB contiene los 7 campos traducidos a español argentino para todos los ejercicios (verificado por `verify-translations.ts`, exit 0, 0 mismatches).
4. `GET /api/exercises` con filtros en español devuelve resultados con nombres y músculos en español; `GET /api/exercises/0001` devuelve el nombre traducido.
5. `README.md` documenta filtros en español y el idioma del catálogo.
6. `npx tsc --noEmit` pasa sin errores nuevos.
7. Los 4 verificadores finales (F1-F4) aprueban.