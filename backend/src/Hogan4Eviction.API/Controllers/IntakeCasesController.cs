using Hogan4Eviction.Core.DTOs;
using Hogan4Eviction.Core.Enums;
using Hogan4Eviction.Core.Interfaces;
using Hogan4Eviction.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Hogan4Eviction.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]                          // C-01: staff-only by default
public class IntakeCasesController : ControllerBase
{
    private readonly IIntakeCaseRepository _repo;
    private readonly IAuditService _audit;
    private readonly ILogger<IntakeCasesController> _logger;
    private readonly IWebHostEnvironment _environment;

    // C-03: Strict allowlist for client-supplied reference numbers used in path building
    private static readonly Regex SafeRefNumRegex =
        new(@"^H\d{4}-\d{4}-[A-F0-9]{4}(-LOCAL)?$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public IntakeCasesController(
        IIntakeCaseRepository repo,
        IAuditService audit,
        ILogger<IntakeCasesController> logger,
        IWebHostEnvironment environment)
    {
        _repo        = repo;
        _audit       = audit;
        _logger      = logger;
        _environment = environment;
    }

    // ── Staff endpoints ───────────────────────────────────────────────────────

    /// <summary>List all submitted intake cases (staff view).</summary>
    [HttpGet]
    [EnableRateLimiting("GeneralApi")]
    public async Task<ActionResult<IReadOnlyList<IntakeCaseSummaryDto>>> GetAll(CancellationToken ct)
    {
        var cases = await _repo.GetAllAsync(ct);
        await _audit.LogAsync(User.Identity?.Name ?? "unknown", "LIST", "IntakeCase", "*", "Listed all cases", ct);
        return Ok(cases.Select(MapToSummary).ToList());
    }

    /// <summary>Get full detail of a single case (staff only — includes PII).</summary>
    [HttpGet("{id:int}")]
    [EnableRateLimiting("GeneralApi")]
    public async Task<ActionResult<IntakeCaseDetailDto>> GetById(int id, CancellationToken ct)
    {
        var c = await _repo.GetByIdAsync(id, ct);
        if (c is null) return NotFound();
        await _audit.LogAsync(User.Identity?.Name ?? "unknown", "READ", "IntakeCase", id.ToString(), $"Viewed case {c.ReferenceNumber}", ct);
        return Ok(MapToDetail(c));
    }

    /// <summary>Look up a case by reference number (staff only).</summary>
    [HttpGet("by-reference/{referenceNumber}")]
    [EnableRateLimiting("GeneralApi")]
    public async Task<ActionResult<IntakeCaseSummaryDto>> GetByReference(string referenceNumber, CancellationToken ct)
    {
        var c = await _repo.GetByReferenceNumberAsync(referenceNumber, ct);
        if (c is null) return NotFound();
        await _audit.LogAsync(User.Identity?.Name ?? "unknown", "READ", "IntakeCase", referenceNumber, "Lookup by reference", ct);
        return Ok(MapToSummary(c));
    }

    /// <summary>Update case status (staff only).</summary>
    [HttpPatch("{id:int}/status")]
    [EnableRateLimiting("WritesAndUploads")]
    public async Task<ActionResult> UpdateStatus(int id, [FromBody] CaseStatus newStatus, CancellationToken ct)
    {
        var c = await _repo.GetByIdAsync(id, ct);
        if (c is null) return NotFound();

        var previous = c.Status;
        c.Status = newStatus;
        await _repo.UpdateAsync(c, ct);
        await _audit.LogAsync(User.Identity?.Name ?? "unknown", "UPDATE_STATUS", "IntakeCase", id.ToString(), $"{previous} -> {newStatus}", ct);
        return NoContent();
    }

    // ── Public/client endpoints (AllowAnonymous) ──────────────────────────────

    /// <summary>Create a new intake case (client-facing — public).</summary>
    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("WritesAndUploads")]
    public async Task<ActionResult<IntakeCaseCreatedDto>> Create(
        [FromBody] SubmitIntakeCaseRequest req,
        CancellationToken ct)
    {
        var refNum = await _repo.GenerateReferenceNumberAsync(ct);

        var intakeCase = new IntakeCase
        {
            ReferenceNumber = refNum,
            Status          = CaseStatus.Draft,
            PropertyOwner   = MapOwner(req.Owner),
            PropertyManager = req.Manager is not null ? MapManager(req.Manager) : null,
            Property        = MapProperty(req.Property),
            EvictionCause   = req.EvictionCause is not null ? MapEvictionCause(req.EvictionCause) : null,
            NoticeRequest   = req.NoticeRequest is not null ? MapNoticeRequest(req.NoticeRequest) : null,
        };

        await _repo.CreateAsync(intakeCase, ct);
        _logger.LogInformation("New intake case created: {RefNum}", refNum);
        await _audit.LogAsync("client", "CREATE", "IntakeCase", intakeCase.Id.ToString(), $"Draft created {refNum}", ct);

        return CreatedAtAction(nameof(GetById), new { id = intakeCase.Id },
            new IntakeCaseCreatedDto(
                intakeCase.Id,
                refNum,
                CaseStatus.Draft,
                $"Your intake has been saved. Reference: {refNum}. Please upload supporting documents and then submit."));
    }

    /// <summary>Submit all form data + documents as a single local package (client-facing — public).</summary>
    [HttpPost("local-submit")]
    [AllowAnonymous]
    [EnableRateLimiting("WritesAndUploads")]
    [RequestSizeLimit(52_428_800)]
    public async Task<ActionResult> LocalSubmit(
        [FromForm] string submissionJson,
        [FromForm] List<IFormFile>? files,
        [FromForm] List<int>? fileDocumentTypes,
        CancellationToken ct)
    {
        try
        {
            using var document = JsonDocument.Parse(submissionJson);

            // C-03: Extract reference number from JSON then validate it before any path use
            var referenceNumber = document.RootElement.TryGetProperty("referenceNumber", out var refProp)
                ? refProp.GetString()
                : null;

            if (string.IsNullOrWhiteSpace(referenceNumber))
            {
                // Generate a safe local reference number server-side
                referenceNumber = $"H{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}-{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}-LOCAL";
            }

            // C-03: Validate reference number against strict allowlist before using in path
            if (!SafeRefNumRegex.IsMatch(referenceNumber))
            {
                _logger.LogWarning("Rejected unsafe referenceNumber in local-submit: {Ref}", referenceNumber);
                return BadRequest("Invalid reference number format.");
            }

            var basePath       = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, "intake-submissions"));
            var submissionPath = Path.GetFullPath(Path.Combine(basePath, referenceNumber));
            var documentsPath  = Path.GetFullPath(Path.Combine(submissionPath, "documents"));

            // C-03: Confirm path resolution stays under basePath
            if (!submissionPath.StartsWith(basePath + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Path traversal blocked in local-submit. Ref: {Ref}", referenceNumber);
                return BadRequest("Invalid reference number.");
            }

            Directory.CreateDirectory(documentsPath);

            var storedFiles = new List<object>();
            for (var i = 0; i < (files?.Count ?? 0); i++)
            {
                var file = files![i];
                if (file.Length == 0) continue;

                var safeName   = Path.GetFileName(file.FileName);
                var outputName = $"{i + 1:D2}_{safeName}";
                var outputPath = Path.GetFullPath(Path.Combine(documentsPath, outputName));

                // C-03: Confirm each file path is inside documentsPath
                if (!outputPath.StartsWith(documentsPath + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                    continue;

                await using var stream = System.IO.File.Create(outputPath);
                await file.CopyToAsync(stream, ct);

                storedFiles.Add(new
                {
                    originalFileName = safeName,
                    storedFileName   = outputName,
                    documentType     = fileDocumentTypes is not null && i < fileDocumentTypes.Count
                        ? (int?)fileDocumentTypes[i]
                        : null,
                    fileSizeBytes = file.Length,
                    contentType   = file.ContentType,
                });
            }

            var savedAt  = DateTime.UtcNow;
            var payload  = JsonSerializer.Deserialize<object>(submissionJson);
            var envelope = new { referenceNumber, savedAt, storageMode = "local-filesystem", submission = payload, storedFiles };

            var jsonPath = Path.Combine(submissionPath, "submission.json");
            await System.IO.File.WriteAllTextAsync(
                jsonPath,
                JsonSerializer.Serialize(envelope, new JsonSerializerOptions { WriteIndented = true }),
                ct);

            _logger.LogInformation("Local intake saved at {Path} for {Ref}", jsonPath, referenceNumber);
            await _audit.LogAsync("client", "LOCAL_SUBMIT", "IntakeCase", referenceNumber, $"Local submission saved ({storedFiles.Count} files)", ct);

            return Ok(new { referenceNumber, savedAt, message = $"Submission saved locally." });
        }
        catch (Exception ex)
        {
            // H-03: Log full detail internally; return generic message to client
            _logger.LogError(ex, "Unexpected error in local-submit.");
            return Problem(title: "An unexpected error occurred. Please try again.", statusCode: 500);
        }
    }

    /// <summary>Submit a draft case for review (client-facing — public).</summary>
    [HttpPost("{id:int}/submit")]
    [AllowAnonymous]
    [EnableRateLimiting("WritesAndUploads")]
    public async Task<ActionResult> Submit(int id, CancellationToken ct)
    {
        try
        {
            var c = await _repo.GetByIdAsync(id, ct);
            if (c is null) return NotFound();
            if (c.Status != CaseStatus.Draft)
                return BadRequest("Only draft cases can be submitted.");

            c.Status      = CaseStatus.Submitted;
            c.SubmittedAt = DateTime.UtcNow;
            await _repo.UpdateAsync(c, ct);

            _logger.LogInformation("Case {RefNum} submitted for review.", c.ReferenceNumber);
            await _audit.LogAsync("client", "SUBMIT", "IntakeCase", id.ToString(), $"Case {c.ReferenceNumber} submitted", ct);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            // H-03: Log detail; send generic message
            _logger.LogError(ex, "Database error while submitting case {Id}.", id);
            return Problem(title: "A database error occurred. Please try again.", statusCode: 500);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while submitting case {Id}.", id);
            return Problem(title: "An unexpected error occurred. Please try again.", statusCode: 500);
        }
    }

    // ── Mapping helpers ───────────────────────────────────────────────────────

    private static IntakeCaseSummaryDto MapToSummary(IntakeCase c) => new(
        c.Id,
        c.ReferenceNumber,
        c.Status,
        c.PropertyOwner?.Name ?? "—",
        c.Property?.Address ?? "—",
        c.CreatedAt,
        c.SubmittedAt,
        c.Documents.Count
    );

    // H-01: Staff detail DTO includes tenant PII but is only returned to authenticated staff
    private static IntakeCaseDetailDto MapToDetail(IntakeCase c) => new(
        c.Id,
        c.ReferenceNumber,
        c.Status,
        c.CreatedAt,
        c.SubmittedAt,
        c.PropertyOwner,
        c.PropertyManager,
        c.Property,
        c.EvictionCause,
        c.NoticeRequest,
        c.Documents.ToList()
    );

    private static PropertyOwner MapOwner(PropertyOwnerDto d) => new()
    {
        Name       = d.Name,
        Address    = d.Address,
        Phone      = d.Phone,
        Email      = d.Email,
        OwnerTypes = d.OwnerTypes,
        TrusteeName = d.TrusteeName,
    };

    private static PropertyManager MapManager(PropertyManagerDto d) => new()
    {
        Name    = d.Name,
        Company = d.Company,
        Address = d.Address,
        Phone   = d.Phone,
        Email   = d.Email,
    };

    private static Property MapProperty(PropertyDto d) => new()
    {
        Address                     = d.Address,
        GateCode                    = d.GateCode,
        IsResidential               = d.IsResidential,
        IsCommercial                = d.IsCommercial,
        TenantMoveInDate            = d.TenantMoveInDate,
        OriginalMonthlyRent         = d.OriginalMonthlyRent,
        CurrentRent                 = d.CurrentRent,
        RentBefore_2020_06_30       = d.RentBefore_2020_06_30,
        RentBefore_2021_06_30       = d.RentBefore_2021_06_30,
        RentBefore_2022_06_30       = d.RentBefore_2022_06_30,
        RentBefore_2023_06_30       = d.RentBefore_2023_06_30,
        RentBefore_2024_06_30       = d.RentBefore_2024_06_30,
        RentBefore_2025_06_30       = d.RentBefore_2025_06_30,
        HasWrittenAgreement         = d.HasWrittenAgreement,
        IsVerbalOnly                = d.IsVerbalOnly,
        NoAgreement                 = d.NoAgreement,
        IsTermLease                 = d.IsTermLease,
        IsMonthToMonth              = d.IsMonthToMonth,
        HasAB1482Exemption          = d.HasAB1482Exemption,
        HasTenantsBeenAdded         = d.HasTenantsBeenAdded,
        AddedTenantMoveInDate       = d.AddedTenantMoveInDate,
        ConstructedWithinLast15Years = d.ConstructedWithinLast15Years,
        IsSection8OrSubsidy         = d.IsSection8OrSubsidy,
        IsForeclosure               = d.IsForeclosure,
        Location                    = d.Location,
        Tenants                     = d.Tenants.Select(t => new Tenant
        {
            FullName        = t.FullName,
            Race            = t.Race,
            Height          = t.Height,
            Weight          = t.Weight,
            HairColor       = t.HairColor,
            FacialHair      = t.FacialHair,
            Eyes            = t.Eyes,
            Hairstyle       = t.Hairstyle,
            CarDescription  = t.CarDescription,
            Comments        = t.Comments,
        }).ToList(),
    };

    private static EvictionCause MapEvictionCause(EvictionCauseDto d) => new()
    {
        NoticeServed                            = d.NoticeServed,
        NoticeForm                              = d.NoticeForm,
        AmountOwedAtNotice                      = d.AmountOwedAtNotice,
        BalanceCalculationExplanation           = d.BalanceCalculationExplanation,
        IsSubjectToRentEvictionControl          = d.IsSubjectToRentEvictionControl,
        HasCompliedWithRentEvictionControlLaws  = d.HasCompliedWithRentEvictionControlLaws,
        RentAcceptedAfterNoticeExpired          = d.RentAcceptedAfterNoticeExpired,
        ReceivedRentalAssistanceForNoticeAmount = d.ReceivedRentalAssistanceForNoticeAmount,
        ReceivedRentalAssistanceAfterNoticeDate = d.ReceivedRentalAssistanceAfterNoticeDate,
        PendingApplicationForNoticeAmount       = d.PendingApplicationForNoticeAmount,
        PendingApplicationAfterNoticeDate       = d.PendingApplicationAfterNoticeDate,
        NonMilitaryConfirmed                    = d.NonMilitaryConfirmed,
    };

    private static NoticeRequest MapNoticeRequest(NoticeRequestDto d) => new()
    {
        NoticeType                    = d.NoticeType,
        OtherNoticeSpecification      = d.OtherNoticeSpecification,
        IsResidential                 = d.IsResidential,
        IsCommercial                  = d.IsCommercial,
        TenantPropertyAddress         = d.TenantPropertyAddress,
        MonthlyRent                   = d.MonthlyRent,
        CurrentBalanceDue             = d.CurrentBalanceDue,
        BalanceCalculationExplanation = d.BalanceCalculationExplanation,
        MethodOfPayment               = d.MethodOfPayment,
        PaymentDueOnFirst             = d.PaymentDueOnFirst,
        PaymentRecipient              = d.PaymentRecipient,
        PaymentDeliveryAddress        = d.PaymentDeliveryAddress,
        AlternatePaymentAddress       = d.AlternatePaymentAddress,
        TenantContactPhone            = d.TenantContactPhone,
        UsualPaymentDaysHours         = d.UsualPaymentDaysHours,
        PaymentByMailOnly             = d.PaymentByMailOnly,
        OtherCausesForNotice          = d.OtherCausesForNotice,
        HasWrittenAgreement           = d.HasWrittenAgreement,
        IsVerbalOnly                  = d.IsVerbalOnly,
        NoAgreement                   = d.NoAgreement,
        IsForeclosure                 = false,
    };
}
