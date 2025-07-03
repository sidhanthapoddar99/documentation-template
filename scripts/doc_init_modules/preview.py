"""
Structure preview for documentation initialization
"""

import os
from typing import Dict, List, Any, Tuple
from .file_handler import FileHandler
from .constants import COLORS


class StructurePreview:
    """Previews the documentation structure before creation."""
    
    def __init__(self, base_path: str):
        self.base_path = base_path
        self.file_handler = FileHandler()
        
    def preview_and_confirm(self, config: Dict[str, Any]) -> bool:
        """
        Preview structure and ask for confirmation.
        
        Returns:
            bool: True if user confirms, False otherwise
        """
        print(f"\n{COLORS['cyan']}📋 Structure Preview:{COLORS['reset']}")
        print("=" * 50)
        
        section_name = config['section_name']
        section_path = os.path.join(self.base_path, section_name)
        
        # Preview main section
        self._print_item("📂", section_name + "/", os.path.exists(section_path), "")
        
        # Preview sections
        sections = self._get_sorted_items(config.get('sections', []))
        for i, section in enumerate(sections, 1):
            self._preview_section(section, i, section_path, "  ")
            
        print("=" * 50)
        print(f"Legend: {COLORS['green']}Green = New files/folders{COLORS['reset']}, Normal = Existing")
        print("Note: Existing MDX files will be preserved, category.json files will be updated")
        
        # Ask for confirmation
        try:
            response = input("\nProceed with creating this structure? (y/N): ").strip().lower()
            return response in ('y', 'yes')
        except EOFError:
            # Running non-interactively, check for environment variable
            if os.environ.get('DOC_INIT_AUTO_CONFIRM') == 'yes':
                print("Auto-confirmed via DOC_INIT_AUTO_CONFIRM=yes")
                return True
            print("Running non-interactively. Set DOC_INIT_AUTO_CONFIRM=yes to auto-confirm.")
            return False
    
    def _preview_section(self, section: Dict[str, Any], index: int,
                        parent_path: str, indent: str) -> None:
        """Preview a section and its contents."""
        section_dir = self.file_handler.generate_numbered_name(index, section['title'])
        section_path = os.path.join(parent_path, section_dir)
        
        # Section directory
        self._print_item("📂", section_dir + "/", os.path.exists(section_path), indent)
        
        # Category file
        category_path = os.path.join(section_path, "_category_.json")
        if os.path.exists(category_path):
            self._print_item("📄", "_category_.json", True, indent + "  ", " (will be updated)")
        else:
            self._print_item("📄", "_category_.json", False, indent + "  ")
            
        # Preview content
        self._preview_content(section, section_path, indent + "  ")
        
        # Section assets
        if section.get('create_assets', False):
            self._preview_assets(section_path, indent + "  ")
    
    def _preview_content(self, container: Dict[str, Any], container_path: str,
                        indent: str) -> None:
        """Preview content (files and subsections) within a container."""
        files = container.get('files', [])
        subsections = container.get('subsections', [])
        
        # Create combined list of all items
        all_items: List[Tuple[str, Dict[str, Any]]] = []
        all_items.extend(('file', f) for f in files)
        all_items.extend(('subsection', s) for s in subsections)
        
        # Sort by position if specified
        if any(item[1].get('position') for item in all_items):
            all_items.sort(key=lambda x: x[1]['position'])
            
        # Preview items in order
        for i, (item_type, item) in enumerate(all_items, 1):
            if item_type == 'file':
                self._preview_file(item, i, container_path, indent)
            else:  # subsection
                self._preview_subsection(item, i, container_path, indent)
    
    def _preview_file(self, file_item: Dict[str, Any], index: int,
                     parent_path: str, indent: str) -> None:
        """Preview a single file."""
        filename = self.file_handler.generate_numbered_name(index, file_item['title'], '.mdx')
        file_path = os.path.join(parent_path, filename)
        
        self._print_item("📄", filename, os.path.exists(file_path), indent)
        
        # File assets
        if file_item.get('create_assets', False):
            file_basename = filename.replace('.mdx', '')
            assets_path = os.path.join(parent_path, "assets", file_basename)
            self._print_item("📂", f"assets/{file_basename}/", 
                           os.path.exists(assets_path), indent + "  ")
            
            placeholder_path = os.path.join(assets_path, "__placeholder__")
            self._print_item("📄", "__placeholder__", 
                           os.path.exists(placeholder_path), indent + "    ")
    
    def _preview_subsection(self, subsection: Dict[str, Any], index: int,
                           parent_path: str, indent: str) -> None:
        """Preview a subsection and its contents."""
        subsection_dir = self.file_handler.generate_numbered_name(index, subsection['title'])
        subsection_path = os.path.join(parent_path, subsection_dir)
        
        # Subsection directory
        self._print_item("📂", subsection_dir + "/", os.path.exists(subsection_path), indent)
        
        # Category file
        category_path = os.path.join(subsection_path, "_category_.json")
        if os.path.exists(category_path):
            self._print_item("📄", "_category_.json", True, indent + "  ", " (will be updated)")
        else:
            self._print_item("📄", "_category_.json", False, indent + "  ")
            
        # Preview nested content
        self._preview_content(subsection, subsection_path, indent + "  ")
        
        # Subsection assets
        if subsection.get('create_assets', False):
            self._preview_assets(subsection_path, indent + "  ")
    
    def _preview_assets(self, parent_path: str, indent: str) -> None:
        """Preview assets folder."""
        assets_path = os.path.join(parent_path, "assets")
        self._print_item("📂", "assets/", os.path.exists(assets_path), indent)
        
        placeholder_path = os.path.join(assets_path, "__placeholder__")
        self._print_item("📄", "__placeholder__", 
                       os.path.exists(placeholder_path), indent + "  ")
    
    def _print_item(self, icon: str, name: str, exists: bool, 
                   indent: str, suffix: str = "") -> None:
        """Print a single item in the preview."""
        if exists:
            print(f"{indent}{icon} {name}{suffix}")
        else:
            print(f"{indent}{icon} {COLORS['green']}{name}{COLORS['reset']} (new){suffix}")
    
    def _get_sorted_items(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Sort items by position if any have positions."""
        if any('position' in item for item in items):
            return sorted(items, key=lambda x: x['position'])
        return items