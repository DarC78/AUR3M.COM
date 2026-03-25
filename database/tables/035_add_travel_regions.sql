/*
Adds UK-wide travel regions and centroid-to-centroid distances, then links users to a travel region.
*/

IF OBJECT_ID('dbo.travel_regions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.travel_regions (
        code NVARCHAR(50) NOT NULL
            CONSTRAINT PK_travel_regions PRIMARY KEY,
        name NVARCHAR(150) NOT NULL,
        nation NVARCHAR(20) NOT NULL,
        centroid_lat DECIMAL(9, 6) NOT NULL,
        centroid_lng DECIMAL(9, 6) NOT NULL
    );
END;

IF OBJECT_ID('dbo.travel_region_distances', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.travel_region_distances (
        from_region_code NVARCHAR(50) NOT NULL,
        to_region_code NVARCHAR(50) NOT NULL,
        distance_km DECIMAL(10, 2) NOT NULL,
        same_nation BIT NOT NULL,
        CONSTRAINT PK_travel_region_distances PRIMARY KEY (from_region_code, to_region_code),
        CONSTRAINT FK_travel_region_distances_from
            FOREIGN KEY (from_region_code) REFERENCES dbo.travel_regions(code),
        CONSTRAINT FK_travel_region_distances_to
            FOREIGN KEY (to_region_code) REFERENCES dbo.travel_regions(code)
    );
END;

IF COL_LENGTH('dbo.users', 'travel_region_code') IS NULL
BEGIN
    ALTER TABLE dbo.users
    ADD travel_region_code NVARCHAR(50) NULL;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_users_travel_region'
      AND parent_object_id = OBJECT_ID('dbo.users')
)
BEGIN
    ALTER TABLE dbo.users
    ADD CONSTRAINT FK_users_travel_region
        FOREIGN KEY (travel_region_code) REFERENCES dbo.travel_regions(code);
END;

;WITH source_regions AS (
    SELECT *
    FROM (VALUES
        ('ENG_LON_CENTRAL', 'Central London', 'england', CAST(51.507400 AS DECIMAL(9, 6)), CAST(-0.127800 AS DECIMAL(9, 6))),
        ('ENG_LON_NORTH', 'Outer London North', 'england', CAST(51.656500 AS DECIMAL(9, 6)), CAST(-0.390300 AS DECIMAL(9, 6))),
        ('ENG_LON_SOUTH', 'Outer London South', 'england', CAST(51.376200 AS DECIMAL(9, 6)), CAST(-0.098200 AS DECIMAL(9, 6))),
        ('ENG_LON_EAST', 'Outer London East / Essex', 'england', CAST(51.576100 AS DECIMAL(9, 6)), CAST(0.183700 AS DECIMAL(9, 6))),
        ('ENG_LON_WEST', 'Outer London West / Thames Valley', 'england', CAST(51.454300 AS DECIMAL(9, 6)), CAST(-0.978100 AS DECIMAL(9, 6))),
        ('ENG_SOUTH_WEST_COAST', 'South Coast West', 'england', CAST(50.909700 AS DECIMAL(9, 6)), CAST(-1.404400 AS DECIMAL(9, 6))),
        ('ENG_SOUTH_EAST_COAST', 'South Coast East', 'england', CAST(50.822500 AS DECIMAL(9, 6)), CAST(-0.137200 AS DECIMAL(9, 6))),
        ('ENG_KENT_MEDWAY', 'Kent / Medway', 'england', CAST(51.270400 AS DECIMAL(9, 6)), CAST(0.522700 AS DECIMAL(9, 6))),
        ('ENG_OX_BUCKS', 'Oxfordshire / Bucks', 'england', CAST(51.752000 AS DECIMAL(9, 6)), CAST(-1.257700 AS DECIMAL(9, 6))),
        ('ENG_EAST_ANGLIA', 'East Anglia', 'england', CAST(52.205300 AS DECIMAL(9, 6)), CAST(0.121800 AS DECIMAL(9, 6))),
        ('ENG_BRISTOL_BATH', 'Bristol / Bath', 'england', CAST(51.454500 AS DECIMAL(9, 6)), CAST(-2.587900 AS DECIMAL(9, 6))),
        ('ENG_DEVON_CORNWALL', 'Devon / Cornwall', 'england', CAST(50.718400 AS DECIMAL(9, 6)), CAST(-3.533900 AS DECIMAL(9, 6))),
        ('ENG_WEST_MIDLANDS', 'West Midlands', 'england', CAST(52.486200 AS DECIMAL(9, 6)), CAST(-1.890400 AS DECIMAL(9, 6))),
        ('ENG_COVENTRY_WARWICK', 'Coventry / Warwickshire', 'england', CAST(52.406800 AS DECIMAL(9, 6)), CAST(-1.519700 AS DECIMAL(9, 6))),
        ('ENG_EAST_MIDLANDS', 'East Midlands', 'england', CAST(52.954800 AS DECIMAL(9, 6)), CAST(-1.158100 AS DECIMAL(9, 6))),
        ('ENG_SOUTH_YORKSHIRE', 'South Yorkshire', 'england', CAST(53.381100 AS DECIMAL(9, 6)), CAST(-1.470100 AS DECIMAL(9, 6))),
        ('ENG_WEST_YORKSHIRE', 'West Yorkshire', 'england', CAST(53.800800 AS DECIMAL(9, 6)), CAST(-1.549100 AS DECIMAL(9, 6))),
        ('ENG_NORTH_EAST', 'North East England', 'england', CAST(54.978300 AS DECIMAL(9, 6)), CAST(-1.617800 AS DECIMAL(9, 6))),
        ('ENG_LIVERPOOL_CHESHIRE', 'Liverpool / Cheshire', 'england', CAST(53.408400 AS DECIMAL(9, 6)), CAST(-2.991600 AS DECIMAL(9, 6))),
        ('ENG_GREATER_MANCHESTER', 'Greater Manchester', 'england', CAST(53.480800 AS DECIMAL(9, 6)), CAST(-2.242600 AS DECIMAL(9, 6))),
        ('ENG_LANCS_CUMBRIA', 'Lancashire / Cumbria', 'england', CAST(53.763200 AS DECIMAL(9, 6)), CAST(-2.703100 AS DECIMAL(9, 6))),
        ('WAL_NORTH', 'North Wales', 'wales', CAST(53.324100 AS DECIMAL(9, 6)), CAST(-3.827600 AS DECIMAL(9, 6))),
        ('WAL_SOUTH', 'South Wales', 'wales', CAST(51.481600 AS DECIMAL(9, 6)), CAST(-3.179100 AS DECIMAL(9, 6))),
        ('SCT_GLASGOW', 'Glasgow / West Central Scotland', 'scotland', CAST(55.864200 AS DECIMAL(9, 6)), CAST(-4.251800 AS DECIMAL(9, 6))),
        ('SCT_EDINBURGH', 'Edinburgh / East Central Scotland', 'scotland', CAST(55.953300 AS DECIMAL(9, 6)), CAST(-3.188300 AS DECIMAL(9, 6))),
        ('SCT_DUNDEE', 'Dundee / Fife / Tayside', 'scotland', CAST(56.462000 AS DECIMAL(9, 6)), CAST(-2.970700 AS DECIMAL(9, 6))),
        ('SCT_ABERDEEN', 'Aberdeen / North East Scotland', 'scotland', CAST(57.149700 AS DECIMAL(9, 6)), CAST(-2.094300 AS DECIMAL(9, 6))),
        ('SCT_HIGHLANDS', 'Highlands / Inverness', 'scotland', CAST(57.477800 AS DECIMAL(9, 6)), CAST(-4.224700 AS DECIMAL(9, 6))),
        ('NIR_BELFAST', 'Belfast / Eastern NI', 'northern_ireland', CAST(54.597300 AS DECIMAL(9, 6)), CAST(-5.930100 AS DECIMAL(9, 6))),
        ('NIR_WEST', 'Western NI', 'northern_ireland', CAST(54.996600 AS DECIMAL(9, 6)), CAST(-7.308600 AS DECIMAL(9, 6)))
    ) AS src(code, name, nation, centroid_lat, centroid_lng)
)
MERGE dbo.travel_regions AS target
USING source_regions AS source
ON target.code = source.code
WHEN MATCHED THEN
    UPDATE SET
        name = source.name,
        nation = source.nation,
        centroid_lat = source.centroid_lat,
        centroid_lng = source.centroid_lng
WHEN NOT MATCHED THEN
    INSERT (code, name, nation, centroid_lat, centroid_lng)
    VALUES (source.code, source.name, source.nation, source.centroid_lat, source.centroid_lng);

DELETE FROM dbo.travel_region_distances;

INSERT INTO dbo.travel_region_distances (
    from_region_code,
    to_region_code,
    distance_km,
    same_nation
)
SELECT
    source.code,
    target.code,
    CAST(
        6371.0 * ACOS(
            CASE
                WHEN (
                    COS(RADIANS(CAST(source.centroid_lat AS FLOAT)))
                    * COS(RADIANS(CAST(target.centroid_lat AS FLOAT)))
                    * COS(RADIANS(CAST(target.centroid_lng AS FLOAT)) - RADIANS(CAST(source.centroid_lng AS FLOAT)))
                    + SIN(RADIANS(CAST(source.centroid_lat AS FLOAT)))
                    * SIN(RADIANS(CAST(target.centroid_lat AS FLOAT)))
                ) > 1 THEN 1
                WHEN (
                    COS(RADIANS(CAST(source.centroid_lat AS FLOAT)))
                    * COS(RADIANS(CAST(target.centroid_lat AS FLOAT)))
                    * COS(RADIANS(CAST(target.centroid_lng AS FLOAT)) - RADIANS(CAST(source.centroid_lng AS FLOAT)))
                    + SIN(RADIANS(CAST(source.centroid_lat AS FLOAT)))
                    * SIN(RADIANS(CAST(target.centroid_lat AS FLOAT)))
                ) < -1 THEN -1
                ELSE (
                    COS(RADIANS(CAST(source.centroid_lat AS FLOAT)))
                    * COS(RADIANS(CAST(target.centroid_lat AS FLOAT)))
                    * COS(RADIANS(CAST(target.centroid_lng AS FLOAT)) - RADIANS(CAST(source.centroid_lng AS FLOAT)))
                    + SIN(RADIANS(CAST(source.centroid_lat AS FLOAT)))
                    * SIN(RADIANS(CAST(target.centroid_lat AS FLOAT)))
                )
            END
        )
        AS DECIMAL(10, 2)
    ) AS distance_km,
    CAST(CASE WHEN source.nation = target.nation THEN 1 ELSE 0 END AS BIT) AS same_nation
FROM dbo.travel_regions source
CROSS JOIN dbo.travel_regions target;
