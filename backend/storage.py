import json
import os
from datetime import datetime
from typing import List, Optional
from pathlib import Path

STORIES_DIR = Path("saved_stories")

class StoryStorage:
    def __init__(self):
        # Create stories directory if it doesn't exist
        STORIES_DIR.mkdir(exist_ok=True)
    
    def save_story(self, story_id: str, story_data: dict) -> bool:
        """Save a story to disk"""
        try:
            story_data['updated_at'] = datetime.now().isoformat()
            file_path = STORIES_DIR / f"{story_id}.json"
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(story_data, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            print(f"Error saving story: {e}")
            return False
    
    def load_story(self, story_id: str) -> Optional[dict]:
        """Load a story from disk"""
        try:
            file_path = STORIES_DIR / f"{story_id}.json"
            
            if not file_path.exists():
                return None
            
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading story: {e}")
            return None
    
    def list_stories(self) -> List[dict]:
        """List all saved stories with metadata"""
        stories = []
        
        try:
            for file_path in STORIES_DIR.glob("*.json"):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        story_data = json.load(f)
                        
                        # Extract metadata
                        stories.append({
                            'story_id': story_data.get('id'),
                            'title': story_data.get('title', 'Untitled Story'),
                            'genre': story_data.get('genre', 'Unknown'),
                            'is_complete': story_data.get('is_complete', False),
                            'created_at': story_data.get('created_at'),
                            'updated_at': story_data.get('updated_at'),
                            'segment_count': len(story_data.get('segments', []))
                        })
                except Exception as e:
                    print(f"Error reading story file {file_path}: {e}")
                    continue
            
            # Sort by updated_at (most recent first)
            stories.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
            
        except Exception as e:
            print(f"Error listing stories: {e}")
        
        return stories
    
    def delete_story(self, story_id: str) -> bool:
        """Delete a story from disk"""
        try:
            file_path = STORIES_DIR / f"{story_id}.json"
            
            if file_path.exists():
                file_path.unlink()
                return True
            
            return False
        except Exception as e:
            print(f"Error deleting story: {e}")
            return False

# Global storage instance
storage = StoryStorage()
