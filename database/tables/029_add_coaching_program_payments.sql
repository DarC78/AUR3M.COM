/*
Tracks one-off coaching programme purchases independently from base membership.
*/

CREATE TABLE dbo.coaching_program_payments (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_coaching_program_payments PRIMARY KEY
        DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    stripe_session_id NVARCHAR(255) NULL,
    stripe_payment_intent_id NVARCHAR(255) NULL,
    amount_cents INT NOT NULL
        CONSTRAINT DF_coaching_program_payments_amount_cents DEFAULT 100000,
    status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_coaching_program_payments_status DEFAULT 'pending',
    paid_at DATETIME2(7) NULL,
    refunded_at DATETIME2(7) NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_coaching_program_payments_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_coaching_program_payments_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_coaching_program_payments_user
        FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT CK_coaching_program_payments_status
        CHECK (status IN ('pending', 'paid', 'refunded')),
    CONSTRAINT UQ_coaching_program_payments_user UNIQUE (user_id)
);

CREATE INDEX IX_coaching_program_payments_status
    ON dbo.coaching_program_payments (status, paid_at);
