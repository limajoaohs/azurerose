import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(50), default="#3b82f6")
    icon = Column(String(50), default="book")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    notes = relationship("Note", back_populates="subject", cascade="all, delete-orphan")
    tasks = relationship("StudyTask", back_populates="subject", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="subject", cascade="all, delete-orphan")


class Note(Base):
    __tablename__ = "notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=True)
    title = Column(String(255), nullable=False, default="Nota sem título")
    content = Column(Text, nullable=False, default="")
    summary = Column(Text, nullable=True)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    subject = relationship("Subject", back_populates="notes")
    mindmaps = relationship("Mindmap", back_populates="note", cascade="all, delete-orphan")


class StudyTask(Base):
    __tablename__ = "study_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=True)
    title = Column(String(255), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    estimated_minutes = Column(Integer, default=25)
    is_completed = Column(Boolean, default=False)
    priority = Column(String(20), default="medium")
    task_type = Column(String(50), default="study")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    subject = relationship("Subject", back_populates="tasks")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=True)
    note_id = Column(String(36), ForeignKey("notes.id"), nullable=True)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    difficulty = Column(String(20), default="medium")
    tags = Column(JSON, default=list)

    repetitions = Column(Integer, default=0)
    interval_days = Column(Integer, default=1)
    ease_factor = Column(Float, default=2.5)
    next_review_at = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    subject = relationship("Subject", back_populates="flashcards")


class Mindmap(Base):
    __tablename__ = "mindmaps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    note_id = Column(String(36), ForeignKey("notes.id"), nullable=True)
    title = Column(String(255), nullable=False)
    central_topic = Column(String(255), nullable=False)
    nodes = Column(JSON, nullable=False, default=list)
    edges = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    note = relationship("Note", back_populates="mindmaps")


class SyllabusPlan(Base):
    __tablename__ = "syllabus_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    course_name = Column(String(255), nullable=False)
    professor = Column(String(255), nullable=True)
    semester_weeks = Column(Integer, default=16)
    key_objectives = Column(JSON, default=list)
    weekly_schedule = Column(JSON, default=list)
    exams_and_deadlines = Column(JSON, default=list)
    suggested_reading = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now)
