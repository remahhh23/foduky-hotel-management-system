using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Jarash.Core.DTOs;
using Jarash.Core.Entities;
using Jarash.Core.Interfaces;
using Jarash.Infrastructure.Data;

namespace Jarash.Infrastructure.Services;

public class HotelService : IHotelService
{
    private readonly AppDbContext _db;

    public HotelService(AppDbContext db)
    {
        _db = db;
    }

    // ── Room Types ──────────────────────────────────────────────

    public async Task<List<RoomTypeResponse>> GetRoomTypesAsync()
    {
        var types = await _db.RoomTypes.OrderBy(x => x.Name).ToListAsync();
        return types.Select(MapRoomType).ToList();
    }

    public async Task<RoomTypeResponse> CreateRoomTypeAsync(CreateRoomTypeRequest request)
    {
        var entity = new RoomType
        {
            Name = request.Name,
            Description = request.Description,
            MaxGuests = request.MaxGuests,
            Amenities = JsonSerializer.Serialize(request.Amenities),
        };
        _db.RoomTypes.Add(entity);
        await _db.SaveChangesAsync();
        return MapRoomType(entity);
    }

    public async Task<RoomTypeResponse?> UpdateRoomTypeAsync(Guid id, UpdateRoomTypeRequest request)
    {
        var entity = await _db.RoomTypes.FindAsync(id);
        if (entity == null) return null;

        if (request.Name != null) entity.Name = request.Name;
        if (request.Description != null) entity.Description = request.Description;
        if (request.MaxGuests.HasValue) entity.MaxGuests = request.MaxGuests.Value;
        if (request.Amenities != null) entity.Amenities = JsonSerializer.Serialize(request.Amenities);

        await _db.SaveChangesAsync();
        return MapRoomType(entity);
    }

    public async Task<bool> DeleteRoomTypeAsync(Guid id)
    {
        var entity = await _db.RoomTypes.FindAsync(id);
        if (entity == null) return false;
        _db.RoomTypes.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Rooms ───────────────────────────────────────────────────

    public async Task<List<RoomResponse>> GetRoomsAsync()
    {
        var rooms = await _db.Rooms.OrderBy(x => x.RoomNumber).ToListAsync();
        return rooms.Select(MapRoom).ToList();
    }

    public async Task<RoomResponse> CreateRoomAsync(CreateRoomRequest request)
    {
        if (await _db.Rooms.AnyAsync(x => x.RoomNumber == request.RoomNumber))
            throw new InvalidOperationException("Room number already exists");

        var entity = new Room
        {
            RoomNumber = request.RoomNumber,
            Floor = request.Floor,
            TypeId = request.TypeId,
            Notes = request.Notes,
        };
        _db.Rooms.Add(entity);
        await _db.SaveChangesAsync();
        return MapRoom(entity);
    }

    public async Task<RoomResponse?> UpdateRoomAsync(Guid id, UpdateRoomRequest request)
    {
        var entity = await _db.Rooms.FindAsync(id);
        if (entity == null) return null;

        if (request.RoomNumber != null) entity.RoomNumber = request.RoomNumber;
        if (request.Floor.HasValue) entity.Floor = request.Floor.Value;
        if (request.TypeId.HasValue) entity.TypeId = request.TypeId.Value;
        if (request.Status != null) entity.Status = request.Status;
        if (request.Notes != null) entity.Notes = request.Notes;

        await _db.SaveChangesAsync();
        return MapRoom(entity);
    }

    public async Task<bool> DeleteRoomAsync(Guid id)
    {
        var entity = await _db.Rooms.FindAsync(id);
        if (entity == null) return false;
        _db.Rooms.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Season Prices ───────────────────────────────────────────

    public async Task<List<SeasonPriceResponse>> GetPricesAsync()
    {
        return await _db.SeasonPrices
            .OrderBy(x => x.SeasonName)
            .Select(x => new SeasonPriceResponse(x.Id, x.RoomTypeId, x.SeasonName, x.Price))
            .ToListAsync();
    }

    public async Task<List<SeasonPriceResponse>> GetPricesByTypeAsync(Guid roomTypeId)
    {
        return await _db.SeasonPrices
            .Where(x => x.RoomTypeId == roomTypeId)
            .OrderBy(x => x.SeasonName)
            .Select(x => new SeasonPriceResponse(x.Id, x.RoomTypeId, x.SeasonName, x.Price))
            .ToListAsync();
    }

    public async Task<SeasonPriceResponse> UpsertPriceAsync(UpsertSeasonPriceRequest request)
    {
        if (request.Id.HasValue)
        {
            var existing = await _db.SeasonPrices.FindAsync(request.Id.Value);
            if (existing != null)
            {
                existing.SeasonName = request.SeasonName;
                existing.Price = request.Price;
                await _db.SaveChangesAsync();
                return new SeasonPriceResponse(existing.Id, existing.RoomTypeId, existing.SeasonName, existing.Price);
            }
        }

        var entity = new SeasonPrice
        {
            RoomTypeId = request.RoomTypeId,
            SeasonName = request.SeasonName,
            Price = request.Price,
        };
        _db.SeasonPrices.Add(entity);
        await _db.SaveChangesAsync();
        return new SeasonPriceResponse(entity.Id, entity.RoomTypeId, entity.SeasonName, entity.Price);
    }

    public async Task<bool> DeletePriceAsync(Guid id)
    {
        var entity = await _db.SeasonPrices.FindAsync(id);
        if (entity == null) return false;
        _db.SeasonPrices.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Reservations ────────────────────────────────────────────

    public async Task<List<ReservationResponse>> GetReservationsAsync()
    {
        return await _db.Reservations
            .Include(x => x.Room)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => MapReservation(x))
            .ToListAsync();
    }

    public async Task<ReservationResponse?> GetReservationByIdAsync(Guid id)
    {
        var entity = await _db.Reservations.Include(x => x.Room).FirstOrDefaultAsync(x => x.Id == id);
        return entity == null ? null : MapReservation(entity);
    }

    public async Task<List<ReservationResponse>> GetActiveReservationsAsync()
    {
        return await _db.Reservations
            .Include(x => x.Room)
            .Where(x => x.Status == "active" || x.Status == "checked-in")
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => MapReservation(x))
            .ToListAsync();
    }

    public async Task<ReservationResponse> CreateReservationAsync(CreateReservationRequest request)
    {
        var entity = new Reservation
        {
            GuestName = request.GuestName,
            GuestPhone = request.GuestPhone,
            RoomId = request.RoomId,
            CheckIn = request.CheckIn,
            CheckOut = request.CheckOut,
            Notes = request.Notes,
            TotalAmount = request.TotalAmount,
        };
        _db.Reservations.Add(entity);
        await _db.SaveChangesAsync();

        var saved = await _db.Reservations.Include(x => x.Room).FirstAsync(x => x.Id == entity.Id);
        return MapReservation(saved);
    }

    public async Task<ReservationResponse?> UpdateReservationAsync(Guid id, UpdateReservationRequest request)
    {
        var entity = await _db.Reservations.Include(x => x.Room).FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null) return null;

        if (request.GuestName != null) entity.GuestName = request.GuestName;
        if (request.GuestPhone != null) entity.GuestPhone = request.GuestPhone;
        if (request.RoomId.HasValue) entity.RoomId = request.RoomId.Value;
        if (request.CheckIn.HasValue) entity.CheckIn = request.CheckIn.Value;
        if (request.CheckOut.HasValue) entity.CheckOut = request.CheckOut.Value;
        if (request.Status != null) entity.Status = request.Status;
        if (request.Notes != null) entity.Notes = request.Notes;
        if (request.TotalAmount.HasValue) entity.TotalAmount = request.TotalAmount.Value;

        await _db.SaveChangesAsync();
        return MapReservation(entity);
    }

    public async Task<bool> CancelReservationAsync(Guid id)
    {
        var entity = await _db.Reservations.FindAsync(id);
        if (entity == null) return false;
        entity.Status = "cancelled";
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExtendStayAsync(Guid id, DateTime newCheckOut)
    {
        var entity = await _db.Reservations.FindAsync(id);
        if (entity == null) return false;
        entity.CheckOut = newCheckOut;
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Invoices ────────────────────────────────────────────────

    public async Task<List<InvoiceResponse>> GetInvoicesAsync()
    {
        return await _db.Invoices
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => MapInvoice(x))
            .ToListAsync();
    }

    public async Task<List<InvoiceResponse>> GetInvoicesByTypeAsync(string invoiceType)
    {
        return await _db.Invoices
            .Where(x => x.InvoiceType == invoiceType)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => MapInvoice(x))
            .ToListAsync();
    }

    public async Task<InvoiceResponse> CreateInvoiceAsync(CreateInvoiceRequest request)
    {
        var entity = new Invoice
        {
            InvoiceType = request.InvoiceType,
            GuestName = request.GuestName,
            RoomNumber = request.RoomNumber,
            ReservationId = request.ReservationId,
            Description = request.Description,
            Amount = request.Amount,
            Date = DateTime.Parse(request.Date),
            Notes = request.Notes,
        };
        _db.Invoices.Add(entity);
        await _db.SaveChangesAsync();
        return MapInvoice(entity);
    }

    public async Task<InvoiceResponse?> UpdateInvoiceAsync(Guid id, UpdateInvoiceRequest request)
    {
        var entity = await _db.Invoices.FindAsync(id);
        if (entity == null) return null;

        if (request.InvoiceType != null) entity.InvoiceType = request.InvoiceType;
        if (request.GuestName != null) entity.GuestName = request.GuestName;
        if (request.RoomNumber != null) entity.RoomNumber = request.RoomNumber;
        if (request.ReservationId != null) entity.ReservationId = request.ReservationId;
        if (request.Description != null) entity.Description = request.Description;
        if (request.Amount.HasValue) entity.Amount = request.Amount.Value;
        if (request.Status != null) entity.Status = request.Status;
        if (request.Date != null) entity.Date = DateTime.Parse(request.Date);
        if (request.Notes != null) entity.Notes = request.Notes;

        await _db.SaveChangesAsync();
        return MapInvoice(entity);
    }

    public async Task<bool> DeleteInvoiceAsync(Guid id)
    {
        var entity = await _db.Invoices.FindAsync(id);
        if (entity == null) return false;
        _db.Invoices.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Service Requests ────────────────────────────────────────

    public async Task<List<ServiceRequestResponse>> GetServiceRequestsAsync()
    {
        return await _db.ServiceRequests
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => MapServiceRequest(x))
            .ToListAsync();
    }

    public async Task<List<ServiceRequestResponse>> GetServiceRequestsByTypeAsync(string serviceType)
    {
        return await _db.ServiceRequests
            .Where(x => x.ServiceType == serviceType)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => MapServiceRequest(x))
            .ToListAsync();
    }

    public async Task<ServiceRequestResponse> CreateServiceRequestAsync(CreateServiceRequest request)
    {
        var entity = new ServiceRequest
        {
            ServiceType = request.ServiceType,
            GuestName = request.GuestName,
            RoomNumber = request.RoomNumber,
            Item = request.Item,
            Quantity = request.Quantity,
            Amount = request.Amount,
            Notes = request.Notes,
        };
        _db.ServiceRequests.Add(entity);
        await _db.SaveChangesAsync();
        return MapServiceRequest(entity);
    }

    public async Task<ServiceRequestResponse?> UpdateServiceRequestAsync(Guid id, UpdateServiceRequest request)
    {
        var entity = await _db.ServiceRequests.FindAsync(id);
        if (entity == null) return null;

        if (request.ServiceType != null) entity.ServiceType = request.ServiceType;
        if (request.GuestName != null) entity.GuestName = request.GuestName;
        if (request.RoomNumber != null) entity.RoomNumber = request.RoomNumber;
        if (request.Item != null) entity.Item = request.Item;
        if (request.Quantity.HasValue) entity.Quantity = request.Quantity.Value;
        if (request.Amount.HasValue) entity.Amount = request.Amount.Value;
        if (request.Status != null) entity.Status = request.Status;
        if (request.Notes != null) entity.Notes = request.Notes;

        await _db.SaveChangesAsync();
        return MapServiceRequest(entity);
    }

    public async Task<bool> DeleteServiceRequestAsync(Guid id)
    {
        var entity = await _db.ServiceRequests.FindAsync(id);
        if (entity == null) return false;
        _db.ServiceRequests.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CompleteServiceRequestAsync(Guid id)
    {
        var entity = await _db.ServiceRequests.FindAsync(id);
        if (entity == null) return false;
        entity.Status = "completed";
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Private Mappers ─────────────────────────────────────────

    private static RoomTypeResponse MapRoomType(RoomType t) => new(
        t.Id, t.Name, t.Description, t.MaxGuests,
        JsonSerializer.Deserialize<List<string>>(t.Amenities) ?? new()
    );

    private static RoomResponse MapRoom(Room r) => new(
        r.Id, r.RoomNumber, r.Floor, r.TypeId, r.Status, r.Notes
    );

    private static ReservationResponse MapReservation(Reservation r) => new(
        r.Id, r.GuestName, r.GuestPhone, r.RoomId,
        r.Room?.RoomNumber ?? "",
        r.CheckIn, r.CheckOut, r.Status, r.Notes, r.TotalAmount, r.CreatedAt
    );

    private static InvoiceResponse MapInvoice(Invoice i) => new(
        i.Id, i.InvoiceType, i.GuestName, i.RoomNumber,
        i.ReservationId, i.Description, i.Amount, i.Status,
        i.Date.ToString("yyyy-MM-dd"), i.Notes, i.CreatedAt
    );

    private static ServiceRequestResponse MapServiceRequest(ServiceRequest s) => new(
        s.Id, s.ServiceType, s.GuestName, s.RoomNumber,
        s.Item, s.Quantity, s.Amount, s.Status, s.Notes, s.CreatedAt
    );
}
