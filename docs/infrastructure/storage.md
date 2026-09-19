# TUKUBI Storage Subsystem Architecture

**Status:** Production Ready  
**Version:** September 2026 Master Baseline  

---

## 1. Storage Topology & Bucket Inventory

TUKUBI provisions dedicated Supabase Storage (AWS S3-backed) buckets with strict isolation between public assets and private customer documents:

| Bucket Name | Visibility | Max File Size | Permitted MIME Types | Access Control Policy |
| :--- | :---: | :---: | :--- | :--- |
| **`avatars`** | Public | 5 MB | `image/jpeg`, `image/png`, `image/webp` | Owner write: `(storage.foldername(name))[1] = auth.uid()::text`. |
| **`post-media`** | Public | 50 MB | `image/*`, `video/mp4`, `video/quicktime` | Owner write: Folder path scoped to author UUID. |
| **`sounds`** | Public | 25 MB | `audio/mpeg`, `audio/aac`, `audio/wav`, `audio/flac` | Verified creators and platform admins. |
| **`marketplace-products`** | Public | 15 MB | `image/jpeg`, `image/png`, `image/webp` | Business members with `editor`/`admin`/`owner` role. |
| **`business-assets`** | Public | 10 MB | `image/jpeg`, `image/png`, `image/webp` | Business members managing the page. |
| **`chat-attachments`** | Private | 25 MB | `image/*`, `audio/*`, `application/pdf` | Active conversation participants only. |
| **`verification-docs`**| Private | 10 MB | `image/jpeg`, `image/png`, `application/pdf` | Restricted strictly to `service_role` and `superadmin`. |

---

## 2. Storage Row-Level Security Policies

Storage access is governed directly inside PostgreSQL on the `storage.objects` table:

```sql
-- Allow users to upload avatars only to their own user_id directory
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read access for public asset buckets
CREATE POLICY "Public read for avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

---

## 3. CDN Caching & Edge Optimization

- **Immutable Hashing:** Uploaded media uses content-addressed UUIDv4 filenames, allowing client responses to set `Cache-Control: public, max-age=31536000, immutable`.
- **Thumbnail Transformations:** Supabase Image Transformation resizes images on the fly via URL parameters (`?width=400&height=400&resize=cover&format=webp`), drastically reducing bandwidth on Caribbean mobile data networks.
