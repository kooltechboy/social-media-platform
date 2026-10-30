import os
from PIL import Image

def build_ico():
    brand_dir = "packages/design-system/brand"
    f16 = Image.open(f"{brand_dir}/favicon-16.png")
    f32 = Image.open(f"{brand_dir}/favicon-32.png")
    f48 = Image.open(f"{brand_dir}/favicon-48.png")
    
    ico_path = f"{brand_dir}/favicon.ico"
    f48.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Generated multi-resolution ICO: {ico_path}")

if __name__ == "__main__":
    build_ico()
