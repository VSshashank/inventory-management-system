# 📖 Complete User Guide
## Biodegradable Bags Inventory Management System

This comprehensive guide will help you master every feature of the inventory system.

## Troubleshooting

### Common Issues and Solutions

#### Installation Issues

**Problem**: "Python is not recognized"
```
Solution:
1. Install Python from python.org
2. During installation, check "Add Python to PATH"
3. Restart command prompt
4. Test: type "python --version"
```

**Problem**: "pip is not recognized"
```
Solution:
1. Python 3.7+ includes pip
2. Try: python -m pip install rich
3. If still failing, reinstall Python with pip option checked
```

**Problem**: "ModuleNotFoundError: No module named 'rich'"
```
Solution:
Run: pip install -r requirements.txt

Or manually:
pip install rich pandas matplotlib openpyxl
```

#### Runtime Errors

**Problem**: "Database is locked"
```
Cause: Another instance is running
Solution:
1. Close all program windows
2. Check Task Manager (Windows) or Activity Monitor (Mac)
3. Kill any python processes
4. Restart program
```

**Problem**: "Permission denied" when creating backups
```
Cause: No write access to folder
Solution:
1. Run as administrator (Windows)
2. Or move program to Documents folder
3. Check folder permissions
```

**Problem**: Charts not generating
```
Solution:
1. Install matplotlib: pip install matplotlib
2. On Linux: sudo apt-get install python3-tk
3. Check enable_charts in config.json
```

**Problem**: Excel export fails
```
Solution:
1. Install openpyxl: pip install openpyxl
2. Close any open Excel files with same name
3. Check write permissions
```

#### Data Issues

**Problem**: Stock shows negative numbers
```
Cause: Past sale entered after current transactions
Solution:
1. This is normal for historical data entry
2. Stock reflects what it would have been at that date
3. Use Stock Adjustment to correct current stock if needed
```

**Problem**: Duplicate dimensions appearing
```
Cause: Inconsistent formatting before normalization
Solution:
1. System now prevents this
2. For old data: manually consolidate in Excel export
3. Delete and re-enter transactions with correct dimension
```

**Problem**: Lost data after crash
```
Solution:
1. Check for backup files: backup_db_*.db
2. Find most recent backup
3. Rename to inventory.db
4. Restart program
```

**Problem**: Wrong date on transaction
```
Solution:
1. Cannot edit transactions directly
2. Use Undo if it's the last transaction
3. For old transactions:
   - Use Stock Adjustment with notes
   - Or export to Excel, edit, and document
```

#### Performance Issues

**Problem**: Program is slow
```
Causes and Solutions:
1. Too many backups: Reduce backups_to_keep in settings
2. Large database: Normal with 10,000+ transactions
3. Charts taking time: Normal for first generation
```

**Problem**: Backups taking disk space
```
Solution:
1. Reduce backups_to_keep to 10-15
2. Manually delete old backup_db_*.db files
3. Database is small (~1MB per 1000 transactions)
```

### Error Messages Explained

**"Cannot sell X kg! Only Y kg available"**
- Trying to sell more than in stock
- Check current inventory first
- Verify dimension is correct

**"Amount must be positive"**
- Entered zero or negative number
- For returns/corrections, use Stock Adjustment

**"Invalid date format. Use YYYY-MM-DD"**
- Date must be: 2025-10-28 (not 28/10/2025)
- Always use 4-digit year
- Use hyphens, not slashes

**"Cannot enter future dates"**
- Date is after today
- Check your date format
- Verify year is correct

### Getting Detailed Error Information

If you encounter an error:

1. **Check error_log.txt**
   ```
   Open error_log.txt in the program folder
   Look for the most recent timestamp
   Error details and stack trace included
   ```

2. **Note exactly what you did**
   - Which menu option?
   - What data did you enter?
   - Can you reproduce it?

3. **Check your data**
   - Is the dimension valid?
   - Are quantities reasonable?
   - Is the date format correct?

### When to Contact Support

Contact if:
- ✅ Error persists after trying solutions
- ✅ Data corruption suspected
- ✅ Feature not working as documented
- ✅ Need help with complex scenario

Include:
- Error message (exact text)
- Contents of error_log.txt (last entry)
- Steps to reproduce
- Your Python version
- Operating system

---

## Frequently Asked Questions

### General Questions

**Q: Is my data secure?**
A: Yes! Data is stored locally on your computer in SQLite database. Automatic backups protect against data loss. No data is sent online.

**Q: Can multiple people use this?**
A: Not simultaneously. Only one instance can access the database at a time. For multi-user, export data and share reports.

**Q: Can I use this on multiple computers?**
A: Yes! Copy the entire folder (including inventory.db) to another computer. Use cloud sync (Dropbox, Google Drive) to keep synchronized.

**Q: What happens if I close the program unexpectedly?**
A: SQLite is very resilient. Last confirmed transaction is saved. Automatic backups available if needed.

### Data Entry Questions

**Q: Can I edit a past transaction?**
A: No direct editing. Options:
- Undo if it's the most recent
- Add correcting adjustment with notes
- Export to Excel for records

**Q: What if I forget to record a sale?**
A: Use "Add Past Transaction" (option 3) with the historical date. System adjusts calculations accordingly.

**Q: Can I enter transactions in bulk from Excel?**
A: Not directly. Use Bulk Entry Wizard (option 4) for fastest manual entry. Copy data from Excel and type in.

**Q: How do I handle returns?**
A: Use "Add Stock" with notes "Customer return". Or use Stock Adjustment if it's simpler.

### Reporting Questions

**Q: Can I customize reports?**
A: Basic customization in settings. For advanced: Export to Excel and create custom reports there.

**Q: How do I share reports with my accountant?**
A: Export to Excel (option 11) and email the file. Contains all necessary data.

**Q: Can I print reports?**
A: Yes! Export to Excel and print from there. Or take screenshots of terminal reports.

**Q: How far back does history go?**
A: Forever! All transactions since you started using the system are retained.

### Technical Questions

**Q: What database does this use?**
A: SQLite - a reliable, file-based database. No server needed. Industry standard.

**Q: How big will my database get?**
A: Very small. ~1MB per 1000 transactions. Years of data fit in a few MB.

**Q: Can I access the database directly?**
A: Yes, with any SQLite browser. But use the program for safety. Direct edits bypass validation.

**Q: Is this open source?**
A: Check LICENSE file. Generally MIT license allows modification and distribution.

---

## Keyboard Shortcuts

While in the program:

| Key | Action |
|-----|--------|
| **Enter** | Accept default / Continue |
| **Ctrl+C** | Cancel current operation |
| **Y** or **y** | Confirm "Yes" |
| **N** or **n** | Answer "No" |
| **0-12** | Menu options |
| **↑** / **↓** | Navigate (if supported) |

---

## Sample Scenarios

### Scenario 1: Starting Fresh

You're a new business with no prior data:

1. **Day 1**: Install program, enter your name
2. **Initial Stock**: 
   - Add Stock (option 1) for each dimension
   - Enter cost per kg
3. **First Sale**: Record Sale (option 2) with selling price
4. **Daily**: Record all transactions immediately
5. **Week 1**: Review inventory (option 5)
6. **Month 1**: Export to Excel for records

### Scenario 2: Migrating Historical Data

You have 3 months of paper records:

1. **Install** program
2. **Organize** your records by date
3. **Bulk Entry** (option 4):
   - Start with oldest date
   - Enter all stock additions first
   - Then enter all sales
   - Work forward chronologically
4. **Verify** final stock matches physical count
5. **Adjust** if discrepancies (option 9)
6. **Continue** with daily operations

### Scenario 3: Monthly Inventory Management

End of month routine:

1. **Physical Count**: Count all stock physically
2. **Compare**: View Current Inventory (option 5)
3. **Adjust**: Fix discrepancies (option 9)
4. **Reports**: 
   - Sales report for the month (option 7)
   - Export to Excel (option 11)
5. **Analysis**:
   - Review profit margins
   - Check sales velocity
   - Plan reorders
6. **Backup**: Copy inventory.db to cloud storage
7. **Send Reports**: Email Excel file to accountant

### Scenario 4: Discovering a Mistake

You realize yesterday's sale quantity was wrong:

**If it's the LAST transaction**:
1. Undo Last Transaction (option 10)
2. Re-enter correctly

**If it's NOT the last transaction**:
1. Check Item History (option 6) to see current effect
2. Add Stock Adjustment (option 9) to correct
3. Add detailed notes explaining the correction
4. Document in Excel export for audit trail

### Scenario 5: Multiple Dimension Management

You sell 20 different bag sizes:

1. **Setup**: Enter all dimensions once (they're saved)
2. **Daily**: Use autocomplete - type first few chars
3. **Reports**: View by dimension to spot trends
4. **Reordering**: Sales velocity shows which need attention
5. **Rationalization**: Drop slow-moving sizes based on data

---

## Glossary

**Dimension**: Size specification of bags (e.g., 10x16 means 10cm x 16cm)

**Transaction**: Any change to inventory (stock added, sale, adjustment)

**Stock Level**: Current quantity available for a dimension

**Low Stock Threshold**: Quantity below which alerts are shown

**Sales Velocity**: Average quantity sold per day

**Profit Margin**: Profit as percentage of revenue

**Adjustment**: Manual correction of stock level

**Audit Trail**: Complete history of all changes

**Backup**: Copy of database for safety

**Normalization**: Standardizing dimension format

**Autocomplete**: System suggesting existing dimensions

**Forecast**: Prediction of when stock runs out

---

## Additional Resources

### Files Reference

| File | Purpose | User Action |
|------|---------|-------------|
| `inventory.db` | Main database | Never edit directly |
| `config.json` | Settings | Can edit carefully |
| `user_config.txt` | Your name | Can edit |
| `error_log.txt` | Error details | Read for troubleshooting |
| `backup_db_*.db` | Backups | For data recovery |
| `*.xlsx` | Excel exports | Reports and analysis |
| `*.png` | Charts | Visual reports |

### Command Line Options

Run the program:
```bash
# Standard
python complete_inventory_system.py

# With Python 3 specifically
python3 complete_inventory_system.py

# Windows
py complete_inventory_system.py
```

### External Tools

**SQLite Browser** (optional):
- Download: sqlitebrowser.org
- View database structure
- Run custom queries
- Backup/restore

**Excel/LibreOffice**:
- Open exported reports
- Create custom analyses
- Print formatted reports

---

## Contact and Support

### Before Contacting Support

1. ✅ Check this guide thoroughly
2. ✅ Review Troubleshooting section
3. ✅ Check error_log.txt
4. ✅ Try with a backup database
5. ✅ Test on fresh installation

### Support Channels

**Email**: vsshashank23@gmail.com
- Include error details
- Attach error_log.txt
- Describe steps to reproduce

**GitHub Issues**: [Your Repository URL]
- For bugs and feature requests
- Include system information
- Screenshots help!

**Documentation**: Keep this guide handy
- Most questions answered here
- Search for keywords (Ctrl+F)

---

## Quick Reference Card

### Most Common Tasks

| Task | Menu Option |
|------|-------------|
| Add today's stock | 1 |
| Record today's sale | 2 |
| Enter old transaction | 3 |
| Enter many old transactions | 4 |
| Check current levels | 5 |
| See transaction history | 6 |
| Monthly reports | 7 |
| Fix wrong stock | 9 |
| Undo mistake | 10 |
| Get Excel report | 11 |

### Important Dates Format
Always use: **YYYY-MM-DD** (e.g., 2025-10-28)

### Key Settings to Configure
- Low stock threshold (default: 10 kg)
- Currency symbol (default: ₹)
- Profit tracking (default: enabled)

### Files to Backup Regularly
- `inventory.db` (main database)
- `config.json` (settings)
- Excel exports (monthly)

---

**Thank you for using our Inventory Management System!**

*This guide covers version 1.0.0 - Last updated: October 2025*

## Table of Contents

1. [Getting Started](#getting-started)
2. [Daily Operations](#daily-operations)
3. [Past Transactions](#past-transactions)
4. [Reports and Analytics](#reports-and-analytics)
5. [Data Management](#data-management)
6. [Advanced Features](#advanced-features)
7. [Tips and Best Practices](#tips-and-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Launch

When you run the program for the first time:

1. **Enter Your Name**
   - You'll be asked to enter your name
   - This name appears on all transactions for accountability
   - Stored in `user_config.txt` - only asked once

2. **Database Creation**
   - A new database file `inventory.db` is created automatically
   - Initial configuration file `config.json` is generated
   - You're ready to start!

### Understanding the Main Menu

The main menu is organized into clear sections:

```
📦 Stock Operations:          (Today's transactions)
├── 1. Add New Stock
└── 2. Record Sale

⏰ Past Transactions:         (Historical data entry)
├── 3. Add Past Transaction
└── 4. Bulk Entry Wizard

📊 Reports & Views:           (Analytics and viewing)
├── 5. View Current Inventory
├── 6. View Item History
├── 7. Sales & Profit Reports
└── 8. Generate Stock Chart

🔧 Management:                (System maintenance)
├── 9. Stock Adjustment
├── 10. Undo Last Transaction
├── 11. Export to Excel
└── 12. Settings
```

---

## Daily Operations

### 1. Adding New Stock (Today)

**When to use**: When you receive new inventory today

**Steps**:
1. Select option **1** from main menu
2. **Enter dimension**: Type the bag size (e.g., `10x16`)
   - System shows existing dimensions for reference
   - Format is automatically standardized
3. **Enter quantity**: Amount received in kilograms
4. **Enter cost** (optional): Cost per kg for profit tracking
5. **Review summary**: Check all details
6. **Confirm**: Press Enter or type 'yes'

**Example**:
```
Dimension: 10x16
Adding: 50 kg
Current stock: 100 kg
New stock: 150 kg
Cost: ₹45/kg (Total: ₹2,250)
```

**Tips**:
- System prevents zero or negative amounts
- Cost tracking is optional but recommended for profit analysis
- Current stock updates automatically

### 2. Recording a Sale (Today)

**When to use**: When you sell bags to a customer today

**Steps**:
1. Select option **2** from main menu
2. **Choose dimension**: Select from existing stock
3. **Current stock displayed**: System shows available quantity
4. **Enter quantity sold**: Amount in kilograms
5. **Enter selling price** (optional): Price per kg
6. **Review and confirm**: Check before saving

**Example**:
```
Dimension: 10x16
Current stock: 150 kg
Selling: 30 kg
Remaining: 120 kg
Revenue: ₹60/kg (Total: ₹1,800)
```

**Safeguards**:
- ❌ Cannot sell more than available stock
- ⚠️ Warning shown if sale creates low stock
- ❌ Cannot sell zero or negative amounts

**What happens**:
- Stock level decreases
- Transaction recorded with timestamp
- Low stock alert if below threshold
- Profit calculated if prices entered

---

## Past Transactions

### 3. Add Past Transaction (Manual Entry)

**When to use**: 
- Entering historical transactions one by one
- Recording missed transactions
- Correcting stock from a specific past date

**Complete Walkthrough**:

#### Step 1: Choose Transaction Type
```
What type of transaction?
  1. Stock Added (received inventory)
  2. Sale (sold to customer)
  3. Adjustment (correction)
```

Select based on what actually happened on that date.

#### Step 2: Enter Date
```
When did this stock addition occur?
Enter date (YYYY-MM-DD): 2025-10-15
```

**Date format**: Always use YYYY-MM-DD (e.g., 2025-10-15)
- Cannot enter future dates
- Can enter any past date

#### Step 3: Enter Dimension
```
Enter bag dimension for this stock addition
Existing dimensions: 10x16, 12x18, 14x20...
Dimension: 10x16
```

The system shows existing dimensions to help you stay consistent.

#### Step 4: Enter Amount
For **Stock Added**:
```
Amount received (kg): 75
```

For **Sale**:
```
Amount sold (kg): 25
```

For **Adjustment**:
```
Adjustment amount (use + or -): -5
```

#### Step 5: Enter Pricing (Optional)
If **Stock Added**:
```
Cost per kg ₹ (optional): 45
```

If **Sale**:
```
Selling price per kg ₹ (optional): 60
```

#### Step 6: Add Notes
```
Notes (optional): Bulk order from supplier XYZ
```

Notes help remember context for historical records.

#### Step 7: Review Summary
```
Transaction Summary:
┌─────────────────┬──────────────────────┐
│ Date            │ 2025-10-15          │
│ Type            │ Stock Added         │
│ Dimension       │ 10x16               │
│ Amount          │ +75.00 kg           │
│ Current Stock   │ 100.00 kg           │
│ New Stock       │ 175.00 kg           │
│ Cost            │ ₹45/kg (Total: ₹3,375) │
└─────────────────┴──────────────────────┘

Is this correct? [Y/n]:
```

#### Step 8: Confirm and Save
- Type **Y** or press **Enter** to save
- Type **N** to cancel

#### Step 9: Continue?
```
Add another past transaction? [y/N]:
```

Allows you to quickly add multiple historical transactions.

**Important Notes**:
- ⚠️ Past sales can create negative stock (warning shown)
- 📅 Transactions stored with the historical date you specify
- 💾 Automatic backup created before saving
- 🔄 Stock calculations are relative to current stock

### 4. Bulk Entry Wizard

**When to use**:
- Importing many past transactions quickly
- Entering a week/month of historical data
- Catching up on missed entries

**How it works**:

#### Initial Setup
```
🔋 Bulk Entry Wizard
Enter multiple past transactions quickly

Tip: Have your records ready (dates, amounts, prices, etc.)

Include pricing information? [Y/n]:
```

Choose whether to include cost/price for each transaction.

#### Transaction Entry Loop

For each transaction:
```
Transaction #1
Date (YYYY-MM-DD) [2025-10-28]: 2025-10-15
Dimension: 10x16
Type (stock/sale/adjust): stock
Amount (kg): 50
Cost per kg ₹ [0]: 45

→ 2025-10-15 | 10x16 | Stock Added | +50.00kg | Stock: 150.00kg | Cost: ₹45/kg

OK? [Y/n]: y
✅ Added (1 total)

Add another? [Y/n]:
```

**Quick Entry Mode**:
- Minimal prompts for speed
- Defaults to today's date (can change)
- Press Enter to skip optional fields
- Quick confirmation
- Running counter of transactions added

**Keyboard Shortcuts**:
- **Enter**: Accept default/continue
- **Ctrl+C**: Stop bulk entry
- **N**: Skip a transaction

**Completion**:
```
✅ Bulk entry complete! Added 15 transactions.
```

---

## Reports and Analytics

### 5. View Current Inventory

**Purpose**: See current stock levels for all dimensions

**Display**:
```
📦 Current Inventory
╔═══════════╤═══════════╤══════════╗
║ Dimension │ Stock(kg) │  Status  ║
╠═══════════╪═══════════╪══════════╣
║ 10x16     │    150.00 │ ✓ OK     ║
║ 12x18     │      8.50 │ ⚠ LOW    ║
║ 14x20     │      0.00 │ OUT      ║
╠═══════════╧═══════════╧══════════╣
║ TOTAL     │    158.50 │          ║
╚═══════════╧═══════════╧══════════╝
```

**Color Coding**:
- 🟢 **Green (✓ OK)**: Above low stock threshold
- 🟡 **Yellow (⚠ LOW)**: Below threshold
- 🔴 **Red (OUT)**: Zero stock

### 6. View Item History

**Purpose**: See complete transaction history for one dimension

**Steps**:
1. Select option **6**
2. Enter dimension to view
3. See last 50 transactions

**Display**:
```
Transaction History for: 10x16
╔════════════╤═══════╤════════╤══════════════╤══════════╤═══════════╤═════════╗
║ Date       │ Time  │ User   │ Action       │ Amt (kg) │ New Stock │ Value   ║
╠════════════╪═══════╪════════╪══════════════╪══════════╪═══════════╪═════════╣
║ 2025-10-28 │ 14:30 │ Admin  │ Sale         │   -25.00 │    125.00 │ ₹1,500  ║
║ 2025-10-27 │ 09:15 │ Admin  │ Stock Added  │   +50.00 │    150.00 │ ₹2,250  ║
║ 2025-10-25 │ 16:45 │ Admin  │ Adjustment   │    -2.00 │    100.00 │         ║
╚════════════╧═══════╧════════╧══════════════╧══════════╧═══════════╧═════════╝
```

**Use cases**:
- Audit specific dimension
- Find when stock was last received
- Review pricing history
- Investigate discrepancies

### 7. Sales & Profit Reports

**Purpose**: Comprehensive business intelligence

#### Selecting Date Range

```
📅 Select Date Range
1. Last 7 Days
2. Last 30 Days
3. This Month
4. This Year
5. All Time
6. Custom Range

Choose [2]:
```

For custom range:
```
Start date (YYYY-MM-DD): 2025-10-01
End date (YYYY-MM-DD): 2025-10-28
```

#### Report Sections

**A. Sales by Dimension**
```
Sales by Dimension
╔═══════════╤═══════════╤══════════╗
║ Dimension │ Sold (kg) │ Revenue  ║
╠═══════════╪═══════════╪══════════╣
║ 10x16     │    125.50 │ ₹7,530   ║
║ 12x18     │     86.00 │ ₹5,676   ║
║ 14x20     │     52.25 │ ₹3,657   ║
╠═══════════╧═══════════╧══════════╣
║ TOTAL     │    263.75 │ ₹16,863  ║
╚═══════════╧═══════════╧══════════╝
```

**B. Profit Summary**
```
Profit Summary
╔════════════════╤═══════════╗
║ Metric         │ Amount    ║
╠════════════════╪═══════════╣
║ Total Cost     │ ₹10,568   ║
║ Total Revenue  │ ₹16,863   ║
╠════════════════╪═══════════╣
║ Net Profit     │ ₹6,295    ║
║ Profit Margin  │ 37.3%     ║
╚════════════════╧═══════════╝
```

**C. Sales Velocity & Forecast**
```
Sales Velocity & Forecast
╔═══════════╤══════════╤═══════════════╤═══════════╗
║ Dimension │ Avg/Day  │ Current Stock │ Days Left ║
╠═══════════╪══════════╪═══════════════╪═══════════╣
║ 10x16     │     4.48 │        150.00 │    33     ║
║ 12x18     │     3.07 │          8.50 │     3     ║  ← Warning!
║ 14x20     │     1.87 │         45.00 │    24     ║
╚═══════════╧══════════╪═══════════════╧═══════════╝
```

**Forecast Color Coding**:
- 🔴 Red: Less than 7 days left
- 🟡 Yellow: 7-14 days left
- 🟢 Green: More than 14 days left

### 8. Generate Stock Chart

**Purpose**: Visual representation of stock levels

**Output**: PNG image file saved as `stock_chart_YYYYMMDD.png`

**Features**:
- Bar chart with color coding
- Low stock threshold line
- Sorted by stock level
- Professional formatting

**Use cases**:
- Quick visual assessment
- Management presentations
- WhatsApp sharing with team
- Printed reports

---

## Data Management

### 9. Stock Adjustment

**When to use**:
- Physical count doesn't match system
- Found missing/damaged stock
- Correcting data entry errors

**Process**:
```
⚙️ Stock Adjustment
Use this to correct stock levels based on physical count

Enter dimension to adjust: 10x16
Current stock in system: 150 kg
Enter actual stock (from physical count): 147

Adjustment needed: -3.00 kg
Reason for adjustment: Found 3kg damaged
Apply this adjustment? [Y/n]:
```

**What happens**:
- Stock updated to actual count
- Adjustment recorded in history
- Reason saved for audit trail

**Best practice**: 
- Do physical counts monthly
- Document reasons clearly
- Take photos if damaged goods

### 10. Undo Last Transaction

**Purpose**: Reverse the most recent transaction

**⚠️ WARNING**: Cannot be undone!

**Display**:
```
⚠️ UNDO LAST TRANSACTION
╔═══════════════╤══════════════════════════╗
║ Field         │ Value                    ║
╠═══════════════╪══════════════════════════╣
║ Date          │ 2025-10-28 14:30         ║
║ User          │ Admin                    ║
║ Dimension     │ 10x16                    ║
║ Action        │ Sale                     ║
║ Amount        │ -25.00 kg                ║
║ Stock After   │ 125.00 kg                ║
╚═══════════════╧══════════════════════════╝

WARNING: This action cannot be reversed!
Are you ABSOLUTELY SURE you want to delete this? [y/N]:
```

**Use only if**:
- Wrong transaction just entered
- Immediate mistake noticed
- Duplicate entry made

**Don't use if**:
- Old transaction needs correction (use Adjustment instead)
- Multiple transactions need changing

### 11. Export to Excel

**Purpose**: Professional reports for sharing and printing

**Output**: Excel file `inventory_report_YYYYMMDD_HHMMSS.xlsx`

**File Contains 4 Sheets**:

1. **Current Stock**
   - All dimensions with current levels
   - Color-coded (red/yellow/green)
   - Total inventory

2. **Transaction History**
   - Complete record of all transactions
   - Sortable and filterable
   - Date, time, user, dimension, action, amounts

3. **Sales Summary**
   - Sales by dimension
   - Number of transactions
   - Total quantities
   - Revenue figures

4. **Profit Analysis** (if enabled)
   - Cost vs. Revenue
   - Profit margins
   - Profitability by dimension

**Features**:
- Professional formatting
- Auto-sized columns
- Color-coded cells
- Ready for printing
- Excel formulas work

**Use cases**:
- Monthly reports to management
- Tax documentation
- Accountant sharing
- Backup records
- Analysis in Excel

### 12. Settings

**Configure System Behavior**:

```
⚙️ Settings
╔═══════════════════════════╤═══════════╗
║ Setting                   │ Value     ║
╠═══════════════════════════╪═══════════╣
║ low_stock_threshold       │ 10        ║
║ backups_to_keep           │ 30        ║
║ default_currency          │ ₹         ║
║ date_format               │ %Y-%m-%d  ║
║ enable_charts             │ True      ║
║ enable_profit_tracking    │ True      ║
╚═══════════════════════════╧═══════════╝
```

**Editable Settings**:

- **low_stock_threshold**: When to show LOW warning (kg)
- **backups_to_keep**: Number of backup files retained
- **default_currency**: Symbol shown in reports (₹, $, €, etc.)
- **date_format**: Date display format
- **enable_charts**: Turn chart generation on/off
- **enable_profit_tracking**: Enable/disable cost and price tracking

---

## Advanced Features

### Dimension Normalization

The system automatically standardizes dimension formats:

**Input variations → Stored as**:
- `10x16` → `10x16`
- `10X16` → `10x16`
- `10 x 16` → `10x16`
- `10*16` → `10x16`

**Benefits**:
- Prevents duplicate entries
- Consistent reporting
- Easier autocomplete

### Autocomplete Suggestions

While typing dimensions:
```
Enter bag dimension: 10

Did you mean: 10x12, 10x14, 10x16, 10x18?
```

**How it works**:
- Shows dimensions starting with your input
- Helps prevent typos
- Learns from your inventory

### Automatic Backups

**When created**:
- Before every stock change
- Before deletions
- Before adjustments

**Format**: `backup_db_YYYYMMDD_HHMMSS.db`

**Retention**: Keeps most recent (default: 30)

**Manual backup**: Copy `inventory.db` to safe location

### Low Stock Alerts

**On startup**:
```
⚠️ LOW STOCK ALERTS:
  • 12x18: Only 8.50 kg remaining
  • 14x20: Only 5.25 kg remaining
```

**After sales**:
```
⚠️ WARNING: Low stock! Only 8.50 kg remaining.
```

**Configure**: Change `low_stock_threshold` in settings

---

## Tips and Best Practices

### Daily Workflow

**Morning**:
1. Check low stock alerts
2. Review yesterday's sales (History view)

**During Day**:
1. Record sales immediately
2. Add stock when received

**Evening**:
1. View current inventory
2. Plan reorders for low stock

### Weekly Tasks

1. **Review Sales Report**
   - Last 7 days performance
   - Identify top sellers
   - Check velocity forecasts

2. **Verify Slow Movers**
   - Dimensions with low sales
   - Consider promotions

3. **Plan Reorders**
   - Items below threshold
   - Items running out soon

### Monthly Best Practices

1. **Physical Count**
   - Count actual stock
   - Use Stock Adjustment for corrections
   - Document discrepancies

2. **Export to Excel**
   - Monthly backup
   - Send to accountant
   - File for records

3. **Analyze Profitability**
   - Run profit reports
   - Review margins by dimension
   - Adjust pricing if needed

4. **Backup Database**
   - Copy `inventory.db` to cloud storage
   - Test backup restoration

### Data Entry Tips

**For Accuracy**:
- ✅ Enter transactions immediately
- ✅ Double-check quantities before confirming
- ✅ Use consistent dimension naming
- ✅ Add notes for unusual transactions

**Save Time**:
- ✅ Use bulk entry for catching up
- ✅ Let autocomplete help you
- ✅ Keep pricing info updated
- ✅ Use default values when possible

**Avoid Errors**:
- ❌ Don't enter future dates
- ❌ Don't use undo for old transactions
- ❌ Don't skip confirmation screens
- ❌ Don't round off quantities excessively

### Profit Tracking

**For best results**:
1. **Always enter costs** when adding stock
2. **Always enter prices** when recording sales
3. **Update prices** when they change
4. **Review margins** monthly

**Benefits**:
- Know your true profitability
- Identify best/worst performers
- Make data-driven pricing decisions
- Justify price increases

---