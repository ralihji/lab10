# SEG3502 · Laboratoire 10 · Conteneurs (Docker, Docker Compose, Kubernetes)

Équipe : **Hjiyej Andaloussi Elghali** (300379897) et **Brayan Adou** (300433616)

L'application Bookstore du laboratoire 7 (client Angular, API REST Spring Boot, base MySQL)
est empaquetée en conteneurs Docker, lancée avec Docker Compose, puis déployée sur un cluster
Kubernetes local avec Minikube.

```
Navigateur ──► booksclient (Nginx, port 4100→80) ──► booksserver (Spring Boot, port 8080) ──► MySQL (booksDb, port 3306)
```

## Structure

```
SEG3502_Lab10/
├── books-rest-api/            API Spring Boot (Kotlin, Java 21, Gradle 8.8)
│   ├── Dockerfile             image books-rest-api:latest (gradle:jdk21-alpine → eclipse-temurin:21-jdk-alpine)
│   └── src/main/resources/application.properties   connexion MySQL lue dans MYSQL_HOST, MYSQL_DB, MYSQL_USER, MYSQL_PASSWORD
├── bookstore-client/          client Angular 18
│   ├── Dockerfile             image books-api-client:latest (node:20-alpine → nginx:alpine)
│   ├── entrypoint.sh          écrit assets/env.json à partir de la variable API_URL, puis démarre Nginx
│   ├── nginx.conf             renvoie index.html pour les routes Angular (/books/1, /authors/1, ...)
│   └── src/assets/            env.template.json et env.json
├── docker/docker-compose.yml  services mysql, booksserver, booksapp + réseau mysql-network + volume mysql-data
├── k8s/                       mysql-deployment.yaml, mysql-volume.yaml, booksserver-deployment.yaml, booksclient-deployment.yaml
├── scripts/seed-data.sh       ajoute 5 livres et 4 auteurs par l'API (base vide au départ)
└── docs/captures-lab10/       captures Q1 à Q6 du rapport
```

## Prérequis

- Docker Desktop (Windows, macOS) ou Docker Engine + Docker Compose v2 (Linux)
- Minikube et kubectl pour la partie Kubernetes : https://minikube.sigs.k8s.io/docs/start/
- Ports libres : 3306, 8080 et 4100

## 1. Docker (section 1.1 et 1.2 de l'énoncé)

```bash
# Image du serveur (dans books-rest-api)
cd books-rest-api
docker image build --network=host -t books-rest-api:latest .

# Réseau, MySQL puis serveur
docker network create mysql-network
docker container run -d --name mysqldb --network mysql-network \
  -v mysql-data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=booksDb mysql:9
docker container run -d --network mysql-network --name booksserver \
  -e MYSQL_USER=root -e MYSQL_PASSWORD=root -e MYSQL_DB=booksDb -e MYSQL_HOST=mysqldb \
  -p 8080:8080 books-rest-api:latest
docker container ls            # Q1

# Image et conteneur du client (dans bookstore-client)
cd ../bookstore-client
docker image build -t books-api-client:latest .
docker container run -d --name booksclient \
  -e API_URL='http://localhost:8080/books-api/' -p 4100:80 books-api-client:latest
docker container ls            # Q2
```

Ouvrir http://localhost:4100. Attendre que MySQL ait fini de démarrer (environ 15 s) avant de lancer
`booksserver` ; sinon le serveur s'arrête et il suffit de le relancer avec `docker container start booksserver`.

La base est vide au départ. Pour ajouter des livres et des auteurs (Git Bash sous Windows) :

```bash
bash scripts/seed-data.sh
```

Arrêter et supprimer les conteneurs avant de passer à Docker Compose (ports 8080 et 4100) :

```bash
docker container stop booksclient booksserver mysqldb
docker container rm booksclient booksserver mysqldb
```

## 2. Docker Compose (section 1.3)

```bash
cd docker
docker compose up -d --build   # Q3
docker compose ps
docker compose down            # arrête et supprime conteneurs et réseaux
```

`booksserver` ne démarre que lorsque le contrôle d'intégrité de MySQL réussit (environ 30 s).

## 3. Kubernetes avec Minikube (section 2)

```bash
minikube start
minikube image load books-rest-api:latest
minikube image load books-api-client:latest

cd k8s
kubectl apply -f .             # Q4
kubectl get deployments        # Q5

# deux terminaux distincts, à laisser ouverts
kubectl port-forward service/booksserver 8080:8080
kubectl port-forward service/booksapp 4100:4100

kubectl get pods               # Q6
kubectl delete pod <nom d'un pod booksserver>   # Kubernetes recrée un pod pour garder 2 réplicas
kubectl get pods
kubectl delete -f .            # supprime tous les objets du laboratoire
```

Si un pod `booksapp` ou `booksserver` reste en `ImagePullBackOff`, l'image n'a pas été chargée dans
Minikube : relancer `minikube image load ...`, puis `kubectl delete pod <nom du pod>`.

## Écarts avec l'énoncé (et pourquoi)

| Fichier | Écart | Raison |
|---|---|---|
| `books-rest-api/Dockerfile` | `./gradlew` au lieu de `gradlew` | le dossier courant n'est pas dans le `PATH` de l'image : `gradlew` seul donne « not found » |
| les deux `Dockerfile` | ligne `sed -i 's/\r$//'` | un clone Windows peut contenir des fins de ligne CRLF ; Linux ne peut alors pas exécuter `gradlew` ni `entrypoint.sh` |
| `books-rest-api/build.gradle.kts` | Java 21, Spring Boot 3.3.5, Kotlin 1.9.25, Gradle 8.8 | les images de l'énoncé utilisent JDK 21 ; Gradle 8.0 (projet du lab 7) ne fonctionne pas sous Java 21 |
| `bookstore-client/Dockerfile` | `COPY nginx.conf` | sans cette règle, recharger `/authors/1` dans le navigateur donne une erreur 404 de Nginx |
| `k8s/booksserver-deployment.yaml` | `replicas: 2` | le YAML de l'énoncé affiche 1, mais le texte (p. 15) et la démonstration de réplication (p. 17) parlent de deux pods |
| `k8s/booksserver-deployment.yaml` | `initContainer` `wait-for-mysql` et `readinessProbe` | le serveur attend que MySQL réponde au lieu d'échouer et de redémarrer ; un pod n'est « prêt » que lorsque le port 8080 répond |
| `.gitattributes` | `*.sh` et `gradlew` en LF | évite le problème CRLF dès le clone |

Les identifiants `root` / `root` sont ceux de l'énoncé : ils conviennent seulement à un laboratoire local
(en production : secrets Docker, fichier `.env` hors du dépôt ou Kubernetes Secrets).
