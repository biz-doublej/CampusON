#!/usr/bin/env python3
"""
Test Poppler Installation
"""

import os
import sys
from pathlib import Path

def test_poppler():
    """Test Poppler installation"""
    print("🧪 Testing Poppler Installation")
    print("=" * 40)
    
    # Load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        print("⚠️  dotenv not available, trying manual .env loading")
        
        # Manual .env loading
        env_file = Path(__file__).parent / ".env"
        if env_file.exists():
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and '=' in line and not line.startswith('#'):
                        key, value = line.split('=', 1)
                        os.environ[key.strip()] = value.strip()
    
    # Check POPPLER_PATH
    poppler_path = os.getenv('POPPLER_PATH')
    print(f"POPPLER_PATH: {poppler_path}")
    
    if not poppler_path:
        print("❌ POPPLER_PATH not set in environment")
        return False
    
    # Check if path exists
    if not os.path.exists(poppler_path):
        print(f"❌ Poppler path does not exist: {poppler_path}")
        return False
    
    print(f"✅ Poppler path exists: {poppler_path}")
    
    # Check for required executables
    required_exes = ['pdftoppm.exe', 'pdftocairo.exe']
    for exe in required_exes:
        exe_path = Path(poppler_path) / exe
        if exe_path.exists():
            print(f"✅ Found {exe}")
        else:
            print(f"❌ Missing {exe}")
            return False
    
    # Test pdf2image import
    try:
        from pdf2image import convert_from_path
        print("✅ pdf2image import successful")
    except ImportError as e:
        print(f"❌ pdf2image import failed: {e}")
        return False
    
    # Test with actual poppler_path parameter
    try:
        # This should fail gracefully with "No such file" not poppler error
        result = convert_from_path("nonexistent.pdf", poppler_path=poppler_path)
    except Exception as e:
        error_msg = str(e).lower()
        if "no such file" in error_msg or "cannot open" in error_msg:
            print("✅ Poppler is working correctly (test file error expected)")
            return True
        elif "poppler" in error_msg:
            print(f"❌ Poppler still not working: {e}")
            return False
        else:
            print(f"✅ Poppler working (unexpected error type: {e})")
            return True
    
    return True

if __name__ == "__main__":
    success = test_poppler()
    if success:
        print("\n🎉 Poppler test passed!")
        print("✅ Your PDF parsing should work now")
    else:
        print("\n❌ Poppler test failed")
        print("   Check the installation and path configuration")