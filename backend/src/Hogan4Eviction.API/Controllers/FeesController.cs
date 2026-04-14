using Hogan4Eviction.Core.DTOs;
using Hogan4Eviction.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Hogan4Eviction.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeesController : ControllerBase
{
    private readonly IFeeCalculatorService _feeCalc;

    public FeesController(IFeeCalculatorService feeCalc) => _feeCalc = feeCalc;

    /// <summary>
    /// Calculate an estimated fee for an eviction case.
    /// Called by the React fee review step before submission.
    /// </summary>
    [HttpPost("calculate")]
    public ActionResult<FeeCalculationResult> Calculate([FromBody] FeeCalculationRequest request)
    {
        var result = _feeCalc.Calculate(request);
        return Ok(result);
    }
}
