    using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MicroserviceA.API.Data;
using MicroserviceA.API.Models.DTOs;
using MicroserviceA.API.Models.Entities;

namespace MicroserviceA.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class ConfigurationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ConfigurationController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/configuration/levels
        [HttpGet("levels")]
        public async Task<IActionResult> GetLevelConfigs()
        {
            // Configuraciones por defecto
            var defaultConfigs = new List<SystemConfigDto>
            {
                new() { Level = 1, LevelName = "Técnico Básico", ResponseHours = 4, ResolutionHours = 24 },
                new() { Level = 2, LevelName = "Técnico Profesional", ResponseHours = 8, ResolutionHours = 48 },
                new() { Level = 3, LevelName = "DITIC", ResponseHours = 12, ResolutionHours = 72 },
                new() { Level = 4, LevelName = "Proveedor Externo", ResponseHours = 24, ResolutionHours = 120 }
            };

            // Intentar cargar desde BD
            var configs = await _context.SystemConfigs.ToListAsync();
            
            if (configs.Count == 0)
            {
                return Ok(defaultConfigs);
            }

            var result = defaultConfigs.Select(d => new SystemConfigDto
            {
                Level = d.Level,
                LevelName = d.LevelName,
                ResponseHours = GetConfigValue(configs, $"Level{d.Level}_ResponseHours", d.ResponseHours),
                ResolutionHours = GetConfigValue(configs, $"Level{d.Level}_ResolutionHours", d.ResolutionHours)
            }).ToList();

            return Ok(result);
        }

        // PUT: api/configuration/levels
        [HttpPut("levels")]
        public async Task<IActionResult> UpdateLevelConfigs([FromBody] UpdateConfigDto dto)
        {
            foreach (var config in dto.Configs)
            {
                await SaveOrUpdateConfig($"Level{config.Level}_ResponseHours", config.ResponseHours.ToString());
                await SaveOrUpdateConfig($"Level{config.Level}_ResolutionHours", config.ResolutionHours.ToString());
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Configuración actualizada correctamente" });
        }

        

        private async Task SaveOrUpdateConfig(string key, string value)
        {
            var existing = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.ConfigKey == key);
            if (existing == null)
            {
                _context.SystemConfigs.Add(new SystemConfig
                {
                    ConfigKey = key,
                    ConfigValue = value,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.ConfigValue = value;
                existing.UpdatedAt = DateTime.UtcNow;
            }
        }

        private int GetConfigValue(List<SystemConfig> configs, string key, int defaultValue)
        {
            var config = configs.FirstOrDefault(c => c.ConfigKey == key);
            if (config != null && int.TryParse(config.ConfigValue, out int value))
                return value;
            return defaultValue;
        }
        // ========== CONFIGURACIÓN GENERAL ==========

// GET: api/configuration/general
[HttpGet("general")]
public async Task<IActionResult> GetGeneralConfig()
{
    var config = new GeneralConfigDto
    {
        NotificacionesRealtime = GetBoolConfig("NotificacionesRealtime", true),
        AsignacionAutomatica = GetBoolConfig("AsignacionAutomatica", true),
        AlertasCorreo = GetBoolConfig("AlertasCorreo", true),
        ControlSLA = GetBoolConfig("ControlSLA", true),
        TwoFactorAuth = GetBoolConfig("TwoFactorAuth", false),
        ModoMantenimiento = GetBoolConfig("ModoMantenimiento", false)
    };
    return Ok(config);
}

// PUT: api/configuration/general
[HttpPut("general")]
public async Task<IActionResult> UpdateGeneralConfig([FromBody] GeneralConfigDto dto)
{
    await SaveOrUpdateConfig("NotificacionesRealtime", dto.NotificacionesRealtime.ToString());
    await SaveOrUpdateConfig("AsignacionAutomatica", dto.AsignacionAutomatica.ToString());
    await SaveOrUpdateConfig("AlertasCorreo", dto.AlertasCorreo.ToString());
    await SaveOrUpdateConfig("ControlSLA", dto.ControlSLA.ToString());
    await SaveOrUpdateConfig("TwoFactorAuth", dto.TwoFactorAuth.ToString());
    await SaveOrUpdateConfig("ModoMantenimiento", dto.ModoMantenimiento.ToString());
    
    await _context.SaveChangesAsync();
    return Ok(new { message = "Configuración general actualizada" });
}

// ========== FORMATO DE TICKET ==========

// GET: api/configuration/ticket-format
[HttpGet("ticket-format")]
public async Task<IActionResult> GetTicketFormat()
{
    var format = new TicketFormatDto
    {
        Prefix = GetStringConfig("TicketFormat_Prefix", "UTA-"),
        IncludeYear = GetBoolConfig("TicketFormat_IncludeYear", true),
        IncludeMonth = GetBoolConfig("TicketFormat_IncludeMonth", false),
        Digits = GetIntConfig("TicketFormat_Digits", 6)
    };
    return Ok(format);
}

// PUT: api/configuration/ticket-format
[HttpPut("ticket-format")]
public async Task<IActionResult> UpdateTicketFormat([FromBody] TicketFormatDto dto)
{
    await SaveOrUpdateConfig("TicketFormat_Prefix", dto.Prefix);
    await SaveOrUpdateConfig("TicketFormat_IncludeYear", dto.IncludeYear.ToString());
    await SaveOrUpdateConfig("TicketFormat_IncludeMonth", dto.IncludeMonth.ToString());
    await SaveOrUpdateConfig("TicketFormat_Digits", dto.Digits.ToString());
    
    await _context.SaveChangesAsync();
    return Ok(new { message = "Formato de ticket actualizado" });
}

// ========== MÉTODOS AUXILIARES ==========

private bool GetBoolConfig(string key, bool defaultValue)
{
    var config = _context.SystemConfigs.FirstOrDefault(c => c.ConfigKey == key);
    if (config != null && bool.TryParse(config.ConfigValue, out bool value))
        return value;
    return defaultValue;
}

private string GetStringConfig(string key, string defaultValue)
{
    var config = _context.SystemConfigs.FirstOrDefault(c => c.ConfigKey == key);
    return config?.ConfigValue ?? defaultValue;
}

private int GetIntConfig(string key, int defaultValue)
{
    var config = _context.SystemConfigs.FirstOrDefault(c => c.ConfigKey == key);
    if (config != null && int.TryParse(config.ConfigValue, out int value))
        return value;
    return defaultValue;
}
    }
}