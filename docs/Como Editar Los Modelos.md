## 🔄 Flujo de Trabajo para Editar Modelos

### 1. Editar el Esquema

Modifica el archivo donde se definen los modelos.

* **Ruta:** `packages/server/prisma/schema.prisma`

### 2. Generar y Aplicar la Migración

Este paso convierte tus cambios de Prisma en SQL y los aplica a la base de datos local.

1. Abre la terminal en la carpeta del servidor:
```bash
cd packages/server
```


2. Ejecuta el comando de migración (asigna un nombre descriptivo al cambio):
```bash
npx prisma migrate dev --name descripcion_del_cambio
```


*Ejemplo: `npx prisma migrate dev --name agregar_tabla_productos*`

### 3. Verificar (Opcional)

Para inspeccionar visualmente los datos y las tablas creadas:

```bash
npx prisma studio

```

---

## ⚠️ Solución de Problemas de Conexión

Si tienes errores al conectar, verifica qué entorno estás usando:

1. **Desde tu Terminal (Migraciones/Studio):**
Estás fuera de Docker, por lo que debes usar el puerto externo **3307**.
* Archivo: `packages/server/.env`
* Valor: `DATABASE_URL="mysql://user:password@localhost:3307/king_and_peasant"`


2. **Desde la Aplicación (Corriendo con Docker):**
El servidor corre dentro de la red de Docker y usa el puerto interno **3306**.
* Archivo: `docker-compose.yml` (Sección `server`)
* Valor: `DATABASE_URL=mysql://user:password@mariadb:3306/king_and_peasant`



```

```