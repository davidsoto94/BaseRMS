namespace BaseCRM.Extensions;

public sealed class ValidationException : Exception
{
    public IReadOnlyCollection<ValidationError> Errors { get; }

    public ValidationException(IEnumerable<ValidationError> errors)
        : base("One or more validation errors occurred.")
    {
        Errors = errors.ToList().AsReadOnly();
    }
}

public sealed class ValidationError
{
    public required string Field { get; init; }
    public required string Message { get; init; }
}