using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ExampleCompany.ExampleProduct.Domain.Entities;
using ExampleCompany.ExampleProduct.Infrastructure.Persistence.Repositories;
using ExampleCompany.ExampleProduct.Infrastructure.Persistence.UnitOfWork;

namespace ExampleCompany.ExampleProduct.Application.Services;

public sealed class ExampleApplicationService
{
    private readonly IRepository<User> _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ExampleApplicationService(
        IRepositoryFactory repositoryFactory,
        IUnitOfWork unitOfWork)
    {
        _userRepository = repositoryFactory.Get<User>();
        _unitOfWork = unitOfWork;
    }

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _userRepository.GetByIdAsync(id, cancellationToken);
    }

    public async Task RenameAsync(
        Guid userId,
        string newDisplayName,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return;
        }

        user.ChangeDisplayName(newDisplayName);

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteByEmailAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is required.", nameof(email));
        }

        var normalizedEmail = email.Trim().ToUpperInvariant();

        var users = await _userRepository.GetByQueryAsync(
            x => x.NormalizedEmail == normalizedEmail,
            cancellationToken);
        var user = users.SingleOrDefault();

        if (user is null)
        {
            return;
        }

        _userRepository.Delete(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<User>> GetPagedUsersAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var all = await _userRepository.GetAllAsync(cancellationToken);
        return all
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();
    }
}
