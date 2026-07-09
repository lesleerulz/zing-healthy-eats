import os
from supabase import create_client
from typing import Optional

_supabase_client = None

BUCKET = "images"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

def get_supabase():
    global _supabase_client
    if _supabase_client is None:
        url = os.environ.get("SUPABASE_URL") or "https://tetcosmsdmhlihasvext.supabase.co"
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if not key:
            from config import Config
            key = getattr(Config, "SUPABASE_SERVICE_KEY", None)
        if not key:
            raise RuntimeError("SUPABASE_SERVICE_KEY not configured")
        _supabase_client = create_client(url, key)
    return _supabase_client

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def ensure_bucket():
    supabase = get_supabase()
    try:
        supabase.storage.from_(BUCKET).info("dummy")
    except Exception:
        try:
            supabase.storage.create_bucket(BUCKET, public=True)
        except TypeError:
            supabase.storage.create_bucket(BUCKET)

def upload_file(file_bytes: bytes, file_path: str, content_type: Optional[str] = None) -> str:
    supabase = get_supabase()
    ensure_bucket()
    opts = {}
    if content_type:
        opts["content-type"] = content_type
    try:
        supabase.storage.from_(BUCKET).update(file_path, file_bytes, opts)
    except Exception:
        supabase.storage.from_(BUCKET).upload(file_path, file_bytes, opts)
    return get_public_url(file_path)

def upload_from_fileobj(file_obj, file_path: str) -> str:
    return upload_file(file_obj.read(), file_path, content_type=file_obj.content_type)

def delete_file(file_path: str):
    supabase = get_supabase()
    try:
        supabase.storage.from_(BUCKET).remove([file_path])
    except Exception:
        pass

def get_public_url(file_path: str) -> str:
    supabase = get_supabase()
    return supabase.storage.from_(BUCKET).get_public_url(file_path)
