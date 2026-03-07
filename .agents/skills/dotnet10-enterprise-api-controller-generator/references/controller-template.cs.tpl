using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using {{ApplicationContractsNamespace}}.Requests;
using {{ApplicationContractsNamespace}}.Responses;
using {{ApplicationServicesNamespace}};

namespace {{ApiNamespace}}.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class {{EntityPlural}}Controller : ControllerBase
{
    private readonly I{{EntitySingular}}AppService _service;

    public {{EntityPlural}}Controller(I{{EntitySingular}}AppService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize(Policy = "{{ReadPolicy}}")]
    [ProducesResponseType(typeof(PagedResponse<{{EntitySingular}}ListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<{{EntitySingular}}ListItemResponse>>> GetAsync(
        [FromQuery] List{{EntityPlural}}Request request,
        CancellationToken cancellationToken)
    {
        var response = await _service.ListAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "{{ReadPolicy}}")]
    [ProducesResponseType(typeof({{EntitySingular}}Response), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<{{EntitySingular}}Response>> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var response = await _service.GetByIdAsync(id, cancellationToken);
        if (response is null)
        {
            return NotFound();
        }

        return Ok(response);
    }

    [HttpPost]
    [Authorize(Policy = "{{WritePolicy}}")]
    [ProducesResponseType(typeof({{EntitySingular}}Response), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<{{EntitySingular}}Response>> CreateAsync(
        [FromBody] Create{{EntitySingular}}Request request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var response = await _service.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetByIdAsync), new { id = response.Id }, response);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "{{WritePolicy}}")]
    [ProducesResponseType(typeof({{EntitySingular}}Response), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<{{EntitySingular}}Response>> UpdateAsync(
        Guid id,
        [FromBody] Update{{EntitySingular}}Request request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var response = await _service.UpdateAsync(id, request, cancellationToken);
        if (response is null)
        {
            return NotFound();
        }

        return Ok(response);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "{{WritePolicy}}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Delete{{EntitySingular}}Response>> DeleteAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var deleted = await _service.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
