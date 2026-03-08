using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Trainio.Infrastructure.Persistence;

namespace Trainio.Tests.Integration.Common;

public sealed class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"trainio-tests-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("IntegrationTests");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<TrainioDbContext>>();
            services.RemoveAll<TrainioDbContext>();

            services.AddDbContext<TrainioDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));

            using var scope = services.BuildServiceProvider().CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<TrainioDbContext>();
            dbContext.Database.EnsureCreated();
        });
    }

    public HttpClient CreateApiClient()
    {
        return CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });
    }

    public async Task SeedAsync(Func<TrainioDbContext, Task> seedAction)
    {
        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TrainioDbContext>();

        await seedAction(dbContext);
        await dbContext.SaveChangesAsync();
    }
}
