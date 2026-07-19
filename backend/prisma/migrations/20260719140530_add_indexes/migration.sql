BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[OrgSettings] DROP CONSTRAINT [OrgSettings_currencySymbol_df];
ALTER TABLE [dbo].[OrgSettings] ADD CONSTRAINT [OrgSettings_currencySymbol_df] DEFAULT '₹' FOR [currencySymbol];

-- CreateIndex
CREATE NONCLUSTERED INDEX [Transaction_itemId_idx] ON [dbo].[Transaction]([itemId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Transaction_userId_idx] ON [dbo].[Transaction]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Transaction_transactionDate_idx] ON [dbo].[Transaction]([transactionDate]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
