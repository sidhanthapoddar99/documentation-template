#!/usr/bin/env python3
"""
Modular Documentation Initialization Script

This script creates documentation structure from YAML configuration files
using a modular architecture that clearly distinguishes between sections
and subsections.

Usage:
    python scripts/doc-init-modular.py <yaml_config_path> <imports_template_path>

Example:
    python scripts/doc-init-modular.py scripts/doc-init/example.yaml scripts/doc-init/imports.mdx
"""

import os
import sys
import argparse
from pathlib import Path

# Add the script directory to the path to import modules
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

from doc_init_modules import (
    ConfigLoader,
    ConfigValidator,
    ContentGenerator,
    StructureBuilder,
    StructurePreview
)
from doc_init_modules.constants import DEFAULT_BASE_PATH, COLORS


class ModularDocInitializer:
    """Main orchestrator for modular documentation initialization."""
    
    def __init__(self, config_path: str, imports_path: str, base_docs_path: str = DEFAULT_BASE_PATH):
        self.config_path = config_path
        self.imports_path = imports_path
        self.base_docs_path = base_docs_path
        
        # Initialize components
        self.config_loader = ConfigLoader(config_path)
        self.validator = ConfigValidator()
        
    def run(self) -> None:
        """Execute the documentation generation process."""
        try:
            # Load configuration
            print(f"{COLORS['cyan']}Loading configuration from: {self.config_path}{COLORS['reset']}")
            config = self.config_loader.load()
            
            # Load imports
            print(f"{COLORS['cyan']}Loading imports from: {self.imports_path}{COLORS['reset']}")
            imports_template = self.config_loader.load_imports_template(self.imports_path)
            
            # Validate configuration
            if not self.validator.validate(config):
                print(f"{COLORS['red']}❌ Configuration validation failed{COLORS['reset']}")
                sys.exit(1)
                
            # Load custom imports if specified
            custom_imports = self.config_loader.load_custom_imports(config)
            
            # Preview structure
            previewer = StructurePreview(self.base_docs_path)
            if not previewer.preview_and_confirm(config):
                print(f"{COLORS['yellow']}❌ Operation cancelled.{COLORS['reset']}")
                return
                
            # Build structure
            content_generator = ContentGenerator(imports_template)
            builder = StructureBuilder(content_generator)
            builder.build_structure(config, self.base_docs_path, custom_imports)
            
        except FileNotFoundError as e:
            print(f"{COLORS['red']}❌ File not found: {e}{COLORS['reset']}")
            sys.exit(1)
        except ValueError as e:
            print(f"{COLORS['red']}❌ Configuration error: {e}{COLORS['reset']}")
            sys.exit(1)
        except Exception as e:
            print(f"{COLORS['red']}❌ Unexpected error: {e}{COLORS['reset']}")
            import traceback
            traceback.print_exc()
            sys.exit(1)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Generate documentation structure from YAML configuration (modular version)'
    )
    parser.add_argument('config_path', help='Path to YAML configuration file')
    parser.add_argument('imports_path', help='Path to imports template file')
    parser.add_argument(
        '--base-docs-path', 
        default=DEFAULT_BASE_PATH, 
        help=f'Base documentation directory (default: {DEFAULT_BASE_PATH})'
    )
    
    args = parser.parse_args()
    
    # Run the initializer
    initializer = ModularDocInitializer(
        args.config_path,
        args.imports_path,
        args.base_docs_path
    )
    initializer.run()


if __name__ == "__main__":
    main()