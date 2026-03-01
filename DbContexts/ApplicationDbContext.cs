using BaseRMS.Entities;
using BaseRMS.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace BaseRMS.DbContexts;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<ApplicationUser, ApplicationRole, string>(options)
{

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
#if DEBUG
        optionsBuilder.EnableSensitiveDataLogging();
#endif
    }


    public required DbSet<ApplicationRole> ApplicationRoles { get; set; }
    public required DbSet<ApplicationUser> ApplicationUsers { get; set; }
    public required DbSet<RefreshToken> RefreshTokens { get; set; }
    public required DbSet<TrustedDevice> TrustedDevices { get; set; }
    public required DbSet<EventLogger> EventLogs { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configure the default schema for all entities in this context
        modelBuilder.HasDefaultSchema("rms");

        ConfigurePropertyConversions(modelBuilder);

        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationUser>().ToTable("asp_net_users");
        modelBuilder.Entity<IdentityUserToken<string>>().ToTable("asp_net_user_tokens");
        modelBuilder.Entity<IdentityUserLogin<string>>().ToTable("asp_net_user_logins");
        modelBuilder.Entity<IdentityUserClaim<string>>().ToTable("asp_net_user_claims");
        modelBuilder.Entity<ApplicationRole>().ToTable("asp_net_roles");
        modelBuilder.Entity<IdentityUserRole<string>>().ToTable("asp_net_user_roles");
        modelBuilder.Entity<IdentityRoleClaim<string>>().ToTable("asp_net_role_claims");

    }

    /// <summary>
	/// This method converts properties that are lists of enums to be stored as
	/// comma-separated lists of string values in the database.
	/// </summary>
	/// <param name="modelBuilder"></param>
	private void ConfigurePropertyConversions(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ApplicationRole>(entity =>
        {
            entity.Property(e => e.Permitions)
                .HasConversion(
                    v => string.Join(',', v.Select(e => e.ToString())),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                          .Select(e => Enum.Parse<PermissionEnum>(e))
                          .ToList());
        });

        modelBuilder.Entity<EventLogger>(entity =>
        {
            entity.Property(e => e.EventTypes)
                .HasConversion(
                v => string.Join(',', v),
                v => v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => Enum.Parse<EventTypeEnum>(x))
                    .ToHashSet(),
                new ValueComparer<ICollection<EventTypeEnum>>(
                    (c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),
                    c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                    c => c.ToList()));
        });

    }

}
