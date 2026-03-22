CREATE TABLE dbo.thumbs_up (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_thumbs_up PRIMARY KEY
        DEFAULT NEWID(),
    from_user_id UNIQUEIDENTIFIER NOT NULL,
    to_user_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_thumbs_up_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_thumbs_up_from_user
        FOREIGN KEY (from_user_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_thumbs_up_to_user
        FOREIGN KEY (to_user_id) REFERENCES dbo.users(id),
    CONSTRAINT UQ_thumbs_up_pair UNIQUE (from_user_id, to_user_id),
    CONSTRAINT CK_thumbs_up_not_self CHECK (from_user_id <> to_user_id)
);

CREATE INDEX IX_thumbs_up_from_user
    ON dbo.thumbs_up (from_user_id, to_user_id);

CREATE INDEX IX_thumbs_up_to_user
    ON dbo.thumbs_up (to_user_id, from_user_id);
