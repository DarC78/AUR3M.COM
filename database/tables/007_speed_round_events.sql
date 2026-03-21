CREATE TABLE dbo.speed_round_events (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_speed_round_events PRIMARY KEY
        DEFAULT NEWID(),
    title NVARCHAR(150) NOT NULL,
    starts_at DATETIME2(7) NOT NULL,
    ends_at DATETIME2(7) NOT NULL,
    room_name NVARCHAR(100) NOT NULL,
    capacity INT NOT NULL
        CONSTRAINT DF_speed_round_events_capacity DEFAULT 100,
    status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_speed_round_events_status DEFAULT 'scheduled',
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_speed_round_events_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_speed_round_events_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_speed_round_events_room_name UNIQUE (room_name),
    CONSTRAINT CK_speed_round_events_status
        CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
    CONSTRAINT CK_speed_round_events_time_range CHECK (ends_at > starts_at),
    CONSTRAINT CK_speed_round_events_capacity CHECK (capacity > 0)
);
