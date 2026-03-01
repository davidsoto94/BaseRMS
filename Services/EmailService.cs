using BaseRMS.Configurations;
using Microsoft.AspNetCore.Identity.UI.Services;
using System.Net;
using System.Net.Mail;

namespace BaseRMS.Services;

public class EmailService : IEmailSender
{
    public async Task SendEmailAsync(string email, string subject, string htmlMessage)
    {
        using (var client = new SmtpClient())
        {
            var portStr = Environment.GetEnvironmentVariable(Constants.EmailPort);
            client.Port = int.TryParse(portStr, out var port) ? port : 587;
            client.Host = Environment.GetEnvironmentVariable(Constants.EmailHost) ?? "";
            client.EnableSsl = true;
            client.DeliveryMethod = SmtpDeliveryMethod.Network;
            client.UseDefaultCredentials = false;
            client.Credentials = new NetworkCredential(Environment.GetEnvironmentVariable(Constants.EmailUser), Environment.GetEnvironmentVariable(Constants.EmailPassword));

            using (var mailMessage = new MailMessage())
            {
                mailMessage.From = new MailAddress(Environment.GetEnvironmentVariable(Constants.EmailUser)!);
                mailMessage.To.Add(email);
                mailMessage.Subject = subject;
                mailMessage.Body = htmlMessage;
                mailMessage.IsBodyHtml = true;

                await client.SendMailAsync(mailMessage);
            }
        }
    }
}
