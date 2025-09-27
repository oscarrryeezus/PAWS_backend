-- Migración para agregar campos relacionados con PIN
-- Ejecutar en PostgreSQL

-- Agregar columnas para PIN de un solo uso
ALTER TABLE usuario 
ADD COLUMN IF NOT EXISTS dt_pin_expiracion TIMESTAMP,
ADD COLUMN IF NOT EXISTS bool_pin_usado BOOLEAN DEFAULT FALSE;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_usuario_pin_estado 
ON usuario (str_correo, bool_pin, dt_pin_expiracion, bool_pin_usado);

CREATE INDEX IF NOT EXISTS idx_usuario_pin_expiracion 
ON usuario (dt_pin_expiracion) 
WHERE dt_pin_expiracion IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN usuario.dt_pin_expiracion IS 'Fecha de expiración del PIN (15 días desde creación)';
COMMENT ON COLUMN usuario.bool_pin_usado IS 'Marca si el PIN ya fue usado (un solo uso)';

-- Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'usuario' 
AND column_name IN ('dt_pin_expiracion', 'bool_pin_usado')
ORDER BY column_name;