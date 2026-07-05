namespace Jarash.Core.Entities;

public class RoomType
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int MaxGuests { get; set; }
    public string Amenities { get; set; } = "[]";

    public ICollection<Room> Rooms { get; set; } = new List<Room>();
    public ICollection<SeasonPrice> SeasonPrices { get; set; } = new List<SeasonPrice>();
}
