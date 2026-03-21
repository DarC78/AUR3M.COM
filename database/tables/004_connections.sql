CREATE TABLE dbo.connections (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_connections PRIMARY KEY
        DEFAULT NEWID(),
    user_a_id UNIQUEIDENTIFIER NOT NULL,
    user_b_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_connections_created_at DEFAULT SYSUTCDATETIME(),
    is_active BIT NOT NULL
        CONSTRAINT DF_connections_is_active DEFAULT 1,
    CONSTRAINT FK_connections_user_a_id
        FOREIGN KEY (user_a_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_connections_user_b_id
        FOREIGN KEY (user_b_id) REFERENCES dbo.users(id),
    CONSTRAINT CK_connections_not_self CHECK (user_a_id <> user_b_id),
    CONSTRAINT CK_connections_order CHECK (user_a_id < user_b_id),
    CONSTRAINT UQ_connections_pair UNIQUE (user_a_id, user_b_id)
);
