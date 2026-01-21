"""
Constants for documentation initialization
"""

# Category.json templates for different types
SECTION_CATEGORY_TEMPLATE = {
    "label": "",
    "position": 1,
    "className": "sidebar-header",
    "collapsible": False
}

SUBSECTION_CATEGORY_TEMPLATE = {
    "label": "",
    "position": 1,
    "collapsible": True,
    "collapsed": True
}

# Default values
DEFAULT_BASE_PATH = "docs"
PLACEHOLDER_FILENAME = "__placeholder__"
PLACEHOLDER_CONTENT = """# Placeholder file for version control
# This file ensures the assets directory is tracked by git
# You can delete this file once you add actual assets"""

# ANSI color codes for terminal output
COLORS = {
    'reset': '\x1b[0m',
    'bright': '\x1b[1m',
    'dim': '\x1b[2m',
    'red': '\x1b[31m',
    'green': '\x1b[32m',
    'yellow': '\x1b[33m',
    'blue': '\x1b[34m',
    'cyan': '\x1b[36m',
    'white': '\x1b[37m'
}