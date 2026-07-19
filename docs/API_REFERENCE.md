# API Reference

Developer documentation for the Biodegradable Bags Inventory System.

## Table of Contents
- [Database Schema](#database-schema)
- [Core Functions](#core-functions)
- [Configuration](#configuration)
- [Data Models](#data-models)
- [Extending the System](#extending-the-system)

---

## Database Schema

### transactions Table

Main table storing all inventory transactions.

```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    user TEXT NOT NULL,
    dimension TEXT NOT NULL,
    action TEXT NOT NULL,
    amount_kg REAL NOT NULL,
    current_stock_kg REAL NOT NULL,
    cost_per_kg REAL DEFAULT 0,
    sell_per_kg REAL DEFAULT 0,
    notes TEXT DEFAULT ''
)
```

**Indexes:**
- `idx_dimension` on `dimension` column
- `idx_date` on `date` column

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Auto-incrementing primary key |
| `date` | TEXT | Transaction date (YYYY-MM-DD format) |
| `time` | TEXT | Transaction time (HH:MM:SS format) |
| `user` | TEXT | Username who made the transaction |
| `dimension` | TEXT | Normalized bag dimension (e.g., "10x16") |
| `action` | TEXT | Transaction type: "Stock Added", "Sale", "Adjustment" |
| `amount_kg` | REAL | Amount changed (+ for additions, - for sales) |
| `current_stock_kg` | REAL | Stock level after this transaction |
| `cost_per_kg` | REAL | Purchase cost per kg (0 if not tracked) |
| `sell_per_kg` | REAL | Selling price per kg (0 if not tracked) |
| `notes` | TEXT | Optional notes/comments |

---

## Core Functions

### Database Functions

#### `init_database()`
Initialize SQLite database with required tables and indexes.

```python
def init_database() -> None
```

**Returns:** None  
**Side Effects:** 
- Creates `inventory.db` if not exists
- Creates `transactions` table
- Creates indexes
- Creates initial backup

**Example:**
```python
init_database()
# Database ready to use
```

---

#### `get_current_stock(dimension: str) -> float`
Get current stock level for a dimension.

```python
def get_current_stock(dimension: str) -> float
```

**Parameters:**
- `dimension` (str): Bag dimension (will be normalized)

**Returns:** 
- float: Current stock in kg (0 if dimension not found)

**Example:**
```python
stock = get_current_stock("10x16")
print(f"Current stock: {stock} kg")
# Output: Current stock: 150.5 kg
```

---

#### `add_transaction(...)`
Add a transaction to the database.

```python
def add_transaction(
    dimension: str,
    action: str,
    amount_kg: float,
    current_stock_kg: float,
    cost_per_kg: float = 0,
    sell_per_kg: float = 0,
    notes: str = '',
    custom_date: str = None
) -> None
```

**Parameters:**
- `dimension` (str): Bag dimension
- `action` (str): Transaction type ("Stock Added", "Sale", "Adjustment")
- `amount_kg` (float): Amount changed (signed: + for add, - for sale)
- `current_stock_kg` (float): Stock level after transaction
- `cost_per_kg` (float, optional): Cost per kg. Defaults to 0
- `sell_per_kg` (float, optional): Selling price per kg. Defaults to 0
- `notes` (str, optional): Transaction notes. Defaults to ''
- `custom_date` (str, optional): Date (YYYY-MM-DD). Defaults to today

**Returns:** None

**Example:**
```python
# Add 100 kg of stock purchased at ₹120/kg
add_transaction(
    dimension="10x16",
    action="Stock Added",
    amount_kg=100,
    current_stock_kg=250,
    cost_per_kg=120,
    notes="Supplier: ABC Plastics"
)
```

---

### Utility Functions

#### `normalize_dimension(dimension: str) -> str`
Standardize dimension format to prevent duplicates.

```python
def normalize_dimension(dimension: str) -> str
```

**Parameters:**
- `dimension` (str): Raw dimension input

**Returns:**
- str: Normalized dimension (lowercase, 'x' separator, no spaces)

**Example:**
```python
normalize_dimension("10 X 16")   # Returns: "10x16"
normalize_dimension("10*16")     # Returns: "10x16"
normalize_dimension("10x16")     # Returns: "10x16"
```

---

#### `get_all_dimensions() -> list`
Get list of all existing dimensions in database.

```python
def get_all_dimensions() -> list[str]
```

**Returns:**
- list: Sorted list of dimension strings

**Example:**
```python
dimensions = get_all_dimensions()
print(dimensions)
# Output: ['10x12', '10x16', '12x18', '15x20']
```

---

#### `autocomplete_dimension(partial: str) -> list`
Get dimension suggestions based on partial input.

```python
def autocomplete_dimension(partial: str) -> list[str]
```

**Parameters:**
- `partial` (str): Partial dimension string

**Returns:**
- list: Matching dimensions

**Example:**
```python
matches = autocomplete_dimension("10")
print(matches)
# Output: ['10x12', '10x16']
```

---

### Backup Functions

#### `create_backup()`
Create timestamped backup of database.

```python
def create_backup() -> None
```

**Returns:** None  
**Side Effects:** Creates file `backup_db_YYYYMMDD_HHMMSS.db`

**Example:**
```python
create_backup()
# Creates: backup_db_20250128_143022.db
```

---

#### `cleanup_old_backups()`
Remove old backups based on retention policy.

```python
def cleanup_old_backups() -> None
```

**Returns:** None  
**Side Effects:** Deletes old backup files  
**Note:** Keeps number specified in `CONFIG['backups_to_keep']`

---

### Configuration Functions

#### `load_config() -> dict`
Load configuration from file or return defaults.

```python
def load_config() -> dict
```

**Returns:**
- dict: Configuration dictionary

**Example:**
```python
config = load_config()
print(config['low_stock_threshold'])
# Output: 10
```

---

#### `save_config(config: dict)`
Save configuration to file.

```python
def save_config(config: dict) -> None
```

**Parameters:**
- `config` (dict): Configuration dictionary

**Returns:** None

**Example:**
```python
CONFIG['low_stock_threshold'] = 15
save_config(CONFIG)
```

---

### Error Handling

#### `log_error(error_msg: str)`
Log errors to file for debugging.

```python
def log_error(error_msg: str) -> None
```

**Parameters:**
- `error_msg` (str): Error message to log

**Returns:** None  
**Side Effects:** Appends to `error_log.txt` with timestamp and traceback

**Example:**
```python
try:
    risky_operation()
except Exception as e:
    log_error(f"Operation failed: {str(e)}")
```

---

## Configuration

### Configuration File: `config.json`

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

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `low_stock_threshold` | float | 10 | Stock level (kg) below which to show warnings |
| `backups_to_keep` | int | 30 | Number of automatic backups to retain |
| `default_currency` | str | "₹" | Currency symbol for display |
| `date_format` | str | "%Y-%m-%d" | Date format (Python strftime) |
| `enable_charts` | bool | true | Enable/disable chart generation |
| `enable_profit_tracking` | bool | true | Enable/disable cost/profit features |

### Accessing Configuration

```python
from complete_inventory_system import CONFIG

# Read values
threshold = CONFIG['low_stock_threshold']

# Modify values
CONFIG['low_stock_threshold'] = 15
save_config(CONFIG)
```

---

## Data Models

### Transaction Model

Conceptual representation of a transaction:

```python
{
    'id': 1,
    'date': '2025-01-28',
    'time': '14:30:22',
    'user': 'Admin',
    'dimension': '10x16',
    'action': 'Stock Added',
    'amount_kg': 100.0,
    'current_stock_kg': 250.0,
    'cost_per_kg': 120.0,
    'sell_per_kg': 0.0,
    'notes': 'Supplier: ABC Plastics'
}
```

### Action Types

Valid values for `action` field:

- **"Stock Added"**: Inventory received/purchased
- **"Sale"**: Inventory sold to customer
- **"Adjustment"**: Manual correction (physical count)

### Date/Time Formats

- **Date**: `YYYY-MM-DD` (ISO 8601)
- **Time**: `HH:MM:SS` (24-hour format)

---

## Extending the System

### Adding Custom Reports

Create a new report function:

```python
def custom_sales_report():
    """Generate custom sales analysis."""
    conn = sqlite3.connect(DB_NAME)
    
    query = '''
        SELECT 
            dimension,
            COUNT(*) as num_transactions,
            SUM(amount_kg) as total_amount,
            AVG(sell_per_kg) as avg_price
        FROM transactions
        WHERE action = 'Sale'
        GROUP BY dimension
        ORDER BY total_amount DESC
    '''
    
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    # Display with Rich
    table = Table(title="Custom Sales Report")
    table.add_column("Dimension", style="cyan")
    table.add_column("Transactions", justify="right")
    table.add_column("Total Sold", justify="right")
    table.add_column("Avg Price", justify="right")
    
    for _, row in df.iterrows():
        table.add_row(
            row['dimension'],
            str(row['num_transactions']),
            f"{abs(row['total_amount']):.2f} kg",
            f"₹{row['avg_price']:.2f}"
        )
    
    console.print(table)
```

### Adding to Main Menu

Modify `main_menu()` function:

```python
def main_menu():
    # ... existing code ...
    
    console.print("  [cyan]13.[/cyan] Custom Sales Report")  # Add new option
    
    choice = Prompt.ask("\nEnter your choice", 
                       choices=['1','2',...,'13','0'])  # Add '13'
    
    # ... existing conditions ...
    
    elif choice == '13':
        custom_sales_report()  # Add handler
```

### Creating Custom Validators

Add input validation:

```python
def validate_positive_number(value: str, field_name: str) -> float:
    """Validate input is a positive number."""
    try:
        num = float(value)
        if num <= 0:
            raise ValueError(f"{field_name} must be positive")
        return num
    except ValueError as e:
        console.print(f"[red]❌ Invalid {field_name}: {str(e)}[/red]")
        raise

# Usage
amount = validate_positive_number(user_input, "Amount")
```

### Adding Database Migrations

When modifying schema:

```python
def migrate_database_v2():
    """Upgrade database to version 2."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Check if migration needed
    cursor.execute("PRAGMA table_info(transactions)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'supplier' not in columns:
        # Add new column
        cursor.execute('''
            ALTER TABLE transactions 
            ADD COLUMN supplier TEXT DEFAULT ''
        ''')
        conn.commit()
        print("✓ Database upgraded to v2")
    
    conn.close()

# Call before main()
migrate_database_v2()
```

### Custom Export Formats

Add JSON export:

```python
def export_to_json():
    """Export transactions to JSON."""
    conn = sqlite3.connect(DB_NAME)
    
    query = 'SELECT * FROM transactions ORDER BY date DESC, time DESC'
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    filename = f'inventory_export_{date.today().strftime("%Y%m%d")}.json'
    df.to_json(filename, orient='records', indent=2)
    
    console.print(f"[green]✅ Exported to {filename}[/green]")
```

### Integration Hooks

Add webhook notifications:

```python
import requests

def send_low_stock_alert(dimension: str, stock: float):
    """Send alert when stock is low."""
    if stock < CONFIG['low_stock_threshold']:
        webhook_url = CONFIG.get('webhook_url', '')
        if webhook_url:
            payload = {
                'text': f'⚠️ Low Stock Alert: {dimension} has only {stock:.2f} kg remaining',
                'dimension': dimension,
                'stock': stock
            }
            try:
                requests.post(webhook_url, json=payload)
            except Exception as e:
                log_error(f"Webhook failed: {str(e)}")

# Call after sales
def record_sale():
    # ... existing code ...
    send_low_stock_alert(dimension, new_stock)
```

---

## Query Examples

### Get Stock Summary

```python
conn = sqlite3.connect('inventory.db')
cursor = conn.cursor()

cursor.execute('''
    SELECT 
        dimension,
        current_stock_kg as stock
    FROM transactions t1
    WHERE id = (
        SELECT MAX(id) 
        FROM transactions t2 
        WHERE t2.dimension = t1.dimension
    )
    ORDER BY dimension
''')

for row in cursor.fetchall():
    print(f"{row[0]}: {row[1]} kg")

conn.close()
```

### Calculate Profit

```python
conn = sqlite3.connect('inventory.db')

# Total costs
costs = pd.read_sql_query('''
    SELECT SUM(ABS(amount_kg) * cost_per_kg) as total_cost
    FROM transactions
    WHERE action = 'Stock Added' AND cost_per_kg > 0
''', conn)

# Total revenue
revenue = pd.read_sql_query('''
    SELECT SUM(ABS(amount_kg) * sell_per_kg) as total_revenue
    FROM transactions
    WHERE action = 'Sale' AND sell_per_kg > 0
''', conn)

profit = revenue['total_revenue'][0] - costs['total_cost'][0]
print(f"Total Profit: ₹{profit:.2f}")

conn.close()
```

### Get Transaction History

```python
conn = sqlite3.connect('inventory.db')

df = pd.read_sql_query('''
    SELECT 
        date,
        dimension,
        action,
        amount_kg,
        current_stock_kg
    FROM transactions
    WHERE dimension = ?
    ORDER BY date DESC, time DESC
    LIMIT 50
''', conn, params=('10x16',))

print(df)
conn.close()
```

---

## Best Practices

### Error Handling

Always wrap database operations:

```python
try:
    conn = sqlite3.connect(DB_NAME)
    # ... operations ...
    conn.commit()
except sqlite3.Error as e:
    log_error(f"Database error: {str(e)}")
    console.print("[red]❌ Database operation failed[/red]")
finally:
    conn.close()
```

### Transaction Safety

Use backups before critical operations:

```python
def critical_operation():
    create_backup()  # Always backup first
    try:
        # ... modify data ...
        pass
    except Exception as e:
        log_error(f"Operation failed: {str(e)}")
        # Restore from backup if needed
```

### Input Validation

Validate before database operations:

```python
if not dimension or dimension.strip() == '':
    console.print("[red]❌ Dimension cannot be empty[/red]")
    return

if amount_kg <= 0:
    console.print("[red]❌ Amount must be positive[/red]")
    return
```

---

For more examples and use cases, see the main program code.