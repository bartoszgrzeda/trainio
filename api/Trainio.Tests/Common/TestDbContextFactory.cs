using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Trainio.Infrastructure.Persistence;

namespace Trainio.Tests.Common;

public static class TestDbContextFactory
{
    public static DbContextOptions<TrainioDbContext> CreateOptions(string databaseName, InMemoryDatabaseRoot root)
    {
        return new DbContextOptionsBuilder<TrainioDbContext>()
            .UseInMemoryDatabase(databaseName, root)
            .Options;
    }
}
