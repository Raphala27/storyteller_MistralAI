"""PostgreSQL-based story storage using SQLAlchemy"""
from sqlalchemy import select, delete
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from models import Story as StoryModel


class PostgresStoryStorage:
    """PostgreSQL storage for stories"""
    
    def save_story(self, db: Session, story_id: str, story_data: dict) -> bool:
        """Save or update a story in PostgreSQL"""
        try:
            # Check if story exists
            stmt = select(StoryModel).where(StoryModel.story_id == story_id)
            result = db.execute(stmt)
            existing_story = result.scalar_one_or_none()
            
            if existing_story:
                # Update existing story
                existing_story.title = story_data.get('title', existing_story.title)
                existing_story.genre = story_data.get('genre', existing_story.genre)
                existing_story.characters = story_data.get('characters')
                existing_story.opening_line = story_data.get('opening_line')
                existing_story.segments = story_data.get('segments', [])
                existing_story.is_complete = story_data.get('is_complete', False)
                existing_story.updated_at = datetime.utcnow()
                existing_story.user_id = story_data.get('user_id')
            else:
                # Create new story
                new_story = StoryModel(
                    story_id=story_id,
                    title=story_data.get('title', 'Untitled Story'),
                    genre=story_data.get('genre', 'Unknown'),
                    characters=story_data.get('characters'),
                    opening_line=story_data.get('opening_line'),
                    segments=story_data.get('segments', []),
                    is_complete=story_data.get('is_complete', False),
                    created_at=datetime.fromisoformat(story_data['created_at']) if 'created_at' in story_data else datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    user_id=story_data.get('user_id')
                )
                db.add(new_story)
            
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            print(f"Error saving story to database: {e}")
            return False
    
    def load_story(self, db: Session, story_id: str) -> Optional[dict]:
        """Load a story from PostgreSQL"""
        try:
            stmt = select(StoryModel).where(StoryModel.story_id == story_id)
            result = db.execute(stmt)
            story = result.scalar_one_or_none()
            
            if story:
                return story.to_dict()
            return None
            
        except Exception as e:
            print(f"Error loading story from database: {e}")
            return None
    
    def list_stories(self, db: Session, user_id: Optional[str] = None) -> List[dict]:
        """List all saved stories with metadata"""
        try:
            if user_id:
                stmt = select(StoryModel).where(StoryModel.user_id == user_id).order_by(StoryModel.updated_at.desc())
            else:
                stmt = select(StoryModel).order_by(StoryModel.updated_at.desc())
            
            result = db.execute(stmt)
            stories = result.scalars().all()
            
            return [story.to_summary() for story in stories]
            
        except Exception as e:
            print(f"Error listing stories from database: {e}")
            return []
    
    def delete_story(self, db: Session, story_id: str) -> bool:
        """Delete a story from PostgreSQL"""
        try:
            stmt = delete(StoryModel).where(StoryModel.story_id == story_id)
            result = db.execute(stmt)
            db.commit()
            
            return result.rowcount > 0
            
        except Exception as e:
            db.rollback()
            print(f"Error deleting story from database: {e}")
            return False
    
    def story_exists(self, db: Session, story_id: str) -> bool:
        """Check if a story exists"""
        try:
            stmt = select(StoryModel.story_id).where(StoryModel.story_id == story_id)
            result = db.execute(stmt)
            return result.scalar_one_or_none() is not None
            
        except Exception as e:
            print(f"Error checking story existence: {e}")
            return False


# Global storage instance
postgres_storage = PostgresStoryStorage()
