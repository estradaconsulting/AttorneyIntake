using Hogan4Eviction.Core.Interfaces;
using Hogan4Eviction.Core.Models;
using Hogan4Eviction.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hogan4Eviction.Infrastructure.Repositories;

public class IntakeCaseRepository : IIntakeCaseRepository
{
    private readonly AppDbContext _db;

    public IntakeCaseRepository(AppDbContext db) => _db = db;

    public async Task<IntakeCase?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await _db.IntakeCases
            .Include(c => c.PropertyOwner)
            .Include(c => c.PropertyManager)
            .Include(c => c.Property).ThenInclude(p => p!.Tenants)
            .Include(c => c.EvictionCause)
            .Include(c => c.NoticeRequest)
            .Include(c => c.Documents)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IntakeCase?> GetByReferenceNumberAsync(string referenceNumber, CancellationToken ct = default) =>
        await _db.IntakeCases
            .Include(c => c.PropertyOwner)
            .Include(c => c.PropertyManager)
            .Include(c => c.Property).ThenInclude(p => p!.Tenants)
            .Include(c => c.EvictionCause)
            .Include(c => c.NoticeRequest)
            .Include(c => c.Documents)
            .FirstOrDefaultAsync(c => c.ReferenceNumber == referenceNumber, ct);

    public async Task<IReadOnlyList<IntakeCase>> GetAllAsync(CancellationToken ct = default) =>
        await _db.IntakeCases
            .Include(c => c.PropertyOwner)
            .Include(c => c.Property)
            .Include(c => c.Documents)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);

    public async Task<IntakeCase> CreateAsync(IntakeCase intakeCase, CancellationToken ct = default)
    {
        _db.IntakeCases.Add(intakeCase);
        await _db.SaveChangesAsync(ct);
        return intakeCase;
    }

    public async Task<IntakeCase> UpdateAsync(IntakeCase intakeCase, CancellationToken ct = default)
    {
        intakeCase.UpdatedAt = DateTime.UtcNow;

        // Cases loaded via this repository are already tracked by the current DbContext.
        // Re-marking the full graph as Modified can trigger unnecessary updates across
        // related entities and cause submit/save failures.
        if (_db.Entry(intakeCase).State == EntityState.Detached)
        {
            _db.Attach(intakeCase);
            _db.Entry(intakeCase).State = EntityState.Modified;
        }

        await _db.SaveChangesAsync(ct);
        return intakeCase;
    }

    public async Task<string> GenerateReferenceNumberAsync(CancellationToken ct = default)
    {
        var year = DateTime.UtcNow.Year;
        var count = await _db.IntakeCases
            .CountAsync(c => c.CreatedAt.Year == year, ct);
        return $"H{year}-{(count + 1):D4}";
    }
}
