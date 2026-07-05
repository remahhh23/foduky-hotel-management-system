using Microsoft.EntityFrameworkCore;
using Jarash.Core.Entities;

namespace Jarash.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<RoomType> RoomTypes => Set<RoomType>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<SeasonPrice> SeasonPrices => Set<SeasonPrice>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<ServiceRequest> ServiceRequests => Set<ServiceRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Username).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Username).HasMaxLength(100).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(200).IsRequired();
            e.HasOne(x => x.Role).WithMany(x => x.Users).HasForeignKey(x => x.RoleId);
        });

        modelBuilder.Entity<Role>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.NameAr).HasMaxLength(100).IsRequired();
            e.Property(x => x.Description).HasMaxLength(500);
        });

        modelBuilder.Entity<Permission>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Code).HasMaxLength(100).IsRequired();
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.NameAr).HasMaxLength(200).IsRequired();
            e.Property(x => x.Group).HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<RolePermission>(e =>
        {
            e.HasKey(x => new { x.RoleId, x.PermissionId });
            e.HasOne(x => x.Role).WithMany(x => x.RolePermissions).HasForeignKey(x => x.RoleId);
            e.HasOne(x => x.Permission).WithMany(x => x.RolePermissions).HasForeignKey(x => x.PermissionId);
        });

        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Token).IsUnique();
            e.Property(x => x.Token).HasMaxLength(500).IsRequired();
            e.HasOne(x => x.User).WithMany(x => x.RefreshTokens).HasForeignKey(x => x.UserId);
        });

        modelBuilder.Entity<RoomType>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Description).HasMaxLength(1000);
            e.Property(x => x.Amenities).HasMaxLength(2000);
        });

        modelBuilder.Entity<Room>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.RoomNumber).IsUnique();
            e.Property(x => x.RoomNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.RoomType).WithMany(x => x.Rooms).HasForeignKey(x => x.TypeId);
        });

        modelBuilder.Entity<SeasonPrice>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.SeasonName).HasMaxLength(200).IsRequired();
            e.HasOne(x => x.RoomType).WithMany(x => x.SeasonPrices).HasForeignKey(x => x.RoomTypeId);
        });

        modelBuilder.Entity<Reservation>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.GuestName).HasMaxLength(200).IsRequired();
            e.Property(x => x.GuestPhone).HasMaxLength(50);
            e.Property(x => x.Status).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.Room).WithMany(x => x.Reservations).HasForeignKey(x => x.RoomId);
        });

        modelBuilder.Entity<Invoice>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.InvoiceType).HasMaxLength(50).IsRequired();
            e.Property(x => x.GuestName).HasMaxLength(200).IsRequired();
            e.Property(x => x.RoomNumber).HasMaxLength(50);
            e.Property(x => x.Description).HasMaxLength(1000);
            e.Property(x => x.Status).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<ServiceRequest>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ServiceType).HasMaxLength(50).IsRequired();
            e.Property(x => x.GuestName).HasMaxLength(200).IsRequired();
            e.Property(x => x.RoomNumber).HasMaxLength(50);
            e.Property(x => x.Item).HasMaxLength(500);
            e.Property(x => x.Status).HasMaxLength(50).IsRequired();
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        var adminRoleId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var userRoleId = Guid.Parse("00000000-0000-0000-0000-000000000002");

        modelBuilder.Entity<Role>().HasData(
            new Role { Id = adminRoleId, Name = "Admin", NameAr = "مدير النظام", IsSystem = true, Description = "Full system access" },
            new Role { Id = userRoleId, Name = "User", NameAr = "مستخدم", IsSystem = true, Description = "Standard user" }
        );

        var permissions = new List<Permission>
        {
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000001"), Code = "users.view", Name = "View Users", NameAr = "عرض المستخدمين", Group = "Users" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000002"), Code = "users.create", Name = "Create Users", NameAr = "إنشاء مستخدمين", Group = "Users" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000003"), Code = "users.edit", Name = "Edit Users", NameAr = "تعديل المستخدمين", Group = "Users" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000004"), Code = "users.delete", Name = "Delete Users", NameAr = "حذف المستخدمين", Group = "Users" },
        };

        modelBuilder.Entity<Permission>().HasData(permissions);

        foreach (var perm in permissions)
        {
            modelBuilder.Entity<RolePermission>().HasData(
                new RolePermission { RoleId = adminRoleId, PermissionId = perm.Id }
            );
        }

        var adminId = Guid.Parse("00000000-0000-0000-0000-000000000003");
        modelBuilder.Entity<User>().HasData(new
        {
            Id = adminId,
            Username = "admin",
            Email = "admin@jarash.com",
            PasswordHash = "$2a$11$K4YfGqJ1e4YHIpYHIpYHIu5X7X7X7X7X7X7X7X7X7X7X7X7X7e", // dummy, will be replaced by migration
            FullName = "مدير النظام",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = (DateTime?)null,
            RoleId = adminRoleId
        });
    }
}
