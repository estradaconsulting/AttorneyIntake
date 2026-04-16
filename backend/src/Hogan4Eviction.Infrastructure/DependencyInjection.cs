using Hogan4Eviction.Core.Interfaces;
using Hogan4Eviction.Core.Services;
using Hogan4Eviction.Infrastructure.Data;
using Hogan4Eviction.Infrastructure.Repositories;
using Hogan4Eviction.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Hogan4Eviction.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── Database ──────────────────────────────────────────────────────
        // Switch between InMemory (dev/no-DB mode) and SqlServer via Database:Provider config.
        // Set "Database:Provider": "InMemory" in appsettings.Development.json to skip SQL Server entirely.
        var dbProvider = configuration["Database:Provider"] ?? "SqlServer";
        var useInMemory = dbProvider.Equals("InMemory", StringComparison.OrdinalIgnoreCase);

        void ConfigureDb(DbContextOptionsBuilder options)
        {
            if (useInMemory)
                options.UseInMemoryDatabase("Hogan4EvictionDb");
            else
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName));
        }

        services.AddDbContext<AppDbContext>(ConfigureDb);

        // M-05: Factory needed by AuditLogService to get a fresh context per write
        services.AddDbContextFactory<AppDbContext>(ConfigureDb, ServiceLifetime.Scoped);

        // ── Repositories ──────────────────────────────────────────────────
        services.AddScoped<IIntakeCaseRepository, IntakeCaseRepository>();

        // ── Storage — swap provider via config ────────────────────────────
        var storageProvider = configuration["Storage:Provider"] ?? "Local";
        if (storageProvider.Equals("Azure", StringComparison.OrdinalIgnoreCase))
            services.AddSingleton<IDocumentStorageService, AzureBlobStorageService>();
        else
            services.AddSingleton<IDocumentStorageService, LocalDocumentStorageService>();

        // ── Domain services ───────────────────────────────────────────────
        services.AddSingleton<IFeeCalculatorService, FeeCalculatorService>();

        // ── Audit logging (M-05) ──────────────────────────────────────────
        services.AddScoped<IAuditService, AuditLogService>();

        return services;
    }

    /// <summary>
    /// Apply pending EF Core migrations on startup (SqlServer only).
    /// No-op for InMemory — the schema is created automatically.
    /// </summary>
    public static void ApplyMigrations(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // InMemory databases don't support Migrate() — EnsureCreated() is sufficient.
        if (db.Database.IsInMemory())
            db.Database.EnsureCreated();
        else
            db.Database.Migrate();
    }
}
