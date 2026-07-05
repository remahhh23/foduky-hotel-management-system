using Microsoft.EntityFrameworkCore;
using Jarash.Core.Entities;
using Jarash.Core.Interfaces;
using Jarash.Infrastructure.Data;

namespace Jarash.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;

    public AuthService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<User?> AuthenticateAsync(string username, string password)
    {
        var user = await _db.Users
            .Include(x => x.Role)
            .FirstOrDefaultAsync(x => x.Username == username && x.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return null;

        return user;
    }

    public async Task<User> RegisterAsync(string username, string email, string password, string fullName)
    {
        if (await _db.Users.AnyAsync(x => x.Username == username))
            throw new InvalidOperationException("Username already exists");

        if (await _db.Users.AnyAsync(x => x.Email == email))
            throw new InvalidOperationException("Email already exists");

        var userRole = await _db.Roles.FirstAsync(x => x.Name == "User");

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            FullName = fullName,
            RoleId = userRole.Id,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null || !BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }
}
