using Trainio.Api.Common;
using Trainio.Application;
using Trainio.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure();
builder.Services.AddControllers();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.MapControllers();

app.Run();
