/*
Seed 378 recent connections across existing seeded users.

Behavior:
- Uses seeded users only: aur3mseed%, ukseed_%, uktown_%
- Creates 378 unique user pairs
- Spreads connection timestamps over the last 90 days
- Safe to re-run for these generated pairs
*/

WITH seeded_users AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY username) AS rn
    FROM dbo.users
    WHERE username LIKE 'aur3mseed%'
       OR username LIKE 'ukseed_%'
       OR username LIKE 'uktown_%'
),
pair_candidates AS (
    SELECT TOP (378)
        a.id AS user_a_raw,
        b.id AS user_b_raw,
        ROW_NUMBER() OVER (ORDER BY a.rn, b.rn) AS pair_no
    FROM seeded_users a
    INNER JOIN seeded_users b
        ON b.rn = a.rn + 379
    ORDER BY a.rn, b.rn
),
normalized_pairs AS (
    SELECT
        CASE
            WHEN user_a_raw < user_b_raw THEN user_a_raw
            ELSE user_b_raw
        END AS user_a_id,
        CASE
            WHEN user_a_raw < user_b_raw THEN user_b_raw
            ELSE user_a_raw
        END AS user_b_id,
        pair_no
    FROM pair_candidates
),
prepared AS (
    SELECT
        user_a_id,
        user_b_id,
        DATEADD(
            DAY,
            -((pair_no * 7) % 90),
            DATEADD(
                MINUTE,
                -((pair_no * 19) % 1440),
                SYSUTCDATETIME()
            )
        ) AS created_at
    FROM normalized_pairs
)
INSERT INTO dbo.connections (
    user_a_id,
    user_b_id,
    created_at,
    is_active
)
SELECT
    p.user_a_id,
    p.user_b_id,
    p.created_at,
    1
FROM prepared p
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.connections c
    WHERE c.user_a_id = p.user_a_id
      AND c.user_b_id = p.user_b_id
);

SELECT TOP (20)
    c.id,
    ua.username AS user_a_username,
    ub.username AS user_b_username,
    c.created_at
FROM dbo.connections c
INNER JOIN dbo.users ua ON ua.id = c.user_a_id
INNER JOIN dbo.users ub ON ub.id = c.user_b_id
WHERE ua.username LIKE 'aur3mseed%'
   OR ua.username LIKE 'ukseed_%'
   OR ua.username LIKE 'uktown_%'
ORDER BY c.created_at DESC;
