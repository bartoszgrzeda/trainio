using ExampleCompany.ExampleProduct.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExampleCompany.ExampleProduct.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.NormalizedEmail)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.DisplayName)
            .IsRequired()
            .HasMaxLength(120);

        builder.Property(x => x.CreatedUtc)
            .IsRequired();

        builder.HasIndex(x => x.NormalizedEmail)
            .IsUnique();

        builder.HasIndex(x => x.ManagerId);

        builder.HasOne(x => x.Manager)
            .WithMany(x => x.DirectReports)
            .HasForeignKey(x => x.ManagerId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
