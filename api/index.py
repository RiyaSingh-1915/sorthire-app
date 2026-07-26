import sys
import os

# Add 'backend' directory to the path so that absolute imports like 'from app.config import get_settings' resolve
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app
