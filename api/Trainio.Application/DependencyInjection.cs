using Microsoft.Extensions.DependencyInjection;
using Trainio.Application.Features.Clients;
using Trainio.Application.Features.Exercises;
using Trainio.Application.Features.Profile;

namespace Trainio.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IClientService, ClientService>();
        services.AddScoped<IExerciseService, ExerciseService>();
        services.AddScoped<IProfileService, ProfileService>();

        return services;
    }
}
