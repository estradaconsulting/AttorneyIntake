using Hogan4Eviction.Core.DTOs;
using Hogan4Eviction.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Hogan4Eviction.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeesController : ControllerBase
{
    private readonly IFeeCalculatorService _feeCalc;

    public FeesController(IFeeCalculatorService feeCalc) => _feeCalc = feeCalc;

    /// <summary>
    /// Calculate an estimated fee — public endpoint, called by the fee review step
    /// in the intake wizard before the client submits.
    /// </summary>
    [HttpPost("calculate")]
    [AllowAnonymous]
    [EnableRateLimiting("GeneralApi")]
    public ActionResult<FeeCalculationResult> Calculate([FromBody] FeeCalculationRequest request)
    {
        var result = _feeCalc.Calculate(request);
        return Ok(result);
    }
}
