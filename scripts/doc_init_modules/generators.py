"""
Content generators for documentation initialization
"""

import json
from typing import Dict, Any
from .constants import SECTION_CATEGORY_TEMPLATE, SUBSECTION_CATEGORY_TEMPLATE


class FrontMatterGenerator:
    """Generates MDX front matter."""
    
    @staticmethod
    def generate(item: Dict[str, Any], position: int) -> str:
        """Generate MDX front matter for a file."""
        # Use custom position if provided, otherwise use auto-generated position
        sidebar_position = item.get('position', position)
        
        # Generate ID from title if not provided
        default_id = item['title'].lower().replace(' ', '-').replace('&', 'and')
        
        front_matter = [
            "---",
            f"id: {item.get('id', default_id)}",
            f"title: {item['title']}",
            f"description: {item.get('description', item['title'])}",
            f"sidebar_position: {sidebar_position}",
            "---"
        ]
        
        return "\n".join(front_matter)


class CategoryGenerator:
    """Generates category.json content for sections and subsections."""
    
    @staticmethod
    def generate_section_category(section: Dict[str, Any], position: int) -> str:
        """Generate category.json for a top-level section."""
        category = SECTION_CATEGORY_TEMPLATE.copy()
        category['label'] = section['label']
        category['position'] = section.get('position', position)
        
        return json.dumps(category, indent=2)
    
    @staticmethod
    def generate_subsection_category(subsection: Dict[str, Any], position: int) -> str:
        """Generate category.json for a subsection."""
        category = SUBSECTION_CATEGORY_TEMPLATE.copy()
        category['label'] = subsection['label']
        category['position'] = subsection.get('position', position)
        
        # Allow customization of collapsible settings
        
        category['collapsible'] = subsection.get('collapsible', True)
        category['collapsed'] = subsection.get('collapsed', True)
            
        return json.dumps(category, indent=2)


class ContentGenerator:
    """Generates MDX file content."""
    
    def __init__(self, imports_template: str):
        self.imports_template = imports_template
        
    def generate_mdx_content(self, item: Dict[str, Any], position: int, 
                           custom_imports: str = "") -> str:
        """Generate complete MDX file content."""
        front_matter = FrontMatterGenerator.generate(item, position)
        
        # Combine imports
        all_imports = self.imports_template
        if custom_imports:
            all_imports += "\n" + custom_imports
            
        # Build content
        content_lines = [
            front_matter,
            "",
            all_imports,
            "",
            f"# {item['title']}"
        ]
        
        # Add any initial content if specified
        if 'initial_content' in item:
            content_lines.extend(["", item['initial_content']])
            
        return "\n".join(content_lines)