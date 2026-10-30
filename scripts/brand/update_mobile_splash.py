from PIL import Image
import shutil

def update_mobile():
    # 1. Update emblem and footer in mobile assets
    shutil.copy2("packages/design-system/brand/tukubi-emblem.png", "apps/mobile/assets/tukubi-emblem.png")
    shutil.copy2("packages/design-system/brand/tukubi-footer-dark.png", "apps/mobile/assets/tukubi-footer-dark.png")
    
    # 2. Build official splash screen (1284 x 2778, background #110D17)
    splash = Image.new("RGBA", (1284, 2778), (17, 13, 23, 255))
    
    # Load stacked dark logo
    logo = Image.open("packages/design-system/brand/tukubi-logo-stacked-dark.png").convert("RGBA")
    
    # Scale logo to ~760px wide
    target_w = 760
    target_h = int(logo.height * (target_w / logo.width))
    resized_logo = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Center on splash
    pos_x = (1284 - target_w) // 2
    pos_y = (2778 - target_h) // 2
    
    splash.paste(resized_logo, (pos_x, pos_y), resized_logo)
    splash.save("apps/mobile/assets/splash.png")
    print("Generated apps/mobile/assets/splash.png successfully")

if __name__ == "__main__":
    update_mobile()
