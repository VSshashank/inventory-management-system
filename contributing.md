# Contributing to Biodegradable Bags Inventory System

Thank you for considering contributing to this project! This document provides guidelines and instructions for contributing.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Expected Behavior
- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs
Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (OS, Python version, etc.)
- **Error logs** from `error_log.txt`

**Bug Report Template:**
```markdown
**Description:**
Brief description of the bug

**Steps to Reproduce:**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior:**
What you expected to happen

**Actual Behavior:**
What actually happened

**Environment:**
- OS: [e.g., Windows 11, Ubuntu 22.04]
- Python Version: [e.g., 3.10.5]
- Package Versions: [run `pip freeze`]

**Screenshots/Logs:**
If applicable, add screenshots or error logs
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When suggesting:

- **Use a clear and descriptive title**
- **Provide detailed description** of the proposed feature
- **Explain why this enhancement would be useful**
- **List examples** of how it would work
- **Mention alternatives** you've considered

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

## Development Setup

### Prerequisites
- Python 3.7 or higher
- pip package manager
- Virtual environment (recommended)

### Setup Steps

```bash
# Clone the repository
git clone https://github.com/yourusername/inventory-system.git
cd inventory-system

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install pytest black flake8 mypy

# Run the application
python complete_inventory_system.py
```

### Development Dependencies
```txt
# Testing
pytest>=7.0.0
pytest-cov>=4.0.0

# Code Quality
black>=22.0.0
flake8>=5.0.0
mypy>=0.990

# Documentation
sphinx>=5.0.0
```

## Coding Standards

### Python Style Guide
We follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) with some modifications:

- **Line Length**: Maximum 100 characters (not 79)
- **Indentation**: 4 spaces (never tabs)
- **Quotes**: Double quotes for strings
- **Naming**:
  - Functions/variables: `snake_case`
  - Classes: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`

### Code Formatting
Before submitting, format your code:

```bash
# Format with black
black complete_inventory_system.py

# Check with flake8
flake8 complete_inventory_system.py --max-line-length=100

# Type check with mypy
mypy complete_inventory_system.py
```

### Documentation Standards

#### Function Documentation
```python
def add_transaction(dimension, action, amount_kg, current_stock_kg, 
                   cost_per_kg=0, sell_per_kg=0, notes='', custom_date=None):
    """
    Add a transaction to the database.
    
    Args:
        dimension (str): Bag dimension identifier
        action (str): Type of transaction ('Stock Added', 'Sale', 'Adjustment')
        amount_kg (float): Amount in kilograms (signed value)
        current_stock_kg (float): Stock level after transaction
        cost_per_kg (float, optional): Cost per kg for purchases. Defaults to 0.
        sell_per_kg (float, optional): Selling price per kg. Defaults to 0.
        notes (str, optional): Additional notes. Defaults to ''.
        custom_date (str, optional): Custom date (YYYY-MM-DD). Defaults to today.
    
    Returns:
        None
    
    Raises:
        sqlite3.Error: If database operation fails
    
    Example:
        >>> add_transaction('10x16', 'Stock Added', 50, 150, cost_per_kg=120)
    """
```

### Testing Guidelines

#### Writing Tests
```python
import pytest
from complete_inventory_system import normalize_dimension, get_current_stock

def test_normalize_dimension():
    """Test dimension normalization."""
    assert normalize_dimension("10 x 16") == "10x16"
    assert normalize_dimension("10*16") == "10x16"
    assert normalize_dimension("10X16") == "10x16"

def test_get_current_stock_empty():
    """Test getting stock for non-existent dimension."""
    # Setup test database
    stock = get_current_stock("nonexistent")
    assert stock == 0
```

#### Running Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=complete_inventory_system

# Run specific test
pytest tests/test_inventory.py::test_normalize_dimension
```

## Submitting Changes

### Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(reports): add monthly sales summary report

- Implemented new monthly aggregation query
- Added chart visualization
- Updated menu with new option

Closes #123
```

```
fix(stock): prevent negative stock on sales

Previously, sales could result in negative stock levels.
Added validation to check current stock before allowing sale.

Fixes #456
```

### Pull Request Process

1. **Update documentation** if you're adding features
2. **Add tests** for new functionality
3. **Update CHANGELOG.md** with your changes
4. **Ensure all tests pass** before submitting
5. **Request review** from maintainers
6. **Address review comments** promptly

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] I have tested this code locally
- [ ] I have added tests that prove my fix/feature works
- [ ] All tests pass locally

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works

## Related Issues
Closes #(issue number)
```

## Project Structure

```
inventory-system/
├── complete_inventory_system.py    # Main application
├── config.json                     # Configuration file
├── requirements.txt                # Python dependencies
├── README.md                       # Project overview
├── LICENSE                         # License file
├── CHANGELOG.md                    # Version history
├── CONTRIBUTING.md                 # This file
├── docs/                           # Documentation
│   ├── USER_GUIDE.md
│   └── INSTALLATION.md
├── tests/                          # Test files
│   ├── __init__.py
│   ├── test_inventory.py
│   ├── test_reports.py
│   └── test_database.py
└── scripts/                        # Utility scripts
    ├── START_INVENTORY.sh
    └── START_INVENTORY.bat
```

## Areas for Contribution

### High Priority
- [ ] Multi-user access control
- [ ] Data import/export improvements
- [ ] Performance optimization for large datasets
- [ ] Mobile-friendly interface

### Medium Priority
- [ ] Advanced reporting features
- [ ] Email notifications
- [ ] Cloud backup integration
- [ ] Barcode scanning support

### Good First Issues
- [ ] Improve error messages
- [ ] Add more unit tests
- [ ] Documentation improvements
- [ ] UI/UX enhancements
- [ ] Add keyboard shortcuts

## Questions?

If you have questions:
1. Check existing documentation
2. Search existing issues
3. Create a new issue with the "question" label
4. Contact maintainers

## Recognition

Contributors will be recognized in:
- README.md Contributors section
- CHANGELOG.md for their contributions
- Project releases

Thank you for contributing! 🎉