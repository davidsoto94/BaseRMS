using BaseRMS.Entities;
using BaseRMS.Enums;
using Microsoft.AspNetCore.Identity;

namespace BaseRMS.Extensions;

public static class IdentitySeeder
{
    public static async Task SeedRolesAndAdminAsync(IServiceProvider serviceProvider)
    {
        using (var scope = serviceProvider.CreateScope())
        {
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            var allEnums = Enum.GetValues(typeof(PermissionEnum)).Cast<PermissionEnum>().ToList();

            // Define roles to seed
            var role = new ApplicationRole() { Name = "Admin", Permitions = allEnums };

            // Seed roles
            if (!await roleManager.RoleExistsAsync(role.Name))
            {
                await roleManager.CreateAsync(role);
            }

            // Define the admin user details
            var adminEmail = "admin@gmail.com";
            var adminPassword = "Admin@123";

            // Check if the admin user already exists
            var userExist = await userManager.FindByEmailAsync(adminEmail);
            if (userExist == null)
            {
                var adminUser = new ApplicationUser
                {
                    UserName = "InitialAdmin",
                    Email = adminEmail,
                    PhoneNumber = "0712345678",
                    EmailConfirmed = true
                };

                // Create the admin user
                var result = await userManager.CreateAsync(adminUser, adminPassword);
                userExist = adminUser;
                if (!result.Succeeded)
                {
                    throw new Exception("Failed to create the admin user: " + string.Join(", ", result.Errors));
                }
            }
            var userRoles = await userManager.GetRolesAsync(userExist!);
            if (!userRoles.Contains("admin"))
            {
                // Assign the Admin role to the user
                await userManager.AddToRoleAsync(userExist!, "Admin");
            }
        }
    }

}
