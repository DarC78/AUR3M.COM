/*
Adds a marker for seeded/test accounts so they can be distinguished from live users.

Migration behavior:
- Adds dbo.users.is_test_member with default 0
- Marks all existing users as test members
*/

ALTER TABLE dbo.users
ADD is_test_member BIT NOT NULL
    CONSTRAINT DF_users_is_test_member DEFAULT 0;

UPDATE dbo.users
SET is_test_member = 1;
