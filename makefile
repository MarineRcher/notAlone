NAME = compose.yml

backend:
	@echo "🚀 Démarrage des conteneurs Docker..."
	docker compose -f $(NAME) down && docker compose -f $(NAME) up --build

frontend:
	@echo "🖥️ Lancement du serveur frontend..."
	cd frontend && npm i && npm ci && npm run start

.PHONY: backend frontend