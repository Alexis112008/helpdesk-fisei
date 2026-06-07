FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copiar el csproj (ahora está en la misma carpeta)
COPY *.csproj .
RUN dotnet restore

# Copiar todo el código
COPY . .

# Publicar
RUN dotnet publish -c Release -o out

# Runtime
FROM base AS final
WORKDIR /app
COPY --from=build /app/out .
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "MicroserviceA.API.dll"]