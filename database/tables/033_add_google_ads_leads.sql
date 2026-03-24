/*
Stores Google Ads / PMAX lead form webhook submissions.
*/

CREATE TABLE dbo.google_ads_leads (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_google_ads_leads PRIMARY KEY
        DEFAULT NEWID(),
    lead_id NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NULL,
    form_id BIGINT NULL,
    campaign_id BIGINT NULL,
    adgroup_id BIGINT NULL,
    creative_id BIGINT NULL,
    asset_group_id BIGINT NULL,
    google_key NVARCHAR(255) NULL,
    lead_stage NVARCHAR(100) NULL,
    lead_submit_time DATETIME2(7) NULL,
    is_test BIT NOT NULL
        CONSTRAINT DF_google_ads_leads_is_test DEFAULT 0,
    raw_payload_json NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_google_ads_leads_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_google_ads_leads_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_google_ads_leads_lead_id UNIQUE (lead_id)
);

CREATE INDEX IX_google_ads_leads_email_created
    ON dbo.google_ads_leads (email, created_at DESC);

CREATE INDEX IX_google_ads_leads_campaign_created
    ON dbo.google_ads_leads (campaign_id, created_at DESC);
