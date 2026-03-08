# CustomWebApplicationFactory Template (C#)

Use this as a scaffold only. Align with existing project namespaces, DI registrations, and test utilities.

```csharp
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace {{TestNamespace}};

public sealed class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("IntegrationTests");

        builder.ConfigureTestServices(services =>
        {
            // 1) Remove/replace production registrations that break determinism.
            // Example patterns:
            // services.RemoveAll<IHostedService>();
            // services.RemoveAll<ITimeProvider>();
            // services.RemoveAll<DbContextOptions<AppDbContext>>();

            // 2) Add deterministic replacements.
            // services.AddSingleton<ITimeProvider>(new FakeTimeProvider(fixedUtcNow));
            // services.AddDbContext<AppDbContext>(options => ...project-aligned test DB...);

            // 3) Optionally configure test auth.
            // services.AddAuthentication(options =>
            // {
            //     options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
            //     options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
            // }).AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
            //     TestAuthHandler.SchemeName,
            //     _ => { });

            // 4) Seed deterministic data if needed.
            // using var scope = services.BuildServiceProvider().CreateScope();
            // var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            // TestDataSeeder.Seed(db);
        });
    }
}
```

Notes:

- Prefer reusing an existing factory if already present.
- Avoid removing services blindly; replace only what is necessary.
- Keep database/auth replacements consistent with repository conventions.
