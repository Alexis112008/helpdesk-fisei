FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copiar el csproj
COPY src/MicroserviceA/MicroserviceA.API.csproj .
RUN dotnet restore MicroserviceA.API.csproj

# Copiar todo el código fuente
COPY src/MicroserviceA/ .

# Publicar la aplicación
RUN dotnet publish MicroserviceA.API.csproj -c Release -o out

# Runtime
FROM base AS final
WORKDIR /app
COPY --from=build /app/out .
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "MicroserviceA.API.dll"]