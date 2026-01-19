# 👑 King and Peasant - Web Adaptation

> **Trabajo de Fin de Grado (TFG)**
> Adaptación del juego de mesa "King and Peasant" a una aplicación web moderna utilizando arquitectura MVC.

![Estado del Proyecto](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED)

## 📋 Descripción del Proyecto

Este proyecto consiste en la digitalización del juego de mesa asimétrico **King and Peasant**. El objetivo es trasladar la experiencia física a un entorno web, permitiendo partidas multijugador a través del navegador.

El desarrollo se ha realizado siguiendo el **patrón de arquitectura Modelo-Vista-Controlador (MVC)** para asegurar un código desacoplado, mantenible y escalable.

---

## 🛠️ Instalación y Despliegue

### Requisitos Previos
* [Docker Engine](https://docs.docker.com/engine/install/) y Docker Compose (Plugin V2).
* Git.

### Pasos para ejecutar el proyecto

1.  **Clonar el repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd KingAndPeasant
    ```

2.  **Cambiar a la rama de desarrollo (`trunk`):**
    ```bash
    git checkout trunk
    ```

3.  **Levantar la aplicación con Docker:**
    Hemos simplificado el despliegue a través de scripts de NPM que utilizan Docker Compose por debajo.
    
    ```bash
    npm run docker
    ```
    
    > Este comando compilará las imágenes del cliente y el servidor y levantará los contenedores necesarios.

4.  **Acceder a la aplicación:**
    Una vez finalice la construcción, abre tu navegador en:
    * `http://localhost:3000` (o el puerto que hayas configurado).

---

## 📂 Estructura del Proyecto

```text
KingAndPeasant/
├── client/          # La VISTA (Frontend)
├── server/          # El CONTROLADOR y MODELO (Backend/API)
├── docker-compose.yml
├── package.json     # Scripts de automatización
└── README.md
