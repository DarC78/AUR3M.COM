ALTER TABLE dbo.users
DROP CONSTRAINT CK_users_membership;

ALTER TABLE dbo.users
DROP CONSTRAINT DF_users_membership;

ALTER TABLE dbo.users
DROP CONSTRAINT DF_users_current_tier;

ALTER TABLE dbo.users
ADD CONSTRAINT DF_users_membership DEFAULT 'free' FOR membership;

ALTER TABLE dbo.users
ADD CONSTRAINT DF_users_current_tier DEFAULT 0 FOR current_tier;

ALTER TABLE dbo.users
ADD CONSTRAINT CK_users_membership
    CHECK (membership IN ('free', 'silver', 'gold', 'platinum'));
