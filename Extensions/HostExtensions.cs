using Microsoft.EntityFrameworkCore;

namespace BaseRMS.Extensions;

public static class HostExtensions
{
    public static IHost MigrateDatabase<TContext>(this IHost host) where TContext : DbContext
    {
        using (var scope = host.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
            try
            {
                var dbContext = services.GetRequiredService<TContext>();
                // Apply pending migrations
                dbContext.Database.Migrate();
            }
            catch (Exception ex)
            {
                // Log errors here
                Console.WriteLine($"An error occurred while migrating the database: {ex.Message}");
                throw;
            }
        }
        return host;
    }

}
