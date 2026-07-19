BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[OrgSettings] DROP CONSTRAINT [OrgSettings_currencySymbol_df];
ALTER TABLE [dbo].[OrgSettings] ADD CONSTRAINT [OrgSettings_currencySymbol_df] DEFAULT '₹' FOR [currencySymbol];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
