# ===============================
# MAKEFILE PARA OAUTH BACKEND
# ===============================

# Variables
PROJECT_NAME = oauth-backend
DOCKER_COMPOSE_DEV = docker-compose.yml
DOCKER_COMPOSE_PROD = docker-compose.prod.yml
ENV_PROD = .env.prod
ENV_DEV = .env

# Colores para output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m

# Función para imprimir mensajes
define print_message
	@echo -e "$(GREEN)[INFO]$(NC) $1"
endef

define print_warning
	@echo -e "$(YELLOW)[WARNING]$(NC) $1"
endef

define print_error
	@echo -e "$(RED)[ERROR]$(NC) $1"
endef

define print_step
	@echo -e "$(BLUE)[STEP]$(NC) $1"
endef

# Variables de entorno leídas dinámicamente
PORT_VAL = $(shell grep "^PORT=" .env.prod 2>/dev/null | sed 's/^PORT=//' | tr -d '\r' || echo "3001")
MYSQL_USER_VAL = $(shell grep "^MYSQL_USER=" .env.prod 2>/dev/null | sed 's/^MYSQL_USER=//' | tr -d '\r' || echo "root")
MYSQL_PASSWORD_VAL = $(shell grep "^MYSQL_PASSWORD=" .env.prod 2>/dev/null | sed 's/^MYSQL_PASSWORD=//' | tr -d '\r' || echo "")
MYSQL_DATABASE_VAL = $(shell grep "^MYSQL_DATABASE=" .env.prod 2>/dev/null | sed 's/^MYSQL_DATABASE=//' | tr -d '\r' || echo "auth_backend")
REDIS_PASSWORD_VAL = $(shell grep "^REDIS_PASSWORD=" .env.prod 2>/dev/null | sed 's/^REDIS_PASSWORD=//' | tr -d '\r' || echo "")

# Comandos por defecto
.PHONY: help
help: ## Mostrar esta ayuda
	@echo -e "$(BLUE)========================================$(NC)"
	@echo -e "$(BLUE)🔐 COMANDOS OAUTH BACKEND DISPONIBLES$(NC)"
	@echo -e "$(BLUE)========================================$(NC)"
	@echo
	@echo -e "$(GREEN)DESARROLLO:$(NC)"
	@echo "  make dev-build     - Construir imagen de desarrollo"
	@echo "  make dev-up        - Iniciar servicios de desarrollo"
	@echo "  make dev-down      - Parar servicios de desarrollo"
	@echo "  make dev-logs      - Ver logs de desarrollo"
	@echo "  make dev-restart   - Reiniciar servicios de desarrollo"
	@echo "  make dev-shell     - Acceder al shell del contenedor app (desarrollo)"
	@echo
	@echo -e "$(GREEN)PRODUCCIÓN:$(NC)"
	@echo "  make prod-build    - Construir imagen de producción"
	@echo "  make prod-up       - Iniciar servicios de producción"
	@echo "  make prod-down     - Parar servicios de producción"
	@echo "  make prod-logs     - Ver logs de producción"
	@echo "  make prod-restart  - Reiniciar servicios de producción"
	@echo "  make prod-deploy   - Despliegue completo a producción"
	@echo "  make prod-shell    - Acceder al shell del contenedor app (producción)"
	@echo
	@echo -e "$(GREEN)MONITOREO:$(NC)"
	@echo "  make status        - Estado de todos los servicios"
	@echo "  make health        - Health check de servicios"
	@echo "  make stats         - Estadísticas de Docker"
	@echo "  make logs-app      - Logs de la aplicación"
	@echo "  make logs-db       - Logs de MySQL"
	@echo "  make logs-redis    - Logs de Redis"
	@echo
	@echo -e "$(GREEN)MANTENIMIENTO:$(NC)"
	@echo "  make clean         - Limpiar contenedores e imágenes"
	@echo "  make clean-all     - Limpiar todo (requiere confirmación)"
	@echo "  make clean-all-confirm - Limpiar todo (contenedores, imágenes, volúmenes no utilizados)"
	@echo "  make clean-project-volumes - Eliminar volúmenes del proyecto (requiere confirmación)"
	@echo "  make clean-project-volumes-confirm - Eliminar volúmenes del proyecto (confirmado)"
	@echo "  make prune         - Limpiar recursos no utilizados"
	@echo "  make backup-db     - Backup de base de datos MySQL"
	@echo "  make restore-db    - Restaurar desde backup (requiere parámetro)"
	@echo "  make restore-db-file - Restaurar desde backup específico"
	@echo
	@echo -e "$(GREEN)UTILIDADES:$(NC)"
	@echo "  make shell         - Acceder al shell del contenedor app"
	@echo "  make db-shell      - Acceder al shell de MySQL"
	@echo "  make redis-shell   - Acceder al shell de Redis"
	@echo "  make env-check     - Verificar variables de entorno"
	@echo "  make show-env      - Mostrar variables de entorno actuales"
	@echo "  make generate-secret - Generar secreto JWT seguro"
	@echo
	@echo -e "$(GREEN)BASE DE DATOS:$(NC)"
	@echo "  make db-migrate    - Ejecutar migraciones de base de datos"
	@echo "  make db-generate   - Generar cliente Prisma"
	@echo "  make db-seed       - Poblar base de datos con datos iniciales"
	@echo "  make db-reset      - Resetear base de datos (requiere confirmación)"
	@echo "  make db-reset-confirm - Resetear base de datos (confirmado)"
	@echo "  make db-setup      - Configuración completa de base de datos"
	@echo
	@echo -e "$(GREEN)NPM SCRIPTS:$(NC)"
	@echo "  make install       - Instalar dependencias"
	@echo "  make build         - Construir aplicación"
	@echo "  make start         - Iniciar aplicación"
	@echo "  make dev           - Iniciar desarrollo con hot reload"
	@echo "  make test          - Ejecutar tests"
	@echo "  make lint          - Ejecutar linter"
	@echo

# ===============================
# DESARROLLO
# ===============================

.PHONY: dev-build
dev-build: ## Construir imagen de desarrollo
	$(call print_step,"🔨 Construyendo imagen de desarrollo...")
	@docker compose -f $(DOCKER_COMPOSE_DEV) build
	$(call print_message,"✅ Imagen de desarrollo construida")

.PHONY: dev-up
dev-up: ## Iniciar servicios de desarrollo
	$(call print_step,"🚀 Iniciando servicios de desarrollo...")
	@docker compose -f $(DOCKER_COMPOSE_DEV) up -d
	$(call print_message,"✅ Servicios de desarrollo iniciados")

.PHONY: dev-down
dev-down: ## Parar servicios de desarrollo
	$(call print_step,"🛑 Parando servicios de desarrollo...")
	@docker compose -f $(DOCKER_COMPOSE_DEV) down
	$(call print_message,"✅ Servicios de desarrollo detenidos")

.PHONY: dev-logs
dev-logs: ## Ver logs de desarrollo
	$(call print_step,"📋 Mostrando logs de desarrollo...")
	@docker compose -f $(DOCKER_COMPOSE_DEV) logs -f

.PHONY: dev-restart
dev-restart: ## Reiniciar servicios de desarrollo
	$(call print_step,"🔄 Reiniciando servicios de desarrollo...")
	@docker compose -f $(DOCKER_COMPOSE_DEV) restart
	$(call print_message,"✅ Servicios de desarrollo reiniciados")

.PHONY: dev-shell
dev-shell: ## Acceder al shell del contenedor app (desarrollo)
	$(call print_step,"🐚 Accediendo al shell del contenedor app (desarrollo)...")
	@docker compose -f $(DOCKER_COMPOSE_DEV) exec app sh

# ===============================
# PRODUCCIÓN
# ===============================

.PHONY: prod-build
prod-build: check-env-prod ## Construir imagen de producción
	$(call print_step,"🔨 Construyendo imagen de producción...")
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) build --no-cache
	$(call print_message,"✅ Imagen de producción construida")

.PHONY: prod-up
prod-up: check-env-prod ## Iniciar servicios de producción
	$(call print_step,"🚀 Iniciando servicios de producción...")
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) up -d
	$(call print_message,"✅ Servicios de producción iniciados")

.PHONY: prod-down
prod-down: ## Parar servicios de producción
	$(call print_step,"🛑 Parando servicios de producción...")
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) down; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) down; \
	fi
	$(call print_message,"✅ Servicios de producción detenidos")

.PHONY: prod-logs
prod-logs: ## Ver logs de producción
	$(call print_step,"📋 Mostrando logs de producción...")
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) logs -f; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) logs -f; \
	fi

.PHONY: prod-restart
prod-restart: ## Reiniciar servicios de producción
	$(call print_step,"🔄 Reiniciando servicios de producción...")
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) restart; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) restart; \
	fi
	$(call print_message,"✅ Servicios de producción reiniciados")

.PHONY: prod-deploy
prod-deploy: check-env-prod ## Despliegue completo a producción
	$(call print_step,"🚀 Iniciando despliegue completo a producción...")
	@$(MAKE) prod-build
	@$(MAKE) prod-down
	@$(MAKE) prod-up
	@echo "⏳ Esperando a que los servicios estén listos..."
	@sleep 30
	@$(MAKE) health
	$(call print_message,"✅ Despliegue completado")
	@echo "🌐 Endpoints disponibles:"
	@echo "  • Health Check: http://localhost:3001/api/v1/health"
	@echo "  • API Version: http://localhost:3001/api/v1/version"

.PHONY: prod-shell
prod-shell: ## Acceder al shell del contenedor app (producción)
	$(call print_step,"🐚 Accediendo al shell del contenedor app (producción)...")
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec app sh; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) exec app sh; \
	fi

# ===============================
# MONITOREO
# ===============================

.PHONY: status
status: ## Estado de todos los servicios
	$(call print_step,"📊 Estado de servicios...")
	@echo "=========================================="
	@echo "🐳 SERVICIOS DE DESARROLLO:"
	@docker compose -f $(DOCKER_COMPOSE_DEV) ps 2>/dev/null || echo "No hay servicios de desarrollo activos"
	@echo
	@echo "🚀 SERVICIOS DE PRODUCCIÓN:"
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) ps; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) ps; \
	fi
	@echo "=========================================="

.PHONY: health
health: ## Health check de servicios
	$(call print_step,"🏥 Health check de servicios...")
	@echo "=========================================="
	@echo "🔍 VERIFICANDO SERVICIOS DE PRODUCCIÓN:"
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"; \
	fi
	@echo
	@echo "🌐 HEALTH CHECKS:"
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec -T app curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1 && echo "✅ Aplicación: OK" || echo "❌ Aplicación: FAILED"; \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec -T mysql mysqladmin ping -h localhost > /dev/null 2>&1 && echo "✅ MySQL: OK" || echo "❌ MySQL: FAILED"; \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec -T redis redis-cli ping > /dev/null 2>&1 && echo "✅ Redis: OK" || echo "❌ Redis: FAILED"; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) exec -T app curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1 && echo "✅ Aplicación: OK" || echo "❌ Aplicación: FAILED"; \
		docker compose -f $(DOCKER_COMPOSE_PROD) exec -T mysql mysqladmin ping -h localhost > /dev/null 2>&1 && echo "✅ MySQL: OK" || echo "❌ MySQL: FAILED"; \
		docker compose -f $(DOCKER_COMPOSE_PROD) exec -T redis redis-cli ping > /dev/null 2>&1 && echo "✅ Redis: OK" || echo "❌ Redis: FAILED"; \
	fi
	@echo "=========================================="

.PHONY: stats
stats: ## Estadísticas de Docker
	$(call print_step,"📊 Estadísticas de Docker...")
	@echo "=========================================="
	@echo "💾 USO DE RECURSOS:"
	@docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" 2>/dev/null || echo "No hay contenedores activos"
	@echo
	@echo "📁 VOLÚMENES:"
	@docker volume ls --format "table {{.Name}}\t{{.Driver}}\t{{.Size}}"
	@echo
	@echo "🌐 REDES:"
	@docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
	@echo "=========================================="

.PHONY: logs-app
logs-app: ## Logs de la aplicación
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) logs -f app; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) logs -f app; \
	fi

.PHONY: logs-db
logs-db: ## Logs de MySQL
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) logs -f mysql; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) logs -f mysql; \
	fi

.PHONY: logs-redis
logs-redis: ## Logs de Redis
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) logs -f redis; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) logs -f redis; \
	fi

# ===============================
# MANTENIMIENTO
# ===============================

.PHONY: clean
clean: ## Limpiar contenedores e imágenes
	$(call print_step,"🧹 Limpiando contenedores e imágenes...")
	@docker compose -f $(DOCKER_COMPOSE_DEV) down 2>/dev/null || true
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) down 2>/dev/null || true; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) down 2>/dev/null || true; \
	fi
	@docker system prune -f
	@docker image prune -f
	$(call print_message,"✅ Limpieza completada")

.PHONY: clean-all
clean-all: ## Limpiar todo (contenedores, imágenes, volúmenes)
	$(call print_warning,"⚠️ Esto eliminará TODOS los datos.")
	$(call print_warning,'⚠️ Para confirmar, ejecuta: make clean-all-confirm')
	@echo "❌ Operación cancelada por seguridad"
	@echo "💡 Usa 'make clean-all-confirm' para ejecutar la limpieza completa"

.PHONY: clean-all-confirm
clean-all-confirm: ## Limpiar todo (contenedores, imágenes, volúmenes no utilizados)
	$(call print_warning,"⚠️ Ejecutando limpieza completa...")
	@$(MAKE) clean
	@docker volume prune -f
	@docker network prune -f
	@docker system prune -f --volumes
	$(call print_message,"✅ Limpieza completa realizada")

.PHONY: clean-project-volumes
clean-project-volumes: ## Eliminar solo volúmenes del proyecto actual
	$(call print_warning,"⚠️ Eliminando volúmenes del proyecto: $(PROJECT_NAME)")
	$(call print_warning,'⚠️ Para confirmar, ejecuta: make clean-project-volumes-confirm')
	@echo "❌ Operación cancelada por seguridad"
	@echo "💡 Usa 'make clean-project-volumes-confirm' para ejecutar la eliminación"

.PHONY: clean-project-volumes-confirm
clean-project-volumes-confirm: ## Eliminar solo volúmenes del proyecto actual (confirmado)
	$(call print_warning,"⚠️ Eliminando volúmenes del proyecto: $(PROJECT_NAME)")
	@$(MAKE) clean
	@docker volume ls -q | grep "$(PROJECT_NAME)" | xargs -r docker volume rm -f
	@docker network prune -f
	$(call print_message,"✅ Volúmenes del proyecto eliminados")

.PHONY: prune
prune: ## Limpiar recursos no utilizados
	$(call print_step,"🧹 Limpiando recursos no utilizados...")
	@docker system prune -f --volumes
	@docker image prune -f
	@docker volume prune -f
	@docker network prune -f
	$(call print_message,"✅ Limpieza de recursos completada")

.PHONY: backup-db
backup-db: ## Backup de base de datos MySQL
	$(call print_step,"🗄️ Creando backup de base de datos...")
	@mkdir -p backups
	@MYSQL_USER=$(MYSQL_USER_VAL); \
	MYSQL_PASSWORD=$(MYSQL_PASSWORD_VAL); \
	MYSQL_DATABASE=$(MYSQL_DATABASE_VAL); \
	BACKUP_FILE="backup_db_$$(date +%Y%m%d_%H%M%S).sql.gz"; \
	if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec -T mysql mysqldump -u $$MYSQL_USER -p$$MYSQL_PASSWORD $$MYSQL_DATABASE | gzip > backups/$$BACKUP_FILE; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) exec -T mysql mysqldump -u $$MYSQL_USER -p$$MYSQL_PASSWORD $$MYSQL_DATABASE | gzip > backups/$$BACKUP_FILE; \
	fi; \
	$(call print_message,"✅ Backup creado: $$BACKUP_FILE")

.PHONY: restore-db
restore-db: ## Restaurar desde backup
	$(call print_step,"🔄 Restaurando desde backup...")
	@ls -la backups/ 2>/dev/null || echo "No hay backups disponibles"
	@echo "❌ Especifica el archivo de backup como parámetro"
	@echo "💡 Uso: make restore-db-file FILE=nombre_archivo.sql.gz"

.PHONY: restore-db-file
restore-db-file: ## Restaurar desde backup específico
	$(call print_step,"🔄 Restaurando desde backup: $(FILE)")
	@if [ -f "backups/$(FILE)" ]; then \
		MYSQL_USER=$(MYSQL_USER_VAL); \
		MYSQL_PASSWORD=$(MYSQL_PASSWORD_VAL); \
		MYSQL_DATABASE=$(MYSQL_DATABASE_VAL); \
		if [ -f "$(ENV_PROD)" ]; then \
			gunzip < backups/$(FILE) | docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec -T mysql mysql -u $$MYSQL_USER -p$$MYSQL_PASSWORD $$MYSQL_DATABASE; \
		else \
			gunzip < backups/$(FILE) | docker compose -f $(DOCKER_COMPOSE_PROD) exec -T mysql mysql -u $$MYSQL_USER -p$$MYSQL_PASSWORD $$MYSQL_DATABASE; \
		fi; \
		$(call print_message,"✅ Restauración completada"); \
	else \
		$(call print_error,"❌ Archivo backups/$(FILE) no encontrado"); \
	fi

# ===============================
# UTILIDADES
# ===============================

.PHONY: shell
shell: ## Acceder al shell del contenedor app
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec app sh; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) exec app sh; \
	fi

.PHONY: db-shell
db-shell: ## Acceder al shell de MySQL
	$(call print_step,"🐚 Accediendo al shell de MySQL...")
	@MYSQL_USER=$(MYSQL_USER_VAL); \
	MYSQL_PASSWORD=$(MYSQL_PASSWORD_VAL); \
	MYSQL_DATABASE=$(MYSQL_DATABASE_VAL); \
	if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec mysql mysql -u $$MYSQL_USER -p$$MYSQL_PASSWORD $$MYSQL_DATABASE; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) exec mysql mysql -u $$MYSQL_USER -p$$MYSQL_PASSWORD $$MYSQL_DATABASE; \
	fi

.PHONY: redis-shell
redis-shell: ## Acceder al shell de Redis
	$(call print_step,"🐚 Accediendo al shell de Redis...")
	@REDIS_PASSWORD=$(REDIS_PASSWORD_VAL); \
	if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec redis redis-cli -a $$REDIS_PASSWORD; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) exec redis redis-cli -a $$REDIS_PASSWORD; \
	fi

.PHONY: env-check
env-check: ## Verificar variables de entorno
	$(call print_step,"🔍 Verificando variables de entorno...")
	@echo "=========================================="
	@echo "📋 VARIABLES DE ENTORNO DE PRODUCCIÓN:"
	@if [ -f "$(ENV_PROD)" ]; then \
		echo "✅ Archivo $(ENV_PROD) encontrado"; \
		echo "📄 Contenido (valores sensibles ocultos):"; \
		cat $(ENV_PROD) | grep -v "^#" | grep -v "^$$" | sed 's/=.*/=***/'; \
	else \
		echo "❌ Archivo $(ENV_PROD) no encontrado"; \
		echo "💡 Crea uno basado en env.prod.example"; \
	fi
	@echo "=========================================="

.PHONY: show-env
show-env: ## Mostrar variables de entorno actuales
	$(call print_step,"📋 Variables de entorno actuales...")
	@echo "=========================================="
	@echo "🔧 VARIABLES LEÍDAS DEL $(ENV_PROD):"
	@echo "PORT: $(PORT_VAL)"
	@echo "MYSQL_USER: $(MYSQL_USER_VAL)"
	@echo "MYSQL_DATABASE: $(MYSQL_DATABASE_VAL)"
	@echo "REDIS_PASSWORD: *** (hidden)"
	@echo "MYSQL_PASSWORD: *** (hidden)"
	@echo
	@echo "📁 ESTADO DE ARCHIVOS:"
	@if [ -f "$(ENV_PROD)" ]; then \
		echo "✅ $(ENV_PROD) existe"; \
		if grep -q "CHANGE_THIS" $(ENV_PROD) 2>/dev/null; then \
			echo "⚠️  Contiene valores por defecto (CHANGE_THIS)"; \
		else \
			echo "✅ No contiene valores por defecto"; \
		fi; \
	else \
		echo "❌ $(ENV_PROD) no encontrado"; \
	fi
	@echo "=========================================="

.PHONY: generate-secret
generate-secret: ## Generar secreto JWT seguro
	$(call print_step,"🔐 Generando secreto JWT seguro...")
	@SECRET=$$(openssl rand -hex 32); \
	echo "Tu nuevo secreto JWT:"; \
	echo "$$SECRET"; \
	echo ""; \
	echo "💡 Copia este valor al $(ENV_PROD):"; \
	echo "JWT_SECRET=$$SECRET"

.PHONY: check-env-prod
check-env-prod: ## Verificar que existe el archivo .env.prod y no tiene valores por defecto
	@if [ ! -f "$(ENV_PROD)" ]; then \
		$(call print_error,"No se encontró el archivo $(ENV_PROD)."); \
		echo "💡 Crea uno basado en env.prod.example:"; \
		echo "   cp env.prod.example $(ENV_PROD)"; \
		exit 1; \
	fi
	@if grep -q "CHANGE_THIS" $(ENV_PROD); then \
		$(call print_error,"$(ENV_PROD) contiene valores por defecto que deben ser actualizados."); \
		echo "💡 Valores que necesitan actualización:"; \
		grep "CHANGE_THIS" $(ENV_PROD) | sed 's/^/   • /'; \
		echo ""; \
		echo "🔐 Genera secretos seguros con:"; \
		echo "   make generate-secret"; \
		exit 1; \
	fi

# ===============================
# BASE DE DATOS
# ===============================

.PHONY: db-migrate
db-migrate: ## Ejecutar migraciones de base de datos
	$(call print_step,"🗄️ Ejecutando migraciones de base de datos...")
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec app npx prisma migrate deploy; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) exec app npx prisma migrate deploy; \
	fi
	$(call print_message,"✅ Migraciones aplicadas")

.PHONY: db-generate
db-generate: ## Generar cliente Prisma
	$(call print_step,"🔧 Generando cliente Prisma...")
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec app npx prisma generate; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) exec app npx prisma generate; \
	fi
	$(call print_message,"✅ Cliente Prisma generado")

.PHONY: db-seed
db-seed: ## Poblar base de datos con datos iniciales
	$(call print_step,"🌱 Poblando base de datos con datos iniciales...")
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec app npm run seed:run; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) exec app npm run seed:run; \
	fi
	$(call print_message,"✅ Base de datos poblada")

.PHONY: db-reset
db-reset: ## Resetear base de datos (¡CUIDADO!)
	$(call print_warning,"⚠️ Esto reseteará TODA la base de datos.")
	$(call print_warning,'⚠️ Para confirmar, ejecuta: make db-reset-confirm')
	@echo "❌ Operación cancelada por seguridad"
	@echo "💡 Usa 'make db-reset-confirm' para resetear la base de datos"

.PHONY: db-reset-confirm
db-reset-confirm: ## Resetear base de datos (confirmado)
	$(call print_warning,"⚠️ Reseteando base de datos...")
	@if [ -f "$(ENV_PROD)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec app npx prisma migrate reset --force; \
	else \
		docker compose -f $(DOCKER_COMPOSE_PROD) exec app npx prisma migrate reset --force; \
	fi
	$(call print_message,"✅ Base de datos reseteada")

.PHONY: db-setup
db-setup: ## Configuración completa de base de datos (migrate + seed)
	$(call print_step,"🗄️ Configuración completa de base de datos...")
	@$(MAKE) db-migrate
	@$(MAKE) db-seed
	$(call print_message,"✅ Base de datos configurada completamente")

# ===============================
# COMANDOS RÁPIDOS
# ===============================

.PHONY: quick-dev
quick-dev: ## Inicio rápido para desarrollo
	$(call print_step,"⚡ Inicio rápido para desarrollo...")
	@$(MAKE) dev-build
	@$(MAKE) dev-up
	$(call print_message,"✅ Desarrollo iniciado")

.PHONY: quick-prod
quick-prod: ## Inicio rápido para producción
	$(call print_step,"⚡ Inicio rápido para producción...")
	@$(MAKE) prod-deploy
	$(call print_message,"✅ Producción iniciada")

.PHONY: quick-stop
quick-stop: ## Parar todos los servicios
	$(call print_step,"🛑 Parando todos los servicios...")
	@$(MAKE) dev-down
	@$(MAKE) prod-down
	$(call print_message,"✅ Todos los servicios detenidos")

# ===============================
# ALIAS PARA NPM SCRIPTS
# ===============================

.PHONY: install
install: ## Instalar dependencias (alias para npm install)
	$(call print_step,"📦 Instalando dependencias...")
	@npm install
	$(call print_message,"✅ Dependencias instaladas")

.PHONY: build
build: ## Construir aplicación (alias para npm run build)
	$(call print_step,"🔨 Construyendo aplicación...")
	@npm run build
	$(call print_message,"✅ Aplicación construida")

.PHONY: start
start: ## Iniciar aplicación (alias para npm start)
	$(call print_step,"🚀 Iniciando aplicación...")
	@npm start

.PHONY: dev
dev: ## Iniciar desarrollo con hot reload (alias para npm run dev)
	$(call print_step,"🔥 Iniciando desarrollo con hot reload...")
	@npm run dev

.PHONY: test
test: ## Ejecutar tests (alias para npm test)
	$(call print_step,"🧪 Ejecutando tests...")
	@npm test

.PHONY: lint
lint: ## Ejecutar linter (alias para npm run lint)
	$(call print_step,"🔍 Ejecutando linter...")
	@npm run lint
