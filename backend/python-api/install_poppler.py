#!/usr/bin/env python3
"""
Poppler Installation Script for Windows
Downloads and installs Poppler binaries required for pdf2image
"""

import os
import sys
import urllib.request
import zipfile
import shutil
from pathlib import Path
import platform

def download_poppler_windows():
    """Download and install Poppler binaries for Windows"""
    print("🚀 Installing Poppler for Windows")
    print("=" * 50)
    
    # Check if Windows
    if platform.system() != "Windows":
        print("❌ This script is designed for Windows only")
        print("   For other systems, please install Poppler using your package manager")
        return False
    
    # Define paths
    script_dir = Path(__file__).parent
    poppler_dir = script_dir / "poppler-windows"
    
    # Check if already installed
    if (poppler_dir / "bin").exists():
        print("✅ Poppler binaries already installed")
        print(f"   Location: {poppler_dir / 'bin'}")
        return update_env_file(str(poppler_dir / "bin"))
    
    print("📥 Downloading Poppler binaries...")
    
    # Download URL for latest Poppler Windows binaries
    # This is from @oschwartz10612's repository which provides up-to-date binaries
    poppler_url = "https://github.com/oschwartz10612/poppler-windows/releases/download/v23.08.0-0/Release-23.08.0-0.zip"
    
    try:
        # Create temp directory
        temp_dir = script_dir / "temp_poppler"
        temp_dir.mkdir(exist_ok=True)
        
        zip_path = temp_dir / "poppler.zip"
        
        # Download with progress
        print(f"   Downloading from: {poppler_url}")
        
        def report_progress(block_num, block_size, total_size):
            downloaded = block_num * block_size
            if total_size > 0:
                percent = min(downloaded / total_size * 100, 100)
                print(f"\r   Progress: {percent:.1f}% ({downloaded / 1024 / 1024:.1f} MB)", end="")
        
        urllib.request.urlretrieve(poppler_url, zip_path, report_progress)
        print()  # New line after progress
        
        print("📦 Extracting Poppler binaries...")
        
        # Extract zip file
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
        
        # Find the extracted directory (usually named poppler-XX.XX.X)
        extracted_dirs = [d for d in temp_dir.iterdir() if d.is_dir() and d.name.startswith('poppler')]
        
        if not extracted_dirs:
            print("❌ Could not find extracted Poppler directory")
            return False
        
        extracted_dir = extracted_dirs[0]
        
        # Move to permanent location
        if poppler_dir.exists():
            shutil.rmtree(poppler_dir)
        
        shutil.move(str(extracted_dir), str(poppler_dir))
        
        # Clean up temp directory
        shutil.rmtree(temp_dir)
        
        print(f"✅ Poppler installed successfully!")
        print(f"   Location: {poppler_dir}")
        
        # Update .env file
        bin_path = poppler_dir / "bin"
        if bin_path.exists():
            return update_env_file(str(bin_path))
        else:
            print("⚠️  Warning: bin directory not found in extracted files")
            return False
            
    except Exception as e:
        print(f"❌ Error downloading Poppler: {e}")
        return False

def update_env_file(poppler_bin_path):
    """Update the .env file with Poppler path"""
    print("📝 Updating .env file...")
    
    env_file = Path(__file__).parent / ".env"
    
    try:
        # Read existing .env file
        if env_file.exists():
            with open(env_file, 'r', encoding='utf-8') as f:
                content = f.read()
        else:
            content = ""
        
        # Check if POPPLER_PATH already exists
        lines = content.split('\n')
        updated = False
        
        for i, line in enumerate(lines):
            if line.startswith('POPPLER_PATH=') or line.startswith('# POPPLER_PATH='):
                lines[i] = f"POPPLER_PATH={poppler_bin_path}"
                updated = True
                break
        
        # If not found, add it
        if not updated:
            if content and not content.endswith('\n'):
                content += '\n'
            content += f"\n# Poppler Path (for PDF processing)\nPOPPLER_PATH={poppler_bin_path}\n"
        else:
            content = '\n'.join(lines)
        
        # Write back to file
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ .env file updated with POPPLER_PATH={poppler_bin_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating .env file: {e}")
        print(f"   Please manually add: POPPLER_PATH={poppler_bin_path}")
        return False

def test_poppler_installation():
    """Test if Poppler installation works"""
    print("\n🧪 Testing Poppler installation...")
    
    try:
        # Test pdf2image with Poppler
        from pdf2image import convert_from_path
        
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        poppler_path = os.getenv('POPPLER_PATH')
        print(f"   POPPLER_PATH: {poppler_path}")
        
        if poppler_path and os.path.exists(poppler_path):
            print("✅ Poppler binaries found")
            
            # Check for required executables
            required_exes = ['pdftoppm.exe', 'pdftocairo.exe']
            for exe in required_exes:
                exe_path = Path(poppler_path) / exe
                if exe_path.exists():
                    print(f"✅ {exe} found")
                else:
                    print(f"❌ {exe} not found")
            
            print("✅ Poppler installation test passed!")
            return True
        else:
            print("❌ Poppler path not found or invalid")
            return False
            
    except ImportError:
        print("❌ pdf2image not installed. Run: pip install pdf2image")
        return False
    except Exception as e:
        print(f"❌ Poppler test failed: {e}")
        return False

def main():
    """Main installation function"""
    print("🔧 CampusON Poppler Installation")
    print("=" * 60)
    print("This script will download and install Poppler binaries for PDF processing.")
    print()
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return
    
    # Install Poppler
    success = download_poppler_windows()
    
    if success:
        # Test installation
        test_success = test_poppler_installation()
        
        if test_success:
            print("\n🎉 Installation completed successfully!")
            print("\n📝 Next steps:")
            print("   1. Restart your Python application")
            print("   2. Test PDF parsing: uvicorn app.main:app --reload --port 8001")
            print("   3. Upload a PDF at: http://localhost:8001/docs")
        else:
            print("\n⚠️  Installation completed but testing failed")
            print("   Please check the installation manually")
    else:
        print("\n❌ Installation failed")
        print("   You may need to install Poppler manually:")
        print("   1. Download from: https://github.com/oschwartz10612/poppler-windows/releases")
        print("   2. Extract to a directory")
        print("   3. Add POPPLER_PATH=path/to/poppler/bin to your .env file")

if __name__ == "__main__":
    main()