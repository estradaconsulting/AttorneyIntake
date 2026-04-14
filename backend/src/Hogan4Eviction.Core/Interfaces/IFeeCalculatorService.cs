using Hogan4Eviction.Core.DTOs;

namespace Hogan4Eviction.Core.Interfaces;

public interface IFeeCalculatorService
{
    FeeCalculationResult Calculate(FeeCalculationRequest request);
}
