"""Automated tests for deterministic BM25 knowledge base retrieval and RAG reference queries."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.services.retrieval_service import retrieval_service
from app.knowledge.repository import get_default_knowledge_documents

client = TestClient(app)


@pytest.fixture(autouse=True)
def restore_knowledge_base():
    """Ensure standard knowledge base is restored before and after each test."""
    retrieval_service.reload_documents(get_default_knowledge_documents())
    yield
    retrieval_service.reload_documents(get_default_knowledge_documents())


def test_retrieve_ssh_guidance():
    """Verify SSH brute force query retrieves KB-SSH-AUTH-001 as top ranked result."""
    response = client.post(
        f"{settings.API_PREFIX}/knowledge/search",
        json={"query": "OpenSSH failed password for invalid user brute force login"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_matched"] >= 1
    top_doc = data["results"][0]
    assert top_doc["doc_id"] == "KB-SSH-AUTH-001"
    assert "OpenSSH" in top_doc["title"]
    assert top_doc["category"] == "Authentication & Access Control"
    assert top_doc["score"] > 0.0


def test_retrieve_sudo_guidance():
    """Verify sudo privilege abuse query retrieves KB-SUDO-PRIV-002 as top ranked result."""
    response = client.post(
        f"{settings.API_PREFIX}/knowledge/search",
        json={"query": "user NOT in sudoers privilege escalation root command"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_matched"] >= 1
    top_doc = data["results"][0]
    assert top_doc["doc_id"] == "KB-SUDO-PRIV-002"
    assert "Sudo" in top_doc["title"]
    assert top_doc["category"] == "Privilege Management"


def test_retrieve_path_traversal_guidance():
    """Verify web path traversal probe query retrieves KB-WEB-TRAVERSAL-003."""
    response = client.post(
        f"{settings.API_PREFIX}/knowledge/search",
        json={"query": "nginx web path traversal /etc/passwd dot-dot-slash 403"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_matched"] >= 1
    top_doc = data["results"][0]
    assert top_doc["doc_id"] == "KB-WEB-TRAVERSAL-003"
    assert "Path Traversal" in top_doc["title"]


def test_retrieve_mac_denials_guidance():
    """Verify AppArmor / SELinux query retrieves KB-MAC-DENIAL-004."""
    response = client.post(
        f"{settings.API_PREFIX}/knowledge/search",
        json={"query": "apparmor denied open profile name /etc/shadow selinux avc"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_matched"] >= 1
    top_doc = data["results"][0]
    assert top_doc["doc_id"] == "KB-MAC-DENIAL-004"
    assert "AppArmor" in top_doc["title"]


def test_retrieve_kernel_oom_guidance():
    """Verify kernel panic and OOM killer query retrieves KB-KERNEL-OOM-005."""
    response = client.post(
        f"{settings.API_PREFIX}/knowledge/search",
        json={"query": "kernel panic out of memory killed process oom-killer segfault"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_matched"] >= 1
    top_doc = data["results"][0]
    assert top_doc["doc_id"] == "KB-KERNEL-OOM-005"
    assert "Out-of-Memory" in top_doc["title"]


def test_ranking_relevant_above_unrelated():
    """Verify that a specific topic scores significantly higher than other documents."""
    response = client.post(
        f"{settings.API_PREFIX}/knowledge/search",
        json={"query": "ssh password MaxAuthTries fail2ban", "top_k": 5},
    )
    assert response.status_code == 200
    data = response.json()
    results = data["results"]
    assert len(results) >= 1
    assert results[0]["doc_id"] == "KB-SSH-AUTH-001"

    # If other documents match, verify descending score ordering
    scores = [r["score"] for r in results]
    assert scores == sorted(scores, reverse=True)


def test_top_k_bounds():
    """Verify top_k parameter restricts results appropriately."""
    # top_k = 1
    resp1 = client.post(
        f"{settings.API_PREFIX}/knowledge/search",
        json={"query": "error failure log linux", "top_k": 1},
    )
    assert resp1.status_code == 200
    assert len(resp1.json()["results"]) <= 1

    # top_k = 2
    resp2 = client.post(
        f"{settings.API_PREFIX}/knowledge/search",
        json={"query": "error failure log linux", "top_k": 2},
    )
    assert resp2.status_code == 200
    assert len(resp2.json()["results"]) <= 2

    # Invalid top_k = 0
    resp_zero = client.post(
        f"{settings.API_PREFIX}/knowledge/search",
        json={"query": "test", "top_k": 0},
    )
    assert resp_zero.status_code == 422

    # Invalid top_k = 25 (>20)
    resp_large = client.post(
        f"{settings.API_PREFIX}/knowledge/search",
        json={"query": "test", "top_k": 25},
    )
    assert resp_large.status_code == 422


def test_query_validation():
    """Verify empty and overly long query strings are rejected."""
    # Empty query
    resp_empty = client.post(
        f"{settings.API_PREFIX}/knowledge/search",
        json={"query": ""},
    )
    assert resp_empty.status_code == 422

    # Query exceeding 500 characters
    long_query = "kernel " * 100
    resp_long = client.post(
        f"{settings.API_PREFIX}/knowledge/search",
        json={"query": long_query},
    )
    assert resp_long.status_code == 422


def test_stable_source_metadata():
    """Verify returned documents contain stable metadata without hallucinations."""
    response = client.post(
        f"{settings.API_PREFIX}/knowledge/search",
        json={"query": "sudoers root"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_matched"] >= 1
    doc = data["results"][0]

    assert doc["doc_id"] == "KB-SUDO-PRIV-002"
    meta = doc["source_metadata"]
    assert meta["document_id"] == "KB-SUDO-PRIV-002"
    assert len(meta["references"]) > 0
    assert "Sudoers Manual" in meta["references"][0]
    assert "Curated LogSleuth" in meta["attribution"]
    assert "2026-10" in meta["version"]


def test_empty_knowledge_base():
    """Verify retrieval engine handles empty knowledge base gracefully without errors."""
    retrieval_service.reload_documents([])

    response = client.post(
        f"{settings.API_PREFIX}/knowledge/search",
        json={"query": "SSH brute force authentication"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_matched"] == 0
    assert data["results"] == []


def test_service_search_empty_query_string():
    """Verify direct service call with empty string returns empty list."""
    results = retrieval_service.search("")
    assert results == []
    results_whitespace = retrieval_service.search("   ")
    assert results_whitespace == []
