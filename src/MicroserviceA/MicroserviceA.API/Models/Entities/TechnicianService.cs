using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MicroserviceA.API.Models.Entities
{
    public class TechnicianService
    {
        [Key]
        public int Id { get; set; }

        public int TechnicianId { get; set; }

        public int ServiceCatalogId { get; set; }

        public int Level { get; set; }

        public bool IsActive { get; set; } = true;

        // Relaciones (opcional, pero útil)
        [ForeignKey("TechnicianId")]
        public virtual User Technician { get; set; }

        // Nota: ServiceCatalog está en otro microservicio (C)
        // Por eso NO pones FK real aquí, solo guardas el ID
    }
}