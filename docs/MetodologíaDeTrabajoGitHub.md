### 1. **Política de ramas**
Se establecen las siguientes ramas:

- **main**: rama donde se espera que haya una versión del juego sin errores y lo más estable posible.
- **trunk**: los cambios pasan a esta rama antes de llegar a la rama main.
- **feature**: se creará una rama feature por cada issue o sub issue. Se nombrará de la siguiente forma: feature/task X, siendo X el identificador de la issue relacionada.
- **bugfix**: se creará una rama bugfix por cada error a solucionar. Se nombrará de la siguiente forma: bugfix/task Y. Siendo Y el identificador de la issue relacionada con el error a corregir.

Se han definido las siguientes posibilidades de merge entre ramas:
- **Merge de trunk a main**
- **Merge de feature a trunk** cuando la issue relacionada a la rama feature esté completada (que funcione).
- **Merge de bugfix a trunk**: cuando la issue de error relacionada a la rama bugfix esté solucionada.
En el caso de las ramas feature y bugfix, una vez realizado el merge, esta se destruirá. En caso de necesidad de cambio a posteriori, se creará una rama nueva.

### 2. **Lógica de Issues**
Se creará una **Issue** por cada tarea a realizar en un sprint definida antes en el sprint planning de este. Estas tendrán una etiqueta asociada en función del tipo de tarea, además contarán con una descripción.
Las issues aparecerán en el tablero Project donde se gestionarán sus distintos estados(A realizar, En desarrollo , Hecha)

### 3. **Política de Commits** 
Para redactar los mensajes de commit nos regimos por la estructura de **Conventional Commits**.
En el título de cada commit, se mencionan los cambios que se están realizando. Opcionalmente, contará con una descripción más detallada que explique un poco estos cambios.

- **¿Cuándo se hace un commit?**
Dentro de cada rama de funcionalidad, se realizará un commit por cada sesión de trabajo, aunque el código tenga errores.