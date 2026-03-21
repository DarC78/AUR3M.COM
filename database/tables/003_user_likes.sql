CREATE TABLE dbo.user_likes (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_user_likes PRIMARY KEY
        DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    liked_user_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_user_likes_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_user_likes_user_id
        FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_user_likes_liked_user_id
        FOREIGN KEY (liked_user_id) REFERENCES dbo.users(id),
    CONSTRAINT CK_user_likes_not_self CHECK (user_id <> liked_user_id),
    CONSTRAINT UQ_user_likes_pair UNIQUE (user_id, liked_user_id)
);
