/*
Add 12 to 27 extra users for every distinct location currently present
in the seeded UK location datasets (ukseed_% and uktown_%).

Behavior:
- Targets every distinct location already present in dbo.users
- Adds a deterministic pseudo-random count between 12 and 27 per location
- Safe to re-run
- Default password for all seeded users: Welcome123!
*/

WITH locations AS (
    SELECT
        location,
        ROW_NUMBER() OVER (ORDER BY location) AS location_no,
        12 + (ABS(CHECKSUM(location)) % 16) AS extra_count
    FROM (
        SELECT DISTINCT location
        FROM dbo.users
        WHERE username LIKE 'ukseed_%'
           OR username LIKE 'uktown_%'
    ) src
),
numbers AS (
    SELECT TOP (27)
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
    FROM sys.all_objects
),
seed_source AS (
    SELECT
        l.location,
        l.location_no,
        l.extra_count,
        n.n AS seq_no,
        CONCAT('ukextra_', FORMAT(l.location_no, '0000'), '_', FORMAT(n.n, '000')) AS username,
        CONCAT('ukextra_', FORMAT(l.location_no, '0000'), '_', FORMAT(n.n, '000'), '@aur3m.seed') AS email,
        CONCAT(
            CASE ((l.location_no + n.n - 2) % 28) + 1
                WHEN 1 THEN 'Olivia'
                WHEN 2 THEN 'Amelia'
                WHEN 3 THEN 'Isla'
                WHEN 4 THEN 'Freya'
                WHEN 5 THEN 'Ava'
                WHEN 6 THEN 'Mia'
                WHEN 7 THEN 'Sophia'
                WHEN 8 THEN 'Grace'
                WHEN 9 THEN 'Lily'
                WHEN 10 THEN 'Emily'
                WHEN 11 THEN 'Jack'
                WHEN 12 THEN 'Noah'
                WHEN 13 THEN 'George'
                WHEN 14 THEN 'Leo'
                WHEN 15 THEN 'Arthur'
                WHEN 16 THEN 'Harry'
                WHEN 17 THEN 'Theo'
                WHEN 18 THEN 'Oscar'
                WHEN 19 THEN 'Charlie'
                WHEN 20 THEN 'Mohammed'
                WHEN 21 THEN 'Ella'
                WHEN 22 THEN 'Sophie'
                WHEN 23 THEN 'James'
                WHEN 24 THEN 'Evie'
                WHEN 25 THEN 'Rosie'
                WHEN 26 THEN 'Archie'
                WHEN 27 THEN 'Ivy'
                ELSE 'Henry'
            END,
            '_',
            LOWER(LEFT(REPLACE(REPLACE(REPLACE(l.location, ' ', ''), '-', ''), '''', ''), 8)),
            '_',
            FORMAT(n.n, '000')
        ) AS display_name,
        '$2b$12$K3DYnjAUiTc6M3i8jy7v/.DmA.j.h8pWpf3A10pH/ouoUbpmVmczO' AS password_hash,
        CASE
            WHEN (l.location_no + n.n) % 20 IN (1, 2, 3, 4, 5) THEN 'female'
            WHEN (l.location_no + n.n) % 20 IN (6, 7, 8, 9, 10) THEN 'male'
            WHEN (l.location_no + n.n) % 20 IN (11, 12, 13, 14) THEN 'female'
            WHEN (l.location_no + n.n) % 20 IN (15, 16, 17, 18) THEN 'male'
            WHEN (l.location_no + n.n) % 20 = 19 THEN 'non-binary'
            ELSE 'prefer-not-to-say'
        END AS gender,
        CASE
            WHEN (l.location_no * 7 + n.n) % 100 < 20 THEN '18-25'
            WHEN (l.location_no * 7 + n.n) % 100 < 56 THEN '26-35'
            WHEN (l.location_no * 7 + n.n) % 100 < 80 THEN '36-45'
            WHEN (l.location_no * 7 + n.n) % 100 < 93 THEN '46-55'
            ELSE '55+'
        END AS age_bracket,
        CASE
            WHEN (l.location_no + n.n) % 12 IN (0, 1, 2, 3, 4) THEN 'both'
            WHEN (l.location_no + n.n) % 12 IN (5, 6, 7, 8) THEN 'women'
            ELSE 'men'
        END AS interested_in,
        CASE ((l.location_no + n.n - 2) % 30) + 1
            WHEN 1 THEN 'Product Manager'
            WHEN 2 THEN 'Business Analyst'
            WHEN 3 THEN 'Account Executive'
            WHEN 4 THEN 'Financial Analyst'
            WHEN 5 THEN 'Operations Manager'
            WHEN 6 THEN 'Management Consultant'
            WHEN 7 THEN 'Marketing Manager'
            WHEN 8 THEN 'Software Engineer'
            WHEN 9 THEN 'HR Business Partner'
            WHEN 10 THEN 'Project Manager'
            WHEN 11 THEN 'Data Analyst'
            WHEN 12 THEN 'Sales Manager'
            WHEN 13 THEN 'Customer Success Manager'
            WHEN 14 THEN 'Legal Counsel'
            WHEN 15 THEN 'Investment Associate'
            WHEN 16 THEN 'Accountant'
            WHEN 17 THEN 'Compliance Officer'
            WHEN 18 THEN 'Procurement Manager'
            WHEN 19 THEN 'Architect'
            WHEN 20 THEN 'Doctor'
            WHEN 21 THEN 'Teacher'
            WHEN 22 THEN 'Chef'
            WHEN 23 THEN 'Photographer'
            WHEN 24 THEN 'Interior Designer'
            WHEN 25 THEN 'Founder'
            WHEN 26 THEN 'Recruitment Consultant'
            WHEN 27 THEN 'Pharmacist'
            WHEN 28 THEN 'UX Designer'
            WHEN 29 THEN 'Solicitor'
            ELSE 'Commercial Manager'
        END AS profession,
        CASE
            WHEN (l.location_no * 3 + n.n) % 100 < 69 THEN 'silver'
            WHEN (l.location_no * 3 + n.n) % 100 < 91 THEN 'gold'
            ELSE 'platinum'
        END AS membership,
        CASE
            WHEN (l.location_no * 5 + n.n) % 100 < 34 THEN 1
            WHEN (l.location_no * 5 + n.n) % 100 < 61 THEN 2
            WHEN (l.location_no * 5 + n.n) % 100 < 81 THEN 3
            WHEN (l.location_no * 5 + n.n) % 100 < 94 THEN 4
            ELSE 5
        END AS current_tier,
        DATEADD(
            DAY,
            -((l.location_no * 11 + n.n * 13) % 500),
            SYSUTCDATETIME()
        ) AS created_at
    FROM locations l
    CROSS JOIN numbers n
)
INSERT INTO dbo.users (
    email,
    username,
    display_name,
    created_at,
    updated_at,
    password_hash,
    gender,
    is_active,
    age_bracket,
    location,
    profession,
    interested_in,
    membership,
    current_tier
)
SELECT
    s.email,
    s.username,
    s.display_name,
    s.created_at,
    s.created_at,
    s.password_hash,
    s.gender,
    1,
    s.age_bracket,
    s.location,
    s.profession,
    s.interested_in,
    s.membership,
    s.current_tier
FROM seed_source s
WHERE s.seq_no <= s.extra_count
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.users u
      WHERE u.username = s.username
         OR u.email = s.email
  );

SELECT
    location,
    COUNT(*) AS added_user_count
FROM dbo.users
WHERE username LIKE 'ukextra_%'
GROUP BY location
ORDER BY location;
