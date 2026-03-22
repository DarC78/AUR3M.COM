ALTER TABLE dbo.users
ADD stripe_customer_id NVARCHAR(255) NULL,
    stripe_subscription_id NVARCHAR(255) NULL,
    membership_status NVARCHAR(50) NOT NULL
        CONSTRAINT DF_users_membership_status DEFAULT 'inactive';

ALTER TABLE dbo.users
ADD CONSTRAINT CK_users_membership_status
    CHECK (membership_status IN ('inactive', 'active', 'past_due', 'cancelled'));
