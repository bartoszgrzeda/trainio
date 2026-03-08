using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Trainio.Application.Common.Persistence;
using Trainio.Infrastructure.Persistence;

namespace Trainio.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddDbContext<TrainioDbContext>(options =>
            options.UseInMemoryDatabase("trainio"));

        services.AddScoped<IRepositoryFactory, RepositoryFactory>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        return services;
    }
}
