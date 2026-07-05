using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Jarash.Core.DTOs;
using Jarash.Core.Interfaces;

namespace Jarash.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HotelController : ControllerBase
{
    private readonly IHotelService _hotel;

    public HotelController(IHotelService hotel)
    {
        _hotel = hotel;
    }

    // ── Room Types ──────────────────────────────────────────────

    [HttpGet("room-types")]
    public async Task<IActionResult> GetRoomTypes()
    {
        return Ok(await _hotel.GetRoomTypesAsync());
    }

    [HttpPost("room-types")]
    public async Task<IActionResult> CreateRoomType([FromBody] CreateRoomTypeRequest request)
    {
        var result = await _hotel.CreateRoomTypeAsync(request);
        return CreatedAtAction(nameof(GetRoomTypes), new { id = result.Id }, result);
    }

    [HttpPut("room-types/{id:guid}")]
    public async Task<IActionResult> UpdateRoomType(Guid id, [FromBody] UpdateRoomTypeRequest request)
    {
        var result = await _hotel.UpdateRoomTypeAsync(id, request);
        if (result == null) return NotFound(new ErrorResponse("Room type not found"));
        return Ok(result);
    }

    [HttpDelete("room-types/{id:guid}")]
    public async Task<IActionResult> DeleteRoomType(Guid id)
    {
        var ok = await _hotel.DeleteRoomTypeAsync(id);
        if (!ok) return NotFound(new ErrorResponse("Room type not found"));
        return NoContent();
    }

    // ── Rooms ───────────────────────────────────────────────────

    [HttpGet("rooms")]
    public async Task<IActionResult> GetRooms()
    {
        return Ok(await _hotel.GetRoomsAsync());
    }

    [HttpPost("rooms")]
    public async Task<IActionResult> CreateRoom([FromBody] CreateRoomRequest request)
    {
        try
        {
            var result = await _hotel.CreateRoomAsync(request);
            return CreatedAtAction(nameof(GetRooms), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ErrorResponse(ex.Message));
        }
    }

    [HttpPut("rooms/{id:guid}")]
    public async Task<IActionResult> UpdateRoom(Guid id, [FromBody] UpdateRoomRequest request)
    {
        var result = await _hotel.UpdateRoomAsync(id, request);
        if (result == null) return NotFound(new ErrorResponse("Room not found"));
        return Ok(result);
    }

    [HttpDelete("rooms/{id:guid}")]
    public async Task<IActionResult> DeleteRoom(Guid id)
    {
        var ok = await _hotel.DeleteRoomAsync(id);
        if (!ok) return NotFound(new ErrorResponse("Room not found"));
        return NoContent();
    }

    // ── Season Prices ───────────────────────────────────────────

    [HttpGet("prices")]
    public async Task<IActionResult> GetPrices()
    {
        return Ok(await _hotel.GetPricesAsync());
    }

    [HttpGet("prices/by-type/{roomTypeId:guid}")]
    public async Task<IActionResult> GetPricesByType(Guid roomTypeId)
    {
        return Ok(await _hotel.GetPricesByTypeAsync(roomTypeId));
    }

    [HttpPost("prices")]
    public async Task<IActionResult> UpsertPrice([FromBody] UpsertSeasonPriceRequest request)
    {
        var result = await _hotel.UpsertPriceAsync(request);
        return Ok(result);
    }

    [HttpDelete("prices/{id:guid}")]
    public async Task<IActionResult> DeletePrice(Guid id)
    {
        var ok = await _hotel.DeletePriceAsync(id);
        if (!ok) return NotFound(new ErrorResponse("Price not found"));
        return NoContent();
    }

    // ── Reservations ────────────────────────────────────────────

    [HttpGet("reservations")]
    public async Task<IActionResult> GetReservations()
    {
        return Ok(await _hotel.GetReservationsAsync());
    }

    [HttpGet("reservations/{id:guid}")]
    public async Task<IActionResult> GetReservationById(Guid id)
    {
        var result = await _hotel.GetReservationByIdAsync(id);
        if (result == null) return NotFound(new ErrorResponse("Reservation not found"));
        return Ok(result);
    }

    [HttpGet("reservations/active")]
    public async Task<IActionResult> GetActiveReservations()
    {
        return Ok(await _hotel.GetActiveReservationsAsync());
    }

    [HttpPost("reservations")]
    public async Task<IActionResult> CreateReservation([FromBody] CreateReservationRequest request)
    {
        var result = await _hotel.CreateReservationAsync(request);
        return CreatedAtAction(nameof(GetReservationById), new { id = result.Id }, result);
    }

    [HttpPut("reservations/{id:guid}")]
    public async Task<IActionResult> UpdateReservation(Guid id, [FromBody] UpdateReservationRequest request)
    {
        var result = await _hotel.UpdateReservationAsync(id, request);
        if (result == null) return NotFound(new ErrorResponse("Reservation not found"));
        return Ok(result);
    }

    [HttpPatch("reservations/{id:guid}/cancel")]
    public async Task<IActionResult> CancelReservation(Guid id)
    {
        var ok = await _hotel.CancelReservationAsync(id);
        if (!ok) return NotFound(new ErrorResponse("Reservation not found"));
        return Ok();
    }

    [HttpPatch("reservations/{id:guid}/extend")]
    public async Task<IActionResult> ExtendStay(Guid id, [FromBody] ExtendStayRequest request)
    {
        var ok = await _hotel.ExtendStayAsync(id, request.NewCheckOut);
        if (!ok) return NotFound(new ErrorResponse("Reservation not found"));
        return Ok();
    }

    // ── Invoices ────────────────────────────────────────────────

    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices()
    {
        return Ok(await _hotel.GetInvoicesAsync());
    }

    [HttpGet("invoices/by-type/{invoiceType}")]
    public async Task<IActionResult> GetInvoicesByType(string invoiceType)
    {
        return Ok(await _hotel.GetInvoicesByTypeAsync(invoiceType));
    }

    [HttpPost("invoices")]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceRequest request)
    {
        var result = await _hotel.CreateInvoiceAsync(request);
        return CreatedAtAction(nameof(GetInvoicesByType), new { invoiceType = result.InvoiceType }, result);
    }

    [HttpPut("invoices/{id:guid}")]
    public async Task<IActionResult> UpdateInvoice(Guid id, [FromBody] UpdateInvoiceRequest request)
    {
        var result = await _hotel.UpdateInvoiceAsync(id, request);
        if (result == null) return NotFound(new ErrorResponse("Invoice not found"));
        return Ok(result);
    }

    [HttpDelete("invoices/{id:guid}")]
    public async Task<IActionResult> DeleteInvoice(Guid id)
    {
        var ok = await _hotel.DeleteInvoiceAsync(id);
        if (!ok) return NotFound(new ErrorResponse("Invoice not found"));
        return NoContent();
    }

    // ── Service Requests ────────────────────────────────────────

    [HttpGet("service-requests")]
    public async Task<IActionResult> GetServiceRequests()
    {
        return Ok(await _hotel.GetServiceRequestsAsync());
    }

    [HttpGet("service-requests/by-type/{serviceType}")]
    public async Task<IActionResult> GetServiceRequestsByType(string serviceType)
    {
        return Ok(await _hotel.GetServiceRequestsByTypeAsync(serviceType));
    }

    [HttpPost("service-requests")]
    public async Task<IActionResult> CreateServiceRequest([FromBody] CreateServiceRequest request)
    {
        var result = await _hotel.CreateServiceRequestAsync(request);
        return CreatedAtAction(nameof(GetServiceRequestsByType), new { serviceType = result.ServiceType }, result);
    }

    [HttpPut("service-requests/{id:guid}")]
    public async Task<IActionResult> UpdateServiceRequest(Guid id, [FromBody] UpdateServiceRequest request)
    {
        var result = await _hotel.UpdateServiceRequestAsync(id, request);
        if (result == null) return NotFound(new ErrorResponse("Service request not found"));
        return Ok(result);
    }

    [HttpDelete("service-requests/{id:guid}")]
    public async Task<IActionResult> DeleteServiceRequest(Guid id)
    {
        var ok = await _hotel.DeleteServiceRequestAsync(id);
        if (!ok) return NotFound(new ErrorResponse("Service request not found"));
        return NoContent();
    }

    [HttpPatch("service-requests/{id:guid}/complete")]
    public async Task<IActionResult> CompleteServiceRequest(Guid id)
    {
        var ok = await _hotel.CompleteServiceRequestAsync(id);
        if (!ok) return NotFound(new ErrorResponse("Service request not found"));
        return Ok();
    }
}
