/*
Creates 30 one-hour live social events for today and the next 29 UTC days.

Distribution:
- 20% morning events (6 total)
- 30% afternoon events (9 total)
- 50% evening events between 17:00 and 19:59 UTC (15 total)

Safe to re-run:
- uses deterministic room_name values per UTC date
*/

WITH day_offsets AS (
    SELECT v.day_offset
    FROM (VALUES
        (0), (1), (2), (3), (4), (5), (6), (7), (8), (9),
        (10), (11), (12), (13), (14), (15), (16), (17), (18), (19),
        (20), (21), (22), (23), (24), (25), (26), (27), (28), (29)
    ) AS v(day_offset)
),
prepared AS (
    SELECT
        day_offset,
        event_date = CAST(DATEADD(DAY, day_offset, CAST(SYSUTCDATETIME() AS DATE)) AS DATE),
        shuffle_rank = ROW_NUMBER() OVER (
            ORDER BY CHECKSUM(CONCAT('aur3m-live-social-', day_offset))
        )
    FROM day_offsets
),
classified AS (
    SELECT
        day_offset,
        event_date,
        event_bucket = CASE
            WHEN shuffle_rank <= 6 THEN 'morning'
            WHEN shuffle_rank <= 15 THEN 'afternoon'
            ELSE 'evening'
        END,
        slot_seed = ABS(CHECKSUM(CONCAT('slot-', day_offset)))
    FROM prepared
),
events_to_insert AS (
    SELECT
        title = CONCAT(
            'AUR3M Live Social ',
            CASE event_bucket
                WHEN 'morning' THEN 'Morning'
                WHEN 'afternoon' THEN 'Afternoon'
                ELSE 'Evening'
            END,
            ' ',
            CONVERT(CHAR(8), event_date, 112)
        ),
        starts_at = DATEADD(
            MINUTE,
            CASE slot_seed % 4
                WHEN 0 THEN 0
                WHEN 1 THEN 15
                WHEN 2 THEN 30
                ELSE 45
            END,
            DATEADD(
                HOUR,
                CASE event_bucket
                    WHEN 'morning' THEN 9 + (slot_seed % 3)
                    WHEN 'afternoon' THEN 13 + (slot_seed % 4)
                    ELSE 17 + (slot_seed % 3)
                END,
                CAST(event_date AS DATETIME2(7))
            )
        ),
        ends_at = DATEADD(
            HOUR,
            1,
            DATEADD(
                MINUTE,
                CASE slot_seed % 4
                    WHEN 0 THEN 0
                    WHEN 1 THEN 15
                    WHEN 2 THEN 30
                    ELSE 45
                END,
                DATEADD(
                    HOUR,
                    CASE event_bucket
                        WHEN 'morning' THEN 9 + (slot_seed % 3)
                        WHEN 'afternoon' THEN 13 + (slot_seed % 4)
                        ELSE 17 + (slot_seed % 3)
                    END,
                    CAST(event_date AS DATETIME2(7))
                )
            )
        ),
        room_name = CONCAT(
            'sr-',
            CONVERT(CHAR(8), event_date, 112),
            '-live-social-',
            event_bucket
        ),
        capacity = CASE event_bucket
            WHEN 'morning' THEN 60
            WHEN 'afternoon' THEN 80
            ELSE 100
        END,
        status = CAST(
            CASE
                WHEN DATEADD(
                    HOUR,
                    1,
                    DATEADD(
                        MINUTE,
                        CASE slot_seed % 4
                            WHEN 0 THEN 0
                            WHEN 1 THEN 15
                            WHEN 2 THEN 30
                            ELSE 45
                        END,
                        DATEADD(
                            HOUR,
                            CASE event_bucket
                                WHEN 'morning' THEN 9 + (slot_seed % 3)
                                WHEN 'afternoon' THEN 13 + (slot_seed % 4)
                                ELSE 17 + (slot_seed % 3)
                            END,
                            CAST(event_date AS DATETIME2(7))
                        )
                    )
                ) <= SYSUTCDATETIME() THEN 'completed'
                WHEN DATEADD(
                    MINUTE,
                    CASE slot_seed % 4
                        WHEN 0 THEN 0
                        WHEN 1 THEN 15
                        WHEN 2 THEN 30
                        ELSE 45
                    END,
                    DATEADD(
                        HOUR,
                        CASE event_bucket
                            WHEN 'morning' THEN 9 + (slot_seed % 3)
                            WHEN 'afternoon' THEN 13 + (slot_seed % 4)
                            ELSE 17 + (slot_seed % 3)
                        END,
                        CAST(event_date AS DATETIME2(7))
                    )
                ) <= SYSUTCDATETIME() THEN 'live'
                ELSE 'scheduled'
            END
            AS NVARCHAR(20)
        ),
        event_type = CAST('live' AS NVARCHAR(20))
    FROM classified
)
INSERT INTO dbo.speed_round_events (
    title,
    starts_at,
    ends_at,
    room_name,
    capacity,
    status,
    event_type
)
SELECT
    e.title,
    e.starts_at,
    e.ends_at,
    e.room_name,
    e.capacity,
    e.status,
    e.event_type
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
    status,
    event_type
FROM dbo.speed_round_events
WHERE room_name LIKE 'sr-%-live-social-%'
  AND starts_at >= CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(7))
  AND starts_at < DATEADD(DAY, 30, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(7)))
ORDER BY starts_at ASC;
