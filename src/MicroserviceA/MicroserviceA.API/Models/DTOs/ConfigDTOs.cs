namespace MicroserviceA.API.Models.DTOs
{
    public class SystemConfigDto
    {
        public int Level { get; set; }
        public string LevelName { get; set; } = string.Empty;
        public int ResponseHours { get; set; }
        public int ResolutionHours { get; set; }
    }

    public class UpdateConfigDto
    {
        public List<SystemConfigDto> Configs { get; set; } = new();
    }
    // Agrega al final del archivo ConfigDTOs.cs

public class GeneralConfigDto
{
    public bool NotificacionesRealtime { get; set; } = true;
    public bool AsignacionAutomatica { get; set; } = true;
    public bool AlertasCorreo { get; set; } = true;
    public bool ControlSLA { get; set; } = true;
    public bool TwoFactorAuth { get; set; } = false;
    public bool ModoMantenimiento { get; set; } = false;
}

public class TicketFormatDto
{
    public string Prefix { get; set; } = "UTA-";
    public bool IncludeYear { get; set; } = true;
    public bool IncludeMonth { get; set; } = false;
    public int Digits { get; set; } = 6;
}
}