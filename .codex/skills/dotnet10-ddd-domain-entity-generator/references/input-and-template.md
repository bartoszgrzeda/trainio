# Input Contract and Templates

## Preferred Input Shape

```yaml
Entity: Customer
NamespaceRoot: Trainio
Properties:
  - Name: FirstName
    Type: FirstName
    Required: true
    ValueObject: true
    Editable: true
  - Name: LastName
    Type: LastName
    Required: true
    ValueObject: true
    Editable: true
  - Name: Email
    Type: Email
    Required: true
    ValueObject: true
    ValueObjectFactory: From
    Editable: true
  - Name: PhoneNumber
    Type: PhoneNumber
    Required: false
    ValueObject: true
    ValueObjectFactory: From
    Editable: true
  - Name: IsActive
    Type: bool
    Required: true
    ValueObject: false
    Editable: false
Behaviors:
  - Rename
  - ChangeContactDetails
  - Activate
  - Deactivate
Collections: []
```

## Defaults

- If `ValueObjectFactory` is omitted, use `From`.
- Business fields default to `ValueObject: true`.
- Keep non-VO primitive fields only for identity/technical/status fields according to repository conventions.
- Keep repository method parameter conventions unchanged (often primitives) unless the user explicitly asks to change them.
- If `Behaviors` is empty, generate one aggregate method:
  - `UpdateDetails(...)` for editable non-status fields.

## Entity Skeleton

```csharp
public sealed class Customer : BaseEntity
{
    public FirstName FirstName { get; private set; } = null!;
    public LastName LastName { get; private set; } = null!;
    public Email Email { get; private set; } = null!;
    public PhoneNumber? PhoneNumber { get; private set; }
    public bool IsActive { get; private set; }

    private Customer()
    {
    }

    private Customer(
        Guid id,
        FirstName firstName,
        LastName lastName,
        Email email,
        PhoneNumber? phoneNumber,
        bool isActive) : base(id)
    {
        FirstName = Require(firstName, nameof(firstName));
        LastName = Require(lastName, nameof(lastName));
        Email = Require(email, nameof(email));
        PhoneNumber = phoneNumber;
        IsActive = isActive;
    }

    public static Customer From(
        Guid id,
        FirstName firstName,
        LastName lastName,
        Email email,
        PhoneNumber? phoneNumber)
    {
        return new Customer(id, firstName, lastName, email, phoneNumber, true);
    }

    public void Rename(FirstName firstName, LastName lastName)
    {
        FirstName = Require(firstName, nameof(firstName));
        LastName = Require(lastName, nameof(lastName));
    }

    public void ChangeContactDetails(Email email, PhoneNumber? phoneNumber)
    {
        Email = Require(email, nameof(email));
        PhoneNumber = phoneNumber;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    private static T Require<T>(T? value, string paramName) where T : class =>
        value is null ? throw new DomainException($"{paramName} is required.") : value;
}
```

## EF Core Skeleton

```csharp
public sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasKey(x => x.Id);

        builder.OwnsOne(x => x.FirstName, owned =>
        {
            owned.Property(x => x.Value)
                .HasColumnName(nameof(Customer.FirstName))
                .IsRequired();
        });

        builder.OwnsOne(x => x.LastName, owned =>
        {
            owned.Property(x => x.Value)
                .HasColumnName(nameof(Customer.LastName))
                .IsRequired();
        });

        builder.OwnsOne(x => x.Email, owned =>
        {
            owned.Property(x => x.Value)
                .HasColumnName(nameof(Customer.Email))
                .IsRequired();
        });

        builder.OwnsOne(x => x.PhoneNumber, owned =>
        {
            owned.Property(x => x.Value)
                .HasColumnName(nameof(Customer.PhoneNumber))
                .IsRequired(false);
        });
    }
}
```

## Test Skeleton

```csharp
using System.Text.Json;

public sealed class CustomerTests
{
    [Fact]
    public void From_ShouldCreateCustomer_WhenInputIsValid()
    {
        var customer = Customer.From(
            Guid.NewGuid(),
            FirstName.From("Jane"),
            LastName.From("Doe"),
            Email.From("jane@site.com"),
            PhoneNumber.From("+48123456789"));

        customer.FirstName.Should().Be(FirstName.From("Jane"));
        customer.Email.Should().Be(Email.From("jane@site.com"));
        customer.IsActive.Should().BeTrue();
    }

    [Fact]
    public void From_ShouldThrow_WhenRequiredValueObjectIsNull()
    {
        Action act = () => Customer.From(
            Guid.NewGuid(),
            null!,
            LastName.From("Doe"),
            Email.From("jane@site.com"),
            PhoneNumber.From("+48123456789"));

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void JsonRoundTrip_ShouldPreserveCustomerState()
    {
        var customer = Customer.From(
            Guid.NewGuid(),
            FirstName.From("Jane"),
            LastName.From("Doe"),
            Email.From("jane@site.com"),
            PhoneNumber.From("+48123456789"));

        var json = JsonSerializer.Serialize(customer);
        var restored = JsonSerializer.Deserialize<Customer>(json);

        restored.Should().NotBeNull();
        restored!.FirstName.Should().Be(customer.FirstName);
        restored.LastName.Should().Be(customer.LastName);
        restored.Email.Should().Be(customer.Email);
        restored.PhoneNumber.Should().Be(customer.PhoneNumber);
        restored.IsActive.Should().Be(customer.IsActive);
    }
}
```
