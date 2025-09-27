-- Migración para corregir el tipo de columna del PIN
-- La columna int_pin debe ser TEXT para almacenar el PIN encriptado

-- Primero, agregar la nueva columna str_pin como TEXT
ALTER TABLE usuario 
ADD COLUMN IF NOT EXISTS str_pin TEXT;

-- Copiar datos existentes si los hay (aunque probablemente no haya por el error)
UPDATE usuario 
SET str_pin = CAST(int_pin AS TEXT) 
WHERE int_pin IS NOT NULL;

-- Eliminar la columna antigua int_pin
ALTER TABLE usuario 
DROP COLUMN IF EXISTS int_pin;

-- Agregar índice para mejorar performance en búsquedas de PIN
CREATE INDEX IF NOT EXISTS idx_usuario_str_pin 
ON usuario (str_correo, str_pin) 
WHERE str_pin IS NOT NULL;

-- Comentario para documentación
COMMENT ON COLUMN usuario.str_pin IS 'PIN encriptado con bcrypt (texto)';

-- Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'usuario' 
AND column_name IN ('str_pin', 'dt_pin_expiracion', 'bool_pin_usado')
ORDER BY column_name;