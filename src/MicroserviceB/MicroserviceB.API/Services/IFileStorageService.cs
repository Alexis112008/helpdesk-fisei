using Microsoft.AspNetCore.Http;

namespace MicroserviceB.API.Services
{
    public interface IFileStorageService
    {
        /// <summary>
        /// Obtiene un archivo por su ID
        /// </summary>
        Task<FileStorageResult?> GetFileAsync(int id);

        /// <summary>
        /// Elimina un archivo
        /// </summary>
        Task<bool> DeleteFileAsync(int id);
    }

    public class FileStorageResult
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public int FileSize { get; set; }
        public string FileType { get; set; } = string.Empty;
        public byte[]? FileData { get; set; }
        public string? FilePath { get; set; }
    }
}