# 📦 Biodegradable Bags Inventory Management System

A professional-grade inventory tracking system designed specifically for biodegradable bag businesses. Features complete transaction history, profit tracking, sales analytics, and beautiful reporting.

![Python Version](https://img.shields.io/badge/python-3.7+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)

## ✨ Key Features

### 📊 Core Functionality
- **Real-time Stock Tracking**: Monitor inventory levels for all bag dimensions
- **Transaction History**: Complete audit trail of all stock movements
- **Past Transaction Entry**: Add historical transactions with custom dates
- **Bulk Entry Wizard**: Quickly import multiple past transactions

### 💰 Business Intelligence
- **Profit Tracking**: Track costs and selling prices for profitability analysis
- **Sales Reports**: Comprehensive sales analytics with date filtering
- **Sales Velocity**: Forecast when stock will run out based on sales patterns
- **Low Stock Alerts**: Automatic warnings when inventory runs low

### 📈 Reporting & Analytics
- **Excel Export**: Professional multi-sheet reports with color coding
- **Visual Charts**: Generate stock level bar charts
- **Item History**: View complete transaction history per dimension
- **Profit Analysis**: Calculate margins and profitability by product

### 🛡️ Data Safety
- **Automatic Backups**: Database backed up before every change
- **Error Logging**: Comprehensive error tracking for debugging
- **Undo Function**: Reverse the last transaction if needed
- **Data Validation**: Prevents negative stock and invalid entries

### 🎨 User Experience
- **Beautiful Interface**: Rich terminal UI with colors and tables
- **Autocomplete**: Dimension suggestions to prevent typos
- **Smart Confirmations**: Preview changes before committing
- **Guided Wizards**: Step-by-step assistance for complex tasks

## 🚀 Quick Start

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Installation

1. **Clone or Download**
   ```bash
   git clone https://github.com/yourusername/inventory-system.git
   cd inventory-system
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Program**
   ```bash
   python complete_inventory_system.py
   ```

   Or use the startup scripts:
   - **Windows**: Double-click `START_INVENTORY.bat`
   - **Linux/Mac**: Run `./START_INVENTORY.sh`

## 📖 Usage Guide

### First Time Setup

When you first run the program:
1. Enter your name for record-keeping
2. The system creates a new database automatically
3. Start adding your inventory!

### Daily Operations

#### Adding New Stock (Today's Date)
1. Select option **1** from main menu
2. Enter bag dimension (e.g., `10x16`)
3. Enter quantity received in kg
4. Optionally enter cost per kg
5. Confirm and save

#### Recording a Sale (Today's Date)
1. Select option **2** from main menu
2. Choose dimension from existing stock
3. Enter quantity sold in kg
4. Optionally enter selling price per kg
5. System prevents overselling automatically

#### Adding Past Transactions
1. Select option **3** for manual entry (one at a time)
2. OR select option **4** for bulk entry wizard (multiple transactions)
3. Choose transaction type (stock/sale/adjustment)
4. Enter the historical date (YYYY-MM-DD format)
5. Enter dimension and quantity
6. Include pricing if needed
7. Confirm and save

### Reports & Analytics

#### View Current Inventory
- Shows all dimensions with current stock levels
- Color-coded: Green (good), Yellow (low), Red (out of stock)
- Total inventory summary

#### Sales & Profit Reports
- Filter by date range (last 7/30 days, this month/year, custom)
- Sales by dimension with revenue
- Profit analysis with margins
- Sales velocity and stock forecasting

#### Excel Export
- Multi-sheet professional reports
- Current stock with color coding
- Complete transaction history
- Sales and profit analysis
- Formatted and ready for presentation

## 🔧 Configuration

Edit settings via the program (option **12**) or manually edit `config.json`:

```json
{
    "low_stock_threshold": 10,
    "backups_to_keep": 30,
    "default_currency": "₹",
    "date_format": "%Y-%m-%d",
    "enable_charts": true,
    "enable_profit_tracking": true
}
```

### Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| `low_stock_threshold` | Alert level for low stock (kg) | 10 |
| `backups_to_keep` | Number of backup files to retain | 30 |
| `default_currency` | Currency symbol for reports | ₹ |
| `date_format` | Date format for transactions | YYYY-MM-DD |
| `enable_charts` | Generate visual charts | true |
| `enable_profit_tracking` | Track costs and profits | true |

## 📁 File Structure

```
inventory-management-system/
├── complete_inventory_system.py    # Main program
├── inventory.db                    # SQLite database (auto-created)
├── config.json                     # Configuration file (auto-created)
├── user_config.txt                 # User name (auto-created)
├── error_log.txt                   # Error logs (auto-created)
├── backup_db_*.db                  # Automatic backups
├── stock_chart_*.png               # Generated charts
├── inventory_report_*.xlsx         # Excel exports
├── requirements.txt                # Python dependencies
├── README.md                       # This file
├── LICENSE                         # License information
├── docs/
│   ├── USER_GUIDE.md              # Detailed user guide
│   └── INSTALLATION.md            # Installation instructions
└── scripts/
    ├── START_INVENTORY.sh         # Linux/Mac startup script
    └── START_INVENTORY.bat        # Windows startup script
```

## 🐛 Troubleshooting

### Common Issues

**"ModuleNotFoundError: No module named 'rich'"**
- Solution: Run `pip install -r requirements.txt`

**"Database is locked"**
- Solution: Close other instances of the program
- The database can only be accessed by one program at a time

**"Permission denied" when creating backups**
- Solution: Run with appropriate permissions
- Ensure write access to the program directory

**Charts not generating**
- Solution: Install matplotlib: `pip install matplotlib`
- Some systems may need additional graphics libraries

### Getting Help

1. Check the detailed [User Guide](docs/USER_GUIDE.md)
2. Review [Installation Guide](docs/INSTALLATION.md)
3. Check `error_log.txt` for error details
4. Create an issue on GitHub with error details

## 🔒 Data Security

### Backup Strategy
- **Automatic backups** created before every change
- Backups stored as `backup_db_YYYYMMDD_HHMMSS.db`
- Configurable retention (default: 30 most recent)
- Manual backups: Copy `inventory.db` to safe location

### Data Recovery
1. Close the program
2. Locate desired backup file
3. Rename backup to `inventory.db`
4. Restart program

### Best Practices
- Regular exports to Excel for external backup
- Store backups in cloud storage (Dropbox, Google Drive)
- Test backups periodically
- Keep program updated

## 🎯 Use Cases

This system is perfect for:
- **Biodegradable bag manufacturers**
- **Packaging material distributors**
- **Small to medium businesses** tracking inventory
- **Businesses needing profit tracking**
- **Operations requiring transaction history**

## 🚀 Advanced Features

### Dimension Normalization
The system automatically standardizes dimension formats:
- `10x16`, `10X16`, `10 x 16` → all stored as `10x16`
- Prevents duplicate entries from formatting differences

### Smart Autocomplete
- Shows existing dimensions while typing
- Suggests similar dimensions to prevent typos
- Learn from your inventory patterns

### Audit Trail
Every transaction records:
- Date and time
- User who made the change
- Complete transaction details
- Stock level before and after

## 📊 Sample Workflow

### Starting a New Business
1. Install and run the program
2. Add initial stock inventory (use option 3 for past dates if needed)
3. Configure low stock threshold
4. Start recording daily sales

### Monthly Review
1. Run sales & profit report for the month
2. Export to Excel for records
3. Review sales velocity forecast
4. Reorder low-stock items

### Year-End Analysis
1. Generate annual sales report
2. Export complete transaction history
3. Analyze profitability by dimension
4. Plan for next year based on velocity data

## 🤝 Contributing

Contributions are welcome! Areas for enhancement:
- Additional report types
- Mobile app integration
- Multi-user support
- Barcode scanning
- Supplier management

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Python and SQLite
- Uses Rich library for beautiful terminal UI
- Pandas for data analysis
- Matplotlib for charting
- OpenPyXL for Excel export

## 📞 Support

For questions, issues, or suggestions:
- **Email**: vsshashank23@gmail.com
- **Issues**: GitHub Issues page
- **Documentation**: See `docs/` folder

## 🔄 Version History

### v1.0.0 (Current)
- ✅ Complete inventory tracking
- ✅ Past transaction entry
- ✅ Bulk entry wizard
- ✅ Profit tracking
- ✅ Sales analytics
- ✅ Excel export
- ✅ Automatic backups
- ✅ Beautiful UI

---

**Made with ❤️ for small businesses**

*Last updated: October 2025*