CREATE TABLE dbo.scheduled_emails (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_scheduled_emails PRIMARY KEY
        DEFAULT NEWID(),
    email_type NVARCHAR(50) NOT NULL,
    [from_email] NVARCHAR(255) NOT NULL,
    [to_email] NVARCHAR(255) NOT NULL,
    [subject] NVARCHAR(255) NOT NULL,
    html_body NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_scheduled_emails_status DEFAULT 'pending',
    to_send_after_date DATETIME2(7) NOT NULL,
    attempts INT NOT NULL
        CONSTRAINT DF_scheduled_emails_attempts DEFAULT 0,
    last_attempt_at DATETIME2(7) NULL,
    sent_at DATETIME2(7) NULL,
    processing_started_at DATETIME2(7) NULL,
    last_error NVARCHAR(2000) NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_scheduled_emails_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_scheduled_emails_updated_at DEFAULT SYSUTCDATETIME()
);

ALTER TABLE dbo.scheduled_emails
ADD CONSTRAINT CK_scheduled_emails_status
    CHECK (status IN ('pending', 'processing', 'sent', 'failed'));

CREATE INDEX IX_scheduled_emails_due
    ON dbo.scheduled_emails (status, to_send_after_date, created_at);
