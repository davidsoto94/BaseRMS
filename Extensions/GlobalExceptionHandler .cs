using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace BaseCRM.Extensions;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IProblemDetailsService _problemDetails;

    public GlobalExceptionHandler(
        ILogger<GlobalExceptionHandler> logger,
        IProblemDetailsService problemDetails)
    {
        _logger = logger;
        _problemDetails = problemDetails;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Unhandled exception. TraceId: {TraceId}", httpContext.TraceIdentifier);

        var (status, title) = exception switch
        {
            ValidationException => (StatusCodes.Status400BadRequest, "Validation Failed"),
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Resource Not Found"),
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "Unauthorized"),
            ArgumentException => (StatusCodes.Status400BadRequest, "Invalid Request"),
            _ => (StatusCodes.Status500InternalServerError, "Server Error")
        };

        ProblemDetails problem = exception is ValidationException validationEx
            ? CreateValidationProblemDetails(httpContext, status, title, validationEx)
            : CreateProblemDetails(httpContext, status, title, exception);

        httpContext.Response.StatusCode = status;
        await _problemDetails.WriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem,
        });

        return true;
    }

    private ValidationProblemDetails CreateValidationProblemDetails(
        HttpContext httpContext,
        int status,
        string title,
        ValidationException exception)
    {
        var problem = new ValidationProblemDetails
        {
            Status = status,
            Title = title,
            Type = exception.GetType().Name,
            Instance = httpContext.Request.Path
        };

        foreach (var error in exception.Errors.GroupBy(e => e.Field))
        {
            problem.Errors[error.Key] = error.Select(e => e.Message).ToArray();
        }

        AddMetadata(httpContext, problem);
        return problem;
    }

    private ProblemDetails CreateProblemDetails(
        HttpContext httpContext,
        int status,
        string title,
        Exception exception)
    {
        var isDevelopment = httpContext.RequestServices
            .GetRequiredService<IHostEnvironment>()
            .IsDevelopment();

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Type = exception.GetType().Name,
            Detail = isDevelopment ? exception.Message : null,
            Instance = httpContext.Request.Path
        };

        AddMetadata(httpContext, problem);
        return problem;
    }

    private static void AddMetadata(HttpContext httpContext, ProblemDetails problem)
    {
        problem.Extensions["traceId"] = httpContext.TraceIdentifier;
        problem.Extensions["timestamp"] = DateTime.UtcNow;
    }
}