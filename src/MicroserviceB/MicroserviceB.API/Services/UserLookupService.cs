using System.Text.Json;

namespace MicroserviceB.API.Services
{
    /// <summary>
    /// Obtiene datos del usuario (email, nombre) consultando al Microservicio A.
    /// Se usa para enriquecer los eventos antes de publicarlos al bus.
    /// </summary>
    public interface IUserLookupService
    {
        Task<UserInfo?> GetByIdAsync(int userId);
    }

    public class UserInfo
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class UserLookupService : IUserLookupService
    {
        private readonly IHttpClientFactory _factory;
        private readonly ILogger<UserLookupService> _logger;

        public UserLookupService(IHttpClientFactory factory, ILogger<UserLookupService> logger)
        {
            _factory = factory;
            _logger = logger;
        }

        public async Task<UserInfo?> GetByIdAsync(int userId)
        {
            try
            {
                var client = _factory.CreateClient("AuthClient");
                var response = await client.GetAsync($"/api/user/{userId}");
                if (!response.IsSuccessStatusCode) return null;

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                return new UserInfo
                {
                    Id = root.GetProperty("id").GetInt32(),
                    FullName = root.TryGetProperty("fullName", out var f) ? f.GetString() ?? "" : "",
                    Email = root.TryGetProperty("email", out var e) ? e.GetString() ?? "" : "",
                    Role = root.TryGetProperty("role", out var r) ? r.GetString() ?? "" : ""
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo obtener usuario {UserId}", userId);
                return null;
            }
        }
    }
}
