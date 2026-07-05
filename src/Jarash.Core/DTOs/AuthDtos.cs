namespace Jarash.Core.DTOs;

public record LoginRequest(string Username, string Password);

public record RegisterRequest(string Username, string Email, string Password, string FullName);

public record RefreshTokenRequest(string RefreshToken);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserInfo User
);

public record UserInfo(
    Guid Id,
    string Username,
    string Email,
    string FullName,
    string Role
);

public record ChangePasswordRequest(Guid UserId, string CurrentPassword, string NewPassword);

public record ErrorResponse(string Message, string? Details = null);
