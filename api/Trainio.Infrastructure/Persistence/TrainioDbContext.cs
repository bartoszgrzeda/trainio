using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Trainio.Domain.Features.Clients;
using Trainio.Domain.Features.Exercises;
using Trainio.Domain.Features.PlanTemplates;
using Trainio.Domain.Features.Profile;
using Trainio.Domain.Features.Trainings;
using Trainio.Domain.ValueObjects;

namespace Trainio.Infrastructure.Persistence;

public sealed class TrainioDbContext : DbContext
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public TrainioDbContext(DbContextOptions<TrainioDbContext> options)
        : base(options)
    {
    }

    public DbSet<Client> Clients => Set<Client>();

    public DbSet<Exercise> Exercises => Set<Exercise>();

    public DbSet<PlanTemplate> PlanTemplates => Set<PlanTemplate>();

    public DbSet<Profile> Profiles => Set<Profile>();

    public DbSet<Training> Trainings => Set<Training>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Client>(builder =>
        {
            builder.ToTable("clients");
            builder.HasKey(x => x.Id);
            builder.Ignore(x => x.FullName);
            builder.Ignore(x => x.TrainingPlanDays);

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

            builder
                .Property(x => x.TrainingPlanName)
                .HasColumnName("TrainingPlanName")
                .HasMaxLength(200)
                .HasConversion(
                    value => value == null ? null : value.Value,
                    value => string.IsNullOrWhiteSpace(value) ? null : PlanName.From(value));

            var trainingPlanDaysComparer = new ValueComparer<List<PlanDay>>(
                (left, right) => SerializeDays(left) == SerializeDays(right),
                value => SerializeDays(value).GetHashCode(StringComparison.Ordinal),
                value => DeserializeDays(SerializeDays(value)));

            builder
                .Property<List<PlanDay>>("_trainingPlanDays")
                .HasColumnName("TrainingPlanDays")
                .HasConversion(
                    value => SerializeDays(value),
                    value => DeserializeDays(value))
                .Metadata
                .SetValueComparer(trainingPlanDaysComparer);
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

        modelBuilder.Entity<PlanTemplate>(builder =>
        {
            builder.ToTable("plan_templates");
            builder.HasKey(x => x.Id);
            builder.Ignore(x => x.Days);

            builder.OwnsOne(x => x.Name, owned =>
            {
                owned.Property(x => x.Value).HasColumnName("Name").HasMaxLength(200).IsRequired();
            });

            var daysComparer = new ValueComparer<List<PlanDay>>(
                (left, right) => SerializeDays(left) == SerializeDays(right),
                value => SerializeDays(value).GetHashCode(StringComparison.Ordinal),
                value => DeserializeDays(SerializeDays(value)));

            builder
                .Property<List<PlanDay>>("_days")
                .HasColumnName("Days")
                .HasConversion(
                    value => SerializeDays(value),
                    value => DeserializeDays(value))
                .Metadata
                .SetValueComparer(daysComparer);
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

        modelBuilder.Entity<Training>(builder =>
        {
            builder.ToTable("trainings");
            builder.HasKey(x => x.Id);

            builder.OwnsOne(x => x.ClientId, owned =>
            {
                owned.Property(x => x.Value).HasColumnName("ClientId").IsRequired();
            });

            builder.Property(x => x.StartAt).HasColumnName("StartAt").IsRequired();
            builder.Property(x => x.EndAt).HasColumnName("EndAt").IsRequired();

            builder.OwnsOne(x => x.Notes, owned =>
            {
                owned.Property(x => x.Value).HasColumnName("Notes").HasMaxLength(500).IsRequired();
            });

            builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        });
    }

    private static string SerializeDays(List<PlanDay>? days)
    {
        return JsonSerializer.Serialize(days ?? [], SerializerOptions);
    }

    private static List<PlanDay> DeserializeDays(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        return JsonSerializer.Deserialize<List<PlanDay>>(json, SerializerOptions) ?? [];
    }
}
