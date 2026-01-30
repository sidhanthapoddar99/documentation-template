"""
Structure builder for documentation initialization
"""

import os
from typing import Dict, List, Any, Tuple
from .file_handler import FileHandler
from .generators import CategoryGenerator, ContentGenerator
from .constants import COLORS


class StructureBuilder:
    """Builds the documentation file structure."""
    
    def __init__(self, content_generator: ContentGenerator):
        self.content_generator = content_generator
        self.file_handler = FileHandler()
        
    def build_structure(self, config: Dict[str, Any], base_path: str, 
                       custom_imports: str = "") -> None:
        """Build the complete documentation structure."""
        print(f"\n{COLORS['cyan']}🚀 Creating documentation structure...{COLORS['reset']}")
        
        section_name = config['section_name']
        section_path = os.path.join(base_path, section_name)
        self.file_handler.create_directory(section_path)
        
        # Process sections
        sections = self._get_sorted_items(config.get('sections', []))
        
        for i, section in enumerate(sections, 1):
            self._build_section(section, i, section_path, custom_imports)
            
        print(f"\n{COLORS['green']}✅ Documentation structure created successfully in {section_path}{COLORS['reset']}")
    
    def _build_section(self, section: Dict[str, Any], index: int, 
                      parent_path: str, custom_imports: str) -> None:
        """Build a top-level section."""
        # Create section directory
        section_dir = self.file_handler.generate_numbered_name(index, section['title'])
        section_path = os.path.join(parent_path, section_dir)
        self.file_handler.create_directory(section_path)
        
        # Create section category.json
        category_content = CategoryGenerator.generate_section_category(section, index)
        category_path = os.path.join(section_path, "_category_.json")
        self.file_handler.write_file(category_path, category_content, overwrite=True)
        
        # Process section content
        self._build_content(section, section_path, custom_imports, is_section=True)
        
        # Create section-level assets if specified
        if section.get('create_assets', False):
            self._create_assets_folder(section_path)
    
    def _build_subsection(self, subsection: Dict[str, Any], index: int,
                         parent_path: str, custom_imports: str) -> None:
        """Build a subsection (can be nested)."""
        # Create subsection directory
        subsection_dir = self.file_handler.generate_numbered_name(index, subsection['title'])
        subsection_path = os.path.join(parent_path, subsection_dir)
        self.file_handler.create_directory(subsection_path)
        
        # Create subsection category.json
        category_content = CategoryGenerator.generate_subsection_category(subsection, index)
        category_path = os.path.join(subsection_path, "_category_.json")
        self.file_handler.write_file(category_path, category_content, overwrite=True)
        
        # Process subsection content
        self._build_content(subsection, subsection_path, custom_imports, is_section=False)
        
        # Create subsection-level assets if specified
        if subsection.get('create_assets', False):
            self._create_assets_folder(subsection_path)
    
    def _build_content(self, container: Dict[str, Any], container_path: str,
                      custom_imports: str, is_section: bool) -> None:
        """Build content (files and subsections) within a container."""
        files = container.get('files', [])
        subsections = container.get('subsections', [])
        
        # Create combined list of all items
        all_items: List[Tuple[str, Dict[str, Any]]] = []
        all_items.extend(('file', f) for f in files)
        all_items.extend(('subsection', s) for s in subsections)
        
        # Sort by position if specified
        if any(item[1].get('position') for item in all_items):
            all_items.sort(key=lambda x: x[1]['position'])
            
        # Process items in order
        for i, (item_type, item) in enumerate(all_items, 1):
            if item_type == 'file':
                self._build_file(item, i, container_path, custom_imports)
            else:  # subsection
                self._build_subsection(item, i, container_path, custom_imports)
    
    def _build_file(self, file_item: Dict[str, Any], index: int,
                   parent_path: str, custom_imports: str) -> None:
        """Build a single MDX file."""
        filename = self.file_handler.generate_numbered_name(index, file_item['title'], '.mdx')
        file_path = os.path.join(parent_path, filename)
        
        # Generate content
        content = self.content_generator.generate_mdx_content(file_item, index, custom_imports)
        self.file_handler.write_file(file_path, content, overwrite=False)
        
        # Create file-specific assets if specified
        if file_item.get('create_assets', False):
            file_basename = filename.replace('.mdx', '')
            assets_path = os.path.join(parent_path, "assets", file_basename)
            self.file_handler.create_directory(assets_path)
            self.file_handler.create_placeholder(assets_path)
    
    def _create_assets_folder(self, parent_path: str) -> None:
        """Create assets folder with placeholder."""
        assets_path = os.path.join(parent_path, "assets")
        self.file_handler.create_directory(assets_path)
        self.file_handler.create_placeholder(assets_path)
    
    def _get_sorted_items(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Sort items by position if any have positions."""
        if any('position' in item for item in items):
            return sorted(items, key=lambda x: x['position'])
        return items