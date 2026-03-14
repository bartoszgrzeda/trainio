Created files:
- `api/Trainio.Api/Controllers/ProductsController.cs`
- `api/Trainio.Application/Contracts/Requests/Products/ListProductsRequest.cs`
- `api/Trainio.Application/Contracts/Responses/Products/ProductResponse.cs`

Updated files:
- `api/Trainio.Application/Features/Products/IProductAppService.cs`

Assumptions:
- Existing API uses policy names `Products.Read` and `Products.Write`.
- Existing error convention keeps unhandled exceptions in middleware and model issues in `ValidationProblem`.

Build validation:
- `dotnet build api/Trainio.sln` completed successfully.

Generated controller (excerpt):

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class ProductsController : ControllerBase
{
    private readonly IProductAppService _productAppService;

    [HttpPost]
    [Authorize(Policy = "Products.Write")]
    public async Task<ActionResult<ProductResponse>> CreateAsync(
        [FromBody] CreateProductRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var response = await _productAppService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetByIdAsync), new { id = response.Id }, response);
    }
}
```
