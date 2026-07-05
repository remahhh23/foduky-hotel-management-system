namespace Jarash.Core.DTOs;

// RoomType
public record CreateRoomTypeRequest(string Name, string Description, int MaxGuests, List<string> Amenities);
public record UpdateRoomTypeRequest(string? Name, string? Description, int? MaxGuests, List<string>? Amenities);
public record RoomTypeResponse(Guid Id, string Name, string Description, int MaxGuests, List<string> Amenities);

// Room
public record CreateRoomRequest(string RoomNumber, int Floor, Guid TypeId, string Notes);
public record UpdateRoomRequest(string? RoomNumber, int? Floor, Guid? TypeId, string? Status, string? Notes);
public record RoomResponse(Guid Id, string RoomNumber, int Floor, Guid TypeId, string Status, string Notes);

// SeasonPrice
public record UpsertSeasonPriceRequest(Guid RoomTypeId, string SeasonName, decimal Price, Guid? Id);
public record SeasonPriceResponse(Guid Id, Guid RoomTypeId, string SeasonName, decimal Price);

// Reservation
public record CreateReservationRequest(string GuestName, string GuestPhone, Guid RoomId, DateTime CheckIn, DateTime CheckOut, string Notes, decimal TotalAmount);
public record UpdateReservationRequest(string? GuestName, string? GuestPhone, Guid? RoomId, DateTime? CheckIn, DateTime? CheckOut, string? Status, string? Notes, decimal? TotalAmount);
public record ReservationResponse(Guid Id, string GuestName, string GuestPhone, Guid RoomId, string RoomNumber, DateTime CheckIn, DateTime CheckOut, string Status, string Notes, decimal TotalAmount, DateTime CreatedAt);

// Invoice
public record CreateInvoiceRequest(string InvoiceType, string GuestName, string RoomNumber, Guid? ReservationId, string Description, decimal Amount, string Date, string Notes);
public record UpdateInvoiceRequest(string? InvoiceType, string? GuestName, string? RoomNumber, Guid? ReservationId, string? Description, decimal? Amount, string? Status, string? Date, string? Notes);
public record InvoiceResponse(Guid Id, string InvoiceType, string GuestName, string RoomNumber, Guid? ReservationId, string Description, decimal Amount, string Status, string Date, string Notes, DateTime CreatedAt);

// ServiceRequest
public record CreateServiceRequest(string ServiceType, string GuestName, string RoomNumber, string Item, int Quantity, decimal Amount, string Notes);
public record UpdateServiceRequest(string? ServiceType, string? GuestName, string? RoomNumber, string? Item, int? Quantity, decimal? Amount, string? Status, string? Notes);
public record ServiceRequestResponse(Guid Id, string ServiceType, string GuestName, string RoomNumber, string Item, int Quantity, decimal Amount, string Status, string Notes, DateTime CreatedAt);

// Misc
public record ExtendStayRequest(DateTime NewCheckOut);
