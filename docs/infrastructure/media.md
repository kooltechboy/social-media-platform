# TUKUBI Media Subsystem & Aspect Ratio Pipeline

**Status:** Production Ready  
**Version:** September 2026 Master Baseline  

---

## 1. Standardized Media Pipeline & Aspect Ratios

To deliver a visually cohesive Caribbean aesthetic without layout shifts, all visual media assets in TUKUBI conform to strictly enforced aspect ratios:

| Ratio | Geometry | Canonical Use Case | Container Class | Max Dimensions |
| :---: | :---: | :--- | :--- | :--- |
| **`9:16`** | Vertical | Short-form videos, stories, mobile-first reels | `aspect-[9/16]` | 1080 × 1920 px |
| **`1:1`** | Square | Profile avatars, album art, marketplace thumbnails | `aspect-square` | 1080 × 1080 px |
| **`4:5`** | Portrait | High-impact social feed posts and photography | `aspect-[4/5]` | 1080 × 1350 px |
| **`16:9`**| Landscape | Live stream broadcasts, landscape video replays | `aspect-video` | 1920 × 1080 px |

---

## 2. Ingest Architecture & Privacy Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as Caribbean User
    participant Client as Web / Mobile Client
    participant Edge as Edge Presigned URL Signer
    participant Storage as Supabase Storage S3 Bucket
    participant DB as PostgreSQL (media_assets)
    
    User->>Client: Selects Photo / Video / Audio File
    Client->>Client: 1. Validate MIME type & file size<br>2. Strip EXIF / GPS metadata (Privacy Guarantee)<br>3. Extract dimensions & compute aspect ratio
    Client->>Edge: Request Presigned Upload URL
    Edge->>Client: Return Signed URL (Scoped to auth.uid folder)
    Client->>Storage: Direct PUT to S3 Bucket with Content-Type
    Client->>DB: INSERT into media_assets (url, aspect_ratio, width, height)
    DB-->>Client: Return Asset UUID for Post / Message Creation
```

---

## 3. Privacy Preservation & EXIF Sanitization

In accordance with TUKUBI Privacy Mandates (`RULE[AGENTS.md]`):
- **EXIF Stripping:** All GPS coordinates, device serial numbers, camera model data, and exposure timestamps are stripped in the client browser / mobile sandbox before upload.
- **Path Isolation:** Files are stored in user-isolated paths (`{bucket}/{user_id}/{uuid}.{ext}`).
- **MIME Whitelisting:** Allowed upload types are strictly restricted to `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `video/mp4`, `video/quicktime`, `audio/mpeg`, `audio/aac`, and `audio/wav`.
