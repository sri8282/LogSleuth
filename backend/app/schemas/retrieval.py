"""Pydantic schemas for knowledge base retrieval and RAG reference queries."""

from typing import List, Optional
from pydantic import BaseModel, Field


class DocumentSourceMetadata(BaseModel):
    """Authoritative source metadata for a knowledge document."""
    document_id: str = Field(..., description="Stable, unique knowledge document ID")
    references: List[str] = Field(..., description="Official authoritative documentation citations")
    attribution: str = Field(..., description="Origin and local educational attribution")
    version: str = Field(..., description="Revision date or version identifier")


class KnowledgeSearchResult(BaseModel):
    """Ranked reference document returned by retrieval engine."""
    doc_id: str = Field(..., description="Stable document ID (e.g., KB-SSH-AUTH-001)")
    title: str = Field(..., description="Document title")
    category: str = Field(..., description="Technical topic category")
    content: str = Field(..., description="Curated troubleshooting and forensic guidance")
    score: float = Field(..., description="Deterministic lexical BM25 relevance score")
    source_metadata: DocumentSourceMetadata = Field(..., description="Attribution and reference citations")


class KnowledgeQueryRequest(BaseModel):
    """Search request for knowledge base query."""
    query: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Search query string describing symptoms or log signatures",
        json_schema_extra={"example": "SSH failed password brute force login attempts"},
    )
    top_k: int = Field(
        default=3,
        ge=1,
        le=20,
        description="Maximum number of relevant documents to return (between 1 and 20)",
    )


class KnowledgeSearchResponse(BaseModel):
    """Structured response containing ranked knowledge base references."""
    status: str = "success"
    query: str
    total_matched: int
    results: List[KnowledgeSearchResult]
