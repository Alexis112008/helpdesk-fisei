using MicroserviceB.API.Events;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace MicroserviceB.API.Services
{
    /// <summary>
    /// HU6 — T6.4: Implementación de envío SMTP con plantillas HTML.
    ///
    /// Configuración (appsettings.json → "SmtpSettings"):
    ///   - Enabled (bool): si está en false, los correos se loguean en consola
    ///     pero no se envían (modo desarrollo).
    ///   - Host, Port, Username, Password, EnableSsl
    ///   - FromAddress, FromName
    ///
    /// Las plantillas HTML están embebidas para no depender de archivos extra.
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly SmtpSettings _settings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _settings = new SmtpSettings();
            config.GetSection("SmtpSettings").Bind(_settings);
            _logger = logger;
        }

        public Task SendTicketCreatedAsync(TicketCreatedEvent evt)
        {
            var subject = $"[Help Desk FISEI] Ticket creado: {evt.TicketNumber}";
            var body = BuildTemplate(
                title: "Ticket creado correctamente",
                color: "#2d6a9f",
                userFullName: evt.UserFullName,
                rows: new (string, string)[]
                {
                    ("Número de ticket", evt.TicketNumber),
                    ("Título", evt.Title),
                    ("Prioridad", evt.Priority),
                    ("Nivel actual", $"N{evt.CurrentLevel}")
                },
                message: "Hemos recibido tu solicitud y la asignaremos al técnico apropiado. " +
                         "Te notificaremos por correo en cada cambio de estado.");
            return SendAsync(evt.UserEmail, subject, body);
        }

        public Task SendTicketUpdatedAsync(TicketUpdatedEvent evt)
        {
            var subject = $"[Help Desk FISEI] Actualización: {evt.TicketNumber}";
            var body = BuildTemplate(
                title: "Estado de ticket actualizado",
                color: "#f57f17",
                userFullName: evt.UserFullName,
                rows: new (string, string)[]
                {
                    ("Número de ticket", evt.TicketNumber),
                    ("Estado anterior", evt.FromStatus),
                    ("Estado nuevo", evt.ToStatus),
                    ("Actualizado por", evt.ChangedByName)
                },
                message: "El estado de tu ticket ha cambiado. Puedes revisar el detalle en la plataforma.");
            return SendAsync(evt.UserEmail, subject, body);
        }

        public Task SendTicketEscalatedAsync(TicketEscalatedEvent evt)
        {
            var subject = $"[Help Desk FISEI] Ticket escalado: {evt.TicketNumber}";
            var body = BuildTemplate(
                title: "Tu ticket ha sido escalado",
                color: "#6a1b9a",
                userFullName: evt.UserFullName,
                rows: new (string, string)[]
                {
                    ("Número de ticket", evt.TicketNumber),
                    ("Del nivel", $"N{evt.FromLevel}"),
                    ("Al nivel", $"N{evt.ToLevel}"),
                    ("Motivo", evt.Reason),
                    ("Escalado por", evt.EscalatedByName)
                },
                message: "Tu caso requiere atención de un nivel superior. Te seguiremos notificando.");
            return SendAsync(evt.UserEmail, subject, body);
        }

        public Task SendTicketResolvedAsync(TicketResolvedEvent evt)
        {
            var subject = $"[Help Desk FISEI] Ticket resuelto: {evt.TicketNumber}";
            var body = BuildTemplate(
                title: "Tu ticket fue resuelto",
                color: "#2e7d32",
                userFullName: evt.UserFullName,
                rows: new (string, string)[]
                {
                    ("Número de ticket", evt.TicketNumber),
                    ("Resuelto por", evt.ResolvedByName),
                    ("Solución aplicada", evt.Solution)
                },
                message: "Tu ticket ha sido marcado como resuelto. Si el problema persiste, contáctanos.");
            return SendAsync(evt.UserEmail, subject, body);
        }

        public Task SendTicketClosedAsync(TicketClosedEvent evt)
        {
            var subject = $"[Help Desk FISEI] Ticket cerrado: {evt.TicketNumber}";
            var body = BuildTemplate(
                title: "Ticket cerrado",
                color: "#424242",
                userFullName: evt.UserFullName,
                rows: new (string, string)[]
                {
                    ("Número de ticket", evt.TicketNumber),
                    ("Solución registrada", evt.Solution)
                },
                message: "Tu ticket ha sido cerrado. La solución quedó documentada en nuestra base de conocimiento.");
            return SendAsync(evt.UserEmail, subject, body);
        }

        public Task SendTicketOverdueAsync(TicketOverdueEvent evt)
        {
            var subject = $"[Help Desk FISEI] Ticket vencido: {evt.TicketNumber}";
            var body = BuildTemplate(
                title: "Ticket vencido — atención requerida",
                color: "#b71c1c",
                userFullName: "Administrador",
                rows: new (string, string)[]
                {
                    ("Número de ticket", evt.TicketNumber),
                    ("Solicitante", evt.UserFullName),
                    ("Nivel actual", $"N{evt.CurrentLevel}"),
                    ("Motivo", evt.Reason)
                },
                message: "Este ticket ha superado el tiempo máximo de atención de su nivel.");
            return SendAsync(evt.UserEmail, subject, body);
        }

        // ---------------- Helpers ----------------

        private async Task SendAsync(string to, string subject, string htmlBody)
        {
            _logger.LogInformation("[EmailService] Intentando enviar correo a {To} — {Subject}", to, subject);

            if (!_settings.Enabled)
            {
                _logger.LogInformation(
                    "[EmailService:DEV] Correo NO enviado (SMTP deshabilitado). To={To} Subject={Subject}",
                    to, subject);
                return;
            }

            if (string.IsNullOrWhiteSpace(to))
            {
                _logger.LogWarning("Destinatario vacío para correo: {Subject}", subject);
                return;
            }

            try
            {
                using var msg = new MimeMessage();
                msg.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
                msg.To.Add(MailboxAddress.Parse(to));
                msg.Subject = subject;

                var builder = new BodyBuilder { HtmlBody = htmlBody };
                msg.Body = builder.ToMessageBody();

                _logger.LogInformation(
                    "[EmailService] Conectando a {Host}:{Port} (SSL={Ssl}) para enviar a {To}",
                    _settings.Host, _settings.Port, _settings.EnableSsl, to);

                using var client = new SmtpClient();
                client.Timeout = 30000;

                // Decide la opción de seguridad según el puerto
                //   - 465 → SSL directo (SslOnConnect)
                //   - 587 → STARTTLS (StartTls)
                //   - cualquier otro → Auto
                SecureSocketOptions secureOption;
                if (_settings.Port == 465)
                    secureOption = SecureSocketOptions.SslOnConnect;
                else if (_settings.Port == 587)
                    secureOption = SecureSocketOptions.StartTls;
                else
                    secureOption = SecureSocketOptions.Auto;

                await client.ConnectAsync(_settings.Host, _settings.Port, secureOption);
                _logger.LogInformation("[EmailService] Conexión SMTP establecida");

                await client.AuthenticateAsync(_settings.Username, _settings.Password);
                _logger.LogInformation("[EmailService] Autenticación SMTP OK");

                await client.SendAsync(msg);
                await client.DisconnectAsync(true);

                _logger.LogInformation("✅ Correo enviado a {To} — {Subject}", to, subject);
            }
            catch (AuthenticationException authEx)
            {
                _logger.LogError(
                    "❌ Error de autenticación SMTP: {Message}. " +
                    "Revisa que el App Password sea correcto y que la verificación en 2 pasos esté activada.",
                    authEx.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error enviando correo a {To}: {Message}", to, ex.Message);
            }
        }

        private string BuildTemplate(
            string title,
            string color,
            string userFullName,
            (string, string)[] rows,
            string message)
        {
            var rowsHtml = string.Join("", rows.Select(r =>
                $"<tr><td style='padding:8px 12px;color:#666;font-size:13px;border-bottom:1px solid #eee'>{r.Item1}</td>" +
                $"<td style='padding:8px 12px;color:#111;font-size:14px;border-bottom:1px solid #eee'><b>{System.Net.WebUtility.HtmlEncode(r.Item2)}</b></td></tr>"));

            return $@"
<!DOCTYPE html>
<html><body style='margin:0;padding:0;background:#f5f7fb;font-family:Segoe UI,Arial,sans-serif'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f5f7fb;padding:24px 0'>
    <tr><td align='center'>
      <table width='560' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eaecf0'>
        <tr><td style='background:{color};color:#fff;padding:20px 24px'>
          <div style='font-size:13px;opacity:.8'>UTA Service Desk · DTIC</div>
          <div style='font-size:20px;font-weight:700;margin-top:4px'>{title}</div>
        </td></tr>
        <tr><td style='padding:24px'>
          <p style='color:#333;font-size:15px;margin:0 0 16px 0'>Hola <b>{System.Net.WebUtility.HtmlEncode(userFullName)}</b>,</p>
          <p style='color:#555;font-size:14px;margin:0 0 20px 0'>{message}</p>
          <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #eee;border-radius:8px;overflow:hidden'>
            {rowsHtml}
          </table>
          <p style='color:#888;font-size:12px;margin:24px 0 0 0'>
            Este es un mensaje automático. Por favor no responda a este correo.
          </p>
        </td></tr>
        <tr><td style='background:#f9fafb;padding:14px 24px;color:#999;font-size:12px;text-align:center'>
          © Universidad Técnica de Ambato — FISEI
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>";
        }

        private class SmtpSettings
        {
            public bool Enabled { get; set; } = false;
            public string Host { get; set; } = "smtp.gmail.com";
            public int Port { get; set; } = 587;
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public bool EnableSsl { get; set; } = true;
            public string FromAddress { get; set; } = "helpdesk@uta.edu.ec";
            public string FromName { get; set; } = "Help Desk FISEI";
        }
    }
}
