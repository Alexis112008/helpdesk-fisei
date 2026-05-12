namespace MicroserviceC.API.Models.Entities
{
    public class DamageCatalog
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int AttentionLevel { get; set; } = 1;
        public bool IsActive { get; set; } = true;

        public ICollection<ServiceCatalog> Services { get; set; }
            = new List<ServiceCatalog>();
    }
}