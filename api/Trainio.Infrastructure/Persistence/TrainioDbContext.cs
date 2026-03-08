using Microsoft.EntityFrameworkCore;
using Trainio.Domain.Features.Clients;
using Trainio.Domain.Features.Exercises;
using Trainio.Domain.Features.Profile;

namespace Trainio.Infrastructure.Persistence;

public sealed class TrainioDbContext : DbContext
{
    public TrainioDbContext(DbContextOptions<TrainioDbContext> options)
        : base(options)
    {
    }

    public DbSet<Client> Clients => Set<Client>();

    public DbSet<Exercise> Exercises => Set<Exercise>();

    public DbSet<Profile> Profiles => Set<Profile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Client>(builder =>
        {
            builder.ToTable("clients");
            builder.HasKey(x => x.Id);
            builder.Ignore(x => x.FullName);

            builder.OwnsOne(x => x.FirstName, owned =>
            {
                owned.Property(x => x.Value).HasColumnName("FirstName").HasMaxLength(128).IsRequired();
            });

            builder.OwnsOne(x => x.LastName, owned =>
            {
                owned.Property(x => x.Value).HasColumnName("LastName").HasMaxLength(128).IsRequired();
            });

            builder.OwnsOne(x => x.BirthDate, owned =>
            {
                owned.Property(x => x.Value).HasColumnName("BirthDate").HasColumnType("date").IsRequired();
            });

            builder.OwnsOne(x => x.PhoneNumber, owned =>
            {
                owned.Property(x => x.Value).HasColumnName("PhoneNumber").HasMaxLength(64).IsRequired();
            });

            builder.OwnsOne(x => x.Gender, owned =>
            {
                owned.Property(x => x.Value).HasColumnName("Gender").HasMaxLength(32).IsRequired();
            });

            builder.OwnsOne(x => x.Notes, owned =>
            {
                owned.Property(x => x.Value).HasColumnName("Notes").HasMaxLength(2000).IsRequired();
            });
        });

        modelBuilder.Entity<Exercise>(builder =>
        {
            builder.ToTable("exercises");
            builder.HasKey(x => x.Id);

            builder.OwnsOne(x => x.ExerciseName, owned =>
            {
                owned.Property(x => x.Value).HasColumnName("name").HasMaxLength(200).IsRequired();
            });

            builder.Property(x => x.Source).HasConversion<string>().HasMaxLength(32).IsRequired();

        });

        modelBuilder.Entity<Profile>(builder =>
        {
            builder.ToTable("profiles");
            builder.HasKey(x => x.Id);

            builder.OwnsOne(x => x.FirstName, owned =>
            {
                owned.Property(x => x.Value).HasColumnName("FirstName").HasMaxLength(128).IsRequired();
            });

            builder.OwnsOne(x => x.LastName, owned =>
            {
                owned.Property(x => x.Value).HasColumnName("LastName").HasMaxLength(128).IsRequired();
            });

            builder.OwnsOne(x => x.Email, owned =>
            {
                owned.Property(x => x.Value).HasColumnName("Email").HasMaxLength(256).IsRequired();
            });

            builder.OwnsOne(x => x.PhoneNumber, owned =>
            {
                owned.Property(x => x.Value).HasColumnName("PhoneNumber").HasMaxLength(64).IsRequired();
            });
        });
    }
}
