/*
Adds email verification tracking and token storage for signup verification.
Existing users are marked verified so the change only affects new signups.
*/

IF COL_LENGTH('dbo.users', 'email_verified') IS NULL
BEGIN
    ALTER TABLE dbo.users
    ADD email_verified BIT NULL,
        email_verified_at DATETIME2(7) NULL;
END;

EXEC('
UPDATE dbo.users
SET email_verified = 1,
    email_verified_at = COALESCE(email_verified_at, created_at)
WHERE email_verified IS NULL;
');

IF EXISTS (
    SELECT 1
    FROM sys.default_constraints
    WHERE name = 'DF_users_email_verified'
      AND parent_object_id = OBJECT_ID('dbo.users')
)
BEGIN
    ALTER TABLE dbo.users
    DROP CONSTRAINT DF_users_email_verified;
END;

EXEC('ALTER TABLE dbo.users ALTER COLUMN email_verified BIT NOT NULL;');

ALTER TABLE dbo.users
ADD CONSTRAINT DF_users_email_verified DEFAULT 0 FOR email_verified;

IF OBJECT_ID('dbo.email_verification_tokens', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.email_verification_tokens (
        id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_email_verification_tokens PRIMARY KEY
            DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        token_hash NVARCHAR(64) NOT NULL,
        expires_at DATETIME2(7) NOT NULL,
        used_at DATETIME2(7) NULL,
        created_at DATETIME2(7) NOT NULL
            CONSTRAINT DF_email_verification_tokens_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_email_verification_tokens_user
            FOREIGN KEY (user_id) REFERENCES dbo.users(id),
        CONSTRAINT UQ_email_verification_tokens_hash UNIQUE (token_hash)
    );

    CREATE INDEX IX_email_verification_tokens_user_active
        ON dbo.email_verification_tokens (user_id, expires_at, used_at);
END;
