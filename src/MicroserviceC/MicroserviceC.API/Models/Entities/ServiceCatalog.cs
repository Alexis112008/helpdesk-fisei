public class ServiceCatalog
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int AttentionLevel { get; set; } = 1;
    public int EstimatedTimeHours { get; set; } = 24;
    public bool IsActive { get; set; } = true;
    public int DamageCatalogId { get; set; }

    public DamageCatalog DamageCatalog { get; set; } = null!;
}