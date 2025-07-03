#!/usr/bin/env python3
"""
Documentation Initialization Script

This script creates documentation structure from YAML configuration files.
It generates numbered folders, MDX files with proper front matter, category configurations,
and asset folders following the established documentation patterns.

Usage:
    python scripts/doc-init.py <yaml_config_path> <imports_template_path>

Example:
    python scripts/doc-init.py scripts/doc-init/example.yaml scripts/doc-init/imports.mdx
"""

import os
import sys
import yaml
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional

class DocInitializer:
    def __init__(self, config_path: str, imports_path: str, base_docs_path: str = "docs"):
        self.config_path = config_path
        self.imports_path = imports_path  
        self.base_docs_path = base_docs_path
        self.config = self._load_config()
        self._validate_config()
        self.imports_template = self._load_imports()
        
    def _load_config(self) -> Dict[str, Any]:
        """Load and validate YAML configuration."""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            return config
        except FileNotFoundError:
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML in {self.config_path}: {e}")
    
    def _load_imports(self) -> str:
        """Load imports template."""
        try:
            with open(self.imports_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except FileNotFoundError:
            print(f"Warning: Imports file not found: {self.imports_path}")
            return ""
    
    def _validate_config(self) -> None:
        """Validate configuration format and position requirements."""
        print("🔍 Validating configuration...")
        
        if not self.config.get('section_name'):
            raise ValueError("Configuration must include 'section_name'")
        
        sections = self.config.get('sections', [])
        if not sections:
            raise ValueError("Configuration must include at least one section")
        
        for i, section in enumerate(sections):
            if not section.get('title'):
                raise ValueError(f"Section {i+1} missing required 'title' field")
            if not section.get('label'):
                raise ValueError(f"Section {i+1} missing required 'label' field")
            
            # Check position consistency within section
            self._validate_section_positions(section, f"Section '{section['title']}'")
        
        print("✅ Configuration validation passed")
    
    def _validate_section_positions(self, section: Dict[str, Any], context: str) -> None:
        """Validate position consistency within a section."""
        files = section.get('files', [])
        subsections = section.get('subsections', [])
        
        # Check if any item has position - if so, all must have position
        files_with_position = [f for f in files if 'position' in f]
        subsections_with_position = [s for s in subsections if 'position' in s]
        
        total_items = len(files) + len(subsections)
        items_with_position = len(files_with_position) + len(subsections_with_position)
        
        if items_with_position > 0 and items_with_position < total_items:
            raise ValueError(f"{context}: If any file or subsection has 'position', ALL files and subsections must have 'position'")
        
        # If positions are used, check for duplicates and validate range
        if items_with_position > 0:
            all_positions = []
            
            for file_item in files:
                pos = file_item.get('position')
                if pos is not None:
                    if not isinstance(pos, int) or pos < 1:
                        raise ValueError(f"{context}: File '{file_item['title']}' position must be a positive integer")
                    all_positions.append(pos)
            
            for subsection in subsections:
                pos = subsection.get('position')
                if pos is not None:
                    if not isinstance(pos, int) or pos < 1:
                        raise ValueError(f"{context}: Subsection '{subsection['title']}' position must be a positive integer")
                    all_positions.append(pos)
            
            # Check for duplicates
            if len(all_positions) != len(set(all_positions)):
                raise ValueError(f"{context}: Duplicate position values found. Each position must be unique")
            
            # Check for proper range (1 to total_items)
            expected_positions = set(range(1, total_items + 1))
            actual_positions = set(all_positions)
            if actual_positions != expected_positions:
                missing = expected_positions - actual_positions
                extra = actual_positions - expected_positions
                error_msg = f"{context}: Position values must be 1-{total_items}"
                if missing:
                    error_msg += f", missing: {sorted(missing)}"
                if extra:
                    error_msg += f", invalid: {sorted(extra)}"
                raise ValueError(error_msg)
        
        # Validate subsection positions recursively
        for subsection in subsections:
            self._validate_subsection_positions_recursive(subsection, f"{context} -> Subsection '{subsection['title']}'")
    
    def _validate_subsection_positions_recursive(self, subsection: Dict[str, Any], context: str) -> None:
        """Recursively validate positions within a subsection and its nested subsections."""
        sub_files = subsection.get('files', [])
        nested_subsections = subsection.get('subsections', [])
        
        # Check position consistency within this subsection
        sub_files_with_position = [f for f in sub_files if 'position' in f]
        nested_subsections_with_position = [s for s in nested_subsections if 'position' in s]
        
        total_items = len(sub_files) + len(nested_subsections)
        items_with_position = len(sub_files_with_position) + len(nested_subsections_with_position)
        
        if items_with_position > 0 and items_with_position < total_items:
            raise ValueError(f"{context}: If any file or nested subsection has 'position', ALL files and nested subsections must have 'position'")
        
        # If positions are used, check for duplicates and validate range
        if items_with_position > 0:
            all_positions = []
            
            for file_item in sub_files:
                pos = file_item.get('position')
                if pos is not None:
                    if not isinstance(pos, int) or pos < 1:
                        raise ValueError(f"{context}: File '{file_item['title']}' position must be a positive integer")
                    all_positions.append(pos)
            
            for nested_subsection in nested_subsections:
                pos = nested_subsection.get('position')
                if pos is not None:
                    if not isinstance(pos, int) or pos < 1:
                        raise ValueError(f"{context}: Nested subsection '{nested_subsection['title']}' position must be a positive integer")
                    all_positions.append(pos)
            
            # Check for duplicates
            if len(all_positions) != len(set(all_positions)):
                raise ValueError(f"{context}: Duplicate position values found. Each position must be unique")
            
            # Check for proper range (1 to total_items)
            if total_items > 0:
                expected_positions = set(range(1, total_items + 1))
                actual_positions = set(all_positions)
                if actual_positions != expected_positions:
                    missing = expected_positions - actual_positions
                    extra = actual_positions - expected_positions
                    error_msg = f"{context}: Position values must be 1-{total_items}"
                    if missing:
                        error_msg += f", missing: {sorted(missing)}"
                    if extra:
                        error_msg += f", invalid: {sorted(extra)}"
                    raise ValueError(error_msg)
        
        # Recursively validate nested subsections
        for nested_subsection in nested_subsections:
            self._validate_subsection_positions_recursive(nested_subsection, f"{context} -> Subsection '{nested_subsection['title']}'")
    
    def _create_directory(self, path: str) -> None:
        """Create directory if it doesn't exist."""
        Path(path).mkdir(parents=True, exist_ok=True)
        
    def _write_file(self, path: str, content: str, overwrite: bool = False) -> None:
        """Write content to file, optionally skipping if file exists."""
        if os.path.exists(path) and not overwrite:
            print(f"Skipped (exists): {path}")
            return
            
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Created: {path}")
    
    def _generate_front_matter(self, item: Dict[str, Any], position: int) -> str:
        """Generate MDX front matter."""
        # Use custom position if provided, otherwise use auto-generated position
        sidebar_position = item.get('position', position)
        
        front_matter = [
            "---",
            f"id: {item.get('id', item['title'].lower().replace(' ', '-').replace('&', 'and'))}", 
            f"title: {item['title']}",
            f"description: {item.get('description', item['title'])}",
            f"sidebar_position: {sidebar_position}",
            "---"
        ]
        return "\n".join(front_matter)
    
    def _generate_category_json(self, section: Dict[str, Any], position: int) -> str:
        """Generate _category_.json content."""
        # Use custom position if provided, otherwise use auto-generated position
        category_position = section.get('position', position)
        
        category = {
            "label": section['label'],
            "position": category_position,
            "className": "sidebar-header",
            "collapsible": False
        }
        return json.dumps(category, indent=2)
    
    def _create_placeholder_file(self, assets_path: str) -> None:
        """Create placeholder file in assets directory."""
        placeholder_path = os.path.join(assets_path, "__placeholder__")
        self._write_file(placeholder_path, "# Placeholder file for version control\n# This file ensures the assets directory is tracked by git\n# You can delete this file once you add actual assets", overwrite=False)
    
    def _generate_mdx_content(self, item: Dict[str, Any], position: int, custom_imports: str = "") -> str:
        """Generate complete MDX file content."""
        front_matter = self._generate_front_matter(item, position)
        
        # Combine default imports with custom imports
        all_imports = self.imports_template
        if custom_imports:
            all_imports += "\n" + custom_imports
            
        # Basic content structure
        content_lines = [
            front_matter,
            "",
            all_imports,
            "",
            f"# {item['title']}"
        ]
            
        return "\n".join(content_lines)
    
    
    def _process_files(self, base_path: str, files: List[Dict[str, Any]], custom_imports: str = "") -> None:
        """Process individual files within a section."""
        # Sort files by position if any have positions, otherwise use original order
        if any('position' in f for f in files):
            sorted_files = sorted(files, key=lambda f: f['position'])
        else:
            sorted_files = files
            
        for i, file_item in enumerate(sorted_files, 1):
            # Generate filename with original numbering for consistency
            filename = f"{i:02d}-{file_item['title'].lower().replace(' ', '-').replace('&', 'and')}.mdx"
            file_path = os.path.join(base_path, filename)
            
            # Generate and write MDX content (position will be handled in front matter)
            mdx_content = self._generate_mdx_content(file_item, i, custom_imports)
            self._write_file(file_path, mdx_content, overwrite=False)
            
            # Create file-specific assets folder if specified
            if file_item.get('create_assets', False):
                file_basename = filename.replace('.mdx', '')
                assets_path = os.path.join(base_path, "assets", file_basename)
                self._create_directory(assets_path)
                self._create_placeholder_file(assets_path)
    
    def _process_subsection_content(self, subsection_path: str, subsection: Dict[str, Any], custom_imports: str = "") -> None:
        """Process content within a subsection (files and nested subsections)."""
        files = subsection.get('files', [])
        nested_subsections = subsection.get('subsections', [])
        
        # Create a combined list for processing order
        # Default order: files first, then nested subsections
        all_items = []
        for file_item in files:
            all_items.append(('file', file_item))
        for nested_subsection in nested_subsections:
            all_items.append(('subsection', nested_subsection))
        
        # Sort by position if any items have position
        if any(item[1].get('position') for item in all_items):
            all_items.sort(key=lambda x: x[1]['position'])
        # If no positions specified, files come first (already in correct order)
        
        # Process items in order - use single counter for both files and nested subsections
        counter = 1
        
        for item_type, item in all_items:
            if item_type == 'file':
                # Process single file
                filename = f"{counter:02d}-{item['title'].lower().replace(' ', '-').replace('&', 'and')}.mdx"
                file_path = os.path.join(subsection_path, filename)
                mdx_content = self._generate_mdx_content(item, counter, custom_imports)
                self._write_file(file_path, mdx_content, overwrite=False)
                
                # Create file-specific assets folder if specified
                if item.get('create_assets', False):
                    file_basename = filename.replace('.mdx', '')
                    assets_path = os.path.join(subsection_path, "assets", file_basename)
                    self._create_directory(assets_path)
                    self._create_placeholder_file(assets_path)
                
            elif item_type == 'subsection':
                # Process nested subsection
                nested_subsection_dir = f"{counter:02d}-{item['title'].lower().replace(' ', '-').replace('&', 'and')}"
                nested_subsection_path = os.path.join(subsection_path, nested_subsection_dir)
                self._create_directory(nested_subsection_path)
                
                # Create _category_.json for nested subsection
                category_content = self._generate_category_json(item, counter)
                category_path = os.path.join(nested_subsection_path, "_category_.json")
                self._write_file(category_path, category_content, overwrite=True)
                
                # Process nested subsection content recursively
                self._process_subsection_content(nested_subsection_path, item, custom_imports)
                    
                # Create assets folder if specified
                if item.get('create_assets', False):
                    assets_path = os.path.join(nested_subsection_path, "assets")
                    self._create_directory(assets_path)
                    self._create_placeholder_file(assets_path)
            
            counter += 1
    
    def _preview_structure(self) -> None:
        """Preview what files and folders will be created."""
        print("\n📋 Structure Preview:")
        print("=" * 50)
        
        section_name = self.config.get('section_name')
        section_path = os.path.join(self.base_docs_path, section_name)
        
        # Check if main section exists
        if os.path.exists(section_path):
            print(f"📂 {section_name}/")
        else:
            print(f"📂 \033[92m{section_name}/\033[0m  (new)")
        
        sections = self.config.get('sections', [])
        for i, section in enumerate(sections, 1):
            section_dir = f"{i:02d}-{section['title'].lower().replace(' ', '-').replace('&', 'and')}"
            section_full_path = os.path.join(section_path, section_dir)
            
            # Check section directory
            if os.path.exists(section_full_path):
                print(f"  📂 {section_dir}/")
            else:
                print(f"  📂 \033[92m{section_dir}/\033[0m  (new)")
            
            # Check _category_.json
            category_path = os.path.join(section_full_path, "_category_.json")
            if os.path.exists(category_path):
                print(f"    📄 _category_.json  (will be updated)")
            else:
                print(f"    📄 \033[92m_category_.json\033[0m  (new)")
            
            # Check files in section
            if 'files' in section:
                for j, file_item in enumerate(section['files'], 1):
                    filename = f"{j:02d}-{file_item['title'].lower().replace(' ', '-').replace('&', 'and')}.mdx"
                    file_path = os.path.join(section_full_path, filename)
                    
                    if os.path.exists(file_path):
                        print(f"    📄 {filename}")
                    else:
                        print(f"    📄 \033[92m{filename}\033[0m  (new)")
                    
                    # Check file-specific assets
                    if file_item.get('create_assets', False):
                        file_basename = filename.replace('.mdx', '')
                        assets_path = os.path.join(section_full_path, "assets", file_basename)
                        if os.path.exists(assets_path):
                            print(f"      📂 assets/{file_basename}/")
                        else:
                            print(f"      📂 \033[92massets/{file_basename}/\033[0m  (new)")
                        
                        placeholder_path = os.path.join(assets_path, "__placeholder__")
                        if os.path.exists(placeholder_path):
                            print(f"        📄 __placeholder__")
                        else:
                            print(f"        📄 \033[92m__placeholder__\033[0m  (new)")
            
            # Check subsections
            if 'subsections' in section:
                self._preview_subsections(section_full_path, section['subsections'], "    ")
            
            # Check section-level assets
            if section.get('create_assets', False):
                assets_path = os.path.join(section_full_path, "assets")
                if os.path.exists(assets_path):
                    print(f"    📂 assets/")
                else:
                    print(f"    📂 \033[92massets/\033[0m  (new)")
                
                placeholder_path = os.path.join(assets_path, "__placeholder__")
                if os.path.exists(placeholder_path):
                    print(f"      📄 __placeholder__")
                else:
                    print(f"      📄 \033[92m__placeholder__\033[0m  (new)")
        
        print("=" * 50)
        print("Legend: \033[92mGreen = New files/folders\033[0m, Normal = Existing")
        print("Note: Existing MDX files will be preserved, category.json files will be updated")
        
        # Ask for confirmation
        response = input("\nProceed with creating this structure? (y/N): ").strip().lower()
        if response != 'y' and response != 'yes':
            print("❌ Operation cancelled.")
            return False
        return True
    
    def _preview_subsections(self, parent_path: str, subsections: List[Dict[str, Any]], indent: str) -> None:
        """Recursively preview subsections and their content."""
        for k, subsection in enumerate(subsections, 1):
            sub_dir = f"{k:02d}-{subsection['title'].lower().replace(' ', '-').replace('&', 'and')}"
            sub_path = os.path.join(parent_path, sub_dir)
            
            if os.path.exists(sub_path):
                print(f"{indent}📂 {sub_dir}/")
            else:
                print(f"{indent}📂 \033[92m{sub_dir}/\033[0m  (new)")
            
            # Subsection category.json
            sub_category_path = os.path.join(sub_path, "_category_.json")
            if os.path.exists(sub_category_path):
                print(f"{indent}  📄 _category_.json  (will be updated)")
            else:
                print(f"{indent}  📄 \033[92m_category_.json\033[0m  (new)")
            
            # Preview subsection content using the same logic as actual processing
            self._preview_subsection_content(sub_path, subsection, indent + "  ")
            
            # Check subsection-level assets
            if subsection.get('create_assets', False):
                assets_path = os.path.join(sub_path, "assets")
                if os.path.exists(assets_path):
                    print(f"{indent}  📂 assets/")
                else:
                    print(f"{indent}  📂 \033[92massets/\033[0m  (new)")
                
                placeholder_path = os.path.join(assets_path, "__placeholder__")
                if os.path.exists(placeholder_path):
                    print(f"{indent}    📄 __placeholder__")
                else:
                    print(f"{indent}    📄 \033[92m__placeholder__\033[0m  (new)")
    
    def _preview_subsection_content(self, subsection_path: str, subsection: Dict[str, Any], indent: str) -> None:
        """Preview content within a subsection using same logic as processing."""
        files = subsection.get('files', [])
        nested_subsections = subsection.get('subsections', [])
        
        # Create a combined list for processing order
        # Default order: files first, then nested subsections
        all_items = []
        for file_item in files:
            all_items.append(('file', file_item))
        for nested_subsection in nested_subsections:
            all_items.append(('subsection', nested_subsection))
        
        # Sort by position if any items have position
        if any(item[1].get('position') for item in all_items):
            all_items.sort(key=lambda x: x[1]['position'])
        # If no positions specified, files come first (already in correct order)
        
        # Preview items in order - use single counter for both files and nested subsections
        counter = 1
        
        for item_type, item in all_items:
            if item_type == 'file':
                # Preview file
                filename = f"{counter:02d}-{item['title'].lower().replace(' ', '-').replace('&', 'and')}.mdx"
                file_path = os.path.join(subsection_path, filename)
                
                if os.path.exists(file_path):
                    print(f"{indent}📄 {filename}")
                else:
                    print(f"{indent}📄 \033[92m{filename}\033[0m  (new)")
                
                # Check file-specific assets
                if item.get('create_assets', False):
                    file_basename = filename.replace('.mdx', '')
                    assets_path = os.path.join(subsection_path, "assets", file_basename)
                    if os.path.exists(assets_path):
                        print(f"{indent}  📂 assets/{file_basename}/")
                    else:
                        print(f"{indent}  📂 \033[92massets/{file_basename}/\033[0m  (new)")
                    
                    placeholder_path = os.path.join(assets_path, "__placeholder__")
                    if os.path.exists(placeholder_path):
                        print(f"{indent}    📄 __placeholder__")
                    else:
                        print(f"{indent}    📄 \033[92m__placeholder__\033[0m  (new)")
                
            elif item_type == 'subsection':
                # Preview nested subsection
                nested_subsection_dir = f"{counter:02d}-{item['title'].lower().replace(' ', '-').replace('&', 'and')}"
                nested_subsection_path = os.path.join(subsection_path, nested_subsection_dir)
                
                if os.path.exists(nested_subsection_path):
                    print(f"{indent}📂 {nested_subsection_dir}/")
                else:
                    print(f"{indent}📂 \033[92m{nested_subsection_dir}/\033[0m  (new)")
                
                # Nested subsection category.json
                category_path = os.path.join(nested_subsection_path, "_category_.json")
                if os.path.exists(category_path):
                    print(f"{indent}  📄 _category_.json  (will be updated)")
                else:
                    print(f"{indent}  📄 \033[92m_category_.json\033[0m  (new)")
                
                # Recursively preview nested subsection content
                self._preview_subsection_content(nested_subsection_path, item, indent + "  ")
                
                # Check nested subsection assets
                if item.get('create_assets', False):
                    assets_path = os.path.join(nested_subsection_path, "assets")
                    if os.path.exists(assets_path):
                        print(f"{indent}  📂 assets/")
                    else:
                        print(f"{indent}  📂 \033[92massets/\033[0m  (new)")
                    
                    placeholder_path = os.path.join(assets_path, "__placeholder__")
                    if os.path.exists(placeholder_path):
                        print(f"{indent}    📄 __placeholder__")
                    else:
                        print(f"{indent}    📄 \033[92m__placeholder__\033[0m  (new)")
            
            counter += 1

    def generate_documentation(self) -> None:
        """Main method to generate documentation structure."""
        print(f"Generating documentation from: {self.config_path}")
        print(f"Using imports from: {self.imports_path}")
        print(f"Target directory: {self.base_docs_path}")
        
        # Get the main section configuration
        section_name = self.config.get('section_name')
        if not section_name:
            raise ValueError("Configuration must include 'section_name'")
        
        # Preview structure and get confirmation
        if not self._preview_structure():
            return
            
        print("\n🚀 Creating documentation structure...")
        
        # Create main section directory
        section_path = os.path.join(self.base_docs_path, section_name)
        self._create_directory(section_path)
        
        # Load custom imports if specified
        custom_imports = ""
        if 'custom_imports_file' in self.config:
            custom_imports_path = os.path.join(os.path.dirname(self.config_path), self.config['custom_imports_file'])
            try:
                with open(custom_imports_path, 'r', encoding='utf-8') as f:
                    custom_imports = f.read().strip()
            except FileNotFoundError:
                print(f"Warning: Custom imports file not found: {custom_imports_path}")
        
        # Process main sections
        sections = self.config.get('sections', [])
        
        # Sort sections by position if any have positions, otherwise use original order
        if any('position' in s for s in sections):
            sorted_sections = sorted(sections, key=lambda s: s['position'])
        else:
            sorted_sections = sections
            
        for i, section in enumerate(sorted_sections, 1):
            # Create numbered section directory
            section_dir = f"{i:02d}-{section['title'].lower().replace(' ', '-').replace('&', 'and')}"
            section_full_path = os.path.join(section_path, section_dir)
            self._create_directory(section_full_path)
            
            # Create _category_.json (position will be handled in the method)
            category_content = self._generate_category_json(section, i)
            category_path = os.path.join(section_full_path, "_category_.json")
            self._write_file(category_path, category_content, overwrite=True)
            
            # Process files and subsections in mixed order based on position
            files = section.get('files', [])
            subsections = section.get('subsections', [])
            
            # Create a combined list for processing order
            # Default order: files first, then subsections
            all_items = []
            for file_item in files:
                all_items.append(('file', file_item))
            for subsection in subsections:
                all_items.append(('subsection', subsection))
            
            # Sort by position if any items have position
            if any(item[1].get('position') for item in all_items):
                all_items.sort(key=lambda x: x[1]['position'])
            # If no positions specified, files come first (already in correct order)
            
            # Process items in order - use single counter for both files and subsections
            counter = 1
            
            for item_type, item in all_items:
                if item_type == 'file':
                    # Process single file
                    filename = f"{counter:02d}-{item['title'].lower().replace(' ', '-').replace('&', 'and')}.mdx"
                    file_path = os.path.join(section_full_path, filename)
                    mdx_content = self._generate_mdx_content(item, counter, custom_imports)
                    self._write_file(file_path, mdx_content, overwrite=False)
                    
                    # Create file-specific assets folder if specified
                    if item.get('create_assets', False):
                        file_basename = filename.replace('.mdx', '')
                        assets_path = os.path.join(section_full_path, "assets", file_basename)
                        self._create_directory(assets_path)
                        self._create_placeholder_file(assets_path)
                    
                elif item_type == 'subsection':
                    # Process subsection
                    subsection_dir = f"{counter:02d}-{item['title'].lower().replace(' ', '-').replace('&', 'and')}"
                    subsection_path = os.path.join(section_full_path, subsection_dir)
                    self._create_directory(subsection_path)
                    
                    # Create _category_.json for subsection
                    category_content = self._generate_category_json(item, counter)
                    category_path = os.path.join(subsection_path, "_category_.json")
                    self._write_file(category_path, category_content, overwrite=True)
                    
                    # Process subsection content recursively
                    self._process_subsection_content(subsection_path, item, custom_imports)
                        
                    # Create assets folder if specified
                    if item.get('create_assets', False):
                        assets_path = os.path.join(subsection_path, "assets")
                        self._create_directory(assets_path)
                        self._create_placeholder_file(assets_path)
                
                counter += 1
            
            # Create section-level assets folder if specified
            if section.get('create_assets', False):
                assets_path = os.path.join(section_full_path, "assets")
                self._create_directory(assets_path)
                self._create_placeholder_file(assets_path)
        
        
        print(f"\n✅ Documentation structure created successfully in {section_path}")
    

def main():
    parser = argparse.ArgumentParser(description='Generate documentation structure from YAML configuration')
    parser.add_argument('config_path', help='Path to YAML configuration file')
    parser.add_argument('imports_path', help='Path to imports template file')
    parser.add_argument('--base-docs-path', default='docs', help='Base documentation directory (default: docs)')
    
    args = parser.parse_args()
    
    try:
        initializer = DocInitializer(args.config_path, args.imports_path, args.base_docs_path)
        initializer.generate_documentation()
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()