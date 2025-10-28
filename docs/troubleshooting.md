# Troubleshooting Guide

This guide helps you resolve common issues with the Biodegradable Bags Inventory System.

## Table of Contents
- [Installation Issues](#installation-issues)
- [Runtime Errors](#runtime-errors)
- [Database Issues](#database-issues)
- [Display Issues](#display-issues)
- [Performance Issues](#performance-issues)
- [Data Issues](#data-issues)
- [Getting Help](#getting-help)

---

## Installation Issues

### Python Not Found

**Problem:** `python: command not found` or `python is not recognized`

**Solutions:**
1. **Verify Python installation:**
   ```bash
   python --version
   # or
   python3 --version
   ```

2. **Add Python to PATH (Windows):**
   - Search "Environment Variables" in Windows
   - Edit "Path" in System Variables
   - Add Python installation directory (e.g., `C:\Python310\`)
   - Add Scripts directory (e.g., `C:\Python310\Scripts\`)
   - Restart terminal

3. **Install Python:**
   - Download from https://python.org/downloads/
   - During installation, check "Add Python to PATH"

### Pip Not Working

**Problem:** `pip: command not found` or `No module named pip`

**Solutions:**
1. **Use Python module directly:**
   ```bash
   python -m pip install -r requirements.txt
   ```

2. **Reinstall pip:**
   ```bash
   python -m ensurepip --upgrade
   ```

### Virtual Environment Fails

**Problem:** Cannot create or activate virtual environment

**Solutions:**

**Windows:**
```batch
# If venv creation fails
python -m venv venv --clear

# If activation fails (permission error)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then try again
venv\Scripts\activate
```

**Linux/Mac:**
```bash
# If venv creation fails
python3 -m venv venv --clear

# If activation fails
chmod +x venv/bin/activate
source venv/bin/activate
```

### Package Installation Fails

**Problem:** Errors during `pip install -r requirements.txt`

**Solutions:**

1. **Update pip first:**
   ```bash
   python -m pip install --upgrade pip
   ```

2. **Install packages individually:**
   ```bash
   pip install rich
   pip install pandas
   pip install matplotlib
   pip install openpyxl
   ```

3. **Use --user flag (if permission issues):**
   ```bash
   pip install --user -r requirements.txt
   ```

4. **Clear pip cache:**
   ```bash
   pip cache purge
   pip install -r requirements.txt
   ```

---

## Runtime Errors

### Rich Library Not Found

**Problem:** `ModuleNotFoundError: No module named 'rich'`

**Solutions:**
1. **Verify virtual environment is activated:**
   - You should see `(venv)` in your terminal prompt
   
2. **Reinstall rich:**
   ```bash
   pip install rich --force-reinstall
   ```

3. **Check Python environment:**
   ```bash
   python -c "import sys; print(sys.executable)"
   # Should point to venv directory
   ```

### Character Encoding Issues

**Problem:** Special characters (₹, ✓, ✗) display incorrectly

**Solutions:**

**Windows:**
1. **Change terminal code page:**
   ```batch
   chcp 65001
   ```

2. **Use Windows Terminal (recommended):**
   - Download from Microsoft Store
   - Supports UTF-8 by default

3. **Update config.json:**
   ```json
   {
       "default_currency": "Rs",
       "enable_charts": true
   }
   ```

**Linux/Mac:**
1. **Set locale:**
   ```bash
   export LC_ALL=en_US.UTF-8
   export LANG=en_US.UTF-8
   ```

2. **Verify terminal supports UTF-8:**
   ```bash
   locale charmap
   # Should show: UTF-8
   ```

### Permission Denied Errors

**Problem:** `PermissionError` when accessing files or database

**Solutions:**

1. **Run as administrator (Windows):**
   - Right-click `START_INVENTORY.bat`
   - Select "Run as administrator"

2. **Check file permissions (Linux/Mac):**
   ```bash
   # Make script executable
   chmod +x START_INVENTORY.sh
   
   # Fix file permissions
   chmod 644 inventory.db
   chmod 644 config.json
   ```

3. **Check if file is open elsewhere:**
   - Close Excel if you have exported files open
   - Close any other programs accessing the database

4. **Move to user directory:**
   - Don't run from Program Files or system directories
   - Use your Documents or Desktop folder

---

## Database Issues

### Database Locked Error

**Problem:** `sqlite3.OperationalError: database is locked`

**Solutions:**

1. **Close other instances:**
   - Only run one instance of the program
   - Check Task Manager (Windows) or Activity Monitor (Mac) for multiple Python processes

2. **Clear lock file:**
   ```bash
   # Stop all instances first
   # Then remove lock files
   rm inventory.db-journal
   rm inventory.db-shm
   rm inventory.db-wal
   ```

3. **Restore from backup:**
   ```bash
   # Find latest backup
   ls -lt backup_db_*.db
   
   # Copy backup to main file
   cp backup_db_20250128_120000.db inventory.db
   ```

### Database Corrupted

**Problem:** `sqlite3.DatabaseError: database disk image is malformed`

**Solutions:**

1. **Restore from backup:**
   - Backups are in the same directory as `backup_db_*.db`
   - Copy the most recent backup:
     ```bash
     cp backup_db_20250128_120000.db inventory.db
     ```

2. **Export and rebuild:**
   ```bash
   # Dump database
   sqlite3 inventory.db .dump > backup.sql
   
   # Create new database
   mv inventory.db inventory_broken.db
   sqlite3 inventory.db < backup.sql
   ```

3. **Contact support** if data recovery is critical

### Missing Tables

**Problem:** `sqlite3.OperationalError: no such table: transactions`

**Solutions:**

1. **Initialize database:**
   - Delete `inventory.db`
   - Run the program again (it will create new database)

2. **Import from backup:**
   - Use most recent backup file
   - Rename it to `inventory.db`

### Wrong Stock Values

**Problem:** Stock levels don't match physical inventory

**Solutions:**

1. **Use Stock Adjustment feature:**
   - Main Menu → Option 9: Stock Adjustment
   - Enter dimension
   - Enter actual physical count
   - System will calculate and apply difference

2. **Check transaction history:**
   - Main Menu → Option 6: View Item History
   - Review all transactions for that dimension
   - Look for errors or duplicates

3. **Restore from backup if needed:**
   - Check backup files before today's transactions
   - Restore and re-enter today's transactions

---

## Display Issues

### Terminal Too Small

**Problem:** Tables and text are cut off or wrapped badly

**Solutions:**

1. **Resize terminal window:**
   - Minimum recommended: 80 columns x 24 rows
   - Optimal: 100 columns x 30 rows

2. **Maximize terminal window**

3. **Use full-screen mode:**
   - Windows: Alt + Enter
   - Mac: Cmd + Ctrl + F
   - Linux: F11 (depends on terminal)

### Colors Not Showing

**Problem:** Terminal shows plain text without colors

**Solutions:**

1. **Use modern terminal:**
   - **Windows:** Windows Terminal (from Microsoft Store)
   - **Mac:** iTerm2 or default Terminal.app
   - **Linux:** GNOME Terminal, Konsole, or Terminator

2. **Enable ANSI color support:**
   - Check terminal settings for "ANSI colors" option

3. **Test color support:**
   ```bash
   python -c "from rich.console import Console; Console().print('[red]Red[/red] [green]Green[/green]')"
   ```

### Charts Not Generating

**Problem:** "Chart generation not available" message

**Solutions:**

1. **Install matplotlib:**
   ```bash
   pip install matplotlib
   ```

2. **Install additional dependencies (if on Linux):**
   ```bash
   sudo apt-get install python3-tk  # Ubuntu/Debian
   sudo yum install python3-tkinter  # CentOS/RHEL
   ```

3. **Check config.json:**
   ```json
   {
       "enable_charts": true
   }
   ```

### Excel Export Issues

**Problem:** Excel export fails or file won't open

**Solutions:**

1. **Install openpyxl:**
   ```bash
   pip install openpyxl
   ```

2. **Close Excel before exporting:**
   - Excel locks files that are open

3. **Check disk space:**
   - Ensure you have enough space for export files

4. **Try different location:**
   - Export may fail in protected directories
   - Try saving to Desktop or Documents

---

## Performance Issues

### Program Runs Slowly

**Problem:** Slow response times, especially with large datasets

**Solutions:**

1. **Database optimization:**
   ```bash
   # Run SQLite optimization
   sqlite3 inventory.db "VACUUM;"
   sqlite3 inventory.db "ANALYZE;"
   ```

2. **Reduce backup retention:**
   - Edit `config.json`:
     ```json
     {
         "backups_to_keep": 7
     }
     ```

3. **Archive old data:**
   - Export old transactions to Excel
   - Keep only recent data in active database

4. **Use date filters:**
   - When viewing reports, use shorter date ranges
   - Instead of "All Time", use "Last 30 Days"

### High Memory Usage

**Problem:** Python process uses too much RAM

**Solutions:**

1. **Close other programs** while running inventory system

2. **Limit report size:**
   - Use date filters in reports
   - Export data in smaller chunks

3. **Increase system memory** if consistently running out

### Backup Takes Long Time

**Problem:** Creating backups is slow

**Solutions:**

1. **Reduce backup frequency:**
   - Backups are created before critical operations
   - This is normal for large databases

2. **Move to faster storage:**
   - Use SSD instead of HDD
   - Avoid network drives

---

## Data Issues

### Duplicate Dimensions

**Problem:** Same dimension appears multiple times (e.g., "10x16" and "10X16")

**Solutions:**

1. **Prevention:**
   - System normalizes dimensions automatically
   - Always use lowercase with 'x' (e.g., "10x16")

2. **Fix existing duplicates:**
   - Export to Excel
   - Manually consolidate in spreadsheet
   - Import corrected data
   - Or contact support for merge script

### Lost Transactions

**Problem:** Transactions are missing

**Solutions:**

1. **Check date filters:**
   - Transactions might be outside selected date range

2. **View full history:**
   - Menu → Option 6: View Item History
   - Check all transactions for that dimension

3. **Restore from backup:**
   ```bash
   # List backups by date
   ls -lt backup_db_*.db
   
   # Preview backup
   sqlite3 backup_db_20250128_120000.db "SELECT * FROM transactions ORDER BY id DESC LIMIT 10;"
   
   # Restore if transactions are there
   cp backup_db_20250128_120000.db inventory.db
   ```

### Wrong Prices in Reports

**Problem:** Cost or selling prices are incorrect

**Solutions:**

1. **Verify transaction entry:**
   - Check transaction history for that item
   - Prices might have been entered incorrectly

2. **Re-enter with correction:**
   - Use Undo (Option 10) if it's the last transaction
   - Or use Stock Adjustment (Option 9) with notes

3. **Enable profit tracking:**
   - Check `config.json`:
     ```json
     {
         "enable_profit_tracking": true
     }
     ```

### Negative Stock Appears

**Problem:** Stock shows negative values

**Solutions:**

1. **Check if warning was ignored:**
   - System warns before creating negative stock
   - Usually means data entry error

2. **Fix with Stock Adjustment:**
   - Menu → Option 9
   - Enter actual physical count
   - Add note explaining correction

3. **Review transaction history:**
   - Find where stock went negative
   - Check if sale was entered twice
   - Check if stock addition was missed

---

## Getting Help

### Before Asking for Help

1. **Check error_log.txt:**
   ```bash
   # View recent errors
   tail -20 error_log.txt
   ```

2. **Try Safe Mode:**
   - Temporarily rename `config.json`
   - Run with default settings

3. **Test with new database:**
   ```bash
   # Backup current database
   mv inventory.db inventory_backup.db
   
   # Run program (creates new database)
   python complete_inventory_system.py
   
   # Test if issue persists
   ```

### Collecting Debug Information

When reporting issues, include:

1. **System Information:**
   ```bash
   # Python version
   python --version
   
   # Package versions
   pip freeze
   
   # Operating System
   # Windows: winver
   # Mac: sw_vers
   # Linux: lsb_release -a
   ```

2. **Error Messages:**
   - Full error from terminal
   - Content from `error_log.txt`
   - Screenshot if applicable

3. **Steps to Reproduce:**
   - Exact sequence of menu choices
   - Data entered (sample values)
   - When error occurred

### Contact Support

1. **GitHub Issues:**
   - Check existing issues first
   - Create new issue with debug information
   - Use appropriate labels (bug, question, help wanted)

2. **Email Support:**
   - Include all debug information
   - Attach `error_log.txt`
   - Describe expected vs actual behavior

3. **Community Forum:**
   - Search for similar issues
   - Post detailed question with context
   - Share solutions if you find them

---

## Emergency Procedures

### Complete Data Loss Prevention

1. **Regular Backups:**
   - System creates automatic backups
   - Manually copy `inventory.db` weekly to external drive

2. **Export Safety Copies:**
   - Menu → Option 11: Export to Excel
   - Keep Excel copies as additional backup

### System Won't Start

1. **Try command line directly:**
   ```bash
   python complete_inventory_system.py
   ```

2. **Check if database is locked:**
   ```bash
   # Close all instances
   # Remove lock files
   rm *.db-journal *.db-shm *.db-wal
   ```

3. **Fresh installation:**
   ```bash
   # Backup data
   cp inventory.db inventory_safe.db
   cp -r backup_db_* backups_safe/
   
   # Fresh virtual environment
   rm -rf venv
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   
   # Restore data
   cp inventory_safe.db inventory.db
   ```

### Data Recovery

If all else fails:

1. **SQLite Recovery:**
   ```bash
   # Try to recover
   sqlite3 inventory.db ".recover" > recovered.sql
   sqlite3 new_inventory.db < recovered.sql
   ```

2. **From Excel Exports:**
   - Previous Excel exports contain full data
   - Can manually rebuild from exports

3. **Professional Data Recovery:**
   - Contact database specialists
   - Provide all backup files

---

## Prevention Best Practices

1. **Regular maintenance:**
   - Review error_log.txt weekly
   - Check backup files exist
   - Test restore process monthly

2. **Data validation:**
   - Double-check entries before confirming
   - Use autocomplete to prevent typos
   - Verify stock levels match physical count regularly

3. **System updates:**
   - Keep Python updated
   - Update dependencies: `pip install --upgrade -r requirements.txt`
   - Check for program updates

4. **User training:**
   - Read USER_GUIDE.md thoroughly
   - Practice with test data first
   - Understand undo limitations

---

**Still having issues?** Create a GitHub issue with the "help wanted" label!