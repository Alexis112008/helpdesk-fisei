using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MicroserviceC.API.Models.Entities
{
    [Table("KnowledgeArticleAttachments")]
    public class KnowledgeArticleAttachment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int KnowledgeArticleId { get; set; }

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

        [ForeignKey("KnowledgeArticleId")]
        public virtual KnowledgeArticle? KnowledgeArticle { get; set; }
    }
}