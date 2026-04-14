using Hogan4Eviction.Core.DTOs;
using Hogan4Eviction.Core.Enums;
using Hogan4Eviction.Core.Interfaces;
using Hogan4Eviction.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Hogan4Eviction.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IntakeCasesController : ControllerBase
{
    private readonly IIntakeCaseRepository _repo;
    private readonly ILogger<IntakeCasesController> _logger;
    private readonly IWebHostEnvironment _environment;

    public IntakeCasesController(
        IIntakeCaseRepository repo,
        ILogger<IntakeCasesController> logger,
        IWebHostEnvironment environment)
    {
        _repo = repo;
        _logger = logger;
        _environment = environment;
    }

    /// <summary>List all submitted intake cases (staff view).</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<IntakeCaseSummaryDto>>> GetAll(CancellationToken ct)
    {
        var cases = await _repo.GetAllAsync(ct);
        var summaries = cases.Select(MapToSummary).ToList();
        return Ok(summaries);
    }

    /// <summary>Get full detail of a single case.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<IntakeCase>> GetById(int id, CancellationToken ct)
    {
        var c = await _repo.GetByIdAsync(id, ct);
        if (c is null) return NotFound();
        return Ok(c);
    }

    /// <summary>Look up a case by its reference number (e.g. H2025-0001).</summary>
    [HttpGet("by-reference/{referenceNumber}")]
    public async Task<ActionResult<IntakeCaseSummaryDto>> GetByReference(string referenceNumber, CancellationToken ct)
    {
        var c = await _repo.GetByReferenceNumberAsync(referenceNumber, ct);
        if (c is null) return NotFound();
        return Ok(MapToSummary(c));
    }

    /// <summary>
    /// Create a new intake case (saves as Draft — client can upload documents before submitting).
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<IntakeCaseCreatedDto>> Create(
        [FromBody] SubmitIntakeCaseRequest req,
        CancellationToken ct)
    {
        var refNum = await _repo.GenerateReferenceNumberAsync(ct);

        var intakeCase = new IntakeCase
        {
            ReferenceNumber = refNum,
            Status = CaseStatus.Draft,
            PropertyOwner = MapOwner(req.Owner),
            PropertyManager = req.Manager is not null ? MapManager(req.Manager) : null,
            Property = MapProperty(req.Property),
            EvictionCause = req.EvictionCause is not null ? MapEvictionCause(req.EvictionCause) : null,
            NoticeRequest = req.NoticeRequest is not null ? MapNoticeRequest(req.NoticeRequest) : null,
        };

        await _repo.CreateAsync(intakeCase, ct);

        _logger.LogInformation("New intake case created: {RefNum}", refNum);

        return CreatedAtAction(nameof(GetById), new { id = intakeCase.Id },
            new IntakeCaseCreatedDto(
                intakeCase.Id,
                refNum,
                CaseStatus.Draft,
                $"Your intake has been saved. Reference number: {refNum}. " +
                "Please upload your supporting documents and then submit."));
    }

    [HttpPost("local-submit")]
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
            var referenceNumber = document.RootElement.TryGetProperty("referenceNumber", out var refProp)
                ? refProp.GetString()
                : null;

            if (string.IsNullOrWhiteSpace(referenceNumber))
            {
                referenceNumber = $"H{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}-LOCAL";
            }

            var basePath = Path.Combine(_environment.ContentRootPath, "intake-submissions");
            var submissionPath = Path.Combine(basePath, referenceNumber);
            var documentsPath = Path.Combine(submissionPath, "documents");

            Directory.CreateDirectory(documentsPath);

            var storedFiles = new List<object>();
            for (var i = 0; i < (files?.Count ?? 0); i++)
            {
                var file = files![i];
                if (file.Length == 0) continue;

                var safeName = Path.GetFileName(file.FileName);
                var outputName = $"{i + 1:D2}_{safeName}";
                var outputPath = Path.Combine(documentsPath, outputName);

                await using var stream = System.IO.File.Create(outputPath);
                await file.CopyToAsync(stream, ct);

                storedFiles.Add(new
                {
                    originalFileName = safeName,
                    storedFileName = outputName,
                    documentType = fileDocumentTypes is not null && i < fileDocumentTypes.Count
                        ? (int?)fileDocumentTypes[i]
                        : null,
                    fileSizeBytes = file.Length,
                    contentType = file.ContentType
                });
            }

            var savedAt = DateTime.UtcNow;
            var payload = JsonSerializer.Deserialize<object>(submissionJson);
            var envelope = new
            {
                referenceNumber,
                savedAt,
                storageMode = "local-filesystem",
                submission = payload,
                storedFiles
            };

            var jsonPath = Path.Combine(submissionPath, "submission.json");
            await System.IO.File.WriteAllTextAsync(
                jsonPath,
                JsonSerializer.Serialize(envelope, new JsonSerializerOptions { WriteIndented = true }),
                ct);

            _logger.LogInformation("Local intake submission saved at {Path} for {ReferenceNumber}.", jsonPath, referenceNumber);

            return Ok(new
            {
                referenceNumber,
                savedAt,
                message = $"Submission saved locally to {jsonPath}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while saving local submission.");
            return Problem(title: "Unexpected error while saving local submission.", detail: ex.InnerException?.Message ?? ex.Message, statusCode: 500);
        }
    }

    /// <summary>Submit a draft case for review by the law office.</summary>
    [HttpPost("{id:int}/submit")]
    public async Task<ActionResult> Submit(int id, CancellationToken ct)
    {
        try
        {
            var c = await _repo.GetByIdAsync(id, ct);
            if (c is null) return NotFound();
            if (c.Status != CaseStatus.Draft)
                return BadRequest("Only draft cases can be submitted.");

            c.Status = CaseStatus.Submitted;
            c.SubmittedAt = DateTime.UtcNow;
            await _repo.UpdateAsync(c, ct);

            _logger.LogInformation("Case {RefNum} submitted for review.", c.ReferenceNumber);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            var detail = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Database error while submitting case {CaseId}.", id);
            return Problem(title: "Database error while submitting case.", detail: detail, statusCode: 500);
        }
        catch (Exception ex)
        {
            var detail = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Unexpected error while submitting case {CaseId}.", id);
            return Problem(title: "Unexpected error while submitting case.", detail: detail, statusCode: 500);
        }
    }

    /// <summary>Update case status (staff only — future: add [Authorize(Roles="Staff")]).</summary>
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult> UpdateStatus(int id, [FromBody] CaseStatus newStatus, CancellationToken ct)
    {
        var c = await _repo.GetByIdAsync(id, ct);
        if (c is null) return NotFound();

        c.Status = newStatus;
        await _repo.UpdateAsync(c, ct);
        return NoContent();
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

    private static PropertyOwner MapOwner(PropertyOwnerDto d) => new()
    {
        Name = d.Name,
        Address = d.Address,
        Phone = d.Phone,
        Email = d.Email,
        OwnerTypes = d.OwnerTypes,
        TrusteeName = d.TrusteeName
    };

    private static PropertyManager MapManager(PropertyManagerDto d) => new()
    {
        Name = d.Name,
        Company = d.Company,
        Address = d.Address,
        Phone = d.Phone,
        Email = d.Email
    };

    private static Property MapProperty(PropertyDto d) => new()
    {
        Address = d.Address,
        GateCode = d.GateCode,
        IsResidential = d.IsResidential,
        IsCommercial = d.IsCommercial,
        TenantMoveInDate = d.TenantMoveInDate,
        OriginalMonthlyRent = d.OriginalMonthlyRent,
        CurrentRent = d.CurrentRent,
        RentBefore_2020_06_30 = d.RentBefore_2020_06_30,
        RentBefore_2021_06_30 = d.RentBefore_2021_06_30,
        RentBefore_2022_06_30 = d.RentBefore_2022_06_30,
        RentBefore_2023_06_30 = d.RentBefore_2023_06_30,
        RentBefore_2024_06_30 = d.RentBefore_2024_06_30,
        RentBefore_2025_06_30 = d.RentBefore_2025_06_30,
        HasWrittenAgreement = d.HasWrittenAgreement,
        IsVerbalOnly = d.IsVerbalOnly,
        NoAgreement = d.NoAgreement,
        IsTermLease = d.IsTermLease,
        IsMonthToMonth = d.IsMonthToMonth,
        HasAB1482Exemption = d.HasAB1482Exemption,
        HasTenantsBeenAdded = d.HasTenantsBeenAdded,
        AddedTenantMoveInDate = d.AddedTenantMoveInDate,
        ConstructedWithinLast15Years = d.ConstructedWithinLast15Years,
        IsSection8OrSubsidy = d.IsSection8OrSubsidy,
        IsForeclosure = d.IsForeclosure,
        Location = d.Location,
        Tenants = d.Tenants.Select(t => new Tenant
        {
            FullName = t.FullName,
            Race = t.Race,
            Height = t.Height,
            Weight = t.Weight,
            HairColor = t.HairColor,
            FacialHair = t.FacialHair,
            Eyes = t.Eyes,
            Hairstyle = t.Hairstyle,
            CarDescription = t.CarDescription,
            Comments = t.Comments
        }).ToList()
    };

    private static EvictionCause MapEvictionCause(EvictionCauseDto d) => new()
    {
        NoticeServed = d.NoticeServed,
        NoticeForm = d.NoticeForm,
        AmountOwedAtNotice = d.AmountOwedAtNotice,
        BalanceCalculationExplanation = d.BalanceCalculationExplanation,
        IsSubjectToRentEvictionControl = d.IsSubjectToRentEvictionControl,
        HasCompliedWithRentEvictionControlLaws = d.HasCompliedWithRentEvictionControlLaws,
        RentAcceptedAfterNoticeExpired = d.RentAcceptedAfterNoticeExpired,
        ReceivedRentalAssistanceForNoticeAmount = d.ReceivedRentalAssistanceForNoticeAmount,
        ReceivedRentalAssistanceAfterNoticeDate = d.ReceivedRentalAssistanceAfterNoticeDate,
        PendingApplicationForNoticeAmount = d.PendingApplicationForNoticeAmount,
        PendingApplicationAfterNoticeDate = d.PendingApplicationAfterNoticeDate,
        NonMilitaryConfirmed = d.NonMilitaryConfirmed
    };

    private static NoticeRequest MapNoticeRequest(NoticeRequestDto d) => new()
    {
        NoticeType = d.NoticeType,
        OtherNoticeSpecification = d.OtherNoticeSpecification,
        IsResidential = d.IsResidential,
        IsCommercial = d.IsCommercial,
        TenantPropertyAddress = d.TenantPropertyAddress,
        MonthlyRent = d.MonthlyRent,
        CurrentBalanceDue = d.CurrentBalanceDue,
        BalanceCalculationExplanation = d.BalanceCalculationExplanation,
        MethodOfPayment = d.MethodOfPayment,
        PaymentDueOnFirst = d.PaymentDueOnFirst,
        PaymentRecipient = d.PaymentRecipient,
        PaymentDeliveryAddress = d.PaymentDeliveryAddress,
        AlternatePaymentAddress = d.AlternatePaymentAddress,
        TenantContactPhone = d.TenantContactPhone,
        UsualPaymentDaysHours = d.UsualPaymentDaysHours,
        PaymentByMailOnly = d.PaymentByMailOnly,
        OtherCausesForNotice = d.OtherCausesForNotice,
        HasWrittenAgreement = d.HasWrittenAgreement,
        IsVerbalOnly = d.IsVerbalOnly,
        NoAgreement = d.NoAgreement,
        IsForeclosure = d.IsForeclosure
    };
}
