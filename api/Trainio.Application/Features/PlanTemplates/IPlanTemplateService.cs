namespace Trainio.Application.Features.PlanTemplates;

public interface IPlanTemplateService
{
    Task<PlanTemplateDto> CreateAsync(CreatePlanTemplateCommand command, CancellationToken cancellationToken);

    Task<PlanTemplateDto?> GetAsync(Guid id, CancellationToken cancellationToken);

    Task<IReadOnlyList<PlanTemplateListItemDto>> ListAsync(string? query, CancellationToken cancellationToken);

    Task<PlanTemplateDto?> UpdateAsync(UpdatePlanTemplateCommand command, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
