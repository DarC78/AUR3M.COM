/*
Seed additional UK towns/localities using a pragmatic approximate population-ranked list.

Distribution:
- 500 additional towns/localities
- Rank 101-200: 100 profiles each
- Rank 201-300: 90 profiles each
- Rank 301-400: 80 profiles each
- Rank 401-500: 70 profiles each
- Rank 501-600: 60 profiles each

Notes:
- Safe to re-run: inserts only missing usernames/emails
- Default password for all seeded users: Welcome123!
- Approximate large-settlement list, intended for broad product seeding rather than census accuracy
*/

WITH locality_list AS (
    SELECT *
    FROM (VALUES
        (101, 'Croydon'),
        (102, 'Romford'),
        (103, 'Sutton'),
        (104, 'Hounslow'),
        (105, 'Ilford'),
        (106, 'Kingston upon Thames'),
        (107, 'Twickenham'),
        (108, 'Uxbridge'),
        (109, 'Harrow'),
        (110, 'Ealing'),
        (111, 'Wokingham'),
        (112, 'Bracknell'),
        (113, 'Guildford'),
        (114, 'Ashford'),
        (115, 'Tunbridge Wells'),
        (116, 'Sevenoaks'),
        (117, 'Reigate'),
        (118, 'Redhill'),
        (119, 'Horsham'),
        (120, 'Chatham'),
        (121, 'Gillingham'),
        (122, 'Sittingbourne'),
        (123, 'Dartford'),
        (124, 'Gravesend'),
        (125, 'Folkestone'),
        (126, 'Margate'),
        (127, 'Canterbury'),
        (128, 'Dover'),
        (129, 'Ramsgate'),
        (130, 'Whitstable'),
        (131, 'Herne Bay'),
        (132, 'Bexleyheath'),
        (133, 'Orpington'),
        (134, 'Camberley'),
        (135, 'Farnham'),
        (136, 'Epsom'),
        (137, 'Leatherhead'),
        (138, 'Esher'),
        (139, 'Staines-upon-Thames'),
        (140, 'Addlestone'),
        (141, 'Walton-on-Thames'),
        (142, 'Sunbury-on-Thames'),
        (143, 'Banstead'),
        (144, 'Dorking'),
        (145, 'Oxted'),
        (146, 'Burgess Hill'),
        (147, 'Haywards Heath'),
        (148, 'East Grinstead'),
        (149, 'Chichester'),
        (150, 'Marlow'),
        (151, 'Taunton'),
        (152, 'Weston-super-Mare'),
        (153, 'Yeovil'),
        (154, 'Frome'),
        (155, 'Bridgwater'),
        (156, 'Torquay'),
        (157, 'Paignton'),
        (158, 'Brixham'),
        (159, 'Barnstaple'),
        (160, 'Exmouth'),
        (161, 'Sidmouth'),
        (162, 'Honiton'),
        (163, 'Truro'),
        (164, 'Falmouth'),
        (165, 'St Austell'),
        (166, 'Penzance'),
        (167, 'Camborne'),
        (168, 'Redruth'),
        (169, 'Newquay'),
        (170, 'Bodmin'),
        (171, 'Saltash'),
        (172, 'Wellington'),
        (173, 'Salisbury'),
        (174, 'Trowbridge'),
        (175, 'Chippenham'),
        (176, 'Devizes'),
        (177, 'Warminster'),
        (178, 'Melksham'),
        (179, 'Calne'),
        (180, 'Dorchester'),
        (181, 'Weymouth'),
        (182, 'Bridport'),
        (183, 'Shaftesbury'),
        (184, 'Blandford Forum'),
        (185, 'Ferndown'),
        (186, 'Wimborne Minster'),
        (187, 'Christchurch'),
        (188, 'Andover'),
        (189, 'Winchester'),
        (190, 'Aldershot'),
        (191, 'Farnborough'),
        (192, 'Fleet'),
        (193, 'Gosport'),
        (194, 'Fareham'),
        (195, 'Havant'),
        (196, 'Waterlooville'),
        (197, 'Eastleigh'),
        (198, 'Totton'),
        (199, 'Lymington'),
        (200, 'Ringwood'),
        (201, 'Bedford'),
        (202, 'Kempston'),
        (203, 'Leighton Buzzard'),
        (204, 'Dunstable'),
        (205, 'Biggleswade'),
        (206, 'Sandy'),
        (207, 'Harlow'),
        (208, 'Brentwood'),
        (209, 'Billericay'),
        (210, 'Rayleigh'),
        (211, 'Maldon'),
        (212, 'Braintree'),
        (213, 'Witham'),
        (214, 'Clacton-on-Sea'),
        (215, 'Harwich'),
        (216, 'Saffron Walden'),
        (217, 'Bishop''s Stortford'),
        (218, 'Hertford'),
        (219, 'Ware'),
        (220, 'Stevenage'),
        (221, 'Hitchin'),
        (222, 'Letchworth Garden City'),
        (223, 'Welwyn Garden City'),
        (224, 'Hatfield'),
        (225, 'Borehamwood'),
        (226, 'Hemel Hempstead'),
        (227, 'St Albans'),
        (228, 'Cheshunt'),
        (229, 'Hoddesdon'),
        (230, 'Potters Bar'),
        (231, 'Corby'),
        (232, 'Kettering'),
        (233, 'Wellingborough'),
        (234, 'Rushden'),
        (235, 'Daventry'),
        (236, 'Market Harborough'),
        (237, 'Melton Mowbray'),
        (238, 'Loughborough'),
        (239, 'Coalville'),
        (240, 'Hinckley'),
        (241, 'Nuneaton'),
        (242, 'Bedworth'),
        (243, 'Rugby'),
        (244, 'Tamworth'),
        (245, 'Burton upon Trent'),
        (246, 'Cannock'),
        (247, 'Rugeley'),
        (248, 'Lichfield'),
        (249, 'Newark-on-Trent'),
        (250, 'Mansfield'),
        (251, 'Sutton in Ashfield'),
        (252, 'Worksop'),
        (253, 'Retford'),
        (254, 'Chesterfield'),
        (255, 'Matlock'),
        (256, 'Glossop'),
        (257, 'Ilkeston'),
        (258, 'Long Eaton'),
        (259, 'Swadlincote'),
        (260, 'Ashbourne'),
        (261, 'Grantham'),
        (262, 'Boston'),
        (263, 'Skegness'),
        (264, 'Spalding'),
        (265, 'Sleaford'),
        (266, 'Scunthorpe'),
        (267, 'Grimsby'),
        (268, 'Cleethorpes'),
        (269, 'Goole'),
        (270, 'Beverley'),
        (271, 'Bridlington'),
        (272, 'Scarborough'),
        (273, 'Whitby'),
        (274, 'Selby'),
        (275, 'Harrogate'),
        (276, 'Knaresborough'),
        (277, 'Ripon'),
        (278, 'Skipton'),
        (279, 'Keighley'),
        (280, 'Bingley'),
        (281, 'Shipley'),
        (282, 'Pudsey'),
        (283, 'Dewsbury'),
        (284, 'Batley'),
        (285, 'Castleford'),
        (286, 'Pontefract'),
        (287, 'Morley'),
        (288, 'Brighouse'),
        (289, 'Elland'),
        (290, 'Hebden Bridge'),
        (291, 'Todmorden'),
        (292, 'Mexborough'),
        (293, 'Dronfield'),
        (294, 'Barnoldswick'),
        (295, 'Colne'),
        (296, 'Nelson'),
        (297, 'Accrington'),
        (298, 'Rawtenstall'),
        (299, 'Haslingden'),
        (300, 'Chorley'),
        (301, 'Leyland'),
        (302, 'Southport'),
        (303, 'Ormskirk'),
        (304, 'Formby'),
        (305, 'St Helens'),
        (306, 'Widnes'),
        (307, 'Runcorn'),
        (308, 'Ellesmere Port'),
        (309, 'Crewe'),
        (310, 'Northwich'),
        (311, 'Macclesfield'),
        (312, 'Wilmslow'),
        (313, 'Knutsford'),
        (314, 'Altrincham'),
        (315, 'Sale'),
        (316, 'Urmston'),
        (317, 'Eccles'),
        (318, 'Middleton'),
        (319, 'Heywood'),
        (320, 'Bury'),
        (321, 'Prestwich'),
        (322, 'Whitefield'),
        (323, 'Chadderton'),
        (324, 'Royton'),
        (325, 'Ashton-under-Lyne'),
        (326, 'Hyde'),
        (327, 'Denton'),
        (328, 'Stalybridge'),
        (329, 'Dukinfield'),
        (330, 'Leigh'),
        (331, 'Atherton'),
        (332, 'Hindley'),
        (333, 'Skelmersdale'),
        (334, 'Kirkby'),
        (335, 'Prescot'),
        (336, 'Crosby'),
        (337, 'Bootle'),
        (338, 'Huyton'),
        (339, 'Wallasey'),
        (340, 'Bebington'),
        (341, 'Heswall'),
        (342, 'Hoylake'),
        (343, 'Newton-le-Willows'),
        (344, 'Golborne'),
        (345, 'Cheadle'),
        (346, 'Cheadle Hulme'),
        (347, 'Hazel Grove'),
        (348, 'Marple'),
        (349, 'Ramsbottom'),
        (350, 'Failsworth'),
        (351, 'Darlington'),
        (352, 'Hartlepool'),
        (353, 'Stockton-on-Tees'),
        (354, 'Thornaby-on-Tees'),
        (355, 'Redcar'),
        (356, 'Guisborough'),
        (357, 'Northallerton'),
        (358, 'Yarm'),
        (359, 'Billingham'),
        (360, 'Peterlee'),
        (361, 'Durham'),
        (362, 'Bishop Auckland'),
        (363, 'Consett'),
        (364, 'Stanley'),
        (365, 'Washington'),
        (366, 'South Shields'),
        (367, 'North Shields'),
        (368, 'Whitley Bay'),
        (369, 'Tynemouth'),
        (370, 'Wallsend'),
        (371, 'Jarrow'),
        (372, 'Hebburn'),
        (373, 'Prudhoe'),
        (374, 'Morpeth'),
        (375, 'Ashington'),
        (376, 'Blyth'),
        (377, 'Cramlington'),
        (378, 'Hexham'),
        (379, 'Berwick-upon-Tweed'),
        (380, 'Alnwick'),
        (381, 'Saltburn-by-the-Sea'),
        (382, 'Barnard Castle'),
        (383, 'Newton Aycliffe'),
        (384, 'Seaham'),
        (385, 'Chester-le-Street'),
        (386, 'Houghton-le-Spring'),
        (387, 'Ryhope'),
        (388, 'Ferryhill'),
        (389, 'Shildon'),
        (390, 'Crook'),
        (391, 'Spennymoor'),
        (392, 'Easington'),
        (393, 'Brandon'),
        (394, 'Sedgefield'),
        (395, 'Hetton-le-Hole'),
        (396, 'Bedlington'),
        (397, 'Killingworth'),
        (398, 'Longbenton'),
        (399, 'Blaydon-on-Tyne'),
        (400, 'Rowlands Gill'),
        (401, 'Wrexham'),
        (402, 'Barry'),
        (403, 'Bridgend'),
        (404, 'Llanelli'),
        (405, 'Merthyr Tydfil'),
        (406, 'Neath'),
        (407, 'Port Talbot'),
        (408, 'Caerphilly'),
        (409, 'Cwmbran'),
        (410, 'Pontypridd'),
        (411, 'Rhondda'),
        (412, 'Aberdare'),
        (413, 'Abergavenny'),
        (414, 'Monmouth'),
        (415, 'Ebbw Vale'),
        (416, 'Tredegar'),
        (417, 'Blackwood'),
        (418, 'Ystrad Mynach'),
        (419, 'Porthcawl'),
        (420, 'Llandudno'),
        (421, 'Colwyn Bay'),
        (422, 'Rhyl'),
        (423, 'Prestatyn'),
        (424, 'Bangor'),
        (425, 'Caernarfon'),
        (426, 'Holyhead'),
        (427, 'Mold'),
        (428, 'Flint'),
        (429, 'Holywell'),
        (430, 'Denbigh'),
        (431, 'Ruthin'),
        (432, 'Newtown'),
        (433, 'Welshpool'),
        (434, 'Brecon'),
        (435, 'Carmarthen'),
        (436, 'Haverfordwest'),
        (437, 'Milford Haven'),
        (438, 'Pembroke Dock'),
        (439, 'Fishguard'),
        (440, 'Aberystwyth'),
        (441, 'Cardigan'),
        (442, 'Lampeter'),
        (443, 'Machynlleth'),
        (444, 'Builth Wells'),
        (445, 'Tenby'),
        (446, 'Pwllheli'),
        (447, 'Conwy'),
        (448, 'Porthmadog'),
        (449, 'Gorseinon'),
        (450, 'Ammanford'),
        (451, 'Irvine'),
        (452, 'Cumnock'),
        (453, 'Troon'),
        (454, 'Prestwick'),
        (455, 'Saltcoats'),
        (456, 'Ardrossan'),
        (457, 'Stevenston'),
        (458, 'Largs'),
        (459, 'Dumbarton'),
        (460, 'Clydebank'),
        (461, 'Bearsden'),
        (462, 'Milngavie'),
        (463, 'East Kilbride'),
        (464, 'Motherwell'),
        (465, 'Coatbridge'),
        (466, 'Airdrie'),
        (467, 'Bellshill'),
        (468, 'Wishaw'),
        (469, 'Cumbernauld'),
        (470, 'Kirkintilloch'),
        (471, 'Bishopbriggs'),
        (472, 'Helensburgh'),
        (473, 'Stirling'),
        (474, 'Alloa'),
        (475, 'Dunblane'),
        (476, 'Livingston'),
        (477, 'Bathgate'),
        (478, 'Linlithgow'),
        (479, 'Grangemouth'),
        (480, 'Larbert'),
        (481, 'Bo''ness'),
        (482, 'Kirkcaldy'),
        (483, 'Glenrothes'),
        (484, 'Leven'),
        (485, 'Cupar'),
        (486, 'St Andrews'),
        (487, 'Rosyth'),
        (488, 'Cowdenbeath'),
        (489, 'Inverkeithing'),
        (490, 'Crieff'),
        (491, 'Arbroath'),
        (492, 'Montrose'),
        (493, 'Forfar'),
        (494, 'Brechin'),
        (495, 'Stonehaven'),
        (496, 'Inverurie'),
        (497, 'Elgin'),
        (498, 'Nairn'),
        (499, 'Fort William'),
        (500, 'Oban'),
        (501, 'Renfrew'),
        (502, 'Johnstone'),
        (503, 'Barrhead'),
        (504, 'Newton Mearns'),
        (505, 'Rutherglen'),
        (506, 'Cambuslang'),
        (507, 'Lanark'),
        (508, 'Hawick'),
        (509, 'Galashiels'),
        (510, 'Peebles'),
        (511, 'Dumfries'),
        (512, 'Annan'),
        (513, 'Stranraer'),
        (514, 'Musselburgh'),
        (515, 'Tranent'),
        (516, 'Haddington'),
        (517, 'Dalkeith'),
        (518, 'Penicuik'),
        (519, 'Bonnyrigg'),
        (520, 'Dunbar'),
        (521, 'North Berwick'),
        (522, 'Port Glasgow'),
        (523, 'Gourock'),
        (524, 'Dunoon'),
        (525, 'Rothesay'),
        (526, 'Campbeltown'),
        (527, 'Lerwick'),
        (528, 'Kirkwall'),
        (529, 'Stornoway'),
        (530, 'Lisburn'),
        (531, 'Newtownabbey'),
        (532, 'Bangor NI'),
        (533, 'Craigavon'),
        (534, 'Newry'),
        (535, 'Ballymena'),
        (536, 'Coleraine'),
        (537, 'Londonderry'),
        (538, 'Omagh'),
        (539, 'Enniskillen'),
        (540, 'Larne'),
        (541, 'Carrickfergus'),
        (542, 'Antrim'),
        (543, 'Cookstown'),
        (544, 'Magherafelt'),
        (545, 'Dungannon'),
        (546, 'Banbridge'),
        (547, 'Armagh'),
        (548, 'Lurgan'),
        (549, 'Portadown'),
        (550, 'Downpatrick'),
        (551, 'Lowestoft'),
        (552, 'Great Yarmouth'),
        (553, 'King''s Lynn'),
        (554, 'Thetford'),
        (555, 'Dereham'),
        (556, 'Cromer'),
        (557, 'Sheringham'),
        (558, 'Fakenham'),
        (559, 'Mildenhall'),
        (560, 'Newmarket'),
        (561, 'Sudbury'),
        (562, 'Stowmarket'),
        (563, 'Felixstowe'),
        (564, 'Bury St Edmunds'),
        (565, 'Hadleigh'),
        (566, 'Woodbridge'),
        (567, 'Diss'),
        (568, 'March'),
        (569, 'Wisbech'),
        (570, 'Ely'),
        (571, 'St Neots'),
        (572, 'Huntingdon'),
        (573, 'Royston'),
        (574, 'Cambourne'),
        (575, 'Didcot'),
        (576, 'Abingdon-on-Thames'),
        (577, 'Wantage'),
        (578, 'Wallingford'),
        (579, 'Banbury'),
        (580, 'Bicester'),
        (581, 'Kidlington'),
        (582, 'Witney'),
        (583, 'Carterton'),
        (584, 'Malvern'),
        (585, 'Kidderminster'),
        (586, 'Stourbridge'),
        (587, 'Halesowen'),
        (588, 'Oldbury'),
        (589, 'Smethwick'),
        (590, 'West Bromwich'),
        (591, 'Sutton Coldfield'),
        (592, 'Redditch'),
        (593, 'Bromsgrove'),
        (594, 'Evesham'),
        (595, 'Leamington Spa'),
        (596, 'Warwick'),
        (597, 'Stratford-upon-Avon'),
        (598, 'Tewkesbury'),
        (599, 'Cirencester'),
        (600, 'Stroud')
    ) AS localities(locality_rank, location)
),
numbers AS (
    SELECT TOP (100)
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
    FROM sys.all_objects
),
seed_source AS (
    SELECT
        l.locality_rank,
        l.location,
        CASE
            WHEN l.locality_rank <= 200 THEN 100
            WHEN l.locality_rank <= 300 THEN 90
            WHEN l.locality_rank <= 400 THEN 80
            WHEN l.locality_rank <= 500 THEN 70
            ELSE 60
        END AS profile_count,
        n.n AS locality_seq,
        CONCAT('uktown_', FORMAT(l.locality_rank, '000'), '_', FORMAT(n.n, '000')) AS username,
        CONCAT('uktown_', FORMAT(l.locality_rank, '000'), '_', FORMAT(n.n, '000'), '@aur3m.seed') AS email,
        CONCAT(
            CASE ((l.locality_rank + n.n - 2) % 28) + 1
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
            WHEN (l.locality_rank + n.n) % 20 IN (1, 2, 3, 4, 5) THEN 'female'
            WHEN (l.locality_rank + n.n) % 20 IN (6, 7, 8, 9, 10) THEN 'male'
            WHEN (l.locality_rank + n.n) % 20 IN (11, 12, 13, 14) THEN 'female'
            WHEN (l.locality_rank + n.n) % 20 IN (15, 16, 17, 18) THEN 'male'
            WHEN (l.locality_rank + n.n) % 20 = 19 THEN 'non-binary'
            ELSE 'prefer-not-to-say'
        END AS gender,
        CASE
            WHEN (l.locality_rank * 7 + n.n) % 100 < 20 THEN '18-25'
            WHEN (l.locality_rank * 7 + n.n) % 100 < 55 THEN '26-35'
            WHEN (l.locality_rank * 7 + n.n) % 100 < 79 THEN '36-45'
            WHEN (l.locality_rank * 7 + n.n) % 100 < 92 THEN '46-55'
            ELSE '55+'
        END AS age_bracket,
        CASE
            WHEN (l.locality_rank + n.n) % 12 IN (0, 1, 2, 3, 4) THEN 'both'
            WHEN (l.locality_rank + n.n) % 12 IN (5, 6, 7, 8) THEN 'women'
            ELSE 'men'
        END AS interested_in,
        CASE ((l.locality_rank + n.n - 2) % 30) + 1
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
            WHEN (l.locality_rank * 3 + n.n) % 100 < 69 THEN 'silver'
            WHEN (l.locality_rank * 3 + n.n) % 100 < 91 THEN 'gold'
            ELSE 'platinum'
        END AS membership,
        CASE
            WHEN (l.locality_rank * 5 + n.n) % 100 < 34 THEN 1
            WHEN (l.locality_rank * 5 + n.n) % 100 < 61 THEN 2
            WHEN (l.locality_rank * 5 + n.n) % 100 < 81 THEN 3
            WHEN (l.locality_rank * 5 + n.n) % 100 < 94 THEN 4
            ELSE 5
        END AS current_tier,
        DATEADD(
            DAY,
            -((l.locality_rank * 11 + n.n * 13) % 1000),
            SYSUTCDATETIME()
        ) AS created_at
    FROM locality_list l
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
WHERE s.locality_seq <= s.profile_count
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.users u
      WHERE u.username = s.username
         OR u.email = s.email
  );

SELECT
    COUNT(*) AS seeded_user_count
FROM dbo.users
WHERE username LIKE 'uktown_%';

SELECT TOP (50)
    location,
    COUNT(*) AS user_count
FROM dbo.users
WHERE username LIKE 'uktown_%'
GROUP BY location
ORDER BY user_count DESC, location ASC;
