namespace MicroserviceA.API.Models.DTOs
{
    // Para crear un usuario nuevo
    public class CreateUserDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int RoleId { get; set; }
    }

    // Para editar un usuario existente
    public class UpdateUserDto
    {
        public string FullName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int RoleId { get; set; }
    }

    // Lo que devuelve la API (nunca devuelves el hash)
    public class UserResponseDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}