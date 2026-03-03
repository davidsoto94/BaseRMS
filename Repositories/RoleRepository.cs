using BaseRMS.DbContexts;
using BaseRMS.Entities;
using Microsoft.EntityFrameworkCore;

namespace BaseRMS.Repositories;

public class RoleRepository(ApplicationDbContext applicationDbContext)
{
    private readonly ApplicationDbContext _applicationDbContext = applicationDbContext;

    public IQueryable<ApplicationRole> GetApplicationRoles()
    {
        return _applicationDbContext.ApplicationRoles.AsNoTracking().AsQueryable();
    }

    public async Task UpdateRolePermissions(ApplicationRole role)
    {
        _applicationDbContext.Entry(role).State = EntityState.Modified;
        await _applicationDbContext.SaveChangesAsync();
        _applicationDbContext.Entry(role).State = EntityState.Detached;
    }
}
