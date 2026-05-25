using System.Text;
using MicroserviceB.API.Data;
using MicroserviceB.API.Events;
using MicroserviceB.API.Hubs;
using MicroserviceB.API.Messaging;
using MicroserviceB.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RabbitMQ.Client;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ----- Base de datos -----
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("TicketDB")));

// ----- Servicios de dominio -----
builder.Services.AddScoped<ITicketAssignmentService, TicketAssignmentService>();
builder.Services.AddScoped<IEscalationService, EscalationService>();
builder.Services.AddScoped<ITicketActionService, TicketActionService>();
builder.Services.AddScoped<IUserLookupService, UserLookupService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IRealtimeNotifier, SignalRRealtimeNotifier>();

// ----- Job de escalamiento (HU7 - T7.3) -----
builder.Services.AddHostedService<TimedEscalationService>();

// ----- HttpClients -----
builder.Services.AddHttpClient("AuthClient", client =>
{
    var baseUrl = builder.Configuration["Services:AuthBaseUrl"] ?? "https://localhost:7179";
    client.BaseAddress = new Uri(baseUrl);
});

builder.Services.AddHttpClient("CatalogClient", client =>
{
    var baseUrl = builder.Configuration["Services:CatalogBaseUrl"] ?? "http://localhost:5038";
    client.BaseAddress = new Uri(baseUrl);
});

// ----- SignalR (HU5 - T5.4) -----
builder.Services.AddSignalR();

// ----- EventBus: RabbitMQ si está disponible, sino InMemory (HU6 - T6.1) -----
var rabbitEnabled = builder.Configuration.GetValue<bool>("RabbitMQ:Enabled");
var rabbitHost = builder.Configuration["RabbitMQ:Host"] ?? "localhost";
var rabbitPort = builder.Configuration.GetValue<int>("RabbitMQ:Port", 5672);
var rabbitUser = builder.Configuration["RabbitMQ:Username"] ?? "guest";
var rabbitPass = builder.Configuration["RabbitMQ:Password"] ?? "guest";
var rabbitExchange = builder.Configuration["RabbitMQ:Exchange"] ?? "helpdesk.tickets";

IConnection? rabbitConnection = null;
if (rabbitEnabled)
{
    try
    {
        var factory = new ConnectionFactory
        {
            HostName = rabbitHost,
            Port = rabbitPort,
            UserName = rabbitUser,
            Password = rabbitPass,
            AutomaticRecoveryEnabled = true,       
            NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
        };
        rabbitConnection = factory.CreateConnection("helpdesk-ms-b");
        Console.WriteLine("[Startup] Conectado a RabbitMQ en {0}:{1}", rabbitHost, rabbitPort);
    }
    catch (Exception ex)
    {
        Console.WriteLine("[Startup] No se pudo conectar a RabbitMQ: {0}. Usando InMemoryEventBus.", ex.Message);
        rabbitConnection = null;
    }
}

if (rabbitConnection != null)
{
    builder.Services.AddSingleton(rabbitConnection);
    builder.Services.AddSingleton<IEventBus>(sp =>
        new RabbitMqEventBus(
            rabbitConnection,
            rabbitExchange,
            sp.GetRequiredService<ILogger<RabbitMqEventBus>>()));

    // Consumer como BackgroundService
    builder.Services.AddSingleton<IHostedService>(sp =>
        new RabbitMqConsumerService(
            rabbitConnection,
            sp,
            sp.GetRequiredService<ILogger<RabbitMqConsumerService>>(),
            rabbitExchange));
}
else
{
    // Fallback in-memory
    builder.Services.AddSingleton<IEventBus, InMemoryEventBus>();

    // Registrar consumer in-memory para todos los eventos
    builder.Services.AddScoped<NotificationConsumer>();
    builder.Services.AddScoped<IEventConsumer<TicketCreatedEvent>>(sp => sp.GetRequiredService<NotificationConsumer>());
    builder.Services.AddScoped<IEventConsumer<TicketUpdatedEvent>>(sp => sp.GetRequiredService<NotificationConsumer>());
    builder.Services.AddScoped<IEventConsumer<TicketEscalatedEvent>>(sp => sp.GetRequiredService<NotificationConsumer>());
    builder.Services.AddScoped<IEventConsumer<TicketResolvedEvent>>(sp => sp.GetRequiredService<NotificationConsumer>());
    builder.Services.AddScoped<IEventConsumer<TicketClosedEvent>>(sp => sp.GetRequiredService<NotificationConsumer>());
    builder.Services.AddScoped<IEventConsumer<TicketOverdueEvent>>(sp => sp.GetRequiredService<NotificationConsumer>());
}

// ----- Autenticación JWT (los mismos parámetros que Microservicio A) -----
var jwt = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["SecretKey"]!))
        };

        // SignalR: leer token del query string para conexiones WebSocket
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var accessToken = ctx.Request.Query["access_token"];
                var path = ctx.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    ctx.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ----- CORS -----
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // necesario para SignalR
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
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<TicketHub>("/hubs/tickets");

app.Run();
