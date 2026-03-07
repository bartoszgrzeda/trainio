# EF Core Mapping Examples

Use these snippets when generating mapping guidance with the value object.

## Scalar Value Object with ValueConverter

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        var emailConverter = new ValueConverter<EmailAddress, string>(
            valueObject => valueObject.Value,
            primitive => EmailAddress.From(primitive));

        builder
            .Property(x => x.Email)
            .HasConversion(emailConverter)
            .HasMaxLength(320)
            .IsRequired();
    }
}
```

## Composite Value Object with OwnsOne

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.OwnsOne(x => x.Total, owned =>
        {
            owned.Property(x => x.Amount)
                .HasColumnName("TotalAmount")
                .HasPrecision(18, 2)
                .IsRequired();

            owned.Property(x => x.Currency)
                .HasColumnName("TotalCurrency")
                .HasMaxLength(3)
                .IsRequired();
        });
    }
}
```
