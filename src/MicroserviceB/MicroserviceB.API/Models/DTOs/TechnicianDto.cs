namespace MicroserviceB.API.Dtos
{
    public class TechnicianDto
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public int Level { get; set; }
        public int CurrentTicketCount { get; set; }
    }
}