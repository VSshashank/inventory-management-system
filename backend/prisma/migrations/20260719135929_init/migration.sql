BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'STAFF',
    [isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 1,
    [tokenVersion] INT NOT NULL CONSTRAINT [User_tokenVersion_df] DEFAULT 0,
    [mfaSecret] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Category_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[UnitOfMeasure] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [abbreviation] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [UnitOfMeasure_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UnitOfMeasure_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Item] (
    [id] INT NOT NULL IDENTITY(1,1),
    [sku] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [categoryId] INT NOT NULL,
    [unitId] INT NOT NULL,
    [currentStock] DECIMAL(14,3) NOT NULL CONSTRAINT [Item_currentStock_df] DEFAULT 0,
    [lowStockThreshold] DECIMAL(14,3) NOT NULL CONSTRAINT [Item_lowStockThreshold_df] DEFAULT 10,
    [isActive] BIT NOT NULL CONSTRAINT [Item_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Item_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Item_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Item_sku_key] UNIQUE NONCLUSTERED ([sku])
);

-- CreateTable
CREATE TABLE [dbo].[Transaction] (
    [id] INT NOT NULL IDENTITY(1,1),
    [itemId] INT NOT NULL,
    [userId] INT NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [quantity] DECIMAL(14,3) NOT NULL,
    [unitCost] DECIMAL(14,2),
    [unitPrice] DECIMAL(14,2),
    [resultingStock] DECIMAL(14,3) NOT NULL,
    [notes] NVARCHAR(1000),
    [isVoided] BIT NOT NULL CONSTRAINT [Transaction_isVoided_df] DEFAULT 0,
    [transactionDate] DATETIME2 NOT NULL CONSTRAINT [Transaction_transactionDate_df] DEFAULT CURRENT_TIMESTAMP,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Transaction_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Transaction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[OrgSettings] (
    [id] INT NOT NULL IDENTITY(1,1),
    [businessName] NVARCHAR(1000) NOT NULL CONSTRAINT [OrgSettings_businessName_df] DEFAULT 'My Business',
    [currencySymbol] NVARCHAR(1000) NOT NULL CONSTRAINT [OrgSettings_currencySymbol_df] DEFAULT '₹',
    [defaultLowStockThreshold] DECIMAL(14,3) NOT NULL CONSTRAINT [OrgSettings_defaultLowStockThreshold_df] DEFAULT 10,
    [dateFormat] NVARCHAR(1000) NOT NULL CONSTRAINT [OrgSettings_dateFormat_df] DEFAULT 'yyyy-MM-dd',
    CONSTRAINT [OrgSettings_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Item] ADD CONSTRAINT [Item_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Item] ADD CONSTRAINT [Item_unitId_fkey] FOREIGN KEY ([unitId]) REFERENCES [dbo].[UnitOfMeasure]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Transaction] ADD CONSTRAINT [Transaction_itemId_fkey] FOREIGN KEY ([itemId]) REFERENCES [dbo].[Item]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Transaction] ADD CONSTRAINT [Transaction_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
