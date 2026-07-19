# Changelog

All notable changes to the Biodegradable Bags Inventory System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-18

### Added
- Complete inventory management system with SQLite database
- Stock addition with cost tracking
- Sales recording with revenue tracking
- Past transaction entry (manual one-by-one)
- Bulk entry wizard for multiple historical transactions
- Current inventory view with status indicators
- Item-specific transaction history viewer
- Comprehensive sales and profit reports with date filtering
- Stock level charts and visualizations
- Sales velocity tracking and forecasting
- Automatic database backups (keeps last 30)
- Stock adjustment feature for physical count corrections
- Undo last transaction functionality
- Professional Excel export with multiple sheets
- Low stock alerts and warnings
- Dimension autocomplete and suggestion system
- Rich terminal interface with colors and tables
- User audit trail system
- Configurable settings (thresholds, currency, formats)
- Error logging system
- Startup scripts for Windows and Linux/Mac

### Features
- **Database**: SQLite with automatic backups
- **Interface**: Rich terminal UI with colors and formatting
- **Reports**: 
  - Current stock summary
  - Transaction history
  - Sales by dimension
  - Profit analysis
  - Sales velocity and forecasting
- **Export**: Multi-sheet Excel reports with formatting
- **Charts**: Stock level bar charts with color coding
- **Safety**: 
  - Automatic backups before critical operations
  - Confirmation dialogs for destructive actions
  - Error logging for debugging
- **Usability**:
  - Dimension autocomplete
  - Smart date filtering (Last 7/30 days, This Month/Year, Custom)
  - Low stock warnings
  - Negative stock prevention
  - Past transaction entry support

### Configuration Options
- Low stock threshold (default: 10 kg)
- Number of backups to keep (default: 30)
- Currency symbol (default: ₹)
- Date format (default: YYYY-MM-DD)
- Chart generation toggle
- Profit tracking toggle

### Technical Details
- Python 3.7+ required
- Dependencies: rich, pandas, matplotlib, openpyxl
- Database: SQLite 3
- Backup system: Timestamped automatic backups
- Platform: Cross-platform (Windows, Linux, macOS)

## [Unreleased]

### Planned Features
- Multi-user access control system
- Barcode scanning integration
- Email report automation
- Mobile app companion
- Cloud backup integration
- Supplier management module
- Purchase order system
- Invoice generation
- Advanced analytics dashboard
- Custom report builder
- Data import from CSV/Excel
- Multi-currency support
- Multi-warehouse management
- Batch/lot tracking
- Expiry date tracking
- Min/max stock level automation
- Reorder point notifications
- API for external integrations

### Under Consideration
- Web-based interface
- Tablet/mobile interface
- Integration with accounting software
- Customer management system
- Returns/refunds tracking
- Seasonal trend analysis
- Predictive analytics
- Machine learning for demand forecasting

---

## Version History

### Legend
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability patches

---

*For detailed commit history, see the Git log.*