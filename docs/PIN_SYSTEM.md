# 🔐 Sistema de PIN de Un Solo Uso - PAWS Backend

## 📋 Descripción General

El Sistema de PIN de Un Solo Uso permite a los usuarios generar y usar PINs temporales encriptados para acceso seguro offline. Cada PIN:

- ⏱️ **Duración**: 15 días desde la creación
- 🔒 **Uso único**: Se elimina automáticamente después de usarse
- 🛡️ **Encriptación**: bcrypt + salt + JWT_SECRET para máxima seguridad
- 📱 **Offline**: Soporta almacenamiento seguro local (IndexedDB/SecureStorage)
- 🔑 **Autorización**: Requiere código OTP para configurar

## 🏗️ Arquitectura

### Servicios

- **`PinService`**: Lógica de negocio, encriptación y generación
- **`PinCleanupJob`**: Job automático de limpieza (cada 6 horas)

### Modelo de Datos

- **Tabla**: `usuario` (campos existentes + nuevos campos PIN)
- **Campos nuevos**:
  - `dt_pin_expiracion`: Fecha de expiración
  - `bool_pin_usado`: Marca de uso único

### Validadores

- **`pin_validator.js`**: Schemas Joi para todos los endpoints

## 🚀 Endpoints API

### 1. Configurar PIN

```http
POST /usuarios/configurar-pin
Content-Type: application/json

{
  "str_correo": "usuario@ejemplo.com",
  "codigo_otp": "123456"
}
```

**Respuesta exitosa (201)**:

```json
{
  "mensaje": "PIN configurado exitosamente",
  "pin": {
    "codigo": "987654",
    "expira_en": "15 días",
    "fecha_expiracion": "2025-10-11T10:30:00.000Z",
    "uso_unico": true
  },
  "almacenamiento_offline": {
    "datos": {
      "encrypted_data": "...",
      "iv": "...",
      "token": "..."
    },
    "instrucciones": [...]
  },
  "advertencias": [...]
}
```

### 2. Usar PIN

```http
POST /usuarios/usar-pin
Content-Type: application/json

{
  "str_correo": "usuario@ejemplo.com",
  "pin": "987654"
}
```

**Respuesta exitosa (200)**:

```json
{
  "mensaje": "PIN usado exitosamente",
  "acceso": {
    "autorizado": true,
    "token_temporal": "eyJhbGciOiJIUzI1NiIs...",
    "valido_por": "1 hora",
    "usuario": {
      "correo": "usuario@ejemplo.com",
      "nombre": "Juan Pérez",
      "ultimo_acceso": "2025-09-26T15:30:00.000Z"
    }
  },
  "estado_pin": {   
    "usado": true,
    "disponible": false,
    "mensaje": "El PIN ha sido consumido y ya no está disponible"
  }
}
```

### 3. Obtener Estado del PIN

```http
GET /usuarios/estado-pin/usuario@ejemplo.com
```

**Respuesta exitosa (200)**:

```json
{
  "estado_pin": {
    "correo": "usuario@ejemplo.com",
    "estado": "activo",
    "mensaje": "Tienes un PIN activo disponible",
    "expira_en": "12 días",
    "fecha_expiracion": "2025-10-11T10:30:00.000Z",
    "acciones_disponibles": ["Usar PIN"],
    "ultimo_acceso": "2025-09-26T15:30:00.000Z"
  },
  "configuracion": {
    "duracion_dias": 15,
    "uso_unico": true,
    "requiere_otp": true
  }
}
```

## 🔐 Estados del PIN

| Estado           | Descripción              | Acciones Disponibles |
| ---------------- | ------------------------ | -------------------- |
| `sin_configurar` | No tiene PIN             | Configurar nuevo PIN |
| `activo`         | PIN disponible para usar | Usar PIN             |
| `usado`          | PIN ya fue consumido     | Configurar nuevo PIN |
| `expirado`       | PIN venció (15 días)     | Configurar nuevo PIN |
| `desactivado`    | PIN deshabilitado        | Configurar nuevo PIN |

## 🛡️ Seguridad

### Encriptación

```javascript
// PIN se encripta con:
bcrypt.hash(pin + JWT_SECRET, (saltRounds = 12));
```

### Almacenamiento Offline

```javascript
// Datos encriptados para almacenamiento local:
{
  "encrypted_data": "datos_encriptados_aes256",
  "iv": "vector_inicializacion",
  "token": "hash_sha256_unico"
}
```

### Validaciones

- ✅ Usuario debe estar activo
- ✅ Usuario debe tener OTP configurado
- ✅ Verificación OTP obligatoria para configurar PIN
- ✅ Validación formato PIN (6 dígitos)
- ✅ Validación email formato correcto
- ✅ Un solo PIN activo por usuario

## 🤖 Job de Limpieza Automática

### Programación

- **Diario**: 2:00 AM (América/México)
- **Frecuente**: Cada 6 horas
- **Manual**: Disponible para administradores

### Funciones

- Limpia PINs expirados
- Limpia PINs usados (después de 30 días)
- Actualiza estadísticas
- Log detallado de operaciones

### Monitoreo

```javascript
// Obtener estadísticas del job
const stats = pinCleanupJob.getEstadisticas();
```

## 📱 Implementación Frontend

### Almacenamiento Seguro

```javascript
// Guardar datos offline (React Native)
import { SecureStorage } from "react-native-secure-storage";

await SecureStorage.setItem("pin_data", JSON.stringify(datos_offline));
```

```javascript
// Guardar datos offline (Web)
// IndexedDB con encriptación adicional
const request = indexedDB.open("PawsSecureDB", 1);
```

### Uso del PIN

```javascript
// Verificar PIN offline primero, luego online
const verificarPin = async (pin) => {
  try {
    // 1. Verificar contra datos offline
    const datosOffline = await SecureStorage.getItem("pin_data");
    if (datosOffline && verificarOffline(pin, datosOffline)) {
      // 2. Enviar a servidor para marcar como usado
      const response = await api.post("/usuarios/usar-pin", {
        str_correo: email,
        pin: pin,
      });

      // 3. Eliminar datos offline después del uso
      await SecureStorage.removeItem("pin_data");

      return response.data;
    }
  } catch (error) {
    console.error("Error al usar PIN:", error);
  }
};
```

## 🚀 Despliegue

### Variables de Entorno Requeridas

```env
JWT_SECRET=tu_clave_secreta_super_segura
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
```

### Configuración Base de Datos

```sql
-- Ejecutar migración
\i migrations/add_pin_fields.sql
```

### Inicio del Servidor

```bash
npm start
# El job de limpieza se inicia automáticamente
```

## 📊 Monitoreo y Estadísticas

### Endpoints de Admin (Futuro)

- `GET /admin/pin-stats` - Estadísticas generales
- `POST /admin/pin-cleanup` - Limpieza manual
- `GET /admin/pin-job-status` - Estado del job

### Logs

- ✅ Creación de PINs
- ✅ Uso de PINs
- ✅ Limpieza automática
- ✅ Errores y excepciones

## 🧪 Testing

### Casos de Prueba

1. **Configurar PIN**
   - Usuario válido con OTP
   - Usuario sin OTP
   - PIN ya existente
2. **Usar PIN**
   - PIN válido
   - PIN incorrecto
   - PIN expirado
   - PIN ya usado
3. **Estado PIN**
   - Todos los estados posibles
   - Usuario inexistente

### Comandos

```bash
npm test # Ejecutar tests unitarios
npm run test:integration # Tests de integración
```

## 📖 Documentación API

- **Swagger**: `http://localhost:3000/docs`
- **Colección Postman**: Disponible en `/docs/postman/`

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

---

**Desarrollado con ❤️ para PAWS Backend**  
**Versión**: 1.0.0  
**Licencia**: MIT
