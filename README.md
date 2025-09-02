# 🔐 OAuth Backend - Sistema de Autenticación Multi-Proveedor

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-7+-red.svg)](https://redis.io/)
[![License](https://img.shields.io/badge/License-ISC-lightgrey.svg)](LICENSE)

Sistema backend de autenticación robusto y escalable que soporta múltiples proveedores OAuth (Google, Microsoft, GitHub, LinkedIn) junto con autenticación tradicional por email/password.

## 📋 Tabla de Contenidos

- [🚀 Características](#-características)
- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [📋 Requisitos Previos](#-requisitos-previos)
- [⚡ Inicio Rápido](#-inicio-rápido)
- [🐳 Uso con Docker](#-uso-con-docker)
- [📝 Configuración](#-configuración)
- [🔌 API Endpoints](#-api-endpoints)
- [🔧 Scripts Disponibles](#-scripts-disponibles)
- [🗄️ Base de Datos](#️-base-de-datos)
- [🔒 Seguridad](#-seguridad)
- [📊 Monitoreo](#-monitoreo)
- [🚀 Despliegue](#-despliegue)
- [🧪 Desarrollo](#-desarrollo)
- [🤝 Contribución](#-contribución)
- [📄 Licencia](#-licencia)

## 🚀 Características

### 🔐 Autenticación Multi-Proveedor
- ✅ **Google OAuth 2.0** - Autenticación con Google
- ✅ **Microsoft OAuth 2.0** - Autenticación con Microsoft/Azure AD
- ✅ **GitHub OAuth** - Autenticación con GitHub
- ✅ **LinkedIn OAuth** - Autenticación con LinkedIn
- ✅ **Autenticación Local** - Email y contraseña tradicional

### 🛡️ Seguridad Avanzada
- ✅ **JWT Tokens** - Access y Refresh tokens con RS256
- ✅ **2FA (TOTP)** - Autenticación de dos factores
- ✅ **Rate Limiting** - Protección contra ataques de fuerza bruta
- ✅ **CORS** - Configuración segura de orígenes permitidos
- ✅ **Helmet.js** - Headers de seguridad HTTP
- ✅ **XSS Protection** - Sanitización de inputs
- ✅ **Account Lockout** - Bloqueo de cuentas por intentos fallidos

### 📊 Gestión y Monitoreo
- ✅ **Auditoría Completa** - Logs detallados de todas las acciones
- ✅ **Gestión de Sesiones** - Control de sesiones activas por usuario
- ✅ **Geolocalización** - Tracking de ubicación por IP
- ✅ **Backup/Restore** - Sistema de respaldos de base de datos
- ✅ **Health Checks** - Verificación de estado de servicios
- ✅ **Logging Estructurado** - Winston con rotación automática

### 🎯 Características Adicionales
- ✅ **Verificación de Email** - Sistema de verificación por email
- ✅ **Reset de Contraseña** - Recuperación de contraseña segura
- ✅ **Gestión de Perfiles** - Actualización de información de usuario
- ✅ **API RESTful** - Endpoints bien documentados
- ✅ **Validación Joi** - Validación robusta de datos
- ✅ **Prisma ORM** - Type-safe database operations
- ✅ **Swagger Docs** - Documentación interactiva de API

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| **Runtime** | Node.js | 18+ |
| **Lenguaje** | TypeScript | 5.0+ |
| **Framework** | Express.js | 5.0+ |
| **Base de Datos** | MySQL | 8.0+ |
| **Cache** | Redis | 7+ |
| **ORM** | Prisma | 6.0+ |
| **Autenticación** | Passport.js | 0.7+ |
| **Validación** | Joi | 18+ |
| **Logging** | Winston | 3.0+ |
| **Documentación** | Swagger UI | 5.0+ |

## 📋 Requisitos Previos

### Sistema Operativo
- ✅ Linux (recomendado)
- ✅ macOS
- ✅ Windows (con WSL2)

### Software Requerido
- ✅ **Docker** 20.10+
- ✅ **Docker Compose** 2.0+
- ✅ **Make** (para usar comandos del Makefile)
- ✅ **Git** (para clonar el repositorio)

### Recursos del Sistema
- ✅ **RAM**: 2GB mínimo, 4GB recomendado
- ✅ **CPU**: 2 cores mínimo
- ✅ **Disco**: 5GB de espacio libre

## ⚡ Inicio Rápido

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd oauth-backend
```

### 2. Configurar Variables de Entorno
```bash
# Copiar template de desarrollo
cp .env.example .env

# O copiar template de producción
cp env.prod.example .env.prod
```

### 3. Iniciar con Docker (Recomendado)
```bash
# Desarrollo
make dev-up

# Producción
make prod-deploy
```

### 4. Verificar Estado
```bash
# Ver estado de servicios
make status

# Health checks
make health

# Ver logs
make logs-app
```

## 🐳 Uso con Docker

### Desarrollo

#### Iniciar Servicios
```bash
# Opción 1: Usando Makefile (recomendado)
make dev-up

# Opción 2: Usando Docker Compose directamente
docker compose up -d
```

#### Ver Logs
```bash
# Ver todos los logs
make dev-logs

# Ver logs de la aplicación
docker compose logs -f app
```

#### Acceder a Contenedores
```bash
# Shell de la aplicación
make dev-shell

# Shell de MySQL
docker compose exec mysql mysql -u root -p

# Shell de Redis
docker compose exec redis redis-cli
```

### Producción

#### Despliegue Completo
```bash
# Despliegue automatizado
make prod-deploy

# Verificar estado
make health
```

#### Gestión de Producción
```bash
# Ver logs de producción
make prod-logs

# Reiniciar servicios
make prod-restart

# Backup de base de datos
make backup-db
```

## 📝 Configuración

### Variables de Entorno

#### Archivo `.env` (Desarrollo)
```env
# Servidor
NODE_ENV=development
PORT=3001

# Base de datos
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=auth_backend

# Redis
REDIS_HOST=localhost
REDIS_PASSWORD=password

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# OAuth Providers (opcional para desarrollo)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Archivo `.env.prod` (Producción)
```env
# Copiar desde env.prod.example y configurar
cp env.prod.example .env.prod

# Generar secretos seguros
make generate-secret

# Configurar proveedores OAuth
# GOOGLE_CLIENT_ID=...
# MICROSOFT_CLIENT_ID=...
# GITHUB_CLIENT_ID=...
# LINKEDIN_CLIENT_ID=...
```

### Base de Datos

#### Configuración Inicial
```bash
# Ejecutar migraciones
make db-migrate

# Poblar con datos iniciales
make db-seed

# Ver estado de la base de datos
make db-setup
```

## 🔌 API Endpoints

### Autenticación Básica
```http
POST   /api/v1/auth/register          # Registro de usuario
POST   /api/v1/auth/login             # Inicio de sesión
POST   /api/v1/auth/logout            # Cierre de sesión
POST   /api/v1/auth/refresh           # Renovar tokens
```

### OAuth Providers
```http
GET    /api/v1/auth/google           # Iniciar OAuth Google
GET    /api/v1/auth/microsoft        # Iniciar OAuth Microsoft
GET    /api/v1/auth/github           # Iniciar OAuth GitHub
GET    /api/v1/auth/linkedin         # Iniciar OAuth LinkedIn
```

### Gestión de Usuario
```http
GET    /api/v1/user/profile          # Obtener perfil
PUT    /api/v1/user/profile          # Actualizar perfil
DELETE /api/v1/user/profile          # Eliminar cuenta
GET    /api/v1/user/sessions         # Listar sesiones
DELETE /api/v1/user/sessions/:id     # Cerrar sesión específica
```

### 2FA y Seguridad
```http
POST   /api/v1/user/enable-2fa        # Activar 2FA
POST   /api/v1/user/disable-2fa       # Desactivar 2FA
POST   /api/v1/user/verify-2fa        # Verificar código 2FA
POST   /api/v1/user/backup-codes      # Generar códigos de respaldo
```

### Sistema
```http
GET    /api/v1/health                # Health check
GET    /api/v1/version               # Versión de la API
GET    /api/docs                     # Documentación Swagger
```

## 🔧 Scripts Disponibles

### NPM Scripts
```bash
# Desarrollo
npm run dev              # Iniciar con hot reload
npm run build            # Compilar TypeScript
npm start                # Iniciar aplicación compilada

# Base de datos
npm run migrate:run      # Ejecutar migraciones
npm run seed:run         # Poblar base de datos

# Calidad de código
npm run lint             # Ejecutar linter
```

### Make Commands

#### Desarrollo
```bash
make dev-up              # Iniciar desarrollo
make dev-down            # Parar desarrollo
make dev-logs            # Ver logs desarrollo
make dev-shell           # Shell aplicación
```

#### Producción
```bash
make prod-up             # Iniciar producción
make prod-down           # Parar producción
make prod-deploy         # Despliegue completo
make prod-logs           # Ver logs producción
```

#### Base de Datos
```bash
make db-migrate          # Migraciones
make db-seed             # Datos iniciales
make db-setup            # Configuración completa
make backup-db           # Crear backup
make restore-db-file     # Restaurar backup
```

#### Utilidades
```bash
make help                # Mostrar ayuda
make show-env            # Ver variables entorno
make generate-secret     # Generar JWT secreto
make env-check           # Verificar configuración
make health              # Health checks
make status              # Estado servicios
```

## 🗄️ Base de Datos

### Esquema Principal

#### Tabla `users`
```sql
- id (UUID, Primary Key)
- email (VARCHAR, Unique)
- password_hash (VARCHAR)
- first_name, last_name (VARCHAR)
- display_name (VARCHAR)
- avatar_url (TEXT)
- phone (VARCHAR)
- email_verified (BOOLEAN)
- two_factor_enabled (BOOLEAN)
- status (ENUM: active, inactive, suspended, pending_verification)
- created_at, updated_at (TIMESTAMP)
```

#### Tabla `oauth_accounts`
```sql
- id (UUID, Primary Key)
- user_id (Foreign Key)
- provider (ENUM: google, microsoft, github, linkedin)
- provider_id (VARCHAR)
- provider_email (VARCHAR)
- access_token, refresh_token (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### Tabla `user_sessions`
```sql
- id (UUID, Primary Key)
- user_id (Foreign Key)
- session_token (VARCHAR, Unique)
- expires_at (TIMESTAMP)
- ip_address (VARCHAR)
- user_agent (TEXT)
- location (JSON)
- is_active (BOOLEAN)
```

### Migraciones
```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones
make db-migrate

# Resetear base de datos
make db-reset-confirm
```

## 🔒 Seguridad

### Medidas Implementadas

#### Autenticación
- ✅ **JWT con RS256** - Firma asimétrica para mayor seguridad
- ✅ **Refresh Tokens** - Rotación automática de tokens
- ✅ **Session Management** - Control de sesiones concurrentes
- ✅ **Account Lockout** - Bloqueo por intentos fallidos

#### Protección
- ✅ **Rate Limiting** - Límite de requests por IP/usuario
- ✅ **CORS** - Control de orígenes permitidos
- ✅ **Helmet.js** - Headers de seguridad
- ✅ **XSS Protection** - Sanitización de inputs
- ✅ **SQL Injection** - ORM con prepared statements

#### Monitoreo
- ✅ **Audit Logging** - Registro de todas las acciones
- ✅ **Geolocation** - Tracking de ubicación
- ✅ **Failed Login Attempts** - Monitoreo de intentos fallidos
- ✅ **Session Tracking** - Seguimiento de sesiones

### Mejores Prácticas Recomendadas

#### Producción
```bash
# Generar secretos seguros
make generate-secret

# Usar HTTPS siempre
# Configurar SSL certificates

# Monitorear logs regularmente
make prod-logs

# Realizar backups periódicos
make backup-db
```

## 📊 Monitoreo

### Health Checks
```bash
# Verificar estado de todos los servicios
make health

# Output esperado:
# ✅ Aplicación: OK
# ✅ MySQL: OK
# ✅ Redis: OK
```

### Logs
```bash
# Logs de aplicación
make logs-app

# Logs de base de datos
make logs-db

# Logs de Redis
make logs-redis

# Todos los logs de producción
make prod-logs
```

### Estadísticas
```bash
# Estadísticas de Docker
make stats

# Estado de servicios
make status
```

## 🚀 Despliegue

### Producción con Docker

#### 1. Preparar Entorno
```bash
# Configurar variables de producción
cp env.prod.example .env.prod
nano .env.prod

# Generar secretos seguros
make generate-secret
```

#### 2. Configurar SSL (Opcional)
```bash
# Crear directorio SSL
mkdir -p nginx/ssl

# Copiar certificados
# cp /path/to/fullchain.pem nginx/ssl/
# cp /path/to/privkey.pem nginx/ssl/
```

#### 3. Desplegar
```bash
# Despliegue completo
make prod-deploy

# Verificar funcionamiento
make health
```

### Variables Críticas de Producción

```env
# Generar con: make generate-secret
JWT_SECRET=your_strong_jwt_secret_here
JWT_REFRESH_SECRET=your_strong_refresh_secret_here

# Base de datos segura
MYSQL_PASSWORD=your_strong_db_password
REDIS_PASSWORD=your_strong_redis_password

# Configurar proveedores OAuth
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/v1/auth/google/callback

# Frontend URLs
FRONTEND_URL=https://your-frontend-domain.com
BASE_URL=https://your-backend-domain.com
```

### Escala y Alta Disponibilidad

#### Docker Swarm (Opcional)
```bash
# Inicializar swarm
docker swarm init

# Desplegar stack
docker stack deploy -c docker-compose.prod.yml oauth-backend

# Escalar servicios
docker service scale oauth-backend_app=3
```

## 🧪 Desarrollo

### Configuración Local

#### 1. Instalar Dependencias
```bash
# Instalar todas las dependencias
npm install

# Instalar dependencias de desarrollo
make deps
```

#### 2. Configurar Base de Datos
```bash
# Iniciar servicios de desarrollo
make dev-up

# Ejecutar migraciones
make db-migrate

# Poblar con datos de prueba
make db-seed
```

#### 3. Iniciar Desarrollo
```bash
# Con hot reload
npm run dev

# O usando Make
make dev
```

### Estructura del Proyecto
```
oauth-backend/
├── src/
│   ├── config/          # Configuraciones
│   ├── controllers/     # Controladores API
│   ├── middleware/      # Middlewares personalizados
│   ├── routes/         # Definición de rutas
│   ├── services/       # Lógica de negocio
│   ├── strategies/     # Estrategias Passport
│   ├── types/          # Definiciones TypeScript
│   ├── utils/          # Utilidades
│   ├── validators/     # Validadores Joi
│   └── app.ts          # Aplicación principal
├── prisma/
│   ├── schema.prisma   # Esquema base de datos
│   └── migrations/     # Migraciones
├── docker/
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
├── nginx/              # Configuración Nginx
├── backups/            # Respaldos (generados)
├── logs/              # Logs aplicación
└── dist/              # Código compilado
```

### Testing

#### Ejecutar Tests
```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests en modo watch
npm run test:watch
```

#### Linting y Formateo
```bash
# Ejecutar linter
npm run lint

# Corregir problemas automáticamente
npm run lint:fix

# Formatear código
npm run format
```

## 🤝 Contribución

### Guía para Contribuidores

1. **Fork** el proyecto
2. **Crear** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abrir** un Pull Request

### Estándares de Código

- ✅ **TypeScript** - Tipado estricto
- ✅ **ESLint** - Linting configurado
- ✅ **Prettier** - Formateo automático
- ✅ **Conventional Commits** - Commits descriptivos
- ✅ **Tests** - Cobertura mínima del 80%

### Configuración de Desarrollo

```bash
# Instalar dependencias
npm install

# Configurar hooks de pre-commit
npm run prepare

# Ejecutar linting antes de commit
npm run lint:staged
```

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

### Recursos de Ayuda

- 📖 **Documentación**: [Wiki del Proyecto](wiki)
- 🐛 **Reportar Issues**: [GitHub Issues](issues)
- 💬 **Discusiones**: [GitHub Discussions](discussions)
- 📧 **Email**: support@oauth-backend.com

### Comunidad

- ⭐ **Star** el proyecto si te gusta
- 🍴 **Fork** para contribuir
- 📣 **Compartir** con la comunidad

---

## 🎯 Resumen Ejecutivo

**OAuth Backend** es un sistema de autenticación moderno y robusto que ofrece:

- 🔐 **Múltiples proveedores OAuth** (Google, Microsoft, GitHub, LinkedIn)
- 🛡️ **Seguridad de nivel empresarial** con JWT, 2FA, y rate limiting
- 📊 **Monitoreo completo** con logs de auditoría y health checks
- 🐳 **Despliegue con Docker** para desarrollo y producción
- 🔧 **Makefile completo** para automatización de tareas
- 📚 **Documentación completa** con ejemplos de uso

**¡Listo para usar en producción!** 🚀

---

**Versión**: 1.0.0  
**Última actualización**: $(date +%Y-%m-%d)  
**Autor**: Equipo de Desarrollo OAuth Backend
