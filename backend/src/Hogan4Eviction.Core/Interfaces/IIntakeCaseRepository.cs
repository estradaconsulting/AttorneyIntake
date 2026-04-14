using Hogan4Eviction.Core.Models;

namespace Hogan4Eviction.Core.Interfaces;

public interface IIntakeCaseRepository
{
    Task<IntakeCase?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IntakeCase?> GetByReferenceNumberAsync(string referenceNumber, CancellationToken ct = default);
    Task<IReadOnlyList<IntakeCase>> GetAllAsync(CancellationToken ct = default);
    Task<IntakeCase> CreateAsync(IntakeCase intakeCase, CancellationToken ct = default);
    Task<IntakeCase> UpdateAsync(IntakeCase intakeCase, CancellationToken ct = default);
    Task<string> GenerateReferenceNumberAsync(CancellationToken ct = default);
}
