#!/usr/bin/env python3
"""
Quick Poppler Fix Script
Provides multiple solutions to resolve Poppler PATH issues for pdf2image
"""

import os
import sys
from pathlib import Path
import subprocess
import platform

def check_system_poppler():
    """Check if Poppler is available in system PATH"""
    print("🔍 Checking system PATH for Poppler...")
    
    executables = ['pdftoppm', 'pdftocairo'] if platform.system() != 'Windows' else ['pdftoppm.exe', 'pdftocairo.exe']
    
    for exe in executables:
        try:
            result = subprocess.run(['which' if platform.system() != 'Windows' else 'where', exe], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                path = result.stdout.strip()
                print(f"✅ Found {exe} at: {path}")
                return True
        except Exception:
            continue
    
    print("❌ Poppler not found in system PATH")
    return False

def find_common_poppler_locations():
    """Find Poppler in common installation locations"""
    print("🔍 Searching common Poppler installation locations...")
    
    if platform.system() == "Windows":
        common_paths = [
            Path("C:/poppler/bin"),
            Path("C:/poppler-*/bin"),
            Path("C:/Program Files/poppler/bin"),
            Path("C:/Program Files (x86)/poppler/bin"),
            Path.home() / "Downloads" / "poppler" / "bin",
            Path.cwd() / "poppler" / "bin",
        ]
        
        # Also check for extracted poppler directories in common download locations
        downloads = Path.home() / "Downloads"
        if downloads.exists():
            for item in downloads.iterdir():
                if item.is_dir() and "poppler" in item.name.lower():
                    bin_path = item / "bin"
                    if bin_path.exists():
                        common_paths.append(bin_path)
    else:
        common_paths = [
            Path("/usr/bin"),
            Path("/usr/local/bin"),
            Path("/opt/poppler/bin"),
        ]
    
    for path in common_paths:
        try:
            if path.exists():
                # Check for required executables
                exe_suffix = ".exe" if platform.system() == "Windows" else ""
                pdftoppm = path / f"pdftoppm{exe_suffix}"
                if pdftoppm.exists():
                    print(f"✅ Found Poppler at: {path}")
                    return str(path)
        except Exception:
            continue
    
    print("❌ Poppler not found in common locations")
    return None

def update_env_with_poppler_path(poppler_path):
    """Update .env file with the found Poppler path"""
    env_file = Path(__file__).parent / ".env"
    
    try:
        # Read existing content
        if env_file.exists():
            with open(env_file, 'r', encoding='utf-8') as f:
                content = f.read()
        else:
            content = ""
        
        # Update or add POPPLER_PATH
        lines = content.split('\n')
        updated = False
        
        for i, line in enumerate(lines):
            if line.startswith('POPPLER_PATH=') or line.startswith('# POPPLER_PATH='):
                lines[i] = f"POPPLER_PATH={poppler_path}"
                updated = True
                print(f"✅ Updated existing POPPLER_PATH in .env")
                break
        
        if not updated:
            # Add new POPPLER_PATH
            if content and not content.endswith('\n'):
                content += '\n'
            content += f"\n# Poppler Path (for PDF processing)\nPOPPLER_PATH={poppler_path}\n"
            print(f"✅ Added POPPLER_PATH to .env")
        else:
            content = '\n'.join(lines)
        
        # Write back
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating .env: {e}")
        return False

def test_poppler_with_pdf2image():
    """Test if pdf2image can work with current Poppler setup"""
    print("\n🧪 Testing pdf2image with current configuration...")
    
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        from pdf2image import convert_from_path
        
        # Create a simple test (this will fail but we can catch the specific error)
        try:
            # This should fail gracefully if no test PDF is available
            test_result = convert_from_path("nonexistent.pdf")
        except Exception as e:
            error_msg = str(e).lower()
            if "poppler" in error_msg and "path" in error_msg:
                print("❌ Poppler PATH issue confirmed")
                return False
            elif "no such file" in error_msg or "cannot open" in error_msg:
                print("✅ Poppler is working (test file not found is expected)")
                return True
            else:
                print(f"⚠️  Unexpected error: {e}")
                return False
        
        return True
        
    except ImportError:
        print("❌ pdf2image not installed")
        return False

def provide_manual_instructions():
    """Provide manual installation instructions"""
    print("\n📚 Manual Installation Instructions")
    print("=" * 50)
    
    if platform.system() == "Windows":
        print("For Windows:")
        print("1. Download Poppler from: https://github.com/oschwartz10612/poppler-windows/releases")
        print("2. Extract the ZIP file to C:\\poppler\\ (or any location)")
        print("3. Add the following to your .env file:")
        print("   POPPLER_PATH=C:\\poppler\\bin")
        print("4. Or add C:\\poppler\\bin to your system PATH")
        print()
        print("Alternative - Using Conda:")
        print("   conda install -c conda-forge poppler")
        print()
        print("Alternative - Using Chocolatey:")
        print("   choco install poppler")
    else:
        print("For Linux/Ubuntu:")
        print("   sudo apt-get install poppler-utils")
        print()
        print("For macOS:")
        print("   brew install poppler")
        print()
        print("For CentOS/RHEL:")
        print("   sudo yum install poppler-utils")

def main():
    """Main function to fix Poppler issues"""
    print("🔧 Poppler PATH Fix Tool")
    print("=" * 40)
    print("This tool helps resolve Poppler installation issues for pdf2image")
    print()
    
    # Step 1: Test current state
    if test_poppler_with_pdf2image():
        print("✅ Poppler is already working correctly!")
        return
    
    # Step 2: Check system PATH
    if check_system_poppler():
        print("✅ Poppler found in system PATH")
        print("   The issue might be with environment variable loading")
        print("   Try restarting your application")
        return
    
    # Step 3: Search common locations
    poppler_path = find_common_poppler_locations()
    
    if poppler_path:
        print(f"✅ Found Poppler at: {poppler_path}")
        if update_env_with_poppler_path(poppler_path):
            print("✅ Updated .env file")
            print("📝 Please restart your application to apply changes")
        else:
            print(f"❌ Failed to update .env file")
            print(f"   Please manually add: POPPLER_PATH={poppler_path}")
    else:
        print("❌ Could not find Poppler installation")
        print("📥 You need to install Poppler first")
        provide_manual_instructions()
        print()
        print("🚀 Quick Installation Options:")
        print("   1. Run: python install_poppler.py (automatic)")
        print("   2. Follow manual instructions above")

if __name__ == "__main__":
    main()