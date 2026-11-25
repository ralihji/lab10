FROM gradle:8.0-jdk17 AS build
WORKDIR /workspace
COPY . .
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon
FROM eclipse-temurin:17-jre
EXPOSE 8080
WORKDIR /app
COPY --from=build /workspace/build/libs/*.jar /app/app.jar
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
