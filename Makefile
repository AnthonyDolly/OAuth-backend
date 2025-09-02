# ========================================
# MAKEFILE PARA OAUTH BACKEND
# ========================================

# Variables
PROJECT_NAME = oauth-backend
DOCKER_COMPOSE_DEV = docker-compose.yml
DOCKER_COMPOSE_PROD = docker-compose.prod.yml
ENV_PROD = .env.prod

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

# Comandos por defecto
.PHONY: help
help: ## Mostrar esta ayuda
	@echo -e "$(BLUE)========================================$(NC)"
	@echo -e "$(BLUE)🔐 COMANDOS OAUTH BACKEND$(NC)"
	@echo -e "$(BLUE)========================================$(NC)"
	@echo
	@echo -e "$(GREEN)DESARROLLO:$(NC)"
	@echo "  make dev-build     - Construir imagen de desarrollo"
	@echo "  make dev-up        - Iniciar servicios de desarrollo"
	@echo "  make dev-down      - Parar servicios de desarrollo"
	@echo "  make dev-logs      - Ver logs de desarrollo"
	@echo "  make dev-restart   - Reiniciar servicios de desarrollo"
	@echo
	@echo -e "$(GREEN)PRODUCCIÓN:$(NC)"
	@echo "  make prod-build    - Construir imagen de producción"
	@echo "  make prod-up       - Iniciar servicios de producción"
	@echo "  make prod-down     - Parar servicios de producción"
	@echo "  make prod-logs     - Ver logs de producción"
	@echo "  make prod-restart  - Reiniciar servicios de producción"
	@echo "  make prod-deploy   - Despliegue completo a producción"
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
	@echo "  make backup        - Backup de volúmenes"
	@echo "  make restore       - Restaurar desde backup (requiere parámetro)"
	@echo "  make restore-file  - Restaurar desde backup específico"
	@echo
	@echo -e "$(GREEN)UTILIDADES:$(NC)"
	@echo "  make shell         - Acceder al shell del contenedor app"
	@echo "  make db-shell      - Acceder al shell de MySQL"
	@echo "  make redis-shell   - Acceder al shell de Redis"
	@echo "  make env-check     - Verificar variables de entorno"
	@echo
	@echo -e "$(GREEN)BASE DE DATOS:$(NC)"
	@echo "  make prod-setup-db - Setup completo de BD para producción"
	@echo "  make db-migrate    - Ejecutar migraciones de base de datos"
	@echo "  make db-generate   - Generar cliente Prisma"
	@echo "  make db-seed       - Poblar base de datos con datos de ejemplo"
	@echo "  make db-reset      - Resetear base de datos (requiere confirmación)"
	@echo "  make db-reset-confirm - Resetear base de datos (confirmado)"
	@echo "  make db-setup      - Configuración completa de base de datos"
	@echo

# ========================================
# DESARROLLO
# ========================================

.PHONY: dev-build
dev-build: ## Construir imagen de desarrollo
	$(call print_step,"🔨 Construyendo imagen de desarrollo...")
	@docker compose build
	$(call print_message,"✅ Imagen de desarrollo construida")

.PHONY: dev-up
dev-up: ## Iniciar servicios de desarrollo
	$(call print_step,"🚀 Iniciando servicios de desarrollo...")
	@docker compose up -d
	$(call print_message,"✅ Servicios de desarrollo iniciados")

.PHONY: dev-down
dev-down: ## Parar servicios de desarrollo
	$(call print_step,"🛑 Parando servicios de desarrollo...")
	@docker compose down
	$(call print_message,"✅ Servicios de desarrollo detenidos")

.PHONY: dev-logs
dev-logs: ## Ver logs de desarrollo
	$(call print_step,"📋 Mostrando logs de desarrollo...")
	@docker compose logs -f

.PHONY: dev-restart
dev-restart: ## Reiniciar servicios de desarrollo
	$(call print_step,"🔄 Reiniciando servicios de desarrollo...")
	@docker compose restart
	$(call print_message,"✅ Servicios de desarrollo reiniciados")

# ========================================
# PRODUCCIÓN
# ========================================

.PHONY: prod-build
prod-build: ## Construir imagen de producción
	$(call print_step,"🔨 Construyendo imagen de producción...")
	@if [ ! -f "$(ENV_PROD)" ]; then \
		$(call print_error,"No se encontró el archivo $(ENV_PROD). Crea uno basado en env.prod.example"); \
		exit 1; \
	fi
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) build --no-cache
	$(call print_message,"✅ Imagen de producción construida")

.PHONY: prod-up
prod-up: ## Iniciar servicios de producción
	$(call print_step,"🚀 Iniciando servicios de producción...")
	@if [ ! -f "$(ENV_PROD)" ]; then \
		$(call print_error,"No se encontró el archivo $(ENV_PROD). Crea uno basado en env.prod.example"); \
		exit 1; \
	fi
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) up -d
	$(call print_message,"✅ Servicios de producción iniciados")

.PHONY: prod-down
prod-down: ## Parar servicios de producción
	$(call print_step,"🛑 Parando servicios de producción...")
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) down
	$(call print_message,"✅ Servicios de producción detenidos")

.PHONY: prod-logs
prod-logs: ## Ver logs de producción
	$(call print_step,"📋 Mostrando logs de producción...")
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) logs -f

.PHONY: prod-restart
prod-restart: ## Reiniciar servicios de producción
	$(call print_step,"🔄 Reiniciando servicios de producción...")
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) restart
	$(call print_message,"✅ Servicios de producción reiniciados")

.PHONY: prod-deploy
prod-deploy: ## Despliegue completo a producción
	$(call print_step,"🚀 Iniciando despliegue completo a producción...")
	@if [ ! -f "$(ENV_PROD)" ]; then \
		$(call print_error,"No se encontró el archivo $(ENV_PROD). Crea uno basado en env.prod.example"); \
		exit 1; \
	fi
	@$(MAKE) prod-build
	@$(MAKE) prod-down
	@$(MAKE) prod-up
	@echo "⏳ Esperando a que la base de datos esté lista..."
	@sleep 20
	@$(MAKE) prod-setup-db
	@echo "⏳ Esperando a que la aplicación esté lista..."
	@sleep 10
	@$(MAKE) health
	$(call print_message,"✅ Despliegue completado")
	@echo "🌐 Endpoints disponibles:"
	@echo "  • Health Check: http://localhost:3001/api/v1/health"
	@echo "  • API Version: http://localhost:3001/api/v1/version"

# ========================================
# MONITOREO
# ========================================

.PHONY: status
status: ## Estado de todos los servicios
	$(call print_step,"📊 Estado de servicios...")
	@echo "=========================================="
	@echo "🐳 SERVICIOS DE DESARROLLO:"
	@docker compose ps
	@echo
	@echo "🚀 SERVICIOS DE PRODUCCIÓN:"
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) ps
	@echo "=========================================="

.PHONY: health
health: ## Health check de servicios
	$(call print_step,"🏥 Health check de servicios...")
	@echo "=========================================="
	@echo "🔍 VERIFICANDO SERVICIOS DE PRODUCCIÓN:"
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@echo
	@echo "🌐 HEALTH CHECKS:"
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec -T app wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health > /dev/null 2>&1 && echo "✅ Aplicación: OK" || echo "❌ Aplicación: FAILED (Container internal check)"
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec -T mysql mysqladmin ping -h mysql -u $$(grep MYSQL_USER $(ENV_PROD) | cut -d'=' -f2) -p$$(grep MYSQL_PASSWORD $(ENV_PROD) | cut -d'=' -f2) > /dev/null 2>&1 && echo "✅ MySQL: OK" || echo "❌ MySQL: FAILED"
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec -T redis redis-cli -a $$(grep REDIS_PASSWORD $(ENV_PROD) | cut -d'=' -f2) ping > /dev/null 2>&1 && echo "✅ Redis: OK" || echo "❌ Redis: FAILED"
	@echo
	@echo "🔍 DETALLES DE LA APLICACIÓN:"
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) logs --tail=5 app 2>/dev/null || echo "No se pudieron obtener logs recientes"
	@echo "=========================================="

.PHONY: stats
stats: ## Estadísticas de Docker
	$(call print_step,"📊 Estadísticas de Docker...")
	@echo "=========================================="
	@echo "💾 USO DE RECURSOS:"
	@docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
	@echo
	@echo "📁 VOLÚMENES:"
	@docker volume ls --format "table {{.Name}}\t{{.Driver}}\t{{.Size}}"
	@echo
	@echo "🌐 REDES:"
	@docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
	@echo "=========================================="

.PHONY: logs-app
logs-app: ## Logs de la aplicación
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) logs -f app

.PHONY: logs-db
logs-db: ## Logs de MySQL
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) logs -f mysql

.PHONY: logs-redis
logs-redis: ## Logs de Redis
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) logs -f redis

# ========================================
# MANTENIMIENTO
# ========================================

.PHONY: clean
clean: ## Limpiar contenedores e imágenes
	$(call print_step,"🧹 Limpiando contenedores e imágenes...")
	@docker compose down
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) down
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

.PHONY: backup
backup: ## Backup de volúmenes
	$(call print_step,"🗄️ Creando backup de volúmenes...")
	@mkdir -p backups
	@BACKUP_FILE="backup_$$(date +%Y%m%d_%H%M%S).tar.gz"; \
	docker run --rm -v $(PROJECT_NAME)_mysql_data_prod:/data -v $$(pwd)/backups:/backup alpine tar czf /backup/$$BACKUP_FILE -C /data .; \
	$(call print_message,"✅ Backup creado: $$BACKUP_FILE")

.PHONY: restore
restore: ## Restaurar desde backup
	$(call print_step,"🔄 Restaurando desde backup...")
	@ls -la backups/ 2>/dev/null || echo "No hay backups disponibles"
	@echo "❌ Especifica el archivo de backup como parámetro"
	@echo "💡 Uso: make restore-file FILE=nombre_archivo.tar.gz"

.PHONY: restore-file
restore-file: ## Restaurar desde backup específico
	$(call print_step,"🔄 Restaurando desde backup: $(FILE)")
	@if [ -f "backups/$(FILE)" ]; then \
		docker run --rm -v $(PROJECT_NAME)_mysql_data_prod:/data -v $$(pwd)/backups:/backup alpine tar xzf /backup/$(FILE) -C /data; \
		$(call print_message,"✅ Restauración completada"); \
	else \
		$(call print_error,"❌ Archivo backups/$(FILE) no encontrado"); \
	fi

# ========================================
# UTILIDADES
# ========================================

.PHONY: shell
shell: ## Acceder al shell del contenedor app
	$(call print_step,"🐚 Accediendo al shell del contenedor app...")
	@docker compose -f $(DOCKER_COMPOSE_PROD) exec app sh

.PHONY: db-shell
db-shell: ## Acceder al shell de MySQL
	$(call print_step,"🐚 Accediendo al shell de MySQL...")
	@docker compose -f $(DOCKER_COMPOSE_PROD) exec mysql mysql -u $$(grep MYSQL_USER $(ENV_PROD) | cut -d'=' -f2) -p$$(grep MYSQL_PASSWORD $(ENV_PROD) | cut -d'=' -f2) $$(grep MYSQL_DATABASE $(ENV_PROD) | cut -d'=' -f2)

.PHONY: redis-shell
redis-shell: ## Acceder al shell de Redis
	$(call print_step,"🐚 Accediendo al shell de Redis...")
	@docker compose -f $(DOCKER_COMPOSE_PROD) exec redis redis-cli -a $$(grep REDIS_PASSWORD $(ENV_PROD) | cut -d'=' -f2)

.PHONY: env-check
env-check: ## Verificar variables de entorno
	$(call print_step,"🔍 Verificando variables de entorno...")
	@echo "=========================================="
	@echo "📋 VARIABLES DE ENTORNO DE PRODUCCIÓN:"
	@if [ -f "$(ENV_PROD)" ]; then \
		echo "✅ Archivo $(ENV_PROD) encontrado"; \
		echo "📄 Contenido:"; \
		cat $(ENV_PROD) | grep -v "^#" | grep -v "^$$" | sed 's/=.*/=***/'; \
	else \
		echo "❌ Archivo $(ENV_PROD) no encontrado"; \
	fi
	@echo "=========================================="

# ========================================
# BASE DE DATOS
# ========================================

.PHONY: prod-setup-db
prod-setup-db: ## Setup completo de base de datos para producción
	$(call print_step,"🗄️ Configurando base de datos para producción...")
	@echo "⏳ Esperando a que MySQL esté disponible..."
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec mysql mysqladmin ping --silent --wait=30 -u $$(grep MYSQL_USER $(ENV_PROD) | cut -d'=' -f2) -p$$(grep MYSQL_PASSWORD $(ENV_PROD) | cut -d'=' -f2) || (echo "❌ MySQL no está disponible" && exit 1)
	@echo "✅ MySQL está disponible"
	@echo "🔧 Generando cliente Prisma..."
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec app npx prisma generate
	@echo "📦 Ejecutando migraciones..."
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec app npx prisma migrate deploy
	$(call print_message,"✅ Base de datos configurada correctamente")

.PHONY: db-migrate
db-migrate: ## Ejecutar migraciones de base de datos
	$(call print_step,"🗄️ Ejecutando migraciones de base de datos...")
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec app npx prisma migrate deploy
	$(call print_message,"✅ Migraciones aplicadas")

.PHONY: db-generate
db-generate: ## Generar cliente Prisma
	$(call print_step,"🔧 Generando cliente Prisma...")
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec app npx prisma generate
	$(call print_message,"✅ Cliente Prisma generado")

.PHONY: db-seed
db-seed: ## Poblar base de datos con datos de ejemplo
	$(call print_step,"🌱 Poblando base de datos con datos de ejemplo...")
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec app npm run seed:run
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
	@docker compose -f $(DOCKER_COMPOSE_PROD) --env-file $(ENV_PROD) exec app npx prisma migrate reset --force
	$(call print_message,"✅ Base de datos reseteada")

.PHONY: db-setup
db-setup: ## Configuración completa de base de datos (migrate + seed)
	$(call print_step,"🗄️ Configuración completa de base de datos...")
	@$(MAKE) db-migrate
	@$(MAKE) db-seed
	$(call print_message,"✅ Base de datos configurada completamente")

# ========================================
# COMANDOS RÁPIDOS
# ========================================

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

# ========================================
# ALIAS PARA NPM SCRIPTS
# ========================================

.PHONY: start
start: ## Iniciar aplicación (alias para npm start)
	@npm start

.PHONY: build
build: ## Construir aplicación (alias para npm run build)
	@npm run build

.PHONY: test
test: ## Ejecutar tests (alias para npm test)
	@npm test

.PHONY: lint
lint: ## Linting (alias para npm run lint)
	@npm run lint
