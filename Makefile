.PHONY: help build up down logs restart clean rebuild

# Colors for output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
NC     := \033[0m # No Color

help: ## Show this help message
	@echo '$(GREEN)VR Meta University - Docker Commands$(NC)'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

setup: ## First time setup - copy .env.example
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo '$(GREEN)✓$(NC) Created .env file. Please edit it with your passwords!'; \
	else \
		echo '$(YELLOW)⚠$(NC)  .env already exists, skipping...'; \
	fi

build: ## Build all services
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## Show logs for all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

logs-ml: ## Show ML service logs
	docker-compose logs -f ml-service

logs-db: ## Show database logs
	docker-compose logs -f postgres

ps: ## Show running containers
	docker-compose ps

restart: ## Restart all services
	docker-compose restart

restart-backend: ## Restart backend only
	docker-compose restart backend

restart-frontend: ## Restart frontend only
	docker-compose restart frontend

restart-ml: ## Restart ML service only
	docker-compose restart ml-service

clean: ## Stop and remove containers, networks
	docker-compose down

clean-all: ## Stop and remove containers, networks, volumes (⚠️  deletes database)
	@echo '$(YELLOW)⚠️  WARNING: This will delete the database!$(NC)'
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo '$(GREEN)✓$(NC) Cleaned everything'; \
	fi

rebuild: ## Rebuild and restart all services
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

rebuild-backend: ## Rebuild backend only
	docker-compose build --no-cache backend
	docker-compose up -d backend

rebuild-frontend: ## Rebuild frontend only
	docker-compose build --no-cache frontend
	docker-compose up -d frontend

rebuild-ml: ## Rebuild ML service only
	docker-compose build --no-cache ml-service
	docker-compose up -d ml-service

shell-backend: ## Open shell in backend container
	docker-compose exec backend bash

shell-ml: ## Open shell in ML service container
	docker-compose exec ml-service bash

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U vrcourses_user -d vrcourses_db

backup-db: ## Backup database to backup.sql
	docker-compose exec postgres pg_dump -U vrcourses_user vrcourses_db > backup.sql
	@echo '$(GREEN)✓$(NC) Database backed up to backup.sql'

restore-db: ## Restore database from backup.sql
	@if [ ! -f backup.sql ]; then \
		echo '$(YELLOW)⚠$(NC)  backup.sql not found!'; \
		exit 1; \
	fi
	docker-compose exec -T postgres psql -U vrcourses_user vrcourses_db < backup.sql
	@echo '$(GREEN)✓$(NC) Database restored from backup.sql'

dev: ## Start in development mode with live reload
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

health: ## Check health of all services
	@echo '$(GREEN)Checking services...$(NC)'
	@curl -f http://localhost:3000/health && echo '$(GREEN)✓$(NC) Frontend: healthy' || echo '$(YELLOW)✗$(NC) Frontend: unhealthy'
	@curl -f http://localhost:8000/health && echo '$(GREEN)✓$(NC) ML Service: healthy' || echo '$(YELLOW)✗$(NC) ML Service: unhealthy'
	@curl -f http://localhost:5272/api/courses && echo '$(GREEN)✓$(NC) Backend: healthy' || echo '$(YELLOW)✗$(NC) Backend: unhealthy'

stats: ## Show resource usage
	docker stats --no-stream

prune: ## Remove unused Docker resources
	docker system prune -a --volumes
