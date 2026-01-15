# Migración: Agregar Campo Ubicación a Tabla Sensor

## Descripción
Se agrega un nuevo campo `ubicacion` a la tabla `sensor` para registrar la ubicación física del sensor.

## Valores Permitidos
- `exterior` (por defecto)
- `interior`
- `tuberia`
- `otro`

## Cómo Aplicar la Migración

### Opción 1: MySQL CLI
```bash
mysql -u root refrigeracioncyc < migrations/add_ubicacion_to_sensor.sql
```

### Opción 2: Desde phpMyAdmin
1. Abre phpMyAdmin
2. Selecciona la base de datos `refrigeracioncyc`
3. Ve a la pestaña "SQL"
4. Copia y pega el contenido de `migrations/add_ubicacion_to_sensor.sql`
5. Haz clic en "Ejecutar"

### Opción 3: Directamente en MySQL Workbench
1. Abre la conexión a la BD
2. Abre el archivo `migrations/add_ubicacion_to_sensor.sql`
3. Ejecuta la consulta

## Cambios en el Código

### Backend (APIs)
- ✅ `api/reporte_iot.php`: Ahora obtiene y almacena `ubicacion` de cada sensor
- ✅ `api/reporte.php`: Ahora obtiene y almacena `ubicacion` de cada sensor
- ✅ `models/sensor.php`: Incluye `ubicacion` al crear nuevos sensores

### Cómo Funciona
1. Cuando se envía un reporte con `codigo_sensor`, el API consulta la tabla `sensor`
2. Obtiene la `ubicacion` configurada para ese sensor
3. Automáticamente rellena el campo `ubicacion` en el reporte
4. No necesitas enviar la ubicación desde ESP32, se asigna automáticamente

## Ejemplo de Uso

### Crear un Sensor con Ubicación
```json
POST /api/sensor
{
  "codigo": "SEN001",
  "nombre": "Sensor Temperatura Cuarto 1",
  "tipo": "temperatura_humedad",
  "codigo_cuarto": "CUARTO001",
  "ubicacion": "interior"
}
```

### Enviar Reporte (ubicacion se completa automáticamente)
```json
POST /api/reporte_iot

[
  {
    "codigo_sensor": "SEN001",
    "fecha_captura": "2026-01-15 10:00:00",
    "temperatura": 23.6,
    "humedad": 50.7
  }
]
```

**Respuesta:**
```json
{
  "success": true,
  "insertados": 1,
  "resultados": [
    {
      "codigo_sensor": "SEN001",
      "success": true
    }
  ]
}
```

El reporte almacenado tendrá `ubicacion: "interior"` obtenido de la configuración del sensor.

## Rollback (Si es necesario)
```sql
ALTER TABLE sensor DROP COLUMN ubicacion;
DROP INDEX idx_sensor_ubicacion ON sensor;
```
