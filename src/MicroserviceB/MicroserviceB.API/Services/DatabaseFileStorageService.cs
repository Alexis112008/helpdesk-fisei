using Microsoft.AspNetCore.Http;
using MicroserviceB.API.Data;
using MicroserviceB.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace MicroserviceB.API.Services
{
    public class DatabaseFileStorageService : IFileStorageService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DatabaseFileStorageService> _logger;

        public DatabaseFileStorageService(AppDbContext context, ILogger<DatabaseFileStorageService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Solo para obtener archivo
        public async Task<FileStorageResult?> GetFileAsync(int id)
        {
            var attachment = await _context.TicketAttachments.FindAsync(id);
            if (attachment == null) return null;

            return new FileStorageResult
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                FileSize = attachment.FileSize,
                FileType = attachment.FileType,
                FileData = attachment.FileData ?? Array.Empty<byte>()
            };
        }

        // Solo para eliminar archivo
        public async Task<bool> DeleteFileAsync(int id)
        {
            var attachment = await _context.TicketAttachments.FindAsync(id);
            if (attachment == null) return false;

            _context.TicketAttachments.Remove(attachment);
            await _context.SaveChangesAsync();
            return true;
        }

        // Métodos obsoletos (ya no se usan) - puedes dejarlos o comentarlos
        public Task<FileStorageResult> SaveFileAsync(IFormFile file) => throw new NotImplementedException();
        public Task<bool> AssignToTicketAsync(int attachmentId, int ticketId) => throw new NotImplementedException();
    }
}