"""
Database connection and utilities.

Provides PostgreSQL connection for reading student data.
"""

import logging
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool

from app.config import get_settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages database connections and queries."""
    
    def __init__(self, database_url: Optional[str] = None):
        """
        Initialize database manager.
        
        Args:
            database_url: PostgreSQL connection URL
        """
        settings = get_settings()
        self.database_url = database_url or settings.get_database_url
        self.engine = None
        self.SessionLocal = None
        self._initialized = False
    
    def initialize(self):
        """Initialize database connection pool."""
        if self._initialized:
            return
        
        try:
            self.engine = create_engine(
                self.database_url,
                poolclass=QueuePool,
                pool_size=5,
                max_overflow=10,
                pool_pre_ping=True,
                echo=False
            )
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            self._initialized = True
            logger.info("Database connection initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
    
    @contextmanager
    def get_session(self):
        """Get database session context manager."""
        if not self._initialized:
            self.initialize()
        
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            raise
        finally:
            session.close()
    
    def get_user_attempts(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Get all quiz attempts for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            List of attempt dictionaries
        """
        query = text("""
            SELECT 
                qa.question_id,
                q.difficulty_level as difficulty,
                qa.is_correct,
                qa.time_spent_seconds,
                qa.timestamp
            FROM quiz_attempts qa
            JOIN quiz_sessions qs ON qa.session_id = qs.id
            JOIN questions q ON qa.question_id = q.id
            WHERE qs.user_id = :user_id
            ORDER BY qa.timestamp ASC
        """)
        
        with self.get_session() as session:
            result = session.execute(query, {"user_id": user_id})
            return [
                {
                    "question_id": row.question_id,
                    "difficulty": row.difficulty,
                    "is_correct": row.is_correct,
                    "time_spent_seconds": row.time_spent_seconds,
                }
                for row in result
            ]
    
    def get_session_attempts(self, session_id: int) -> List[Dict[str, Any]]:
        """
        Get all attempts for a quiz session.
        
        Args:
            session_id: Quiz session ID
            
        Returns:
            List of attempt dictionaries
        """
        query = text("""
            SELECT 
                qa.question_id,
                q.difficulty_level as difficulty,
                qa.is_correct,
                qa.time_spent_seconds,
                qa.timestamp
            FROM quiz_attempts qa
            JOIN questions q ON qa.question_id = q.id
            WHERE qa.session_id = :session_id
            ORDER BY qa.timestamp ASC
        """)
        
        with self.get_session() as session:
            result = session.execute(query, {"session_id": session_id})
            return [
                {
                    "question_id": row.question_id,
                    "difficulty": row.difficulty,
                    "is_correct": row.is_correct,
                    "time_spent_seconds": row.time_spent_seconds,
                }
                for row in result
            ]
    
    def get_user_skill_level(self, user_id: int) -> str:
        """Get user's skill level."""
        query = text("""
            SELECT skill_level FROM users WHERE id = :user_id
        """)
        
        with self.get_session() as session:
            result = session.execute(query, {"user_id": user_id}).fetchone()
            return result.skill_level if result else "Beginner"
    
    def health_check(self) -> bool:
        """Check database connectivity."""
        try:
            with self.get_session() as session:
                session.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    def close(self):
        """Close database connections."""
        if self.engine:
            self.engine.dispose()
            self._initialized = False
            logger.info("Database connections closed")


# Global instance
_db_manager: Optional[DatabaseManager] = None


def get_db_manager() -> DatabaseManager:
    """Get or create global database manager."""
    global _db_manager
    if _db_manager is None:
        _db_manager = DatabaseManager()
    return _db_manager
