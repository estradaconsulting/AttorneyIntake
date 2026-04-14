namespace Hogan4Eviction.Core.Models;

public class Tenant
{
    public int Id { get; set; }
    public int PropertyId { get; set; }

    public string FullName { get; set; } = string.Empty;

    // ── Process server fields (Page h of intake pack) ─────────────────────
    public string? Race { get; set; }
    public string? Height { get; set; }
    public string? Weight { get; set; }
    public string? HairColor { get; set; }
    public string? FacialHair { get; set; }
    public string? Eyes { get; set; }
    public string? Hairstyle { get; set; }
    public string? CarDescription { get; set; }
    public string? Comments { get; set; }

    public Property Property { get; set; } = null!;
}
