using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MicroserviceB.API.Models.Entities
{
    [Table("TicketAttachments")]
    public class TicketAttachment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int TicketId { get; set; }

        [Required]
        public int UserId { get; set; }  

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        public int FileSize { get; set; }

        [Required]
        [MaxLength(100)]
        public string FileType { get; set; } = string.Empty;

        [Required]
        public byte[] FileData { get; set; } = Array.Empty<byte>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("TicketId")]
        public virtual Ticket? Ticket { get; set; }
    }
}