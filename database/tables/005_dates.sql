CREATE TABLE dbo.dates (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_dates PRIMARY KEY
        DEFAULT NEWID(),
    connection_id UNIQUEIDENTIFIER NOT NULL,
    scheduled_for DATETIME2(7) NOT NULL,
    location_name NVARCHAR(255) NULL,
    notes NVARCHAR(1000) NULL,
    status NVARCHAR(50) NOT NULL
        CONSTRAINT DF_dates_status DEFAULT 'scheduled',
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_dates_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_dates_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_dates_connection_id
        FOREIGN KEY (connection_id) REFERENCES dbo.connections(id),
    CONSTRAINT CK_dates_status
        CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'))
);
