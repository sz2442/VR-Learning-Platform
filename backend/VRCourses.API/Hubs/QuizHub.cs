using Microsoft.AspNetCore.SignalR;

namespace VRCourses.API.Hubs;

public class QuizHub : Hub
{
    private readonly ILogger<QuizHub> _logger;

    public QuizHub(ILogger<QuizHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinSession(int sessionId)
    {
        var group = $"session_{sessionId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, group);
        _logger.LogInformation(
            "{{\"event\":\"signalr_join\",\"connection_id\":\"{ConnectionId}\",\"session_id\":{SessionId}}}",
            Context.ConnectionId, sessionId);
    }

    public async Task LeaveSession(int sessionId)
    {
        var group = $"session_{sessionId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
        _logger.LogInformation(
            "{{\"event\":\"signalr_leave\",\"connection_id\":\"{ConnectionId}\",\"session_id\":{SessionId}}}",
            Context.ConnectionId, sessionId);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation(
            "{{\"event\":\"signalr_disconnect\",\"connection_id\":\"{ConnectionId}\"}}",
            Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
