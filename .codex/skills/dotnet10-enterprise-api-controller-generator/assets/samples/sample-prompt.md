Use $dotnet10-enterprise-api-controller-generator to generate a production-ready `ProductsController` in `.NET 10`.

Requirements:
- follow the repository's current namespace/style conventions
- place files according to existing repo pattern (fallback to `Controllers/`, `Contracts/Requests/`, `Contracts/Responses/`)
- inject `IProductAppService`
- use `CreateProductRequest`, `UpdateProductRequest`, `ListProductsRequest`
- return `ProductResponse` and `PagedResponse<ProductListItemResponse>`
- include authorization attributes and map `Products.Read` / `Products.Write` policies
- use `CreatedAtAction` for POST
- return `NotFound` when missing
- use `ValidationProblem` for invalid model state
- include `CancellationToken` in all async actions
- avoid touching unrelated files
- run a compile check before finalizing
