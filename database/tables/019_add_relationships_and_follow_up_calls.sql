/*
Adds post-call relationship tracking, feedback, availability, and scheduled follow-up calls.
*/

CREATE TABLE dbo.relationships (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_relationships PRIMARY KEY
        DEFAULT NEWID(),
    user_a_id UNIQUEIDENTIFIER NOT NULL,
    user_b_id UNIQUEIDENTIFIER NOT NULL,
    latest_session_id UNIQUEIDENTIFIER NULL,
    stage NVARCHAR(30) NOT NULL
        CONSTRAINT DF_relationships_stage DEFAULT 'speed_round_done',
    started_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_relationships_started_at DEFAULT SYSUTCDATETIME(),
    last_updated DATETIME2(7) NOT NULL
        CONSTRAINT DF_relationships_last_updated DEFAULT SYSUTCDATETIME(),
    flagged_for_review BIT NOT NULL
        CONSTRAINT DF_relationships_flagged_for_review DEFAULT 0,
    CONSTRAINT FK_relationships_user_a
        FOREIGN KEY (user_a_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_relationships_user_b
        FOREIGN KEY (user_b_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_relationships_latest_session
        FOREIGN KEY (latest_session_id) REFERENCES dbo.speed_round_sessions(id),
    CONSTRAINT CK_relationships_not_self CHECK (user_a_id <> user_b_id),
    CONSTRAINT CK_relationships_order CHECK (user_a_id < user_b_id),
    CONSTRAINT CK_relationships_stage CHECK (
        stage IN (
            'speed_round_done',
            'passed',
            'mutual_yes',
            'scheduled_15min',
            'completed_15min',
            'scheduled_60min',
            'completed_60min',
            'offline_date',
            'revealed'
        )
    ),
    CONSTRAINT UQ_relationships_pair UNIQUE (user_a_id, user_b_id)
);

CREATE INDEX IX_relationships_user_a_stage
    ON dbo.relationships (user_a_id, stage, last_updated);

CREATE INDEX IX_relationships_user_b_stage
    ON dbo.relationships (user_b_id, stage, last_updated);

CREATE TABLE dbo.speed_round_feedback (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_speed_round_feedback PRIMARY KEY
        DEFAULT NEWID(),
    session_id UNIQUEIDENTIFIER NOT NULL,
    relationship_id UNIQUEIDENTIFIER NOT NULL,
    author_user_id UNIQUEIDENTIFIER NOT NULL,
    was_professional BIT NULL,
    felt_unsafe BIT NULL,
    private_note NVARCHAR(500) NULL,
    flagged_for_review BIT NOT NULL
        CONSTRAINT DF_speed_round_feedback_flagged DEFAULT 0,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_speed_round_feedback_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_speed_round_feedback_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_speed_round_feedback_session
        FOREIGN KEY (session_id) REFERENCES dbo.speed_round_sessions(id),
    CONSTRAINT FK_speed_round_feedback_relationship
        FOREIGN KEY (relationship_id) REFERENCES dbo.relationships(id),
    CONSTRAINT FK_speed_round_feedback_author
        FOREIGN KEY (author_user_id) REFERENCES dbo.users(id),
    CONSTRAINT UQ_speed_round_feedback_session_author UNIQUE (session_id, author_user_id)
);

CREATE INDEX IX_speed_round_feedback_relationship
    ON dbo.speed_round_feedback (relationship_id, created_at);

CREATE TABLE dbo.relationship_notes (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_relationship_notes PRIMARY KEY
        DEFAULT NEWID(),
    relationship_id UNIQUEIDENTIFIER NOT NULL,
    session_id UNIQUEIDENTIFIER NULL,
    author_user_id UNIQUEIDENTIFIER NOT NULL,
    stage NVARCHAR(30) NOT NULL,
    note NVARCHAR(500) NOT NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_relationship_notes_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_relationship_notes_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_relationship_notes_relationship
        FOREIGN KEY (relationship_id) REFERENCES dbo.relationships(id),
    CONSTRAINT FK_relationship_notes_session
        FOREIGN KEY (session_id) REFERENCES dbo.speed_round_sessions(id),
    CONSTRAINT FK_relationship_notes_author
        FOREIGN KEY (author_user_id) REFERENCES dbo.users(id),
    CONSTRAINT CK_relationship_notes_stage CHECK (
        stage IN (
            'speed_round_done',
            'passed',
            'mutual_yes',
            'scheduled_15min',
            'completed_15min',
            'scheduled_60min',
            'completed_60min',
            'offline_date',
            'revealed'
        )
    ),
    CONSTRAINT UQ_relationship_notes_session_author UNIQUE (relationship_id, session_id, author_user_id)
);

CREATE INDEX IX_relationship_notes_relationship
    ON dbo.relationship_notes (relationship_id, created_at);

CREATE TABLE dbo.speed_round_availability (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_speed_round_availability PRIMARY KEY
        DEFAULT NEWID(),
    session_id UNIQUEIDENTIFIER NOT NULL,
    relationship_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    slot_date DATE NOT NULL,
    period NVARCHAR(20) NOT NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_speed_round_availability_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_speed_round_availability_session
        FOREIGN KEY (session_id) REFERENCES dbo.speed_round_sessions(id),
    CONSTRAINT FK_speed_round_availability_relationship
        FOREIGN KEY (relationship_id) REFERENCES dbo.relationships(id),
    CONSTRAINT FK_speed_round_availability_user
        FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT CK_speed_round_availability_period
        CHECK (period IN ('morning', 'afternoon', 'evening')),
    CONSTRAINT UQ_speed_round_availability_slot UNIQUE (session_id, user_id, slot_date, period)
);

CREATE INDEX IX_speed_round_availability_session
    ON dbo.speed_round_availability (session_id, user_id, slot_date, period);

CREATE TABLE dbo.scheduled_calls (
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_scheduled_calls PRIMARY KEY
        DEFAULT NEWID(),
    relationship_id UNIQUEIDENTIFIER NOT NULL,
    session_id UNIQUEIDENTIFIER NOT NULL,
    user_a_id UNIQUEIDENTIFIER NOT NULL,
    user_b_id UNIQUEIDENTIFIER NOT NULL,
    scheduled_at DATETIME2(7) NOT NULL,
    duration_minutes INT NOT NULL,
    call_type NVARCHAR(20) NOT NULL
        CONSTRAINT DF_scheduled_calls_call_type DEFAULT 'video',
    status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_scheduled_calls_status DEFAULT 'scheduled',
    room_name NVARCHAR(100) NOT NULL,
    created_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_scheduled_calls_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NOT NULL
        CONSTRAINT DF_scheduled_calls_updated_at DEFAULT SYSUTCDATETIME(),
    cancelled_at DATETIME2(7) NULL,
    CONSTRAINT FK_scheduled_calls_relationship
        FOREIGN KEY (relationship_id) REFERENCES dbo.relationships(id),
    CONSTRAINT FK_scheduled_calls_session
        FOREIGN KEY (session_id) REFERENCES dbo.speed_round_sessions(id),
    CONSTRAINT FK_scheduled_calls_user_a
        FOREIGN KEY (user_a_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_scheduled_calls_user_b
        FOREIGN KEY (user_b_id) REFERENCES dbo.users(id),
    CONSTRAINT CK_scheduled_calls_not_self CHECK (user_a_id <> user_b_id),
    CONSTRAINT CK_scheduled_calls_duration CHECK (duration_minutes > 0),
    CONSTRAINT CK_scheduled_calls_call_type CHECK (call_type IN ('video', 'audio', 'offline')),
    CONSTRAINT CK_scheduled_calls_status CHECK (status IN ('scheduled', 'rescheduled', 'cancelled', 'completed'))
);

CREATE INDEX IX_scheduled_calls_user_a_upcoming
    ON dbo.scheduled_calls (user_a_id, status, scheduled_at);

CREATE INDEX IX_scheduled_calls_user_b_upcoming
    ON dbo.scheduled_calls (user_b_id, status, scheduled_at);

INSERT INTO dbo.relationships (user_a_id, user_b_id, latest_session_id, stage, started_at, last_updated)
SELECT
    CASE WHEN pa.user_id < pb.user_id THEN pa.user_id ELSE pb.user_id END AS user_a_id,
    CASE WHEN pa.user_id < pb.user_id THEN pb.user_id ELSE pa.user_id END AS user_b_id,
    s.id,
    'speed_round_done',
    s.created_at,
    s.created_at
FROM dbo.speed_round_sessions s
INNER JOIN dbo.speed_round_participants pa
    ON pa.id = s.participant_a_id
INNER JOIN dbo.speed_round_participants pb
    ON pb.id = s.participant_b_id
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.relationships r
    WHERE r.user_a_id = CASE WHEN pa.user_id < pb.user_id THEN pa.user_id ELSE pb.user_id END
      AND r.user_b_id = CASE WHEN pa.user_id < pb.user_id THEN pb.user_id ELSE pa.user_id END
);

UPDATE r
SET stage = CASE
        WHEN EXISTS (
            SELECT 1
            FROM dbo.connections c
            WHERE c.user_a_id = r.user_a_id
              AND c.user_b_id = r.user_b_id
        ) THEN 'mutual_yes'
        WHEN EXISTS (
            SELECT 1
            FROM dbo.speed_round_decisions d
            INNER JOIN dbo.speed_round_sessions s
                ON s.id = d.session_id
            INNER JOIN dbo.speed_round_participants pa
                ON pa.id = s.participant_a_id
            INNER JOIN dbo.speed_round_participants pb
                ON pb.id = s.participant_b_id
            WHERE (
                    (pa.user_id = r.user_a_id AND pb.user_id = r.user_b_id)
                 OR (pa.user_id = r.user_b_id AND pb.user_id = r.user_a_id)
                  )
              AND d.decision = 'pass'
        ) THEN 'passed'
        ELSE r.stage
    END,
    last_updated = SYSUTCDATETIME()
FROM dbo.relationships r;
