# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["VRCourses.API/VRCourses.API.csproj", "VRCourses.API/"]
RUN dotnet restore "VRCourses.API/VRCourses.API.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/VRCourses.API"
RUN dotnet build "VRCourses.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "VRCourses.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 80
EXPOSE 443

COPY --from=publish /app/publish .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

ENTRYPOINT ["dotnet", "VRCourses.API.dll"]