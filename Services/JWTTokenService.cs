using BaseRMS.Configurations;
using BaseRMS.Entities;
using BaseRMS.Enums;
using BaseRMS.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace BaseRMS.Services;

public class JWTTokenService (
    UserManager<ApplicationUser> userManager,
    RoleRepository roleRepository
    )
{
    public async Task<string> GenerateJwtToken(ApplicationUser user, string? scope = null)
    {
        var roles = await userManager.GetRolesAsync(user);

        var allPermissionsPerUser = (await roleRepository.GetApplicationRoles()
            .Where(w => w.Name != null && roles.Contains(w.Name))
            .Select(s => s.Permitions)
            .ToListAsync())
            .SelectMany(s => s)
            .Distinct()
            .Select(p => Enum.GetName(typeof(PermissionEnum), p))
            .ToList();

        var claims = new List<Claim>
         {
            new Claim(JwtRegisteredClaimNames.Sub, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Name, user.UserName ?? ""),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
        };

        // Add permissions only if not a scoped token (like MFA verification)
        if (string.IsNullOrEmpty(scope))
        {
            claims.Add(new Claim("permissions", JsonSerializer.Serialize(allPermissionsPerUser)));
        }
        else
        {
            // For scoped tokens, restrict permissions and add scope claim
            claims.Add(new Claim("scope", scope));
            claims.Add(new Claim("permissions", JsonSerializer.Serialize(new List<string>())));
        }

        var randomKey = Guid.NewGuid().ToString();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable(Constants.JwtKey) ?? randomKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // MFA tokens expire in 15 minutes, regular tokens in 5 minutes
        var expiryMinutes = string.IsNullOrEmpty(scope) ? 5 : 15;

        var token = new JwtSecurityToken(
            issuer: Environment.GetEnvironmentVariable(Constants.JwtIssuer),
            audience: Environment.GetEnvironmentVariable(Constants.JwtAudience),
            claims: claims,
            expires: DateTime.Now.AddMinutes(expiryMinutes),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);

    }

    public RefreshToken GenerateRefreshToken(string ipAddress)
    {
        return new RefreshToken
        {
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            Expires = DateTime.UtcNow.AddDays(7),
            Created = DateTime.UtcNow,
            CreatedByIp = ipAddress
        };

    }
}