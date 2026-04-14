# ── Build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/Hogan4Eviction.API/Hogan4Eviction.API.csproj", "src/Hogan4Eviction.API/"]
COPY ["src/Hogan4Eviction.Core/Hogan4Eviction.Core.csproj", "src/Hogan4Eviction.Core/"]
COPY ["src/Hogan4Eviction.Infrastructure/Hogan4Eviction.Infrastructure.csproj", "src/Hogan4Eviction.Infrastructure/"]
RUN dotnet restore "src/Hogan4Eviction.API/Hogan4Eviction.API.csproj"

COPY . .
WORKDIR "/src/src/Hogan4Eviction.API"
RUN dotnet build "Hogan4Eviction.API.csproj" -c Release -o /app/build

# ── Publish stage ─────────────────────────────────────────────────────────────
FROM build AS publish
RUN dotnet publish "Hogan4Eviction.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080

# Create upload directory
RUN mkdir -p /app/uploads

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Hogan4Eviction.API.dll"]
