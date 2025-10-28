#!/bin/bash

# Biodegradable Bags Inventory System - Linux/Mac Startup Script
# This script checks dependencies and starts the inventory system

echo "================================================"
echo "  BIODEGRADABLE BAGS INVENTORY SYSTEM"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Python is installed
echo -e "${CYAN}Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Error: Python 3 is not installed!${NC}"
    echo "Please install Python 3.7 or higher from https://www.python.org/"
    read -p "Press Enter to exit..."
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✓ Python $PYTHON_VERSION found${NC}"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo ""
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Virtual environment created${NC}"
    else
        echo -e "${RED}❌ Failed to create virtual environment${NC}"
        read -p "Press Enter to exit..."
        exit 1
    fi
fi

# Activate virtual environment
echo ""
echo -e "${CYAN}Activating virtual environment...${NC}"
source venv/bin/activate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Virtual environment activated${NC}"
else
    echo -e "${RED}❌ Failed to activate virtual environment${NC}"
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if requirements are installed
echo ""
echo -e "${CYAN}Checking dependencies...${NC}"
if ! python3 -c "import rich" 2>/dev/null; then
    echo -e "${YELLOW}Installing required packages...${NC}"
    pip install -r requirements.txt
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        read -p "Press Enter to exit..."
        exit 1
    fi
else
    echo -e "${GREEN}✓ All dependencies are installed${NC}"
fi

# Check if config file exists
if [ ! -f "config.json" ]; then
    echo ""
    echo -e "${YELLOW}Creating default configuration file...${NC}"
    if [ -f "config.json.example" ]; then
        cp config.json.example config.json
        echo -e "${GREEN}✓ Configuration file created${NC}"
        echo -e "${CYAN}You can customize settings in config.json${NC}"
    fi
fi

# Start the program
echo ""
echo -e "${CYAN}================================================${NC}"
echo -e "${GREEN}Starting Inventory System...${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""
sleep 1

python3 inventory_tracker.py

# After program exits
EXIT_CODE=$?
echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Program closed successfully${NC}"
else
    echo -e "${RED}❌ Program exited with error code: $EXIT_CODE${NC}"
    echo -e "${YELLOW}Check error_log.txt for details${NC}"
fi

# Deactivate virtual environment
deactivate

echo ""
read -p "Press Enter to exit..."
