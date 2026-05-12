using Microsoft.EntityFrameworkCore;
using MicroserviceC.API.Data;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("CatalogDB")
    )
);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.Title = "HelpDesk FISEI - Microservicio C";
});

app.UseAuthorization();
app.MapControllers();
app.Run();