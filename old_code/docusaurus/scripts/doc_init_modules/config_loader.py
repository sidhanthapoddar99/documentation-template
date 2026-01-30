"""
Configuration loader for documentation initialization
"""

import yaml
from pathlib import Path
from typing import Dict, Any


class ConfigLoader:
    """Handles loading and basic parsing of YAML configuration files."""
    
    def __init__(self, config_path: str):
        self.config_path = Path(config_path)
        
    def load(self) -> Dict[str, Any]:
        """Load and parse YAML configuration file."""
        if not self.config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
            
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            return config
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML in {self.config_path}: {e}")
    
    def load_imports_template(self, imports_path: str) -> str:
        """Load imports template file."""
        imports_path = Path(imports_path)
        
        if not imports_path.exists():
            print(f"Warning: Imports file not found: {imports_path}")
            return ""
            
        try:
            with open(imports_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except Exception as e:
            print(f"Warning: Could not read imports file: {e}")
            return ""
    
    def load_custom_imports(self, config: Dict[str, Any]) -> str:
        """Load custom imports if specified in config."""
        if 'custom_imports_file' not in config:
            return ""
            
        custom_imports_path = self.config_path.parent / config['custom_imports_file']
        
        try:
            with open(custom_imports_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except FileNotFoundError:
            print(f"Warning: Custom imports file not found: {custom_imports_path}")
            return ""