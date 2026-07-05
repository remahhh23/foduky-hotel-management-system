namespace Jarash.Core.Entities;

public class SeasonPrice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RoomTypeId { get; set; }
    public string SeasonName { get; set; } = string.Empty;
    public decimal Price { get; set; }

    public RoomType RoomType { get; set; } = null!;
}
