# SEG3502 · Lab 10 · Client Angular (bookstore-client)

Application Angular BookStore (reprise du laboratoire 7), servie par Nginx dans le conteneur.

L'URL de l'API n'est plus écrite dans le code : `src/main.ts` charge `/assets/env.json` avant de
démarrer Angular, et `BooksService` lit `window.env.apiUrl`. Dans le conteneur, `entrypoint.sh`
crée `env.json` à partir de `env.template.json` et de la variable `API_URL`.

Image et conteneur (dans ce dossier) :

```bash
docker image build -t books-api-client:latest .
docker container run -d --name booksclient -e API_URL='http://localhost:8080/books-api/' -p 4100:80 books-api-client:latest
```

Ouvrir ensuite `http://localhost:4100`.

Sans Docker : `npm install` puis `npm start` (http://localhost:4200). `env.json` contient alors
`PLACEHOLDER`, et le service utilise l'API locale `http://localhost:8080/books-api/`.
