using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Jarash.Core.Interfaces;
using Jarash.Infrastructure.Data;
using Jarash.Infrastructure.Services;

namespace Jarash.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var provider = config.GetValue<string>("Database:Provider") ?? "Sqlite";

        if (provider == "PostgreSQL")
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(config.GetConnectionString("Postgres")));
        }
        else
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(config.GetConnectionString("Sqlite") ?? "Data Source=Jarash.db"));
        }

        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IHotelService, HotelService>();

        return services;
    }
}
