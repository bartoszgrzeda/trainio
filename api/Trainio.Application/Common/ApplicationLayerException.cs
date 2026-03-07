namespace Trainio.Application.Common;

public sealed class ApplicationLayerException : Exception
{
    public ApplicationLayerException(string message)
        : base(message)
    {
    }
}
