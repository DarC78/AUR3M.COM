/*
Seed 20 speed-round events in the next 30 days.

Distribution:
- 3 midday events
- 4 afternoon events
- 13 evening events between 17:00 and 20:00

Safe to re-run:
- skips rows with the same room_name
*/

WITH event_seed AS (
    SELECT *
    FROM (VALUES
        (1,  1, 12,  0,  'AUR3M Midday Mixer 01',    'sr-20260323-midday-01',   80),
        (2,  4, 13,  0,  'AUR3M Midday Mixer 02',    'sr-20260326-midday-02',   80),
        (3,  8, 12, 30,  'AUR3M Midday Mixer 03',    'sr-20260330-midday-03',   80),

        (4,  2, 15,  0,  'AUR3M Afternoon Social 01','sr-20260324-afternoon-01',90),
        (5,  6, 16,  0,  'AUR3M Afternoon Social 02','sr-20260328-afternoon-02',90),
        (6, 11, 15, 30,  'AUR3M Afternoon Social 03','sr-20260402-afternoon-03',90),
        (7, 17, 16, 30,  'AUR3M Afternoon Social 04','sr-20260408-afternoon-04',90),

        (8,  3, 17,  0,  'AUR3M Evening Round 01',   'sr-20260325-evening-01',  120),
        (9,  5, 17, 30,  'AUR3M Evening Round 02',   'sr-20260327-evening-02',  120),
        (10, 7, 18,  0,  'AUR3M Evening Round 03',   'sr-20260329-evening-03',  120),
        (11, 9, 18, 30,  'AUR3M Evening Round 04',   'sr-20260331-evening-04',  120),
        (12,10, 19,  0,  'AUR3M Evening Round 05',   'sr-20260401-evening-05',  120),
        (13,12, 19, 30,  'AUR3M Evening Round 06',   'sr-20260403-evening-06',  120),
        (14,14, 17, 15,  'AUR3M Evening Round 07',   'sr-20260405-evening-07',  120),
        (15,16, 18, 15,  'AUR3M Evening Round 08',   'sr-20260407-evening-08',  120),
        (16,18, 19, 15,  'AUR3M Evening Round 09',   'sr-20260409-evening-09',  120),
        (17,20, 17, 45,  'AUR3M Evening Round 10',   'sr-20260411-evening-10',  120),
        (18,22, 18, 45,  'AUR3M Evening Round 11',   'sr-20260413-evening-11',  120),
        (19,25, 19, 45,  'AUR3M Evening Round 12',   'sr-20260416-evening-12',  120),
        (20,28, 18, 30,  'AUR3M Evening Round 13',   'sr-20260419-evening-13',  120)
    ) AS src(event_no, day_offset, start_hour, start_minute, title, room_name, capacity)
),
prepared AS (
    SELECT
        title,
        room_name,
        capacity,
        DATEADD(
            MINUTE,
            start_minute,
            DATEADD(
                HOUR,
                start_hour,
                CAST(CAST(DATEADD(DAY, day_offset, SYSUTCDATETIME()) AS DATE) AS DATETIME2)
            )
        ) AS starts_at
    FROM event_seed
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
    p.title,
    p.starts_at,
    DATEADD(MINUTE, 60, p.starts_at),
    p.room_name,
    p.capacity,
    'scheduled'
FROM prepared p
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.speed_round_events e
    WHERE e.room_name = p.room_name
);

SELECT
    title,
    starts_at,
    ends_at,
    room_name,
    capacity,
    status
FROM dbo.speed_round_events
WHERE room_name LIKE 'sr-%'
  AND starts_at >= SYSUTCDATETIME()
  AND starts_at < DATEADD(DAY, 31, SYSUTCDATETIME())
ORDER BY starts_at ASC;
