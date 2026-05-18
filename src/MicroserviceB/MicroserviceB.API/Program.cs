using MicroserviceB.API.Data;
using MicroserviceB.API.Services;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Base de datos
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("TicketDB")
    )
);

builder.Services.AddScoped<ITicketAssignmentService, TicketAssignmentService>();
builder.Services.AddScoped<IEscalationService, EscalationService>();
builder.Services.AddHostedService<TimedEscalationService>();

// HttpClient para comunicarse con MicroserviceA
builder.Services.AddHttpClient("AuthClient", client =>
{
    client.BaseAddress = new Uri("https://localhost:7179");
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();  

app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.Title = "HelpDesk FISEI - Microservicio B";
});

app.UseCors("AllowReact");
app.UseAuthorization();
app.MapControllers();
app.Run();