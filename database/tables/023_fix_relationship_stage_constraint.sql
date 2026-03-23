/*
Aligns the relationships stage constraint with the stages used by the backend.
*/

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_relationships_stage'
      AND parent_object_id = OBJECT_ID('dbo.relationships')
)
BEGIN
    ALTER TABLE dbo.relationships
    DROP CONSTRAINT CK_relationships_stage;
END;

ALTER TABLE dbo.relationships
ADD CONSTRAINT CK_relationships_stage CHECK (
    stage IN (
        '3min',
        'passed',
        '15min',
        '60min',
        'date',
        'revealed'
    )
);
