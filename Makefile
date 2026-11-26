NAME        = iRent
DOCKER      = docker
COMPOSE     = docker compose
COMPOSE_FILE = docker-compose.yml

GREEN       = \033[0;32m
YELLOW      = \033[0;33m
RED         = \033[0;31m
RESET       = \033[0m

.PHONY: all build up down start stop restart logs status ps \
        clean fclean re prune frontend backend help

all: up

build:
	@echo "$(YELLOW)Building $(NAME)...$(RESET)"
	$(COMPOSE) -f $(COMPOSE_FILE) build

up:
	@echo "$(GREEN)Starting $(NAME)...$(RESET)"
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --build

start:
	$(COMPOSE) -f $(COMPOSE_FILE) start

stop:
	$(COMPOSE) -f $(COMPOSE_FILE) stop

down:
	$(COMPOSE) -f $(COMPOSE_FILE) down

restart: down up

logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f

ps:
	$(COMPOSE) -f $(COMPOSE_FILE) ps

status: ps

backend:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f backend

frontend:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f frontend

clean:
	@echo "$(YELLOW)Removing containers...$(RESET)"
	$(COMPOSE) -f $(COMPOSE_FILE) down --remove-orphans

fclean:
	@echo "$(RED)Removing containers, volumes and images...$(RESET)"
	$(COMPOSE) -f $(COMPOSE_FILE) down --volumes --rmi local --remove-orphans

prune: fclean
	$(DOCKER) builder prune -f

re: fclean up

help:
	@echo "$(YELLOW)$(NAME) - Available commands$(RESET)"
	@echo "$(GREEN)"
	@echo "  make / make all / make up     - Build and start the project"
	@echo "  make build                    - Build Docker images"
	@echo "  make start                    - Start existing containers"
	@echo "  make stop                     - Stop containers"
	@echo "  make down                     - Stop and remove containers"
	@echo "  make restart                  - Restart the project"
	@echo "  make logs                     - Follow all logs"
	@echo "  make backend                  - Follow backend logs"
	@echo "  make frontend                 - Follow frontend logs"
	@echo "  make ps                       - Show running containers"
	@echo "  make clean                    - Remove containers"
	@echo "  make fclean                   - Remove containers and volumes"
	@echo "  make prune                    - Full Docker cleanup"
	@echo "  make re                       - Clean and rebuild"
	@echo "  make help                     - Show this help"
	@echo "$(RESET)"
