class CacheService {
  constructor() {
    // Almacenamiento en memoria (en producción usar Redis)
    this.cache = new Map();
    // Tiempo de expiración: 15 minutos
    this.TTL = 15 * 60 * 1000; // 15 minutos en milisegundos
  }

  /**
   * Guarda datos temporalmente con un TTL
   * @param {string} key - Clave única (email del usuario)
   * @param {object} data - Datos a almacenar temporalmente
   */
  set(key, data) {
    const expirationTime = Date.now() + this.TTL;
    this.cache.set(key, {
      data,
      expiresAt: expirationTime,
    });

    // Auto-limpiar cuando expire
    setTimeout(() => {
      this.delete(key);
    }, this.TTL);

    console.log(`Cache set para ${key}, expira en ${this.TTL / 60000} minutos`);
  }

  /**
   * Obtiene datos del cache si no han expirado
   * @param {string} key - Clave única
   * @returns {object|null} - Datos almacenados o null si no existe/expiró
   */
  get(key) {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() > cached.expiresAt) {
      this.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Elimina una entrada del cache
   * @param {string} key - Clave a eliminar
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`Cache eliminado para ${key}`);
    }
    return deleted;
  }

  /**
   * Limpia entradas expiradas manualmente
   */
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.delete(key);
      }
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Singleton para usar en toda la aplicación
const cacheService = new CacheService();

// Limpiar cache expirado cada 5 minutos
setInterval(() => {
  cacheService.cleanup();
}, 5 * 60 * 1000);

module.exports = cacheService;
