using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Jarash.Core.DTOs;
using Jarash.Core.Entities;
using Jarash.Core.Interfaces;
using Jarash.Infrastructure.Data;

namespace Jarash.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly IJwtService _jwt;
    private readonly AppDbContext _db;

    public AuthController(IAuthService auth, IJwtService jwt, AppDbContext db)
    {
        _auth = auth;
        _jwt = jwt;
        _db = db;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _auth.AuthenticateAsync(request.Username, request.Password);
        if (user == null)
            return Unauthorized(new ErrorResponse("Invalid username or password"));

        var accessToken = _jwt.GenerateAccessToken(user);
        var refreshToken = _jwt.GenerateRefreshToken();

        _db.RefreshTokens.Add(new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
        });
        await _db.SaveChangesAsync();

        return Ok(new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            ExpiresAt: DateTime.UtcNow.AddMinutes(15),
            User: new UserInfo(user.Id, user.Username, user.Email, user.FullName, user.Role?.Name ?? "User")
        ));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var user = await _auth.RegisterAsync(request.Username, request.Email, request.Password, request.FullName);
            var accessToken = _jwt.GenerateAccessToken(user);
            var refreshToken = _jwt.GenerateRefreshToken();

            _db.RefreshTokens.Add(new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
            });
            await _db.SaveChangesAsync();

            return Ok(new AuthResponse(
                AccessToken: accessToken,
                RefreshToken: refreshToken,
                ExpiresAt: DateTime.UtcNow.AddMinutes(15),
                User: new UserInfo(user.Id, user.Username, user.Email, user.FullName, user.Role?.Name ?? "User")
            ));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ErrorResponse(ex.Message));
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var storedToken = await _db.RefreshTokens
            .Include(x => x.User)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Token == request.RefreshToken);

        if (storedToken == null || !storedToken.IsActive)
            return Unauthorized(new ErrorResponse("Invalid or expired refresh token"));

        storedToken.IsRevoked = true;

        var user = storedToken.User;
        var newAccessToken = _jwt.GenerateAccessToken(user);
        var newRefreshToken = _jwt.GenerateRefreshToken();

        _db.RefreshTokens.Add(new RefreshToken
        {
            Token = newRefreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            ReplacedByToken = newRefreshToken,
        });
        await _db.SaveChangesAsync();

        return Ok(new AuthResponse(
            AccessToken: newAccessToken,
            RefreshToken: newRefreshToken,
            ExpiresAt: DateTime.UtcNow.AddMinutes(15),
            User: new UserInfo(user.Id, user.Username, user.Email, user.FullName, user.Role?.Name ?? "User")
        ));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
    {
        var storedToken = await _db.RefreshTokens
            .FirstOrDefaultAsync(x => x.Token == request.RefreshToken);

        if (storedToken != null)
        {
            storedToken.IsRevoked = true;
            await _db.SaveChangesAsync();
        }

        return Ok();
    }
}
