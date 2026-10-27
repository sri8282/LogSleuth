"""Knowledge base and RAG retrieval endpoints."""

from fastapi import APIRouter, HTTPException, status
from app.schemas.retrieval import KnowledgeQueryRequest, KnowledgeSearchResponse
from app.services.retrieval_service import retrieval_service

router = APIRouter(prefix="/knowledge", tags=["Knowledge & RAG"])


@router.post(
    "/search",
    response_model=KnowledgeSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search Knowledge Base (BM25)",
    description=(
        "Performs deterministic Okapi BM25 lexical search over curated Linux and application "
        "troubleshooting runbooks. Does not execute LLM generation or query vector databases."
    ),
)
async def search_knowledge_base(payload: KnowledgeQueryRequest) -> KnowledgeSearchResponse:
    """Execute lexical retrieval over curated knowledge documents."""
    try:
        results = retrieval_service.search(query=payload.query, top_k=payload.top_k)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while querying the knowledge base.",
        )

    return KnowledgeSearchResponse(
        status="success",
        query=payload.query,
        total_matched=len(results),
        results=results,
    )
