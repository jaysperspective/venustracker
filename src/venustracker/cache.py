"""Transparent diskcache-backed caching layer for all remote feeds."""

from __future__ import annotations

import functools
import hashlib
import json
import logging
from typing import Any, Callable, TypeVar

import diskcache

from venustracker.config import CACHE_DIR

log = logging.getLogger(__name__)

_cache: diskcache.Cache | None = None


def get_cache() -> diskcache.Cache:
    """Return (or lazily initialise) the shared diskcache instance."""
    global _cache
    if _cache is None:
        _cache = diskcache.Cache(str(CACHE_DIR), size_limit=2 ** 30)  # 1 GiB
    return _cache


def _make_key(*args: Any, **kwargs: Any) -> str:
    """Stable cache key from arbitrary positional + keyword arguments."""
    payload = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode()).hexdigest()


F = TypeVar("F", bound=Callable[..., Any])


def cached(prefix: str, ttl: int) -> Callable[[F], F]:
    """Decorator: cache the return value of *func* for *ttl* seconds.

    The cache key is derived from *prefix* plus all call arguments.
    Works with regular (non-async) functions.
    """

    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            key = f"{prefix}:{_make_key(*args, **kwargs)}"
            c = get_cache()
            if key in c:
                log.debug("cache hit: %s", key[:16])
                return c[key]
            result = func(*args, **kwargs)
            c.set(key, result, expire=ttl)
            log.debug("cache set: %s (ttl=%ds)", key[:16], ttl)
            return result

        return wrapper  # type: ignore[return-value]

    return decorator


def clear_cache() -> int:
    """Delete all entries from the local cache. Returns number of items removed."""
    c = get_cache()
    count = len(c)
    c.clear()
    return count


def cache_info() -> dict[str, Any]:
    """Return basic stats about the cache."""
    c = get_cache()
    return {
        "directory": str(CACHE_DIR),
        "items": len(c),
        "size_bytes": c.volume(),
    }
