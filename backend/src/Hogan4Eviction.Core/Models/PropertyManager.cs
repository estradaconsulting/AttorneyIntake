namespace Hogan4Eviction.Core.Models;

public class PropertyManager
{
    public int Id { get; set; }
    public int IntakeCaseId { get; set; }

    public string? Name { get; set; }
    public string? Company { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }

    public IntakeCase IntakeCase { get; set; } = null!;
}
