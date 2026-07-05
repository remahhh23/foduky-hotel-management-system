namespace Jarash.Core.Entities;

public class Room
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RoomNumber { get; set; } = string.Empty;
    public int Floor { get; set; }
    public Guid TypeId { get; set; }
    public string Status { get; set; } = "available";
    public string Notes { get; set; } = string.Empty;

    public RoomType RoomType { get; set; } = null!;
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
