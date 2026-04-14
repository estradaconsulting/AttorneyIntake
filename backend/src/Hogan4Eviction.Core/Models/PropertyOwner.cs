using Hogan4Eviction.Core.Enums;

namespace Hogan4Eviction.Core.Models;

public class PropertyOwner
{
    public int Id { get; set; }
    public int IntakeCaseId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }

    /// <summary>
    /// One or more owner types (stored as comma-separated enum values or flags).
    /// </summary>
    public ICollection<OwnerType> OwnerTypes { get; set; } = new List<OwnerType>();

    /// <summary>Required when OwnerType includes FamilyTrust or REIT.</summary>
    public string? TrusteeName { get; set; }

    public IntakeCase IntakeCase { get; set; } = null!;
}
