# Decisiones tomadas durante el desarrollo

- Decidí utilizar un sistema de base de datos relacional, ya que existen relaciones entre los portafolios, assets, activos de portafolio y transacciones que son fácilmente representables en un motor de base de datos relacional. Mi elección fue `Postgres`, ya que cuento con experiencia previa en esta tecnología.

- Opté por la implementación de caché para el almacenamiento de los precios de activos, para evitar múltiples llamadas al sistema proveedor de precios. Para esto, `Redis` fue la opción elegida, ya que contaba con experiencia previa y considero que es la opción más popular para este caso de uso.

- Decidí crear la tabla `AssetTypes` para que sea muy fácil, en un futuro, agregar un nuevo tipo de activo para que los usuarios puedan operar.

- A nivel de arquitectura y estructura de carpetas, decidí seguir la estructura recomendada por NestJS: `Module-Controller-Service`, y trabajar con inyección de dependencias.

- Elegí `Yahoo Finance` como fuente de precios de activos, ya que contiene información sobre acciones y criptomonedas, evitando la necesidad de trabajar con dos fuentes de información.

- El tiempo de caché de cada precio es de 5 minutos. Esto fue determinado para no superar un posible rate limiting por parte de Yahoo Finance.

- Para agregar un asset (acción o criptomoneda) a un portafolio, se valida que se haga una transacción del tipo `BUY`.

- Se soportan 2 tipos de comisiones por cada transacción:
  - `FIXED`: un valor fijo en USD, independientemente de la cantidad que se opera.
  - `PERCENTAGE`: un valor proporcional al valor de la operación.

- Para las transacciones de compra, se tiene en cuenta el valor de la comisión (si es que se incluyó información sobre la misma) y se considera al momento de calcular el precio promedio de compra del activo, para obtener un comportamiento más realista teniendo en cuenta la presencia de comisiones.

- La generación de los reportes se realiza en formato `.xlsx`, y se tienen las siguientes hojas:
  - Resumen del portafolio.
  - Resumen de cada activo del portafolio.
  - Una hoja por activo; aquí se listan todas las transacciones del mismo.
