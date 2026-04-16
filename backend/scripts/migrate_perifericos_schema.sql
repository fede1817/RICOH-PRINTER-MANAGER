-- 1. Agregar columnas de historial a la tabla de solicitudes
ALTER TABLE perifericos_solicitudes ADD COLUMN IF NOT EXISTS modelo_periferico VARCHAR(100);
ALTER TABLE perifericos_solicitudes ADD COLUMN IF NOT EXISTS tipo_periferico VARCHAR(50);

-- 2. Poblar las nuevas columnas con los datos actuales (opcional si ya hay datos)
UPDATE perifericos_solicitudes ps
SET modelo_periferico = p.nombre,
    tipo_periferico = p.tipo
FROM perifericos p
WHERE ps.periferico_id = p.id;

-- 3. Cambiar la restricción de FK para que sea SET NULL en lugar de CASCADE
-- Primero identificamos el nombre de la restricción (por defecto suele ser perifericos_solicitudes_periferico_id_fkey)
ALTER TABLE perifericos_solicitudes DROP CONSTRAINT IF EXISTS perifericos_solicitudes_periferico_id_fkey;

-- Agregamos la nueva restricción
ALTER TABLE perifericos_solicitudes 
ADD CONSTRAINT perifericos_solicitudes_periferico_id_fkey 
FOREIGN KEY (periferico_id) REFERENCES perifericos(id) ON DELETE SET NULL;
