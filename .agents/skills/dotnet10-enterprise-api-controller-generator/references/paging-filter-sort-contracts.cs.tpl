using System.Collections.Generic;

namespace {{ContractsNamespace}}.Requests
{
    public sealed record List{{EntityPlural}}Request(
        int Page = 1,
        int PageSize = 20,
        string? Search = null,
        string? SortBy = null,
        SortDirection SortDirection = SortDirection.Asc);

    public enum SortDirection
    {
        Asc,
        Desc
    }
}

namespace {{ContractsNamespace}}.Responses
{
    public sealed record PagedResponse<T>(
        IReadOnlyList<T> Items,
        int Page,
        int PageSize,
        int TotalCount);
}
