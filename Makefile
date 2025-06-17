NAME = compose.yml

backend:
	@echo "🚀 Démarrage des conteneurs Docker..."
	clear && \
	docker compose -f $(NAME) down && docker compose -f $(NAME) up --build


clear:
	docker system prune -a --volumes -f

frontend:
	@echo "🖥️ Lancement du serveur frontend..."
	cd frontend && yarn install && yarn start

.PHONY: backend frontend


