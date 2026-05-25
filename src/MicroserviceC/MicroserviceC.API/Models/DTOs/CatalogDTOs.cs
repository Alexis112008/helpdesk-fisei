namespace MicroserviceC.API.Models.DTOs
{
    public class DamageCatalogDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;       
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        
    }

    public class ServiceCatalogDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int AttentionLevel { get; set; }
        public int EstimatedTimeHours { get; set; }             
        public bool IsActive { get; set; }
        public int DamageCatalogId { get; set; }
        public string DamageName { get; set; } = string.Empty;
    }

    public class CreateDamageDto
    {
        public string Code { get; set; } = string.Empty;       
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
     
    }

    public class CreateServiceDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int AttentionLevel { get; set; } = 1;
        public int EstimatedTimeHours { get; set; } = 24;      
        public int DamageCatalogId { get; set; }
    }
}