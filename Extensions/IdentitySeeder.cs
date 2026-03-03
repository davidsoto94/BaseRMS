using BaseRMS.Entities;
using BaseRMS.Enums;
using BaseRMS.Repositories;
using Microsoft.AspNetCore.Identity;

namespace BaseRMS.Extensions;

public static class IdentitySeeder
{
    public static async Task SeedRolesAndAdminAsync(IServiceProvider serviceProvider)
    {
        using (var scope = serviceProvider.CreateScope())
        {
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
            var roleRepository = scope.ServiceProvider.GetRequiredService<RoleRepository>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            var allEnums = Enum.GetValues(typeof(PermissionEnum)).Cast<PermissionEnum>().ToList();

            // Define roles to seed
            var role = roleManager.Roles.FirstOrDefault(r => r.Name == "Admin");
            if (role  == null)
            {
                role = new ApplicationRole() { Name = "Admin", Permitions = allEnums };
                await roleManager.CreateAsync(role);
            }

            if (role.Permitions != allEnums) {
                //This ensures that all permissions added are now in the admin role
                role.Permitions = allEnums;
                await roleRepository.UpdateRolePermissions(role);
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
