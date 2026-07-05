using Jarash.Core.DTOs;

namespace Jarash.Core.Interfaces;

public interface IHotelService
{
    // Room Types
    Task<List<RoomTypeResponse>> GetRoomTypesAsync();
    Task<RoomTypeResponse> CreateRoomTypeAsync(CreateRoomTypeRequest request);
    Task<RoomTypeResponse?> UpdateRoomTypeAsync(Guid id, UpdateRoomTypeRequest request);
    Task<bool> DeleteRoomTypeAsync(Guid id);

    // Rooms
    Task<List<RoomResponse>> GetRoomsAsync();
    Task<RoomResponse> CreateRoomAsync(CreateRoomRequest request);
    Task<RoomResponse?> UpdateRoomAsync(Guid id, UpdateRoomRequest request);
    Task<bool> DeleteRoomAsync(Guid id);

    // Season Prices
    Task<List<SeasonPriceResponse>> GetPricesAsync();
    Task<List<SeasonPriceResponse>> GetPricesByTypeAsync(Guid roomTypeId);
    Task<SeasonPriceResponse> UpsertPriceAsync(UpsertSeasonPriceRequest request);
    Task<bool> DeletePriceAsync(Guid id);

    // Reservations
    Task<List<ReservationResponse>> GetReservationsAsync();
    Task<ReservationResponse?> GetReservationByIdAsync(Guid id);
    Task<List<ReservationResponse>> GetActiveReservationsAsync();
    Task<ReservationResponse> CreateReservationAsync(CreateReservationRequest request);
    Task<ReservationResponse?> UpdateReservationAsync(Guid id, UpdateReservationRequest request);
    Task<bool> CancelReservationAsync(Guid id);
    Task<bool> ExtendStayAsync(Guid id, DateTime newCheckOut);

    // Invoices
    Task<List<InvoiceResponse>> GetInvoicesAsync();
    Task<List<InvoiceResponse>> GetInvoicesByTypeAsync(string invoiceType);
    Task<InvoiceResponse> CreateInvoiceAsync(CreateInvoiceRequest request);
    Task<InvoiceResponse?> UpdateInvoiceAsync(Guid id, UpdateInvoiceRequest request);
    Task<bool> DeleteInvoiceAsync(Guid id);

    // Service Requests
    Task<List<ServiceRequestResponse>> GetServiceRequestsAsync();
    Task<List<ServiceRequestResponse>> GetServiceRequestsByTypeAsync(string serviceType);
    Task<ServiceRequestResponse> CreateServiceRequestAsync(CreateServiceRequest request);
    Task<ServiceRequestResponse?> UpdateServiceRequestAsync(Guid id, UpdateServiceRequest request);
    Task<bool> DeleteServiceRequestAsync(Guid id);
    Task<bool> CompleteServiceRequestAsync(Guid id);
}
