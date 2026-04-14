using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Hogan4Eviction.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Hogan4Eviction.Infrastructure.Services;

/// <summary>
/// Azure Blob Storage implementation — used in staging/production.
/// Configure Storage:Provider = "Azure" in appsettings or environment variables.
///
/// Required config keys:
///   Azure:BlobStorage:ConnectionString
///   Azure:BlobStorage:ContainerName
/// </summary>
public class AzureBlobStorageService : IDocumentStorageService
{
    private readonly BlobContainerClient _container;

    public AzureBlobStorageService(IConfiguration config)
    {
        var connectionString = config["Azure:BlobStorage:ConnectionString"]
            ?? throw new InvalidOperationException("Azure:BlobStorage:ConnectionString is not configured.");
        var containerName = config["Azure:BlobStorage:ContainerName"] ?? "case-documents";

        _container = new BlobContainerClient(connectionString, containerName);
        _container.CreateIfNotExists(PublicAccessType.None);
    }

    public async Task<string> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string caseReferenceNumber,
        CancellationToken ct = default)
    {
        var safeRef = caseReferenceNumber.Replace('/', '-');
        var blobName = $"{safeRef}/{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";

        var blobClient = _container.GetBlobClient(blobName);
        await blobClient.UploadAsync(fileStream, new BlobHttpHeaders { ContentType = contentType }, cancellationToken: ct);

        return blobName;
    }

    public async Task<string> GetDownloadUrlAsync(string storageKey, CancellationToken ct = default)
    {
        var blobClient = _container.GetBlobClient(storageKey);

        // Generate a SAS URL valid for 1 hour
        if (blobClient.CanGenerateSasUri)
        {
            var sasUri = blobClient.GenerateSasUri(BlobSasPermissions.Read, DateTimeOffset.UtcNow.AddHours(1));
            return sasUri.ToString();
        }

        // Fallback: return blob URI (requires public access or caller must be authenticated)
        return blobClient.Uri.ToString();
    }

    public async Task DeleteAsync(string storageKey, CancellationToken ct = default)
    {
        var blobClient = _container.GetBlobClient(storageKey);
        await blobClient.DeleteIfExistsAsync(cancellationToken: ct);
    }
}
