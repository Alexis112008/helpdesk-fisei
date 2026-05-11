using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MicroserviceA.API.Data;
using MicroserviceA.API.Models.DTOs;
using MicroserviceA.API.Services;

namespace MicroserviceA.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly TokenService _tokenService;

        public AuthController(AppDbContext context, TokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            // Buscar usuario por email incluyendo su rol
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == request.Email
                                       && u.IsActive);

            if (user == null)
                return Unauthorized(new { message = "Credenciales incorrectas" });

            // Verificar contraseña con BCrypt
            bool passwordValid = BCrypt.Net.BCrypt.Verify(
                                     request.Password, user.PasswordHash);

            if (!passwordValid)
                return Unauthorized(new { message = "Credenciales incorrectas" });

            // Generar token JWT
            var token = _tokenService.GenerateToken(user);

            return Ok(new LoginResponseDto
            {
                Token = token,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.Name,
                ExpiresAt = DateTime.UtcNow.AddHours(8)
            });
        }
    }
}