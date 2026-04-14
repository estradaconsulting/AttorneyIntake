namespace Hogan4Eviction.Core.Interfaces;

public interface IDocumentStorageService
{
    /// <summary>Upload a file and return its storage key.</summary>
    Task<string> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string caseReferenceNumber,
        CancellationToken ct = default);

    /// <summary>Get a time-limited download URL (Azure SAS) or local path.</summary>
    Task<string> GetDownloadUrlAsync(string storageKey, CancellationToken ct = default);

    Task DeleteAsync(string storageKey, CancellationToken ct = default);
}
