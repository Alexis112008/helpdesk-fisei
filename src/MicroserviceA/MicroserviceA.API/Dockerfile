FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar el csproj desde la ubicación CORRECTA
COPY ["src/MicroserviceA/MicroserviceA.API.csproj", "MicroserviceA.API/"]
RUN dotnet restore "MicroserviceA.API/MicroserviceA.API.csproj"

# Copiar todo el código
COPY . .
WORKDIR "/src/src/MicroserviceA"
RUN dotnet build "MicroserviceA.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MicroserviceA.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "MicroserviceA.API.dll"]