"""
File operations handler for documentation initialization
"""

import os
from pathlib import Path
from typing import Optional
from .constants import PLACEHOLDER_FILENAME, PLACEHOLDER_CONTENT, COLORS


class FileHandler:
    """Handles file system operations."""
    
    @staticmethod
    def create_directory(path: str) -> None:
        """Create directory if it doesn't exist."""
        Path(path).mkdir(parents=True, exist_ok=True)
    
    @staticmethod
    def write_file(path: str, content: str, overwrite: bool = False) -> bool:
        """
        Write content to file.
        
        Returns:
            bool: True if file was written, False if skipped
        """
        if os.path.exists(path) and not overwrite:
            print(f"{COLORS['yellow']}Skipped (exists): {path}{COLORS['reset']}")
            return False
            
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"{COLORS['green']}Created: {path}{COLORS['reset']}")
        return True
    
    @staticmethod
    def create_placeholder(directory: str) -> None:
        """Create placeholder file in directory."""
        placeholder_path = os.path.join(directory, PLACEHOLDER_FILENAME)
        FileHandler.write_file(placeholder_path, PLACEHOLDER_CONTENT, overwrite=False)
    
    @staticmethod
    def sanitize_filename(title: str) -> str:
        """Convert title to valid filename."""
        return title.lower().replace(' ', '-').replace('&', 'and')
    
    @staticmethod
    def generate_numbered_name(index: int, title: str, extension: str = "") -> str:
        """Generate numbered filename or directory name."""
        sanitized = FileHandler.sanitize_filename(title)
        name = f"{index:02d}-{sanitized}"
        if extension:
            name += extension
        return name