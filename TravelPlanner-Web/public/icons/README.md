# PWA Icons

This directory should contain PWA icons for Add to Home Screen functionality.

## Required Icons

- `icon-192x192.png` - 192x192 pixels
- `icon-512x512.png` - 512x512 pixels

## Creating Icons

You can create these icons using:

1. **Online tools**: https://realfavicongenerator.net/
2. **Image editors**: Photoshop, GIMP, Figma, etc.
3. **CLI tools**: `sharp` or `imagemagick`

## Temporary Solution

For testing, you can use any PNG image and resize it:

```bash
# Using ImageMagick
convert your-icon.png -resize 192x192 icon-192x192.png
convert your-icon.png -resize 512x512 icon-512x512.png
```

## Icon Design Guidelines

- Use a simple, recognizable logo
- Ensure good contrast on both light and dark backgrounds
- Leave padding around the logo
- Test on both iOS and Android devices
