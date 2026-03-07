# Input Contract and Templates

## Preferred Input Shape

```yaml
Entity: Customer
NamespaceRoot: Trainio
Properties:
  - Name: FirstName
    Type: string
    Required: true
    ValueObject: false
    Editable: true
  - Name: LastName
    Type: string
    Required: true
    ValueObject: false
    Editable: true
  - Name: Email
    Type: EmailAddress
    Required: true
    ValueObject: true
    ValueObjectFactory: From
    SourceType: string
    Editable: true
  - Name: PhoneNumber
    Type: PhoneNumber
    Required: false
    ValueObject: true
    ValueObjectFactory: From
    SourceType: string
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
- If `SourceType` is omitted for VO:
  - use `string` for `Email`, `Phone`, `Code`, `Number`
  - otherwise accept VO type directly and validate non-null.
- If `Behaviors` is empty, generate one aggregate method:
  - `UpdateDetails(...)` for editable non-status fields.

## Entity Skeleton

```csharp
public sealed class Customer : BaseEntity
{
    public string FirstName { get; private set; } = null!;
    public string LastName { get; private set; } = null!;
    public EmailAddress Email { get; private set; } = null!;
    public PhoneNumber? PhoneNumber { get; private set; }
    public bool IsActive { get; private set; }

    private Customer()
    {
    }

    private Customer(
        Guid id,
        string firstName,
        string lastName,
        EmailAddress email,
        PhoneNumber? phoneNumber,
        bool isActive) : base(id)
    {
        FirstName = firstName;
        LastName = lastName;
        Email = email;
        PhoneNumber = phoneNumber;
        IsActive = isActive;
    }

    public static Customer From(
        Guid id,
        string firstName,
        string lastName,
        string email,
        string? phoneNumber)
    {
        var validFirstName = RequireNonEmpty(firstName, nameof(firstName));
        var validLastName = RequireNonEmpty(lastName, nameof(lastName));
        var emailAddress = EmailAddress.From(email);
        var parsedPhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : PhoneNumber.From(phoneNumber);

        return new Customer(id, validFirstName, validLastName, emailAddress, parsedPhoneNumber, true);
    }

    public void Rename(string firstName, string lastName)
    {
        FirstName = RequireNonEmpty(firstName, nameof(firstName));
        LastName = RequireNonEmpty(lastName, nameof(lastName));
    }

    public void ChangeContactDetails(string email, string? phoneNumber)
    {
        Email = EmailAddress.From(email);
        PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : PhoneNumber.From(phoneNumber);
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    private static string RequireNonEmpty(string value, string paramName) =>
        string.IsNullOrWhiteSpace(value) ? throw new ArgumentException("Value is required.", paramName) : value.Trim();
}
```

## EF Core Skeleton

```csharp
public sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FirstName)
            .IsRequired();

        builder.Property(x => x.LastName)
            .IsRequired();

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
        var customer = Customer.From(Guid.NewGuid(), "Jane", "Doe", "jane@site.com", "+48123456789");

        customer.FirstName.Should().Be("Jane");
        customer.Email.Value.Should().Be("jane@site.com");
        customer.IsActive.Should().BeTrue();
    }

    [Fact]
    public void JsonRoundTrip_ShouldPreserveCustomerState()
    {
        var customer = Customer.From(Guid.NewGuid(), "Jane", "Doe", "jane@site.com", "+48123456789");

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
