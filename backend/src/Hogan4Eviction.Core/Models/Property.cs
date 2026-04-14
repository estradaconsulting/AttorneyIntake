using Hogan4Eviction.Core.Enums;

namespace Hogan4Eviction.Core.Models;

public class Property
{
    public int Id { get; set; }
    public int IntakeCaseId { get; set; }

    public string Address { get; set; } = string.Empty;   // Street, City, State, Zip
    public string? GateCode { get; set; }

    public bool IsResidential { get; set; } = true;
    public bool IsCommercial { get; set; } = false;

    public DateTime? TenantMoveInDate { get; set; }
    public decimal? OriginalMonthlyRent { get; set; }
    public decimal? CurrentRent { get; set; }             // Excluding utilities & late fees

    // ── Rent history (AB 1482 / rent control compliance) ──────────────────
    public decimal? RentBefore_2020_06_30 { get; set; }
    public decimal? RentBefore_2021_06_30 { get; set; }
    public decimal? RentBefore_2022_06_30 { get; set; }
    public decimal? RentBefore_2023_06_30 { get; set; }
    public decimal? RentBefore_2024_06_30 { get; set; }
    public decimal? RentBefore_2025_06_30 { get; set; }

    // ── Lease details ──────────────────────────────────────────────────────
    public bool HasWrittenAgreement { get; set; }
    public bool IsVerbalOnly { get; set; }
    public bool NoAgreement { get; set; }
    public bool IsTermLease { get; set; }
    public bool IsMonthToMonth { get; set; }
    public bool HasAB1482Exemption { get; set; }

    public bool HasTenantsBeenAdded { get; set; }
    public DateTime? AddedTenantMoveInDate { get; set; }

    // ── Regulatory ────────────────────────────────────────────────────────
    public bool ConstructedWithinLast15Years { get; set; }
    public bool IsSection8OrSubsidy { get; set; }
    public bool IsForeclosure { get; set; }

    public PropertyLocation Location { get; set; } = PropertyLocation.Sacramento;

    // ── Navigation ────────────────────────────────────────────────────────
    public ICollection<Tenant> Tenants { get; set; } = new List<Tenant>();
    public IntakeCase IntakeCase { get; set; } = null!;
}
