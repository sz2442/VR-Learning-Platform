using System.Collections.Concurrent;

namespace VRCourses.API.Services;

public record PredictionLogEntry(
    int SessionId,
    int CurrentDifficulty,
    int PredictedDifficulty,
    double Confidence,
    string Source,
    Dictionary<string, float> Features,
    DateTime Timestamp
);

public class MlPredictionStore
{
    private const int MaxEntries = 100;
    private readonly ConcurrentQueue<PredictionLogEntry> _entries = new();

    public void Add(PredictionLogEntry entry)
    {
        _entries.Enqueue(entry);
        while (_entries.Count > MaxEntries)
            _entries.TryDequeue(out _);
    }

    public IReadOnlyList<PredictionLogEntry> GetLast(int count)
    {
        return _entries
            .OrderByDescending(e => e.Timestamp)
            .Take(count)
            .ToList();
    }

    public int TotalCount => _entries.Count;
}
