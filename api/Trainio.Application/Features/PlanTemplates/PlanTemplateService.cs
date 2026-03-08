using Trainio.Application.Common.Persistence;
using Trainio.Domain.Common;
using Trainio.Domain.Features.PlanTemplates;
using Trainio.Domain.ValueObjects;

namespace Trainio.Application.Features.PlanTemplates;

public sealed class PlanTemplateService : IPlanTemplateService
{
    private readonly IRepository<PlanTemplate> _planTemplateRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PlanTemplateService(IRepositoryFactory repositoryFactory, IUnitOfWork unitOfWork)
    {
        _planTemplateRepository = repositoryFactory.Get<PlanTemplate>();
        _unitOfWork = unitOfWork;
    }

    public async Task<PlanTemplateDto> CreateAsync(CreatePlanTemplateCommand command, CancellationToken cancellationToken)
    {
        var name = PlanName.From(command.Name);
        var days = ToPlanDays(command.Days);

        var planTemplate = PlanTemplate.From(name, days);

        await _planTemplateRepository.AddAsync(planTemplate, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(planTemplate);
    }

    public async Task<PlanTemplateDto?> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        var planTemplate = await _planTemplateRepository.GetByIdAsync(id, cancellationToken);
        if (planTemplate is null)
        {
            return null;
        }

        return ToDto(planTemplate);
    }

    public async Task<IReadOnlyList<PlanTemplateListItemDto>> ListAsync(
        string? query,
        CancellationToken cancellationToken)
    {
        var normalizedQuery = query?.Trim();

        IReadOnlyList<PlanTemplate> planTemplates;
        if (string.IsNullOrWhiteSpace(normalizedQuery))
        {
            planTemplates = await _planTemplateRepository.GetAllAsync(cancellationToken);
        }
        else
        {
            var value = normalizedQuery.ToLowerInvariant();
            planTemplates = await _planTemplateRepository.GetByQueryAsync(
                planTemplate => planTemplate.Name.Value.ToLower().Contains(value),
                cancellationToken);
        }

        return planTemplates
            .OrderBy(planTemplate => planTemplate.Name.Value)
            .Select(planTemplate => new PlanTemplateListItemDto(planTemplate.Id, planTemplate.Name.Value))
            .ToArray();
    }

    public async Task<PlanTemplateDto?> UpdateAsync(UpdatePlanTemplateCommand command, CancellationToken cancellationToken)
    {
        var planTemplate = await _planTemplateRepository.GetByIdAsync(command.Id, cancellationToken);
        if (planTemplate is null)
        {
            return null;
        }

        var name = PlanName.From(command.Name);
        var days = ToPlanDays(command.Days);

        planTemplate.Update(name, days);
        _planTemplateRepository.Update(planTemplate);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(planTemplate);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var planTemplate = await _planTemplateRepository.GetByIdAsync(id, cancellationToken);
        if (planTemplate is null)
        {
            return false;
        }

        _planTemplateRepository.Delete(planTemplate);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static IReadOnlyList<PlanDay> ToPlanDays(IReadOnlyList<PlanTemplateDayCommand> days)
    {
        if (days is null)
        {
            throw new DomainException("days is required.");
        }

        return days
            .Select(day => PlanDay.From(
                PlanDayName.From(day.Name),
                day.Exercises.Select(exercise => PlanDayExercise.From(
                    EntityId.From(exercise.ExerciseId),
                    exercise.Series.Select(set => ExerciseSet.From(RepeatsCount.From(set.RepeatsCount))).ToArray()))
                .ToArray()))
            .ToArray();
    }

    private static PlanTemplateDto ToDto(PlanTemplate planTemplate)
    {
        return new PlanTemplateDto(
            planTemplate.Id,
            planTemplate.Name.Value,
            planTemplate.Days
                .Select(day => new PlanTemplateDayDto(
                    day.Name.Value,
                    day.Exercises.Select(exercise => new PlanTemplateDayExerciseDto(
                        exercise.ExerciseId.Value,
                        exercise.Series.Select(set => new PlanTemplateExerciseSetDto(set.RepeatsCount.Value)).ToArray()))
                    .ToArray()))
                .ToArray());
    }
}
