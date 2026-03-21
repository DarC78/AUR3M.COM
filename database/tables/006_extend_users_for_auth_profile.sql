ALTER TABLE dbo.users
ADD
    username NVARCHAR(50) NOT NULL
        CONSTRAINT DF_users_username DEFAULT '',
    age_bracket NVARCHAR(20) NULL,
    location NVARCHAR(150) NULL,
    profession NVARCHAR(150) NULL,
    interested_in NVARCHAR(20) NULL,
    membership NVARCHAR(20) NOT NULL
        CONSTRAINT DF_users_membership DEFAULT 'silver',
    current_tier INT NOT NULL
        CONSTRAINT DF_users_current_tier DEFAULT 1;

ALTER TABLE dbo.users
ADD CONSTRAINT UQ_users_username UNIQUE (username);

ALTER TABLE dbo.users
ADD CONSTRAINT CK_users_gender
    CHECK (gender IS NULL OR gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say'));

ALTER TABLE dbo.users
ADD CONSTRAINT CK_users_age_bracket
    CHECK (age_bracket IS NULL OR age_bracket IN ('18-25', '26-35', '36-45', '46-55', '55+'));

ALTER TABLE dbo.users
ADD CONSTRAINT CK_users_interested_in
    CHECK (interested_in IS NULL OR interested_in IN ('men', 'women', 'both'));

ALTER TABLE dbo.users
ADD CONSTRAINT CK_users_membership
    CHECK (membership IN ('silver', 'gold', 'platinum'));
