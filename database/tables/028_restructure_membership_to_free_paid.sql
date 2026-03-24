/*
Restructures user membership to the new base model:
- free
- paid

Legacy silver/gold/platinum memberships are normalized to paid.
*/

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_users_membership'
      AND parent_object_id = OBJECT_ID('dbo.users')
)
BEGIN
    ALTER TABLE dbo.users
    DROP CONSTRAINT CK_users_membership;
END;

IF EXISTS (
    SELECT 1
    FROM sys.default_constraints
    WHERE name = 'DF_users_membership'
      AND parent_object_id = OBJECT_ID('dbo.users')
)
BEGIN
    ALTER TABLE dbo.users
    DROP CONSTRAINT DF_users_membership;
END;

IF EXISTS (
    SELECT 1
    FROM sys.default_constraints
    WHERE name = 'DF_users_current_tier'
      AND parent_object_id = OBJECT_ID('dbo.users')
)
BEGIN
    ALTER TABLE dbo.users
    DROP CONSTRAINT DF_users_current_tier;
END;

ALTER TABLE dbo.users
ADD CONSTRAINT DF_users_membership DEFAULT 'free' FOR membership;

ALTER TABLE dbo.users
ADD CONSTRAINT DF_users_current_tier DEFAULT 0 FOR current_tier;

UPDATE dbo.users
SET membership = CASE
                   WHEN membership = 'free' THEN 'free'
                   ELSE 'paid'
                 END,
    current_tier = CASE
                     WHEN membership = 'free' THEN 0
                     ELSE 1
                   END;

ALTER TABLE dbo.users
ADD CONSTRAINT CK_users_membership
CHECK (membership IN ('free', 'paid'));
