using Jarash.Core.Entities;

namespace Jarash.Core.Interfaces;

public interface IAuthService
{
    Task<User?> AuthenticateAsync(string username, string password);
    Task<User> RegisterAsync(string username, string email, string password, string fullName);
    Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
}
