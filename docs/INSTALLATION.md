# 🚀 Installation Guide
## Biodegradable Bags Inventory Management System

Complete installation instructions for Windows, macOS, and Linux.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Windows Installation](#windows-installation)
3. [macOS Installation](#macos-installation)
4. [Linux Installation](#linux-installation)
5. [Verification](#verification)
6. [First Run Setup](#first-run-setup)
7. [Troubleshooting](#troubleshooting)
8. [Updating](#updating)

---

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 7+, macOS 10.12+, or Linux (any recent distro)
- **Python**: Version 3.7 or higher
- **RAM**: 512 MB (system uses very little memory)
- **Disk Space**: 50 MB for program + space for data (minimal)
- **Display**: Any resolution (terminal-based)

### Recommended
- **Python**: 3.9 or higher
- **RAM**: 1 GB+
- **Disk Space**: 200 MB (for backups and exports)
- **Terminal**: Modern terminal with UTF-8 support for best display

### Required Python Packages
- `rich` - Beautiful terminal interface
- `pandas` - Data manipulation
- `sqlite3` - Database (included with Python)
- `matplotlib` - Chart generation
- `openpyxl` - Excel export

All packages install automatically via `requirements.txt`.

---

## Windows Installation

### Step 1: Install Python

#### Option A: Download from Python.org (Recommended)

1. **Visit**: https://www.python.org/downloads/
2. **Download**: Latest Python 3.x for Windows
3. **Run installer**
4. **CRITICAL**: ✅ Check "Add Python to PATH"
5. **Click**: Install Now
6. **Wait** for installation to complete
7. **Verify**:
   ```cmd
   python --version
   ```
   Should show: `Python 3.x.x`

#### Option B: Microsoft Store

1. Open Microsoft Store
2. Search "Python 3.11" (or latest)
3. Click Get/Install
4. Automatically adds to PATH

### Step 2: Download the Program

#### Option A: Download ZIP
1. Download the program ZIP file
2. Extract to a folder (e.g., `C:\InventorySystem`)
3. Remember this location

#### Option B: Git Clone
```cmd
git clone https://github.com/yourusername/inventory-system.git
cd inventory-system
```

### Step 3: Install Dependencies

1. **Open Command Prompt**:
   - Press `Win + R`
   - Type `cmd`
   - Press Enter

2. **Navigate to program folder**:
   ```cmd
   cd C:\InventorySystem
   ```

3. **Install required packages**:
   ```cmd
   pip install -r requirements.txt
   ```

4. **Wait for installation** (1-2 minutes)

### Step 4: Create Startup Shortcut

1. **Find** `START_INVENTORY.bat` in program folder
2. **Right-click** → "Create shortcut"
3. **Move shortcut** to Desktop
4. **Double-click** shortcut to run program

### Alternative: Manual Run

```cmd
cd C:\InventorySystem
python complete_inventory_system.py
```

---

## macOS Installation

### Step 1: Install Python

#### Check if Python is installed:
```bash
python3 --version
```

If not installed or version < 3.7:

#### Option A: Homebrew (Recommended)

1. **Install Homebrew** (if not installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Python**:
   ```bash
   brew install python3
   ```

3. **Verify**:
   ```bash
   python3 --version
   ```

#### Option B: Download from Python.org

1. Visit: https://www.python.org/downloads/macos/
2. Download latest Python 3.x for macOS
3. Run the installer package
4. Follow installation prompts

### Step 2: Download the Program

#### Option A: Download ZIP
```bash
# Download and extract, then:
cd ~/Downloads/inventory-system
```

#### Option B: Git Clone
```bash
cd ~/Documents
git clone https://github.com/yourusername/inventory-system.git
cd inventory-system
```

### Step 3: Install Dependencies

```bash
# Navigate to program folder
cd ~/Documents/inventory-system

# Install packages
pip3 install -r requirements.txt
```

### Step 4: Make Startup Script Executable

```bash
chmod +x START_INVENTORY.sh
```

### Step 5: Run the Program

**Double-click** `START_INVENTORY.sh` or from terminal:
```bash
./START_INVENTORY.sh
```

Or manually:
```bash
python3 complete_inventory_system.py
```

---

## Linux Installation

### Step 1: Install Python

Most Linux distributions include Python. Verify:
```bash
python3 --version
```

If not installed or version < 3.7:

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install python3 python3-pip python3-tk
```

#### Fedora:
```bash
sudo dnf install python3 python3-pip python3-tkinter
```

#### Arch Linux:
```bash
sudo pacman -S python python-pip tk
```

### Step 2: Download the Program

#### Option A: Download ZIP
```bash
cd ~/Documents
# Extract downloaded ZIP
unzip inventory-system.zip
cd inventory-system
```

#### Option B: Git Clone
```bash
cd ~/Documents
git clone https://github.com/yourusername/inventory-system.git
cd inventory-system
```

### Step 3: Install Dependencies

```bash
# Using pip
pip3 install -r requirements.txt

# Or if you have a virtual environment (recommended):
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 4: Make Startup Script Executable

```bash
chmod +x START_INVENTORY.sh
```

### Step 5: Run the Program

```bash
./START_INVENTORY.sh
```

Or manually:
```bash
python3 complete_inventory_system.py
```

### Optional: Create Desktop Launcher

Create file `~/.local/share/applications/inventory-system.desktop`:

```ini
[Desktop Entry]
Type=Application
Name=Inventory System
Comment=Biodegradable Bags Inventory Management
Exec=/path/to/inventory-system/START_INVENTORY.sh
Icon=applications-office
Terminal=true
Categories=Office;Finance;
```

---

## Verification

After installation, verify everything works:

### 1. Test Python Installation
```bash
# Windows
python --version
pip --version

# macOS/Linux
python3 --version
pip3 --version
```

Expected: Python 3.7+ and pip version shown

### 2. Test Required Packages
```bash
# Windows
python -c "import rich, pandas, matplotlib, openpyxl; print('All packages OK')"

# macOS/Linux
python3 -c "import rich, pandas, matplotlib, openpyxl; print('All packages OK')"
```

Expected: `All packages OK`

### 3. Test Program Launch
```bash
# Windows
python complete_inventory_system.py

# macOS/Linux
python3 complete_inventory_system.py
```

Expected: Program menu displays

### 4. Test Database Creation
1. Run program
2. Enter your name when prompted
3. Select option **0** to exit
4. Check files created:
   - `inventory.db` ✅
   - `config.json` ✅
   - `user_config.txt` ✅

---

## First Run Setup

### Initial Configuration

When you first run the program:

1. **Enter Your Name**
   ```
   Enter your name (for record-keeping): John Smith
   ```
   This appears on all transactions.

2. **Database Creation**
   - System creates `inventory.db` automatically
   - No action needed

3. **Configuration File**
   - Default `config.json` created
   - Can customize later (option 12)

### Configure Settings (Optional)

1. Run program
2. Select option **12** (Settings)
3. Customize:
   - Low stock threshold (default: 10 kg)
   - Currency symbol (default: ₹)
   - Backup retention (default: 30)
   - Enable/disable features

### Add Initial Inventory

1. Select option **1** (Add Stock)
2. Enter each bag dimension
3. Enter initial quantities
4. Skip cost if unknown (can add later)

### Verify Installation

1. Add a test dimension: `TEST-10x10`
2. Add 100 kg stock
3. Record a 10 kg sale
4. View inventory (option 5)
5. Check history (option 6)
6. If all works, delete test data using option 10

---

## Troubleshooting

### Common Installation Issues

#### "python is not recognized"

**Cause**: Python not in system PATH

**Solution Windows**:
1. Reinstall Python
2. ✅ Check "Add Python to PATH"
3. Or manually add to PATH:
   - Control Panel → System → Advanced → Environment Variables
   - Add Python folder to PATH

**Solution macOS/Linux**:
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="/usr/local/bin:$PATH"
```

#### "pip is not recognized"

**Solution Windows**:
```cmd
python -m pip install -r requirements.txt
```

**Solution macOS/Linux**:
```bash
python3 -m pip install -r requirements.txt
```

#### "ModuleNotFoundError: No module named 'rich'"

**Cause**: Dependencies not installed

**Solution**:
```bash
# Windows
pip install rich pandas matplotlib openpyxl

# macOS/Linux
pip3 install rich pandas matplotlib openpyxl
```

#### "Permission denied" (Linux/macOS)

**Solution**:
```bash
# Make script executable
chmod +x complete_inventory_system.py
chmod +x START_INVENTORY.sh

# Or run with python directly
python3 complete_inventory_system.py
```

#### Charts not working

**Linux Solution**:
```bash
# Ubuntu/Debian
sudo apt-get install python3-tk

# Fedora
sudo dnf install python3-tkinter
```

**macOS Solution**:
```bash
brew install python-tk
```

#### Excel export fails

**Solution**:
```bash
pip install openpyxl --upgrade
```

### Virtual Environment (Optional but Recommended)

Using a virtual environment isolates dependencies:

#### Windows:
```cmd
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

#### macOS/Linux:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

To run program with venv:
```bash
# Activate venv first
source venv/bin/activate  # or venv\Scripts\activate on Windows
python complete_inventory_system.py
```

---

## Updating

### Update the Program

#### If using Git:
```bash
cd inventory-system
git pull origin main
pip install -r requirements.txt --upgrade
```

#### Manual Update:
1. Backup your data:
   - Copy `inventory.db` to safe location
   - Copy `config.json`
2. Download new version
3. Extract/replace files (keep your .db and .json)
4. Run: `pip install -r requirements.txt --upgrade`

### Update Dependencies

```bash
# Windows
pip install --upgrade rich pandas matplotlib openpyxl

# macOS/Linux
pip3 install --upgrade rich pandas matplotlib openpyxl
```

### Update Python

If you need to update Python itself:

**Windows**:
1. Download latest from python.org
2. Run installer (will upgrade existing)

**macOS**:
```bash
brew upgrade python3
```

**Linux**:
```bash
sudo apt update && sudo apt upgrade python3
```

After updating Python, reinstall packages:
```bash
pip install -r requirements.txt
```

---

## Uninstallation

### Remove the Program

1. **Backup your data**:
   - Save `inventory.db` if you want to keep records
   - Export to Excel for final backup

2. **Delete program folder**:
   - Windows: Delete from `C:\InventorySystem`
   - macOS/Linux: `rm -rf ~/Documents/inventory-system`

3. **Optional - Remove Python packages**:
   ```bash
   pip uninstall rich pandas matplotlib openpyxl
   ```

4. **Optional - Remove Python**:
   - Only if not needed for other programs
   - Windows: Control Panel → Programs → Uninstall
   - macOS: `brew uninstall python3`
   - Linux: `sudo apt remove python3` (not recommended)

---

## Advanced Installation

### Running as a Service (Linux)

For automatic startup:

1. Create service file `/etc/systemd/system/inventory.service`:
```ini
[Unit]
Description=Inventory Management System
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/inventory-system
ExecStart=/usr/bin/python3 /path/to/inventory-system/complete_inventory_system.py
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

2. Enable service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable inventory.service
sudo systemctl start inventory.service
```

### Network Access Setup

To access from other computers (advanced):

1. Install additional packages:
   ```bash
   pip install flask
   ```

2. Create wrapper script for web access
3. Configure firewall to allow access
4. (This requires advanced customization - not included by default)

### Database Location Customization

To store database in custom location:

Edit `complete_inventory_system.py`:
```python
DB_NAME = '/path/to/custom/location/inventory.db'
```

---

## Getting Help

### Installation Support

If you encounter issues not covered here:

1. **Check error messages** carefully
2. **Review** Troubleshooting section above
3. **Search** online for specific error messages
4. **Contact support** with:
   - Your operating system
   - Python version (`python --version`)
   - Complete error message
   - Steps you've tried

### Resources

- **Python Documentation**: https://docs.python.org/3/
- **Rich Library**: https://rich.readthedocs.io/
- **SQLite**: https://www.sqlite.org/docs.html
- **Program Documentation**: See [USER_GUIDE.md](USER_GUIDE.md)

---

## Quick Start After Installation

Once installed successfully:

```bash
# Run the program
python complete_inventory_system.py

# Or use startup script
./START_INVENTORY.sh          # macOS/Linux
START_INVENTORY.bat           # Windows
```

**Next steps**:
1. Read [USER_GUIDE.md](USER_GUIDE.md) for detailed usage
2. Add your initial inventory
3. Start recording transactions
4. Enjoy automated inventory management!

---

**Installation complete! 🎉**

*For usage instructions, see [USER_GUIDE.md](USER_GUIDE.md)*

*Last updated: October 2025*