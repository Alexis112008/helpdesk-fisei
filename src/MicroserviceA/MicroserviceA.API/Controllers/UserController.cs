using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MicroserviceA.API.Data;
using MicroserviceA.API.Models.Entities;
using MicroserviceA.API.Models.DTOs;

namespace MicroserviceA.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Todas las rutas requieren token JWT
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/user — listar todos los usuarios
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users
                .Include(u => u.Role)
                .Select(u => new UserResponseDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Role = u.Role.Name,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/user/5 — obtener un usuario por id (usado también
        // por MicroserviceB para lookup de email/nombre al notificar)
        // [AllowAnonymous] permite que otros microservicios consulten datos
        // básicos del usuario sin JWT (comunicación interna).
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound(new { message = "Usuario no encontrado" });

            return Ok(new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.Name,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            });
        }

        // POST: api/user — crear usuario nuevo
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            // Verificar que el correo sea institucional
            if (!dto.Email.EndsWith("@uta.edu.ec"))
                return BadRequest(new { message = "Solo se permiten correos @uta.edu.ec" });

            // Verificar que el correo no exista ya
            bool emailExists = await _context.Users
                .AnyAsync(u => u.Email == dto.Email);

            if (emailExists)
                return BadRequest(new { message = "El correo ya está registrado" });

            // Verificar que el rol existe
            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null)
                return BadRequest(new { message = "Rol no válido" });

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                RoleId = dto.RoleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = user.Id },
                new { message = "Usuario creado correctamente", userId = user.Id });
        }

        // PUT: api/user/5 — editar usuario
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound(new { message = "Usuario no encontrado" });

            // Verificar que el rol existe
            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null)
                return BadRequest(new { message = "Rol no válido" });

            user.FullName = dto.FullName;
            user.IsActive = dto.IsActive;
            user.RoleId = dto.RoleId;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Usuario actualizado correctamente" });
        }

        // DELETE: api/user/5 — desactivar usuario (nunca borrar)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound(new { message = "Usuario no encontrado" });

            // No borramos, solo desactivamos
            user.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Usuario desactivado correctamente" });
        }

        // GET: api/user/roles — listar todos los roles
        [HttpGet("roles")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .Select(r => new { r.Id, r.Name })
                .ToListAsync();

            return Ok(roles);
        }
    }
}