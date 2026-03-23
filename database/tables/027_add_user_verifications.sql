/*
Adds user verification tracking for Stripe Identity-based date verification.
*/

CREATE TABLE dbo.user_verifications (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_user_verifications PRIMARY KEY
        DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    relationship_id UNIQUEIDENTIFIER NULL,
    provider NVARCHAR(50) NOT NULL
        CONSTRAINT DF_user_verifications_provider DEFAULT 'stripe_identity',
    verification_purpose NVARCHAR(50) NOT NULL
        CONSTRAINT DF_user_verifications_purpose DEFAULT 'date',
    provider_session_id NVARCHAR(255) NOT NULL,
    status NVARCHAR(50) NOT NULL
        CONSTRAINT DF_user_verifications_status DEFAULT 'pending',
    verified_at DATETIME2(7) NULL,
    last_error_code NVARCHAR(100) NULL,
    last_error_reason NVARCHAR(500) NULL,
    metadata_json NVARCHAR(MAX) NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_user_verifications_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_user_verifications_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_user_verifications_user
        FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_user_verifications_relationship
        FOREIGN KEY (relationship_id) REFERENCES dbo.relationships(id),
    CONSTRAINT UQ_user_verifications_provider_session UNIQUE (provider_session_id),
    CONSTRAINT CK_user_verifications_provider
        CHECK (provider IN ('stripe_identity')),
    CONSTRAINT CK_user_verifications_purpose
        CHECK (verification_purpose IN ('date')),
    CONSTRAINT CK_user_verifications_status
        CHECK (status IN ('pending', 'processing', 'verified', 'requires_input', 'canceled'))
);

CREATE INDEX IX_user_verifications_user_purpose_created
    ON dbo.user_verifications (user_id, verification_purpose, created_at DESC);

CREATE INDEX IX_user_verifications_relationship_created
    ON dbo.user_verifications (relationship_id, created_at DESC);
