CREATE TABLE dbo.users (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_users PRIMARY KEY
        DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL,
    display_name NVARCHAR(150) NOT NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME(),
    password_hash NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50) NULL,
    birth_date DATE NULL,
    gender NVARCHAR(50) NULL,
    is_active BIT NOT NULL
        CONSTRAINT DF_users_is_active DEFAULT 1,
    CONSTRAINT UQ_users_email UNIQUE (email)
);
