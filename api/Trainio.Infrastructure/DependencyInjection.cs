using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Trainio.Application.Features.Clients;
using Trainio.Application.Features.Exercises;
using Trainio.Application.Features.Profile;
using Trainio.Infrastructure.Features.Clients;
using Trainio.Infrastructure.Features.Exercises;
using Trainio.Infrastructure.Features.Profile;
using Trainio.Infrastructure.Persistence;

namespace Trainio.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddDbContext<TrainioDbContext>(options =>
            options.UseInMemoryDatabase("trainio"));

        services.AddScoped<IClientRepository, ClientRepository>();
        services.AddScoped<IExerciseRepository, ExerciseRepository>();
        services.AddScoped<IProfileRepository, ProfileRepository>();

        return services;
    }
}
