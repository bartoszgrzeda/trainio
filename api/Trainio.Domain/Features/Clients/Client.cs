using System.Text.Json.Serialization;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Domain.Features.Clients;

public sealed class Client : BaseEntity
{
    private List<PlanDay> _trainingPlanDays;

    private Client()
    {
        FirstName = null!;
        LastName = null!;
        BirthDate = null!;
        PhoneNumber = null!;
        Gender = null!;
        Notes = null!;
        TrainingPlanName = null;
        _trainingPlanDays = [];
    }

    [JsonConstructor]
    private Client(
        Guid id,
        FirstName firstName,
        LastName lastName,
        BirthDate birthDate,
        PhoneNumber phoneNumber,
        Gender gender,
        Notes notes,
        PlanName? trainingPlanName = null,
        IReadOnlyList<PlanDay>? trainingPlanDays = null)
        : base(id)
    {
        FirstName = Require(firstName, nameof(firstName));
        LastName = Require(lastName, nameof(lastName));
        BirthDate = Require(birthDate, nameof(birthDate));
        PhoneNumber = Require(phoneNumber, nameof(phoneNumber));
        Gender = Require(gender, nameof(gender));
        Notes = Require(notes, nameof(notes));
        TrainingPlanName = trainingPlanName;
        _trainingPlanDays = NormalizeOptionalTrainingPlanDays(trainingPlanName, trainingPlanDays);
    }

    public FirstName FirstName { get; private set; }

    public LastName LastName { get; private set; }

    public BirthDate BirthDate { get; private set; }

    public PhoneNumber PhoneNumber { get; private set; }

    public Gender Gender { get; private set; }

    public Notes Notes { get; private set; }

    public PlanName? TrainingPlanName { get; private set; }

    public IReadOnlyList<PlanDay> TrainingPlanDays => _trainingPlanDays.AsReadOnly();

    public string FullName => $"{FirstName.Value} {LastName.Value}";

    public static Client From(
        FirstName firstName,
        LastName lastName,
        BirthDate birthDate,
        PhoneNumber phoneNumber,
        Gender gender,
        Notes notes)
    {
        return new Client(
            Guid.NewGuid(),
            firstName,
            lastName,
            birthDate,
            phoneNumber,
            gender,
            notes);
    }

    public static Client Create(
        FirstName firstName,
        LastName lastName,
        BirthDate birthDate,
        PhoneNumber phoneNumber,
        Gender gender,
        Notes notes)
    {
        return From(firstName, lastName, birthDate, phoneNumber, gender, notes);
    }

    public void Update(
        FirstName firstName,
        LastName lastName,
        BirthDate birthDate,
        PhoneNumber phoneNumber,
        Gender gender,
        Notes notes)
    {
        var validatedFirstName = Require(firstName, nameof(firstName));
        var validatedLastName = Require(lastName, nameof(lastName));
        var validatedBirthDate = Require(birthDate, nameof(birthDate));
        var validatedPhoneNumber = Require(phoneNumber, nameof(phoneNumber));
        var validatedGender = Require(gender, nameof(gender));
        var validatedNotes = Require(notes, nameof(notes));

        FirstName = validatedFirstName;
        LastName = validatedLastName;
        BirthDate = validatedBirthDate;
        PhoneNumber = validatedPhoneNumber;
        Gender = validatedGender;
        Notes = validatedNotes;
    }

    public void UpdateTrainingPlan(PlanName trainingPlanName, IReadOnlyList<PlanDay> trainingPlanDays)
    {
        TrainingPlanName = Require(trainingPlanName, nameof(trainingPlanName));
        _trainingPlanDays = NormalizeTrainingPlanDays(trainingPlanDays);
    }

    private static List<PlanDay> NormalizeOptionalTrainingPlanDays(
        PlanName? trainingPlanName,
        IReadOnlyList<PlanDay>? trainingPlanDays)
    {
        if (trainingPlanName is null)
        {
            return [];
        }

        return NormalizeTrainingPlanDays(trainingPlanDays);
    }

    private static List<PlanDay> NormalizeTrainingPlanDays(IReadOnlyList<PlanDay>? trainingPlanDays)
    {
        if (trainingPlanDays is null)
        {
            throw new DomainException("trainingPlanDays is required.");
        }

        if (trainingPlanDays.Count == 0)
        {
            throw new DomainException("trainingPlanDays must contain at least one item.");
        }

        var normalized = new List<PlanDay>(trainingPlanDays.Count);
        for (var index = 0; index < trainingPlanDays.Count; index++)
        {
            normalized.Add(Require(trainingPlanDays[index], $"trainingPlanDays[{index}]"));
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
