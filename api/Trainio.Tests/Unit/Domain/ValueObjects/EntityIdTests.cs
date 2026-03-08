using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.ValueObjects;

public sealed class EntityIdTests
{
    [Fact]
    public void From_ShouldCreateValueObject_WhenGuidIsValid()
    {
        var guid = Guid.NewGuid();

        var entityId = EntityId.From(guid);

        entityId.Value.Should().Be(guid);
    }

    [Fact]
    public void From_ShouldThrow_WhenGuidIsEmpty()
    {
        Action act = () => EntityId.From(Guid.Empty);

        act.Should().Throw<DomainException>().WithMessage("Entity id is invalid.");
    }

    [Fact]
    public void TryFrom_ShouldReturnFalse_WhenGuidIsInvalid()
    {
        var result = EntityId.TryFrom(Guid.Empty, out var entityId);

        result.Should().BeFalse();
        entityId.Should().BeNull();
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepTheSameValue()
    {
        var valueObject = EntityId.From(Guid.NewGuid());

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<EntityId>(json);

        restored.Should().Be(valueObject);
    }
}
