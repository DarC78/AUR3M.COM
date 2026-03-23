/*
Adds an append-only user action log for reconstructing important user actions
independently from business tables.
*/

CREATE TABLE dbo.user_action_logs (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_user_action_logs PRIMARY KEY
        DEFAULT NEWID(),
    actor_user_id UNIQUEIDENTIFIER NOT NULL,
    target_user_id UNIQUEIDENTIFIER NULL,
    session_id UNIQUEIDENTIFIER NULL,
    relationship_id UNIQUEIDENTIFIER NULL,
    entity_type NVARCHAR(50) NOT NULL,
    entity_id UNIQUEIDENTIFIER NULL,
    action_type NVARCHAR(100) NOT NULL,
    metadata_json NVARCHAR(MAX) NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_user_action_logs_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_user_action_logs_actor
        FOREIGN KEY (actor_user_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_user_action_logs_target
        FOREIGN KEY (target_user_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_user_action_logs_session
        FOREIGN KEY (session_id) REFERENCES dbo.speed_round_sessions(id),
    CONSTRAINT FK_user_action_logs_relationship
        FOREIGN KEY (relationship_id) REFERENCES dbo.relationships(id),
    CONSTRAINT CK_user_action_logs_entity_type
        CHECK (entity_type IN ('speed_round_event', 'speed_round_session', 'relationship', 'scheduled_call', 'date_booking', 'user')),
    CONSTRAINT CK_user_action_logs_action_type
        CHECK (action_type IN (
            'speed_round_joined_queue',
            'speed_round_matched',
            'speed_round_waiting',
            'speed_round_decision_submitted',
            'speed_round_feedback_submitted',
            'speed_round_availability_submitted',
            'speed_round_follow_up_scheduled',
            'speed_round_session_completed'
        ))
);

CREATE INDEX IX_user_action_logs_actor_created
    ON dbo.user_action_logs (actor_user_id, created_at DESC);

CREATE INDEX IX_user_action_logs_session_created
    ON dbo.user_action_logs (session_id, created_at DESC);

CREATE INDEX IX_user_action_logs_relationship_created
    ON dbo.user_action_logs (relationship_id, created_at DESC);

CREATE INDEX IX_user_action_logs_action_created
    ON dbo.user_action_logs (action_type, created_at DESC);
