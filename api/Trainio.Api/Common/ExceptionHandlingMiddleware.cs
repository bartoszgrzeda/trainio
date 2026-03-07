using System.Net;
using System.Text.Json;
using Trainio.Application.Common;
using Trainio.Domain.Common;

namespace Trainio.Api.Common;

public sealed class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next;

    public ExceptionHandlingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DomainException exception)
        {
            await WriteErrorAsync(context, HttpStatusCode.BadRequest, "domain_error", exception.Message);
        }
        catch (ApplicationLayerException exception)
        {
            await WriteErrorAsync(context, HttpStatusCode.BadRequest, "application_error", exception.Message);
        }
        catch (Exception)
        {
            await WriteErrorAsync(context, HttpStatusCode.InternalServerError, "unexpected_error", "Unexpected error occurred.");
        }
    }

    private static async Task WriteErrorAsync(HttpContext context, HttpStatusCode statusCode, string code, string message)
    {
        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var response = new ErrorResponse(code, message);

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, SerializerOptions));
    }
}
