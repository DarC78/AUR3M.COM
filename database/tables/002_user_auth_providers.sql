CREATE TABLE dbo.user_auth_providers (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_user_auth_providers PRIMARY KEY
        DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    provider_name NVARCHAR(50) NOT NULL,
    provider_user_id NVARCHAR(255) NOT NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_user_auth_providers_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_user_auth_providers_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_user_auth_providers_user_id
        FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT UQ_user_auth_providers_provider UNIQUE (provider_name, provider_user_id)
);
