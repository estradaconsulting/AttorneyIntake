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
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)
            ));

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

        return services;
    }

    /// <summary>Apply pending EF Core migrations on startup (dev/staging only).</summary>
    public static void ApplyMigrations(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
    }
}
