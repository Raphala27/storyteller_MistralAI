"""SQLAlchemy ORM models for stories"""
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from database import Base


class Story(Base):
    """Story model for PostgreSQL storage"""
    __tablename__ = "stories"
    
    # Primary key
    story_id = Column(String(36), primary_key=True, index=True)
    
    # Story metadata
    title = Column(String(500), nullable=False)
    genre = Column(String(200), nullable=False)
    characters = Column(Text, nullable=True)
    opening_line = Column(Text, nullable=True)
    
    # Story content (JSON array of segments)
    segments = Column(JSONB, nullable=False, default=[])
    
    # Status
    is_complete = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # User identification (for future multi-user support)
    user_id = Column(String(100), nullable=True, index=True)
    
    def __repr__(self):
        return f"<Story(story_id={self.story_id}, title={self.title}, genre={self.genre})>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.story_id,
            'story_id': self.story_id,
            'title': self.title,
            'genre': self.genre,
            'characters': self.characters,
            'opening_line': self.opening_line,
            'segments': self.segments,
            'is_complete': self.is_complete,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user_id': self.user_id
        }
    
    def to_summary(self):
        """Convert model to summary dictionary"""
        return {
            'story_id': self.story_id,
            'title': self.title,
            'genre': self.genre,
            'is_complete': self.is_complete,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'segment_count': len(self.segments) if self.segments else 0
        }
