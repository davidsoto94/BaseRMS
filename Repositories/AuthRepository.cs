using BaseRMS.DbContexts;
using BaseRMS.Entities;
using Microsoft.EntityFrameworkCore;

namespace BaseRMS.Repositories;

public class AuthRepository(ApplicationDbContext applicationDbContext)
{
    private readonly ApplicationDbContext _applicationDbContext = applicationDbContext;

    public IQueryable<TrustedDevice> GetTrustedDevices()
    {
        return _applicationDbContext.TrustedDevices.AsNoTracking().AsQueryable();
    }
}
