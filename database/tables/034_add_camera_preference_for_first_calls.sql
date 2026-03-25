/*
Adds a profile preference for 3-minute intro calls and stores the
resolved camera mode on each speed-round session.
*/

ALTER TABLE dbo.users
ADD prefers_camera_off_3min BIT NOT NULL
    CONSTRAINT DF_users_prefers_camera_off_3min DEFAULT 0;

ALTER TABLE dbo.speed_round_sessions
ADD camera_off BIT NOT NULL
    CONSTRAINT DF_speed_round_sessions_camera_off DEFAULT 0;
