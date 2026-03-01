using BaseRMS.DbContexts;
using BaseRMS.Entities;
using Microsoft.EntityFrameworkCore;

namespace BaseRMS.Repositories;

public class EventLoggerRepository(ApplicationDbContext applicationDbContext)
{
    private readonly ApplicationDbContext _applicationDbContext = applicationDbContext;

    public IQueryable<EventLogger> GetEventLogs()
    {
        return _applicationDbContext.EventLogs.AsNoTracking().AsQueryable();
    }

    public async Task AddEventLogAsync(EventLogger eventLogger)
    {
        _applicationDbContext.EventLogs.Add(eventLogger);
        await _applicationDbContext.SaveChangesAsync();
    }
}
