using Hogan4Eviction.Core.Interfaces;
using Hogan4Eviction.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace Hogan4Eviction.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly IIntakeCaseRepository _caseRepo;
    private readonly IDocumentStorageService _storage;
    private readonly ILogger<DocumentsController> _logger;

    private static readonly string[] AllowedContentTypes =
        ["application/pdf", "image/jpeg", "image/png", "image/tiff"];

    private const long MaxFileSizeBytes = 25 * 1024 * 1024; // 25 MB

    public DocumentsController(
        IIntakeCaseRepository caseRepo,
        IDocumentStorageService storage,
        ILogger<DocumentsController> logger)
    {
        _caseRepo = caseRepo;
        _storage = storage;
        _logger = logger;
    }

    /// <summary>Upload a document to an existing intake case.</summary>
    [HttpPost("upload/{caseId:int}")]
    [RequestSizeLimit(26_214_400)]
    public async Task<ActionResult<CaseDocument>> Upload(
        int caseId,
        IFormFile file,
        [FromForm] DocumentType documentType,
        [FromForm] string? notes,
        CancellationToken ct)
    {
        var intakeCase = await _caseRepo.GetByIdAsync(caseId, ct);
        if (intakeCase is null) return NotFound("Case not found.");

        if (file.Length == 0) return BadRequest("File is empty.");
        if (file.Length > MaxFileSizeBytes) return BadRequest("File exceeds 25 MB limit.");

        if (!AllowedContentTypes.Contains(file.ContentType))
            return BadRequest("Only PDF, JPEG, PNG, and TIFF files are accepted.");

        await using var stream = file.OpenReadStream();
        var storageKey = await _storage.UploadAsync(
            stream,
            file.FileName,
            file.ContentType,
            intakeCase.ReferenceNumber,
            ct);

        var doc = new CaseDocument
        {
            IntakeCaseId = caseId,
            DocumentType = documentType,
            OriginalFileName = file.FileName,
            StorageKey = storageKey,
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            Notes = notes
        };

        intakeCase.Documents.Add(doc);
        await _caseRepo.UpdateAsync(intakeCase, ct);

        _logger.LogInformation("Document {FileName} uploaded to case {RefNum}", file.FileName, intakeCase.ReferenceNumber);
        return CreatedAtAction(nameof(GetDownloadUrl), new { storageKey = Uri.EscapeDataString(doc.StorageKey) }, doc);
    }

    /// <summary>Get a download URL for a stored document.</summary>
    [HttpGet("download/{*storageKey}")]
    public async Task<ActionResult> GetDownloadUrl(string storageKey, CancellationToken ct)
    {
        var url = await _storage.GetDownloadUrlAsync(storageKey, ct);

        // For local storage, serve the file directly; for Azure, redirect to SAS URL
        if (url.StartsWith("/app/uploads") || url.StartsWith("./uploads"))
        {
            var fullPath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "uploads",
                Uri.UnescapeDataString(storageKey));
            if (!System.IO.File.Exists(fullPath)) return NotFound();
            return PhysicalFile(fullPath, "application/octet-stream", Path.GetFileName(fullPath));
        }

        return Redirect(url);
    }
}
