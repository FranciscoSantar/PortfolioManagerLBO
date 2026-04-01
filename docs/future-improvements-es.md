# Mejoras a Futuro

- Creación de roles para un panel de administración (dashboard), donde se puedan configurar los assets y la información de acciones y criptomonedas, así como eliminar usuarios. Esto implicaría la implementación de un custom guard para validar que el usuario tenga los permisos necesarios.

- Implementación de un cron job (vía [NestJS Task Scheduling](https://docs.nestjs.com/techniques/task-scheduling)) para la actualización automática y sincrónica de precios de todos los activos, sin necesidad de acceder al endpoint `GET /portfolios/{{portfolioId}}`. El enfoque actual genera desincronización entre los TTL en caché de los precios de cada activo.

- Desarrollo de un endpoint público para recibir alertas de precios desde plataformas como TradingView, que permiten enviar información vía webhooks según eventos configurados. Para esto, se implementaría un filtrado de IP (mediante un Guard), ya que TradingView proporciona las posibles direcciones IP emisoras.

- Implementación de un endpoint para que los usuarios puedan editar sus datos personales.

- Soporte para múltiples proveedores de precios como fallback en caso de fallos del proveedor principal (Coingecko, Alpha Vantage, etc.).

- Implementación de una caché de corta duración (unos pocos segundos) para los precios de los activos.

- Ampliación del número de acciones y criptomonedas disponibles.

- Mejora del sistema de autenticación, incorporando refresh tokens.

- Implementación de pipelines de CI/CD.

- Creacion de nuevas tablas para acciones y criptomonedas para almacenar mas información sobre los activos, como su sector, industria, descripción, entre otros.

- Agregar soporte de bonos

- Crear una tabla para almacenar la tasa de cambio entre moneda (USD-EUR-ARS), y así permitir que el frontend muestre los precios en la moneda que el usuario prefiera.

- Almacenar en cache las respuestas de los endpoints de la API, mejorando el rendimiento por la reduccion de consultas a la base de datos.