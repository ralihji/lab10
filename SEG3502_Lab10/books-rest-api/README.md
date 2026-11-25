# SEG3502 · Lab 10 · Serveur Spring Boot (books-rest-api)

API REST Spring Boot/Kotlin de l'application Bookstore (reprise du laboratoire 7).
Java 21, Spring Boot 3.3, Gradle 8.8. URL de base : `http://localhost:8080/books-api`

La connexion MySQL est lue dans les variables d'environnement `MYSQL_HOST`, `MYSQL_DB`,
`MYSQL_USER` et `MYSQL_PASSWORD` (valeurs par défaut : `localhost`, `booksDb`, `root`, `root`).

Image Docker (dans ce dossier) :

```bash
docker image build --network=host -t books-rest-api:latest .
```

Sans Docker (JDK 21 et MySQL local requis) :

```bash
./gradlew bootRun          # Windows : gradlew.bat bootRun
```

Voir le README du dossier `SEG3502_Lab10` pour Docker Compose et Kubernetes.
