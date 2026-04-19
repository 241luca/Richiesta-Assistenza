#!/bin/bash
# install_ocr_dependencies.sh
# 
# Script per installare le dipendenze OCR (Docling e PaddleOCR-VL)
# Supporta installazione separata o completa
#
# Usage:
#   chmod +x scripts/install_ocr_dependencies.sh
#   ./scripts/install_ocr_dependencies.sh [all|docling|paddleocr]
#
# Default: all

set -e

INSTALL_MODE="${1:-all}"

echo "🚀 SmartDocs Advanced OCR - Dependency Installer"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica Python
echo -e "${BLUE}Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Python 3 not found. Please install Python 3.8 or higher.${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✅ Python ${PYTHON_VERSION} found${NC}"
echo ""

# Crea virtual environment se non esiste
VENV_PATH="./venv_ocr"
if [ ! -d "$VENV_PATH" ]; then
    echo -e "${BLUE}Creating virtual environment...${NC}"
    python3 -m venv "$VENV_PATH"
    echo -e "${GREEN}✅ Virtual environment created${NC}"
fi

# Attiva virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source "$VENV_PATH/bin/activate"
echo ""

# Upgrade pip
echo -e "${BLUE}Upgrading pip...${NC}"
pip install --upgrade pip
echo ""

# Installa dipendenze base
echo -e "${BLUE}Installing base dependencies...${NC}"
pip install pillow pandas openpyxl
echo -e "${GREEN}✅ Base dependencies installed${NC}"
echo ""

# Installa Docling
if [ "$INSTALL_MODE" = "all" ] || [ "$INSTALL_MODE" = "docling" ]; then
    echo -e "${BLUE}Installing Docling...${NC}"
    pip install "docling[table]"
    echo -e "${GREEN}✅ Docling installed${NC}"
    echo ""
fi

# Installa PaddleOCR-VL
if [ "$INSTALL_MODE" = "all" ] || [ "$INSTALL_MODE" = "paddleocr" ]; then
    echo -e "${BLUE}Installing PaddleOCR-VL...${NC}"
    
    # Detect OS
    OS="$(uname -s)"
    case "${OS}" in
        Linux*)
            echo "Detected Linux - Installing PaddlePaddle for Linux..."
            pip install paddlepaddle-gpu==3.0.0 -i https://www.paddlepaddle.org.cn/packages/stable/cu126/ || \
            pip install paddlepaddle  # Fallback to CPU version
            ;;
        Darwin*)
            echo "Detected macOS - Installing PaddlePaddle for macOS..."
            pip install paddlepaddle
            ;;
        *)
            echo "Unknown OS - Installing CPU version of PaddlePaddle..."
            pip install paddlepaddle
            ;;
    esac
    
    # Install PaddleOCR with document parser
    pip install -U "paddleocr[doc-parser]"
    
    echo -e "${GREEN}✅ PaddleOCR-VL installed${NC}"
    echo ""
fi

# Test installations
echo -e "${BLUE}Testing installations...${NC}"
echo ""

if [ "$INSTALL_MODE" = "all" ] || [ "$INSTALL_MODE" = "docling" ]; then
    echo -n "Testing Docling... "
    if python3 -c "import docling; print('OK')" 2>/dev/null; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${YELLOW}❌ Failed${NC}"
    fi
fi

if [ "$INSTALL_MODE" = "all" ] || [ "$INSTALL_MODE" = "paddleocr" ]; then
    echo -n "Testing PaddleOCR... "
    if python3 -c "import paddleocr; print('OK')" 2>/dev/null; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${YELLOW}❌ Failed${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Installation complete!${NC}"
echo ""
echo "To use the OCR services, activate the virtual environment:"
echo "  source $VENV_PATH/bin/activate"
echo ""
echo "Test the advanced_ocr script:"
echo "  python3 scripts/advanced_ocr.py --check-engines"
echo ""
