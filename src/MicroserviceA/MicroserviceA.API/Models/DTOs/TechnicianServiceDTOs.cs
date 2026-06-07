namespace MicroserviceA.API.Models.DTOs
{
    /// <summary>
    /// DTO para crear una asignación técnico → servicio.
    /// El nivel NO se acepta desde el cliente: se deriva del rol del técnico
    /// para garantizar el escalamiento progresivo de HU7.
    /// </summary>
    public class TechnicianServiceDto
    {
        public int TechnicianId { get; set; }
        public int ServiceCatalogId { get; set; }
    }

    /// <summary>
    /// Respuesta enriquecida con nombre del técnico y rol.
    /// El Level mostrado coincide siempre con el nivel del rol.
    /// </summary>
    public class TechnicianServiceResponseDto
    {
        public int Id { get; set; }
        public int TechnicianId { get; set; }
        public string TechnicianName { get; set; } = string.Empty;
        public string TechnicianEmail { get; set; } = string.Empty;
        public string TechnicianRole { get; set; } = string.Empty;
        public int ServiceCatalogId { get; set; }
        public int Level { get; set; }
        public bool IsActive { get; set; }
    }
}
