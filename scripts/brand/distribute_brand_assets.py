import os
import shutil

SOURCE_DIR = "packages/design-system/brand"

TARGET_DIRS = [
    "apps/web/public/brand",
    "apps/admin/public/brand",
    "apps/moderation/public/brand",
    "apps/creator-studio/public/brand",
    "apps/business-studio/public/brand",
]

def distribute():
    # 1. Distribute to all apps public/brand
    files = os.listdir(SOURCE_DIR)
    for target in TARGET_DIRS:
        os.makedirs(target, exist_ok=True)
        for f in files:
            src_file = os.path.join(SOURCE_DIR, f)
            if os.path.isfile(src_file):
                shutil.copy2(src_file, os.path.join(target, f))
        print(f"Copied {len(files)} brand assets to {target}")

    # 2. Distribute root web icons
    web_public = "apps/web/public"
    shutil.copy2(f"{SOURCE_DIR}/favicon.ico", f"{web_public}/favicon.ico")
    shutil.copy2(f"{SOURCE_DIR}/favicon.png", f"{web_public}/favicon.png")
    shutil.copy2(f"{SOURCE_DIR}/favicon.svg", f"{web_public}/favicon.svg")
    shutil.copy2(f"{SOURCE_DIR}/apple-touch-icon.png", f"{web_public}/apple-touch-icon.png")
    shutil.copy2(f"{SOURCE_DIR}/icon-192.png", f"{web_public}/icon-192.png")
    shutil.copy2(f"{SOURCE_DIR}/icon-512.png", f"{web_public}/icon-512.png")
    
    web_icons = "apps/web/public/icons"
    os.makedirs(web_icons, exist_ok=True)
    shutil.copy2(f"{SOURCE_DIR}/apple-touch-icon.png", f"{web_icons}/apple-touch-icon.png")
    shutil.copy2(f"{SOURCE_DIR}/icon-192.png", f"{web_icons}/icon-192.png")
    shutil.copy2(f"{SOURCE_DIR}/icon-512.png", f"{web_icons}/icon-512.png")
    shutil.copy2(f"{SOURCE_DIR}/icon-maskable-192.png", f"{web_icons}/icon-maskable-192.png")
    shutil.copy2(f"{SOURCE_DIR}/icon-maskable-512.png", f"{web_icons}/icon-maskable-512.png")
    shutil.copy2(f"{SOURCE_DIR}/tukubi-symbol.svg", f"{web_icons}/icon.svg")
    print("Updated apps/web icons and favicons")

    # 3. Distribute admin favicons
    admin_public = "apps/admin/public"
    shutil.copy2(f"{SOURCE_DIR}/favicon.ico", f"{admin_public}/favicon.ico")
    shutil.copy2(f"{SOURCE_DIR}/favicon.png", f"{admin_public}/favicon.png")
    print("Updated apps/admin favicons")

    # 4. Distribute moderation favicons
    mod_public = "apps/moderation/public"
    shutil.copy2(f"{SOURCE_DIR}/favicon.ico", f"{mod_public}/favicon.ico")
    shutil.copy2(f"{SOURCE_DIR}/favicon.png", f"{mod_public}/favicon.png")
    print("Updated apps/moderation favicons")

    # 5. Distribute mobile assets
    mobile_assets = "apps/mobile/assets"
    os.makedirs(mobile_assets, exist_ok=True)
    shutil.copy2(f"{SOURCE_DIR}/tukubi-app-icon-1024.png", f"{mobile_assets}/icon.png")
    shutil.copy2(f"{SOURCE_DIR}/tukubi-adaptive-foreground.png", f"{mobile_assets}/adaptive-icon.png")
    shutil.copy2(f"{SOURCE_DIR}/favicon-48.png", f"{mobile_assets}/favicon.png")
    shutil.copy2(f"{SOURCE_DIR}/tukubi-logo-dark.png", f"{mobile_assets}/tukubi-logo.png")
    print("Updated apps/mobile assets (icon, adaptive-icon, favicon, tukubi-logo)")

if __name__ == "__main__":
    distribute()
