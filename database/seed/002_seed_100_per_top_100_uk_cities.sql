/*
Seed 10,000 AUR3M user profiles across 100 major UK locations.

Distribution:
- 100 profiles per location
- 100 locations total

Notes:
- Safe to re-run: inserts only missing usernames/emails
- Default password for all seeded users: Welcome123!
- Uses a population-oriented "largest UK urban locations" style list
*/

WITH city_list AS (
    SELECT *
    FROM (VALUES
        (1, 'London'),
        (2, 'Birmingham'),
        (3, 'Manchester'),
        (4, 'Liverpool'),
        (5, 'Leeds'),
        (6, 'Glasgow'),
        (7, 'Newcastle upon Tyne'),
        (8, 'Nottingham'),
        (9, 'Sheffield'),
        (10, 'Bristol'),
        (11, 'Belfast'),
        (12, 'Leicester'),
        (13, 'Edinburgh'),
        (14, 'Cardiff'),
        (15, 'Coventry'),
        (16, 'Bradford'),
        (17, 'Southampton'),
        (18, 'Portsmouth'),
        (19, 'Stoke-on-Trent'),
        (20, 'Reading'),
        (21, 'Sunderland'),
        (22, 'Preston'),
        (23, 'Swansea'),
        (24, 'Newport'),
        (25, 'Kingston upon Hull'),
        (26, 'Derby'),
        (27, 'Luton'),
        (28, 'Plymouth'),
        (29, 'Milton Keynes'),
        (30, 'Wolverhampton'),
        (31, 'Northampton'),
        (32, 'Aberdeen'),
        (33, 'Norwich'),
        (34, 'Dudley'),
        (35, 'Swindon'),
        (36, 'Crawley'),
        (37, 'Birkenhead'),
        (38, 'Bournemouth'),
        (39, 'Basildon'),
        (40, 'Poole'),
        (41, 'Watford'),
        (42, 'Huddersfield'),
        (43, 'Bolton'),
        (44, 'Blackpool'),
        (45, 'Middlesbrough'),
        (46, 'Telford'),
        (47, 'Ipswich'),
        (48, 'Slough'),
        (49, 'York'),
        (50, 'Oxford'),
        (51, 'Chelmsford'),
        (52, 'Peterborough'),
        (53, 'Cambridge'),
        (54, 'Gloucester'),
        (55, 'Exeter'),
        (56, 'Colchester'),
        (57, 'Cheltenham'),
        (58, 'Doncaster'),
        (59, 'Woking'),
        (60, 'Rotherham'),
        (61, 'Worthing'),
        (62, 'Rochdale'),
        (63, 'Solihull'),
        (64, 'Oldham'),
        (65, 'Southend-on-Sea'),
        (66, 'Maidstone'),
        (67, 'Gateshead'),
        (68, 'Carlisle'),
        (69, 'Worcester'),
        (70, 'Blackburn'),
        (71, 'Walsall'),
        (72, 'Lincoln'),
        (73, 'Burnley'),
        (74, 'Basingstoke'),
        (75, 'High Wycombe'),
        (76, 'Hastings'),
        (77, 'Eastbourne'),
        (78, 'Dundee'),
        (79, 'Perth'),
        (80, 'Inverness'),
        (81, 'Ayr'),
        (82, 'Paisley'),
        (83, 'Kilmarnock'),
        (84, 'Greenock'),
        (85, 'Hamilton'),
        (86, 'Falkirk'),
        (87, 'Dunfermline'),
        (88, 'Bath'),
        (89, 'Hereford'),
        (90, 'Chester'),
        (91, 'Lancaster'),
        (92, 'Harrogate'),
        (93, 'Rugby'),
        (94, 'Stafford'),
        (95, 'Wakefield'),
        (96, 'Halifax'),
        (97, 'Barnsley'),
        (98, 'Stockport'),
        (99, 'Warrington'),
        (100, 'Wigan')
    ) AS cities(city_rank, location)
),
numbers AS (
    SELECT TOP (100)
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
    FROM sys.all_objects
),
seed_source AS (
    SELECT
        c.city_rank,
        c.location,
        LOWER(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(c.location, ' ', ''),
                        '-', ''),
                    '''', ''),
                '.', ''),
            ',', '')
        ) AS city_slug,
        n.n AS city_seq,
        CONCAT('ukseed_', FORMAT(c.city_rank, '000'), '_', FORMAT(n.n, '000')) AS seed_code,
        CONCAT('ukseed_', FORMAT(c.city_rank, '000'), '_', FORMAT(n.n, '000')) AS username,
        CONCAT('ukseed_', FORMAT(c.city_rank, '000'), '_', FORMAT(n.n, '000'), '@aur3m.seed') AS email,
        CONCAT(
            CASE ((c.city_rank + n.n - 2) % 24) + 1
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
            '_',
            LOWER(LEFT(REPLACE(REPLACE(c.location, ' ', ''), '-', ''), 8)),
            '_',
            FORMAT(n.n, '000')
        ) AS display_name,
        '$2b$12$K3DYnjAUiTc6M3i8jy7v/.DmA.j.h8pWpf3A10pH/ouoUbpmVmczO' AS password_hash,
        CASE
            WHEN (c.city_rank + n.n) % 20 IN (1, 2, 3, 4, 5) THEN 'female'
            WHEN (c.city_rank + n.n) % 20 IN (6, 7, 8, 9, 10) THEN 'male'
            WHEN (c.city_rank + n.n) % 20 IN (11, 12, 13, 14) THEN 'female'
            WHEN (c.city_rank + n.n) % 20 IN (15, 16, 17, 18) THEN 'male'
            WHEN (c.city_rank + n.n) % 20 = 19 THEN 'non-binary'
            ELSE 'prefer-not-to-say'
        END AS gender,
        CASE
            WHEN (c.city_rank * 7 + n.n) % 100 < 20 THEN '18-25'
            WHEN (c.city_rank * 7 + n.n) % 100 < 56 THEN '26-35'
            WHEN (c.city_rank * 7 + n.n) % 100 < 80 THEN '36-45'
            WHEN (c.city_rank * 7 + n.n) % 100 < 93 THEN '46-55'
            ELSE '55+'
        END AS age_bracket,
        CASE
            WHEN (c.city_rank + n.n) % 12 IN (0, 1, 2, 3, 4) THEN 'both'
            WHEN (c.city_rank + n.n) % 12 IN (5, 6, 7, 8) THEN 'women'
            ELSE 'men'
        END AS interested_in,
        CASE ((c.city_rank + n.n - 2) % 28) + 1
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
            ELSE 'UX Designer'
        END AS profession,
        CASE
            WHEN (c.city_rank * 3 + n.n) % 100 < 68 THEN 'silver'
            WHEN (c.city_rank * 3 + n.n) % 100 < 91 THEN 'gold'
            ELSE 'platinum'
        END AS membership,
        CASE
            WHEN (c.city_rank * 5 + n.n) % 100 < 33 THEN 1
            WHEN (c.city_rank * 5 + n.n) % 100 < 60 THEN 2
            WHEN (c.city_rank * 5 + n.n) % 100 < 81 THEN 3
            WHEN (c.city_rank * 5 + n.n) % 100 < 94 THEN 4
            ELSE 5
        END AS current_tier,
        DATEADD(
            DAY,
            -((c.city_rank * 11 + n.n * 13) % 900),
            SYSUTCDATETIME()
        ) AS created_at
    FROM city_list c
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
    current_tier,
    is_test_member
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
    s.current_tier,
    1
FROM seed_source s
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.users u
    WHERE u.username = s.username
       OR u.email = s.email
);

SELECT
    COUNT(*) AS seeded_user_count
FROM dbo.users
WHERE username LIKE 'ukseed_%';

SELECT TOP (100)
    location,
    COUNT(*) AS user_count
FROM dbo.users
WHERE username LIKE 'ukseed_%'
GROUP BY location
ORDER BY user_count DESC, location ASC;
