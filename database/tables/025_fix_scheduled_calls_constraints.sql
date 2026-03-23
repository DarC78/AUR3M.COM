/*
Aligns scheduled_calls enums/defaults with the follow-up scheduling backend.
Older environments still allow only offline/audio/video call types, which
causes 15/60-minute follow-up call creation to fail.
*/

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_scheduled_calls_call_type'
      AND parent_object_id = OBJECT_ID('dbo.scheduled_calls')
)
BEGIN
    ALTER TABLE dbo.scheduled_calls
    DROP CONSTRAINT CK_scheduled_calls_call_type;
END;

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_scheduled_calls_status'
      AND parent_object_id = OBJECT_ID('dbo.scheduled_calls')
)
BEGIN
    ALTER TABLE dbo.scheduled_calls
    DROP CONSTRAINT CK_scheduled_calls_status;
END;

DECLARE @callTypeDefault SYSNAME;

SELECT @callTypeDefault = dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns c
    ON c.object_id = dc.parent_object_id
   AND c.column_id = dc.parent_column_id
WHERE dc.parent_object_id = OBJECT_ID('dbo.scheduled_calls')
  AND c.name = 'call_type';

IF @callTypeDefault IS NOT NULL
BEGIN
    DECLARE @dropDefaultSql NVARCHAR(400);
    SET @dropDefaultSql = N'ALTER TABLE dbo.scheduled_calls DROP CONSTRAINT ' + QUOTENAME(@callTypeDefault) + N';';
    EXEC sp_executesql @dropDefaultSql;
END;

ALTER TABLE dbo.scheduled_calls
ADD CONSTRAINT DF_scheduled_calls_call_type DEFAULT '15min' FOR call_type;

ALTER TABLE dbo.scheduled_calls
ADD CONSTRAINT CK_scheduled_calls_call_type
CHECK (call_type IN ('15min', '60min', 'date'));

ALTER TABLE dbo.scheduled_calls
ADD CONSTRAINT CK_scheduled_calls_status
CHECK (status IN ('scheduled', 'in-progress', 'completed', 'missed', 'cancelled'));
