/*
Tracks clicks on email CTA buttons through signed redirect links.
*/

CREATE TABLE dbo.email_click_logs (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_email_click_logs PRIMARY KEY
        DEFAULT NEWID(),
    recipient_email NVARCHAR(255) NOT NULL,
    recipient_user_id UNIQUEIDENTIFIER NULL,
    email_type NVARCHAR(100) NOT NULL,
    button_id NVARCHAR(100) NOT NULL,
    target_url NVARCHAR(1000) NOT NULL,
    user_agent NVARCHAR(1000) NULL,
    ip_address NVARCHAR(255) NULL,
    clicked_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_email_click_logs_clicked_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_email_click_logs_user
        FOREIGN KEY (recipient_user_id) REFERENCES dbo.users(id)
);

CREATE INDEX IX_email_click_logs_email_created
    ON dbo.email_click_logs (recipient_email, clicked_at DESC);

CREATE INDEX IX_email_click_logs_user_created
    ON dbo.email_click_logs (recipient_user_id, clicked_at DESC);

CREATE INDEX IX_email_click_logs_type_created
    ON dbo.email_click_logs (email_type, clicked_at DESC);
