\# Plant-Core 🌱



Plant-Core es un sistema informático diseñado para la gestión de inventario y el control del movimiento de plantas en viveros. 



\## Arquitectura y Tecnologías

El proyecto implementa una arquitectura MVC, separando la lógica de negocio, la persistencia de datos y las interfaces de usuario.



\*   \*\*Backend:\*\* Spring Boot (Java) con Spring Data JPA

\*   \*\*Frontend:\*\* React (configurado mediante Vite)

\*   \*\*Base de Datos:\*\* SQLite

\*   \*\*Gestores de paquetes:\*\* Maven (Backend) / npm (Frontend)



\## Estructura del Directorio

El sistema está configurado para acceder a una base de datos y archivos multimedia de forma local en un nivel superior al código fuente, lo que permite mantener los datos persistentes independientemente de las actualizaciones del código.



```text

/

├── plant-core/         # Código fuente del Backend (API y Controladores)

├── front-vistas/       # Código fuente del Frontend (Vistas de React)

└── recursos/           # Almacenamiento externo local

&#x20;   ├── fotos/          # Imágenes de las plantas servidas por Spring

&#x20;   └── caposa.db       # Archivo físico de la base de datos SQLite

