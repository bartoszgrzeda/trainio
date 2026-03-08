using System.Text.Json.Serialization;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Domain.Features.PlanTemplates;

public sealed class PlanTemplate : BaseEntity
{
    private List<PlanDay> _days;

    private PlanTemplate()
    {
        Name = null!;
        _days = [];
    }

    [JsonConstructor]
    private PlanTemplate(Guid id, PlanName name, IReadOnlyList<PlanDay> days)
        : base(id)
    {
        Name = Require(name, nameof(name));
        _days = NormalizeDays(days);
    }

    public PlanName Name { get; private set; }

    public IReadOnlyList<PlanDay> Days => _days.AsReadOnly();

    public static PlanTemplate From(PlanName name, IReadOnlyList<PlanDay> days)
    {
        return new PlanTemplate(Guid.NewGuid(), name, days);
    }

    public void Update(PlanName name, IReadOnlyList<PlanDay> days)
    {
        Name = Require(name, nameof(name));
        _days = NormalizeDays(days);
    }

    private static List<PlanDay> NormalizeDays(IReadOnlyList<PlanDay>? days)
    {
        if (days is null)
        {
            throw new DomainException("days is required.");
        }

        if (days.Count == 0)
        {
            throw new DomainException("days must contain at least one item.");
        }

        var normalized = new List<PlanDay>(days.Count);
        for (var index = 0; index < days.Count; index++)
        {
            normalized.Add(Require(days[index], $"days[{index}]"));
        }

        return normalized;
    }

    private static T Require<T>(T? value, string fieldName) where T : class
    {
        if (value is null)
        {
            throw new DomainException($"{fieldName} is required.");
        }

        return value;
    }
}
