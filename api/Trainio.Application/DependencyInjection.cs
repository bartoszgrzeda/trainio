using Microsoft.Extensions.DependencyInjection;
using Trainio.Application.Features.Clients;
using Trainio.Application.Features.Exercises;
using Trainio.Application.Features.PlanTemplates;
using Trainio.Application.Features.Profile;
using Trainio.Application.Features.Trainings;

namespace Trainio.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IClientService, ClientService>();
        services.AddScoped<IExerciseService, ExerciseService>();
        services.AddScoped<IPlanTemplateService, PlanTemplateService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<ITrainingService, TrainingService>();

        return services;
    }
}
