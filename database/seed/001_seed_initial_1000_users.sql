/*
Seed 1,000 initial AUR3M user profiles.

Distribution:
- 500 London
- 200 Birmingham
- 50 each for Manchester, Leeds, Glasgow, Liverpool, Bristol, Edinburgh

Notes:
- Safe to re-run: inserts only missing usernames/emails
- Default password for all seeded users: Welcome123!
*/

WITH numbers AS (
    SELECT TOP (1000)
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
    FROM sys.all_objects a
    CROSS JOIN sys.all_objects b
),
seed_source AS (
    SELECT
        CONCAT('aur3mseed', RIGHT(CONCAT('0000', n), 4)) AS username,
        CONCAT('aur3mseed', RIGHT(CONCAT('0000', n), 4), '@aur3m.seed') AS email,
        CONCAT(
            CASE ((n - 1) % 24) + 1
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
                ELSE 'Evie'
            END,
            RIGHT(CONCAT('0000', n), 4)
        ) AS display_name,
        '$2b$12$K3DYnjAUiTc6M3i8jy7v/.DmA.j.h8pWpf3A10pH/ouoUbpmVmczO' AS password_hash,
        CASE
            WHEN n <= 500 THEN 'London'
            WHEN n <= 700 THEN 'Birmingham'
            WHEN n <= 750 THEN 'Manchester'
            WHEN n <= 800 THEN 'Leeds'
            WHEN n <= 850 THEN 'Glasgow'
            WHEN n <= 900 THEN 'Liverpool'
            WHEN n <= 950 THEN 'Bristol'
            ELSE 'Edinburgh'
        END AS location,
        CASE
            WHEN n % 20 IN (1, 2, 3, 4, 5) THEN 'female'
            WHEN n % 20 IN (6, 7, 8, 9, 10) THEN 'male'
            WHEN n % 20 IN (11, 12, 13, 14) THEN 'female'
            WHEN n % 20 IN (15, 16, 17, 18) THEN 'male'
            WHEN n % 20 = 19 THEN 'non-binary'
            ELSE 'prefer-not-to-say'
        END AS gender,
        CASE
            WHEN n % 100 < 22 THEN '18-25'
            WHEN n % 100 < 58 THEN '26-35'
            WHEN n % 100 < 82 THEN '36-45'
            WHEN n % 100 < 94 THEN '46-55'
            ELSE '55+'
        END AS age_bracket,
        CASE
            WHEN n % 12 IN (0, 1, 2, 3, 4) THEN 'both'
            WHEN n % 12 IN (5, 6, 7, 8) THEN 'women'
            ELSE 'men'
        END AS interested_in,
        CASE ((n - 1) % 24) + 1
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
            WHEN 16 THEN 'Architect'
            WHEN 17 THEN 'Doctor'
            WHEN 18 THEN 'Teacher'
            WHEN 19 THEN 'Chef'
            WHEN 20 THEN 'Photographer'
            WHEN 21 THEN 'Interior Designer'
            WHEN 22 THEN 'Founder'
            WHEN 23 THEN 'Recruitment Consultant'
            ELSE 'Accountant'
        END AS profession,
        CASE
            WHEN n % 100 < 70 THEN 'silver'
            WHEN n % 100 < 92 THEN 'gold'
            ELSE 'platinum'
        END AS membership,
        CASE
            WHEN n % 100 < 35 THEN 1
            WHEN n % 100 < 62 THEN 2
            WHEN n % 100 < 82 THEN 3
            WHEN n % 100 < 94 THEN 4
            ELSE 5
        END AS current_tier,
        DATEADD(
            DAY,
            -((n * 17) % 720),
            SYSUTCDATETIME()
        ) AS created_at
    FROM numbers
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
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.users u
    WHERE u.username = s.username
       OR u.email = s.email
);

SELECT
    location,
    COUNT(*) AS user_count
FROM dbo.users
WHERE username LIKE 'aur3mseed%'
GROUP BY location
ORDER BY
    CASE location
        WHEN 'London' THEN 1
        WHEN 'Birmingham' THEN 2
        WHEN 'Manchester' THEN 3
        WHEN 'Leeds' THEN 4
        WHEN 'Glasgow' THEN 5
        WHEN 'Liverpool' THEN 6
        WHEN 'Bristol' THEN 7
        WHEN 'Edinburgh' THEN 8
        ELSE 9
    END;
