/*
One-off normalization script to move every existing user onto the free tier.

Behavior:
- Sets membership to free
- Sets current_tier to 0
- Sets membership_status to inactive
- Clears active Stripe subscription linkage
- Safe to re-run
*/

UPDATE dbo.users
SET membership = 'free',
    current_tier = 0,
    membership_status = 'inactive',
    stripe_subscription_id = NULL,
    updated_at = SYSUTCDATETIME();

SELECT
    membership,
    current_tier,
    membership_status,
    COUNT(*) AS user_count
FROM dbo.users
GROUP BY membership, current_tier, membership_status
ORDER BY membership, current_tier, membership_status;
