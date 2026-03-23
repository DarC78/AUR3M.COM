/*
Creates all-day live speed-round events for today and the next 6 UTC days.

Safe to re-run:
- uses deterministic room_name values per UTC date
*/

WITH day_offsets AS (
    SELECT v.day_offset
    FROM (VALUES (0), (1), (2), (3), (4), (5), (6)) AS v(day_offset)
),
prepared AS (
    SELECT
        event_date = CAST(DATEADD(DAY, d.day_offset, CAST(SYSUTCDATETIME() AS DATE)) AS DATE)
    FROM day_offsets d
),
events_to_insert AS (
    SELECT
        title = CONCAT('AUR3M Live Speed Round ', CONVERT(CHAR(8), p.event_date, 112)),
        starts_at = CAST(p.event_date AS DATETIME2(7)),
        ends_at = DATEADD(DAY, 1, CAST(p.event_date AS DATETIME2(7))),
        room_name = CONCAT('sr-', CONVERT(CHAR(8), p.event_date, 112), '-live-all-day'),
        capacity = 200,
        status = CAST('live' AS NVARCHAR(20))
    FROM prepared p
)
INSERT INTO dbo.speed_round_events (
    title,
    starts_at,
    ends_at,
    room_name,
    capacity,
    status
)
SELECT
    e.title,
    e.starts_at,
    e.ends_at,
    e.room_name,
    e.capacity,
    e.status
FROM events_to_insert e
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.speed_round_events existing
    WHERE existing.room_name = e.room_name
);

SELECT
    id,
    title,
    starts_at,
    ends_at,
    room_name,
    capacity,
    status
FROM dbo.speed_round_events
WHERE room_name LIKE 'sr-%-live-all-day'
  AND starts_at >= CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(7))
  AND starts_at < DATEADD(DAY, 7, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(7)))
ORDER BY starts_at ASC;
