using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MicroserviceA.API.Data;
using MicroserviceA.API.Models.Entities;
using MicroserviceA.API.Models.DTOs;
using System.Security.Claims;

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

        // GET: api/user/list
        [HttpGet("list")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFilteredUsers(
            [FromQuery] string? search = null,
            [FromQuery] int? roleId = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _context.Users
                .Include(u => u.Role)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(u => u.FullName.Contains(search) ||
                                          u.Email.Contains(search));
            }

            if (roleId.HasValue)
            {
                query = query.Where(u => u.RoleId == roleId.Value);
            }

            if (isActive.HasValue)
            {
                query = query.Where(u => u.IsActive == isActive.Value);
            }

            var total = await query.CountAsync();
            var users = await query
                .OrderBy(u => u.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserListDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    RoleName = u.Role.Name,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, users });
        }

        // GET: api/user
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
                    Phone = u.Phone,
                    Cedula = u.Cedula,
                    Department = u.Department,
                    Specialty = u.Specialty,
                    Role = u.Role.Name,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/user/5
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
                Phone = user.Phone,
                Cedula = user.Cedula,
                Department = user.Department,
                Specialty = user.Specialty,
                Role = user.Role.Name,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            });
        }

        // 👇 NUEVO: Usuario actualiza su propio perfil (cualquier usuario autenticado)
        [HttpPut("me")]
        [Authorize]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateMyProfileDto dto)
        {
            // Obtener el userId del token JWT
            var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized(new { message = "No se pudo identificar el usuario" });

            int userId = int.Parse(userIdClaim.Value);

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "Usuario no encontrado" });

            // Actualizar solo campos permitidos
            user.FullName = dto.FullName;
            user.Phone = dto.Phone ?? user.Phone;

            // Si cambia el email, validar que no exista
            if (user.Email != dto.Email)
            {
                bool emailExists = await _context.Users
                    .AnyAsync(u => u.Email == dto.Email && u.Id != userId);
                if (emailExists)
                    return BadRequest(new { message = "El correo ya está registrado por otro usuario" });

                if (!dto.Email.EndsWith("@uta.edu.ec"))
                    return BadRequest(new { message = "Solo se permiten correos @uta.edu.ec" });

                user.Email = dto.Email;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Perfil actualizado correctamente" });
        }

        // 👇 NUEVO: Cambiar contraseña
        [HttpPut("me/password")]
        [Authorize]
        public async Task<IActionResult> ChangeMyPassword([FromBody] ChangePasswordDto dto)
        {
            // Obtener el userId del token JWT
            var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized(new { message = "No se pudo identificar el usuario" });

            int userId = int.Parse(userIdClaim.Value);

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "Usuario no encontrado" });

            // Verificar contraseña actual
            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                return BadRequest(new { message = "Contraseña actual incorrecta" });

            // Validar nueva contraseña
            if (string.IsNullOrEmpty(dto.NewPassword) || dto.NewPassword.Length < 6)
                return BadRequest(new { message = "La nueva contraseña debe tener al menos 6 caracteres" });

            // Actualizar contraseña
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Contraseña actualizada correctamente" });
        }

        // POST: api/user
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            if (!dto.Email.EndsWith("@uta.edu.ec"))
                return BadRequest(new { message = "Solo se permiten correos @uta.edu.ec" });

            bool emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (emailExists)
                return BadRequest(new { message = "El correo ya está registrado" });

            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null)
                return BadRequest(new { message = "Rol no válido" });

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Phone = dto.Phone,
                Cedula = dto.Cedula,
                Department = dto.Department,
                Specialty = dto.Specialty,
                RoleId = dto.RoleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = user.Id },
                new { message = "Usuario creado correctamente", userId = user.Id });
        }

        // PUT: api/user/5 (SOLO ADMIN)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Usuario no encontrado" });

            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null)
                return BadRequest(new { message = "Rol no válido" });

            // Verificar que el nuevo email no exista en otro usuario
            if (user.Email != dto.Email)
            {
                bool emailExists = await _context.Users
                    .AnyAsync(u => u.Email == dto.Email && u.Id != id);
                if (emailExists)
                    return BadRequest(new { message = "El correo ya está registrado por otro usuario" });

                if (!dto.Email.EndsWith("@uta.edu.ec"))
                    return BadRequest(new { message = "Solo se permiten correos @uta.edu.ec" });

                user.Email = dto.Email;
            }

            user.FullName = dto.FullName;
            user.Phone = dto.Phone;
            user.Cedula = dto.Cedula;
            user.Department = dto.Department;
            user.Specialty = dto.Specialty;
            user.IsActive = dto.IsActive;
            user.RoleId = dto.RoleId;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Usuario actualizado correctamente" });
        }

        // DELETE: api/user/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Usuario no encontrado" });

            user.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Usuario desactivado correctamente" });
        }

        // GET: api/user/roles
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