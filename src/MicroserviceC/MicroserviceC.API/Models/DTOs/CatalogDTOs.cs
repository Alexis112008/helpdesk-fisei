namespace MicroserviceC.API.Models.DTOs
{
    public class DamageCatalogDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int AttentionLevel { get; set; }
        public bool IsActive { get; set; }
    }

    public class ServiceCatalogDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int AttentionLevel { get; set; }
        public bool IsActive { get; set; }
        public int DamageCatalogId { get; set; }
        public string DamageName { get; set; } = string.Empty;
    }

    public class CreateDamageDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int AttentionLevel { get; set; } = 1;
    }

    public class CreateServiceDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int AttentionLevel { get; set; } = 1;
        public int DamageCatalogId { get; set; }
    }
}