/*
Adds Gold date payment, availability, and booking tables.
*/

CREATE TABLE dbo.date_payments (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_date_payments PRIMARY KEY
        DEFAULT NEWID(),
    relationship_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    stripe_session_id NVARCHAR(255) NULL,
    stripe_payment_intent_id NVARCHAR(255) NULL,
    amount_cents INT NOT NULL
        CONSTRAINT DF_date_payments_amount_cents DEFAULT 20000,
    status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_date_payments_status DEFAULT 'pending',
    paid_at DATETIME2(7) NULL,
    refund_deadline DATETIME2(7) NULL,
    refunded_at DATETIME2(7) NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_date_payments_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_date_payments_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_date_payments_relationship
        FOREIGN KEY (relationship_id) REFERENCES dbo.relationships(id),
    CONSTRAINT FK_date_payments_user
        FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT CK_date_payments_status CHECK (status IN ('pending', 'paid', 'refunded')),
    CONSTRAINT UQ_date_payments_relationship_user UNIQUE (relationship_id, user_id)
);

CREATE INDEX IX_date_payments_relationship
    ON dbo.date_payments (relationship_id, status, refund_deadline);

CREATE TABLE dbo.date_availability (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_date_availability PRIMARY KEY
        DEFAULT NEWID(),
    relationship_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    slot_date DATE NOT NULL,
    slot_time NVARCHAR(5) NOT NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_date_availability_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_date_availability_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_date_availability_relationship
        FOREIGN KEY (relationship_id) REFERENCES dbo.relationships(id),
    CONSTRAINT FK_date_availability_user
        FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT CK_date_availability_time CHECK (slot_time IN ('18:00', '18:30', '19:00', '19:30')),
    CONSTRAINT UQ_date_availability_slot UNIQUE (relationship_id, user_id, slot_date, slot_time)
);

CREATE INDEX IX_date_availability_relationship
    ON dbo.date_availability (relationship_id, user_id, slot_date, slot_time);

CREATE TABLE dbo.date_bookings (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_date_bookings PRIMARY KEY
        DEFAULT NEWID(),
    relationship_id UNIQUEIDENTIFIER NOT NULL,
    scheduled_at DATETIME2(7) NOT NULL,
    venue NVARCHAR(255) NOT NULL,
    venue_address NVARCHAR(255) NULL,
    status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_date_bookings_status DEFAULT 'confirmed',
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_date_bookings_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_date_bookings_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_date_bookings_relationship
        FOREIGN KEY (relationship_id) REFERENCES dbo.relationships(id),
    CONSTRAINT CK_date_bookings_status CHECK (status IN ('confirmed', 'completed', 'cancelled')),
    CONSTRAINT UQ_date_bookings_relationship UNIQUE (relationship_id)
);

CREATE INDEX IX_date_bookings_relationship
    ON dbo.date_bookings (relationship_id, status);
