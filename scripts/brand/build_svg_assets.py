"""
TUKUBI Official Brand Identity - Master Vector SVG Builder
Reconstructs the approved brand assets with 100% vector fidelity:
- Symbol (Color, White, Monochrome Dark)
- Horizontal Lockup (Light mode, Dark mode, White, Monochrome)
- Stacked Lockup (Light mode, Dark mode, White, Monochrome)
- App Icon (Squircle container, Android Adaptive Foreground/Background)
- Compact Navigation Logo
"""

import os
import re

with open('scratch/traced_poly.svg', 'r', encoding='utf-8') as f:
    sym_paths = re.findall(r'd="([^"]+)"', f.read())

with open('scratch/traced_wordmark.svg', 'r', encoding='utf-8') as f:
    wm_paths = re.findall(r'd="([^"]+)"', f.read())

with open('scratch/traced_tagline.svg', 'r', encoding='utf-8') as f:
    tl_paths = re.findall(r'd="([^"]+)"', f.read())

# Path elements:
# sym_paths[0]: Main T body
# sym_paths[1]: Splash Frond 1 (Top)
# sym_paths[2]: Splash Frond 2 (Middle)
# sym_paths[3]: Splash Frond 3 (Bottom)
# wm_paths[0]: TUKUBI wordmark
# tl_paths[0]: The Caribbean Connected tagline

def get_defs(prefix="tkb"):
    return f'''  <defs>
    <!-- Crossbar Horizontal Gradient: Bright Caribbean Teal to Ocean Blue -->
    <linearGradient id="{prefix}-cbGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00E5C9" />
      <stop offset="35%" stop-color="#00C2A8" />
      <stop offset="75%" stop-color="#0EA5E9" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>

    <!-- Stem Vertical Gradient: Ocean Blue -> Electric Violet -> Sunset Coral -> Sunset Orange -->
    <linearGradient id="{prefix}-stemGrad" x1="15%" y1="0%" x2="75%" y2="100%">
      <stop offset="0%" stop-color="#0EA5E9" />
      <stop offset="18%" stop-color="#2563EB" />
      <stop offset="38%" stop-color="#6366F1" />
      <stop offset="52%" stop-color="#8B5CF6" />
      <stop offset="70%" stop-color="#C026D3" />
      <stop offset="84%" stop-color="#F43F5E" />
      <stop offset="94%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>

    <!-- 3D Ribbon Fold Highlight -->
    <linearGradient id="{prefix}-foldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.8" />
      <stop offset="32%" stop-color="#818CF8" stop-opacity="0.85" />
      <stop offset="62%" stop-color="#C084FC" stop-opacity="0.9" />
      <stop offset="85%" stop-color="#FB7185" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#FBBF24" />
    </linearGradient>

    <!-- Splash Fronds Gradient -->
    <linearGradient id="{prefix}-splashGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00C2A8" />
      <stop offset="60%" stop-color="#0EA5E9" />
      <stop offset="100%" stop-color="#38BDF8" />
    </linearGradient>

    <!-- Brand Typography Linear Gradient for dark backgrounds (optional glow) -->
    <linearGradient id="{prefix}-textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F8FAFC" />
    </linearGradient>

    <!-- Clipping masks for crossbar and stem separation -->
    <clipPath id="{prefix}-cbClip">
      <path d="M 0 0 L 100 0 L 100 24.5 L 68 24.5 L 56 26 L 33 26 L 0 26 Z" />
    </clipPath>
    <clipPath id="{prefix}-stemClip">
      <path d="M 0 24 L 100 24 L 100 90 L 0 90 Z" />
    </clipPath>
  </defs>'''

def get_symbol_group(prefix="tkb", mode="color", transform=""):
    trans_attr = f' transform="{transform}"' if transform else ''
    if mode == "color":
        return f'''  <g id="{prefix}-symbol"{trans_attr}>
    <!-- Crossbar -->
    <path d="{sym_paths[0]}" fill="url(#{prefix}-cbGrad)" clip-path="url(#{prefix}-cbClip)" />
    <!-- Stem -->
    <path d="{sym_paths[0]}" fill="url(#{prefix}-stemGrad)" clip-path="url(#{prefix}-stemClip)" />
    <!-- 3D Ribbon Fold Highlight -->
    <path d="M 41 32 C 37.5 43, 38.5 57, 44 68 C 46.5 73, 49.5 77.5, 51 80 C 53 78.5, 53.5 76, 52.5 73.5 C 50 67, 52 58, 56 48 C 57.5 43, 57 37, 54 32 C 49 32, 45 32, 41 32 Z" fill="url(#{prefix}-foldGrad)" opacity="0.92" />
    <!-- 3 Splash Fronds -->
    <path d="{sym_paths[1]}" fill="url(#{prefix}-splashGrad)" />
    <path d="{sym_paths[2]}" fill="url(#{prefix}-splashGrad)" />
    <path d="{sym_paths[3]}" fill="url(#{prefix}-splashGrad)" />
  </g>'''
    elif mode == "white":
        return f'''  <g id="{prefix}-symbol"{trans_attr} fill="#FFFFFF">
    <path d="{sym_paths[0]}" />
    <path d="{sym_paths[1]}" />
    <path d="{sym_paths[2]}" />
    <path d="{sym_paths[3]}" />
  </g>'''
    elif mode == "monochrome" or mode == "black":
        return f'''  <g id="{prefix}-symbol"{trans_attr} fill="#0B1B3B">
    <path d="{sym_paths[0]}" />
    <path d="{sym_paths[1]}" />
    <path d="{sym_paths[2]}" />
    <path d="{sym_paths[3]}" />
  </g>'''

def build_symbol_svg(mode="color", size=120):
    # The symbol bounds in 100x88 space: x=[0, 85], y=[0, 88]
    # We place it nicely centered in a 100x100 square with 6px padding
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">
{get_defs("sym") if mode == "color" else ""}
{get_symbol_group("sym", mode, "translate(7.5, 6)")}
</svg>'''
    return svg

def build_horizontal_logo_svg(theme="light", with_tagline=True):
    # ViewBox: 540 x 120
    # Symbol placed at x=10, y=16 (scale 1.0)
    # Wordmark placed at x=125, y=28 (scale 0.72)
    # Tagline placed at x=127, y=86 (scale 0.72)
    # Light theme: text is Deep Navy (#0B1B3B)
    # Dark theme: text is Pure White (#FFFFFF)
    # White theme: everything is Pure White
    # Mono theme: everything is Deep Navy
    
    text_color = "#0B1B3B" if theme in ("light", "mono") else "#FFFFFF"
    tagline_color = "#1E293B" if theme == "light" else "#F8FAFC"
    if theme == "white":
        tagline_color = "#FFFFFF"
    elif theme == "mono":
        tagline_color = "#0B1B3B"
        
    mode = "color"
    if theme == "white":
        mode = "white"
    elif theme == "mono":
        mode = "monochrome"
        
    # Scale wordmark from 400x77 down to ~290x56 (scale 0.725)
    # Scale tagline from 389x24 down to ~282x17.4 (scale 0.725)
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 110" width="460" height="110">
{get_defs("hl") if mode == "color" else ""}
{get_symbol_group("hl", mode, "translate(10, 11)")}
  <!-- TUKUBI Wordmark -->
  <g transform="translate(126, 22) scale(0.725)">
    <path d="{wm_paths[0]}" fill="{text_color}" fill-rule="evenodd" />
  </g>
'''
    if with_tagline:
        svg += f'''  <!-- The Caribbean Connected Tagline -->
  <g transform="translate(128, 81) scale(0.725)">
    <path d="{tl_paths[0]}" fill="{tagline_color}" fill-rule="evenodd" />
  </g>
'''
    svg += '</svg>'
    return svg

def build_stacked_logo_svg(theme="light"):
    # ViewBox: 240 x 220
    # Symbol centered on top: width 100, height 88, placed at x=70, y=14
    # Wordmark centered below: width ~180 (scale 0.45, placed at x=30, y=122)
    # Tagline centered below: width ~175 (scale 0.45, placed at x=32, y=168)
    text_color = "#0B1B3B" if theme in ("light", "mono") else "#FFFFFF"
    tagline_color = "#1E293B" if theme == "light" else "#F8FAFC"
    if theme == "white":
        tagline_color = "#FFFFFF"
    elif theme == "mono":
        tagline_color = "#0B1B3B"
        
    mode = "color"
    if theme == "white":
        mode = "white"
    elif theme == "mono":
        mode = "monochrome"
        
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200" width="240" height="200">
{get_defs("stk") if mode == "color" else ""}
{get_symbol_group("stk", mode, "translate(70, 14)")}
  <!-- TUKUBI Wordmark -->
  <g transform="translate(30, 120) scale(0.45)">
    <path d="{wm_paths[0]}" fill="{text_color}" fill-rule="evenodd" />
  </g>
  <!-- The Caribbean Connected Tagline -->
  <g transform="translate(32, 164) scale(0.45)">
    <path d="{tl_paths[0]}" fill="{tagline_color}" fill-rule="evenodd" />
  </g>
</svg>'''
    return svg

def build_app_icon_svg(size=512, background="#0B1B3B", is_adaptive_foreground=False):
    # ViewBox: 512 x 512
    # Symbol placed in center with ~20% safe-zone margin
    # Symbol dimensions: 100x88 scaled by 3.6 -> 360x316.8
    # Centered at x = (512 - 360)/2 = 76, y = (512 - 316.8)/2 = 97.6
    if is_adaptive_foreground:
        # Transparent background, safe zone inside 72dp (inner 66%)
        # Scale: ~260x228, centered at x=126, y=142
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="{size}" height="{size}">
{get_defs("appfg")}
{get_symbol_group("appfg", "color", "translate(126, 142) scale(2.6)")}
</svg>'''
    else:
        # Squircle app icon with 112px border radius
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="{size}" height="{size}">
{get_defs("app")}
  <!-- Deep Navy Rounded Container -->
  <rect width="512" height="512" rx="112" fill="{background}" />
  <!-- Subtle Tropical Ambient Glow Behind Mark -->
  <circle cx="256" cy="230" r="180" fill="#00C2A8" opacity="0.12" filter="blur(40px)" />
  <circle cx="260" cy="280" r="160" fill="#8B5CF6" opacity="0.15" filter="blur(40px)" />
{get_symbol_group("app", "color", "translate(76, 96) scale(3.6)")}
</svg>'''
    return svg

def build_compact_nav_svg():
    # Compact logo for headers when space is tight:
    # Symbol (40x35) + "TUKUBI" wordmark (height 24px)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 60" width="280" height="60">
{get_defs("nav")}
{get_symbol_group("nav", "color", "translate(4, 4) scale(0.58)")}
  <!-- TUKUBI Wordmark -->
  <g transform="translate(70, 13) scale(0.44)">
    <path d="{wm_paths[0]}" fill="#FFFFFF" fill-rule="evenodd" />
  </g>
</svg>'''
    return svg

def main():
    out_dir = "scratch/master_brand_svgs"
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Symbol
    with open(f"{out_dir}/tukubi-symbol.svg", "w", encoding="utf-8") as f:
        f.write(build_symbol_svg("color"))
    with open(f"{out_dir}/tukubi-symbol-white.svg", "w", encoding="utf-8") as f:
        f.write(build_symbol_svg("white"))
    with open(f"{out_dir}/tukubi-symbol-monochrome.svg", "w", encoding="utf-8") as f:
        f.write(build_symbol_svg("monochrome"))
        
    # 2. Horizontal Logos
    with open(f"{out_dir}/tukubi-logo.svg", "w", encoding="utf-8") as f:
        f.write(build_horizontal_logo_svg("light", True))
    with open(f"{out_dir}/tukubi-logo-dark.svg", "w", encoding="utf-8") as f:
        f.write(build_horizontal_logo_svg("dark", True))
    with open(f"{out_dir}/tukubi-logo-white.svg", "w", encoding="utf-8") as f:
        f.write(build_horizontal_logo_svg("white", True))
    with open(f"{out_dir}/tukubi-logo-monochrome.svg", "w", encoding="utf-8") as f:
        f.write(build_horizontal_logo_svg("mono", True))
    with open(f"{out_dir}/tukubi-logo-compact.svg", "w", encoding="utf-8") as f:
        f.write(build_compact_nav_svg())
        
    # 3. Stacked Logos
    with open(f"{out_dir}/tukubi-logo-stacked.svg", "w", encoding="utf-8") as f:
        f.write(build_stacked_logo_svg("light"))
    with open(f"{out_dir}/tukubi-logo-stacked-dark.svg", "w", encoding="utf-8") as f:
        f.write(build_stacked_logo_svg("dark"))
        
    # 4. App Icon & Android Adaptive
    with open(f"{out_dir}/tukubi-app-icon.svg", "w", encoding="utf-8") as f:
        f.write(build_app_icon_svg(512))
    with open(f"{out_dir}/tukubi-app-icon-adaptive-foreground.svg", "w", encoding="utf-8") as f:
        f.write(build_app_icon_svg(512, is_adaptive_foreground=True))
    with open(f"{out_dir}/tukubi-app-icon-adaptive-background.svg", "w", encoding="utf-8") as f:
        f.write('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#0B1B3B" />
</svg>''')

    print("All master SVGs written to", out_dir)

if __name__ == "__main__":
    main()
