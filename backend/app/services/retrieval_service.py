"""Deterministic lexical retrieval engine implementing Okapi BM25.

Provides lexical scoring across curated knowledge documents without external
vector databases or embedding APIs.
"""

from collections import Counter
import math
import re
from typing import Dict, List, Optional
from app.knowledge.repository import get_default_knowledge_documents
from app.schemas.retrieval import DocumentSourceMetadata, KnowledgeSearchResult

# Stopwords list to filter non-informative terms
COMMON_STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "to", "in", "is", "for", "with",
    "on", "at", "by", "from", "it", "as", "be", "that", "this", "are",
    "was", "were", "been", "has", "have", "had", "do", "does", "did",
}

TOKEN_PATTERN = re.compile(r"\b[a-zA-Z0-9_\-\.]{2,}\b")


def tokenize(text: str) -> List[str]:
    """Tokenize and filter text into lowercase terms."""
    tokens = TOKEN_PATTERN.findall(text.lower())
    return [t for t in tokens if t not in COMMON_STOPWORDS]


class BM25Index:
    """In-memory Okapi BM25 search index."""

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.documents: List[Dict] = []
        self.doc_lengths: List[int] = []
        self.avg_doc_length: float = 0.0
        self.term_frequencies: List[Counter] = []
        self.doc_frequencies: Counter = Counter()
        self.num_docs: int = 0

    def index_documents(self, documents: List[Dict]) -> None:
        """Build term frequency and inverse document frequency structures."""
        self.documents = documents
        self.num_docs = len(documents)
        self.term_frequencies = []
        self.doc_lengths = []
        self.doc_frequencies = Counter()

        if self.num_docs == 0:
            self.avg_doc_length = 0.0
            return

        total_length = 0
        for doc in documents:
            # Combine title (weighted 2x) and content for comprehensive matching
            searchable_text = f"{doc.get('title', '')} {doc.get('title', '')} {doc.get('category', '')} {doc.get('content', '')}"
            tokens = tokenize(searchable_text)
            term_counts = Counter(tokens)
            doc_len = len(tokens)

            self.term_frequencies.append(term_counts)
            self.doc_lengths.append(doc_len)
            total_length += doc_len

            for term in term_counts.keys():
                self.doc_frequencies[term] += 1

        self.avg_doc_length = total_length / self.num_docs if self.num_docs > 0 else 0.0

    def calculate_idf(self, term: str) -> float:
        """Compute standard smoothed IDF for a term."""
        n_q = self.doc_frequencies.get(term, 0)
        # Smoothed BM25 IDF: ln(1 + (N - n(q) + 0.5) / (n(q) + 0.5))
        return math.log(1.0 + (self.num_docs - n_q + 0.5) / (n_q + 0.5))

    def score_document(self, doc_idx: int, query_tokens: List[str]) -> float:
        """Compute BM25 score for a document against query terms."""
        if self.num_docs == 0 or self.avg_doc_length == 0.0:
            return 0.0

        score = 0.0
        tf_dict = self.term_frequencies[doc_idx]
        doc_len = self.doc_lengths[doc_idx]
        len_norm = 1.0 - self.b + self.b * (doc_len / self.avg_doc_length)

        for term in query_tokens:
            if term not in tf_dict:
                continue
            tf = tf_dict[term]
            idf = self.calculate_idf(term)
            term_score = idf * (tf * (self.k1 + 1.0)) / (tf + self.k1 * len_norm)
            score += term_score

        return score

    def search(
        self, query: str, top_k: int = 3, min_score: float = 0.01
    ) -> List[KnowledgeSearchResult]:
        """Rank indexed documents against query terms."""
        query_tokens = tokenize(query)
        if not query_tokens or self.num_docs == 0:
            return []

        scored_results: List[KnowledgeSearchResult] = []

        for idx, doc in enumerate(self.documents):
            score = self.score_document(idx, query_tokens)
            if score > min_score:
                meta_dict = doc.get("source_metadata", {})
                source_meta = DocumentSourceMetadata(
                    document_id=meta_dict.get("document_id", doc.get("doc_id", "UNKNOWN")),
                    references=meta_dict.get("references", []),
                    attribution=meta_dict.get("attribution", "LogSleuth Knowledge Base"),
                    version=meta_dict.get("version", "1.0"),
                )

                scored_results.append(
                    KnowledgeSearchResult(
                        doc_id=doc["doc_id"],
                        title=doc["title"],
                        category=doc["category"],
                        content=doc["content"],
                        score=round(score, 4),
                        source_metadata=source_meta,
                    )
                )

        # Sort descending by score
        scored_results.sort(key=lambda r: r.score, reverse=True)
        return scored_results[:top_k]


class RetrievalService:
    """Service layer exposing deterministic lexical search over knowledge documents."""

    def __init__(self, initial_documents: Optional[List[Dict]] = None):
        self.index = BM25Index()
        docs = initial_documents if initial_documents is not None else get_default_knowledge_documents()
        self.index.index_documents(docs)

    def search(self, query: str, top_k: int = 3) -> List[KnowledgeSearchResult]:
        """Execute BM25 search over the active knowledge base.
        
        Args:
            query: User search text or anomalous log snippet.
            top_k: Maximum number of ranked documents to return.

        Returns:
            List of KnowledgeSearchResult ranked by BM25 relevance score.
        """
        query_clean = (query or "").strip()
        if not query_clean:
            return []

        return self.index.search(query=query_clean, top_k=top_k)

    def reload_documents(self, documents: List[Dict]) -> None:
        """Re-index a custom document set (used for testing or dynamic KB updates)."""
        self.index.index_documents(documents)


retrieval_service = RetrievalService()
