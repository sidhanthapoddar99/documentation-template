"""
Configuration validators for documentation initialization
"""

from typing import Dict, List, Any, Set, Tuple
from .constants import COLORS


class ConfigValidator:
    """Validates configuration structure and content."""
    
    def __init__(self):
        self.errors: List[str] = []
        
    def validate(self, config: Dict[str, Any]) -> bool:
        """Validate entire configuration."""
        print(f"{COLORS['cyan']}🔍 Validating configuration...{COLORS['reset']}")
        
        self.errors = []
        
        # Validate required fields
        if not config.get('section_name'):
            self.errors.append("Configuration must include 'section_name'")
            
        sections = config.get('sections', [])
        if not sections:
            self.errors.append("Configuration must include at least one section")
            
        # Validate each section
        for i, section in enumerate(sections):
            self._validate_section(section, i + 1, "Section")
            
        if self.errors:
            for error in self.errors:
                print(f"{COLORS['red']}❌ {error}{COLORS['reset']}")
            return False
            
        print(f"{COLORS['green']}✅ Configuration validation passed{COLORS['reset']}")
        return True
    
    def _validate_section(self, section: Dict[str, Any], index: int, context: str) -> None:
        """Validate a section or subsection."""
        section_context = f"{context} {index}"
        
        # Required fields
        if not section.get('title'):
            self.errors.append(f"{section_context} missing required 'title' field")
        if not section.get('label'):
            self.errors.append(f"{section_context} missing required 'label' field")
            
        # Validate position consistency
        self._validate_positions(section, f"{section_context} '{section.get('title', 'Unknown')}'")
        
        # Validate nested subsections
        subsections = section.get('subsections', [])
        for i, subsection in enumerate(subsections):
            self._validate_section(subsection, i + 1, f"{section_context} -> Subsection")
    
    def _validate_positions(self, section: Dict[str, Any], context: str) -> None:
        """Validate position consistency within a section."""
        files = section.get('files', [])
        subsections = section.get('subsections', [])
        
        # Create combined list of all items with their types
        all_items: List[Tuple[str, Dict[str, Any]]] = []
        all_items.extend(('file', f) for f in files)
        all_items.extend(('subsection', s) for s in subsections)
        
        # Check if any item has position
        items_with_position = [(t, item) for t, item in all_items if 'position' in item]
        
        if not items_with_position:
            return  # No positions specified, that's fine
            
        # If any item has position, all must have position
        if len(items_with_position) < len(all_items):
            self.errors.append(
                f"{context}: If any file or subsection has 'position', "
                f"ALL files and subsections must have 'position'"
            )
            return
            
        # Validate position values
        positions: List[int] = []
        for item_type, item in all_items:
            pos = item.get('position')
            if pos is None:
                continue
                
            # Check type and value
            if not isinstance(pos, int) or pos < 1:
                item_name = item.get('title', 'Unknown')
                self.errors.append(
                    f"{context}: {item_type.capitalize()} '{item_name}' "
                    f"position must be a positive integer"
                )
                continue
                
            positions.append(pos)
        
        # Check for duplicates
        if len(positions) != len(set(positions)):
            self.errors.append(f"{context}: Duplicate position values found")
            
        # Check for proper range (1 to N)
        if positions:
            expected = set(range(1, len(all_items) + 1))
            actual = set(positions)
            
            if actual != expected:
                missing = expected - actual
                extra = actual - expected
                error_msg = f"{context}: Position values must be 1-{len(all_items)}"
                
                if missing:
                    error_msg += f", missing: {sorted(missing)}"
                if extra:
                    error_msg += f", invalid: {sorted(extra)}"
                    
                self.errors.append(error_msg)