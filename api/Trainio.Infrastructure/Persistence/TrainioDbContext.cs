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

    public DbSet<UserProfile> Profiles => Set<UserProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Client>(builder =>
        {
            builder.ToTable("clients");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.FirstName).HasMaxLength(128).IsRequired();
            builder.Property(x => x.LastName).HasMaxLength(128).IsRequired();
            builder.Property(x => x.BirthDate).HasColumnType("date");
            builder.Property(x => x.PhoneNumber).HasMaxLength(64).IsRequired();
            builder.Property(x => x.Gender).HasMaxLength(32).IsRequired();
            builder.Property(x => x.Notes).HasMaxLength(2048);
        });

        modelBuilder.Entity<Exercise>(builder =>
        {
            builder.ToTable("exercises");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Name).HasMaxLength(256).IsRequired();
            builder.Property(x => x.Source).HasConversion<string>().HasMaxLength(32).IsRequired();

            builder.HasIndex(x => new { x.Name, x.Source }).IsUnique();
        });

        modelBuilder.Entity<UserProfile>(builder =>
        {
            builder.ToTable("profiles");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.FirstName).HasMaxLength(128).IsRequired();
            builder.Property(x => x.LastName).HasMaxLength(128).IsRequired();
            builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
            builder.Property(x => x.PhoneNumber).HasMaxLength(64).IsRequired();
        });
    }
}
