namespace Jarash.Core.Entities;

public class Reservation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string GuestName { get; set; } = string.Empty;
    public string GuestPhone { get; set; } = string.Empty;
    public Guid RoomId { get; set; }
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public string Status { get; set; } = "active";
    public string Notes { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Room Room { get; set; } = null!;
}
