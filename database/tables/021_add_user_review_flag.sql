ALTER TABLE dbo.users
ADD flagged_for_review BIT NOT NULL
    CONSTRAINT DF_users_flagged_for_review DEFAULT 0;
