CREATE TABLE dbo.password_reset_tokens (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_password_reset_tokens PRIMARY KEY
        DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    token_hash NVARCHAR(64) NOT NULL,
    expires_at DATETIME2(7) NOT NULL,
    used_at DATETIME2(7) NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_password_reset_tokens_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_password_reset_tokens_user_id
        FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT UQ_password_reset_tokens_token_hash UNIQUE (token_hash)
);

CREATE INDEX IX_password_reset_tokens_lookup
    ON dbo.password_reset_tokens (token_hash, expires_at, used_at);
