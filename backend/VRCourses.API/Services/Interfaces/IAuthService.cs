using VRCourses.API.Models.DTOs;

namespace VRCourses.API.Services.Interfaces;

public interface IAuthService
{
    Task<string?> RegisterAsync(RegisterDto registerDto);
    Task<string?> LoginAsync(LoginDto loginDto);
}