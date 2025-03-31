NAME	=	./docker-compose.yml 

start:
		clear && docker-compose -f $(NAME) down &&  docker-compose -f $(NAME) up --build

PHONY: start stop