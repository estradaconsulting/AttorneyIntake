using Hogan4Eviction.Core.Enums;
using Hogan4Eviction.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Hogan4Eviction.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<IntakeCase> IntakeCases => Set<IntakeCase>();
    public DbSet<PropertyOwner> PropertyOwners => Set<PropertyOwner>();
    public DbSet<PropertyManager> PropertyManagers => Set<PropertyManager>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<EvictionCause> EvictionCauses => Set<EvictionCause>();
    public DbSet<NoticeRequest> NoticeRequests => Set<NoticeRequest>();
    public DbSet<CaseDocument> CaseDocuments => Set<CaseDocument>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── IntakeCase ────────────────────────────────────────────────────
        modelBuilder.Entity<IntakeCase>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ReferenceNumber).HasMaxLength(20).IsRequired();
            e.HasIndex(x => x.ReferenceNumber).IsUnique();
            e.Property(x => x.Status).HasConversion<string>();

            e.HasOne(x => x.PropertyOwner)
                .WithOne(x => x.IntakeCase)
                .HasForeignKey<PropertyOwner>(x => x.IntakeCaseId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.PropertyManager)
                .WithOne(x => x.IntakeCase)
                .HasForeignKey<PropertyManager>(x => x.IntakeCaseId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Property)
                .WithOne(x => x.IntakeCase)
                .HasForeignKey<Property>(x => x.IntakeCaseId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.EvictionCause)
                .WithOne(x => x.IntakeCase)
                .HasForeignKey<EvictionCause>(x => x.IntakeCaseId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.NoticeRequest)
                .WithOne(x => x.IntakeCase)
                .HasForeignKey<NoticeRequest>(x => x.IntakeCaseId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(x => x.Documents)
                .WithOne(x => x.IntakeCase)
                .HasForeignKey(x => x.IntakeCaseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── PropertyOwner — OwnerTypes stored as comma-separated string ──
        modelBuilder.Entity<PropertyOwner>(e =>
        {
            e.Property(x => x.OwnerTypes)
                .HasConversion(
                    v => string.Join(',', v.Select(t => (int)t)),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                          .Select(s => (OwnerType)int.Parse(s))
                          .ToList())
                .HasMaxLength(100);
        });

        // ── Property ──────────────────────────────────────────────────────
        modelBuilder.Entity<Property>(e =>
        {
            e.Property(x => x.Location).HasConversion<string>();
            e.HasMany(x => x.Tenants)
                .WithOne(x => x.Property)
                .HasForeignKey(x => x.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── NoticeRequest ─────────────────────────────────────────────────
        modelBuilder.Entity<NoticeRequest>(e =>
        {
            e.Property(x => x.NoticeType).HasConversion<string>();
        });

        // ── CaseDocument ──────────────────────────────────────────────────
        modelBuilder.Entity<CaseDocument>(e =>
        {
            e.Property(x => x.DocumentType).HasConversion<string>();
        });
    }
}
