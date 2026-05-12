using Microsoft.EntityFrameworkCore;
using MicroserviceB.API.Data;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("TicketDB")
    )
);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.Title = "HelpDesk FISEI - Microservicio B";
});

app.UseAuthorization();
app.MapControllers();
app.Run();