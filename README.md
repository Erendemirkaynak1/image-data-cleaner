# ClearPixel — Image Privacy Studio

A privacy-first image cleaning and optimization app. Images are decoded, re-encoded and verified locally in the browser. No image upload service or AI API is involved.

## Features
- Batch upload with drag and drop (JPG, JPEG, PNG, WEBP; 50 MB per file)
- Browser-local metadata removal through canvas re-encoding
- Inspection of common EXIF fields, GPS, JPEG APP markers, PNG metadata chunks and WebP EXIF/XMP chunks
- Post-processing verification before a successful verification state is displayed
- Image quality control, proportional resizing and output format conversion
- PNG alpha transparency preserved on a transparent canvas
- SHA-256 duplicate-output detection
- Before/after preview, file size comparison and ZIP batch download
- Responsive dark and light themes
- Vitest unit tests and GitHub Actions CI

## Privacy and verification
Images are never sent to a backend. Canvas re-encoding creates a fresh image stream and normally discards embedded metadata. The output is inspected again:
- JPEG: APP1, APP13 and comment markers
- PNG: eXIf, tEXt, zTXt, iTXt and tIME chunks
- WebP: EXIF and XMP chunks
- JPEG EXIF fields are inspected with exifr when an EXIF APP1 segment is present; PNG and WEBP are verified through their native container chunk structures. JPEG APP markers, comments, PNG metadata chunks, and WEBP EXIF/XMP chunks are checked structurally.

The UI only labels a result as verified when structural and parser checks find no remaining metadata. Parser failures and malformed containers fail closed: the result is not offered for download. A failed verification is surfaced rather than described as clean. Browser encoders may normalize color profiles and encoding; lossy formats can have small visual differences. PNG alpha is retained.

## Run locally
Requires Node.js 22+.

    npm install
    npm run dev

## Quality checks
    npm test
    npm run build

## Docker
    docker build -t clearpixel .
    docker run --rm -p 8080:80 clearpixel

Open http://localhost:8080.

## Supported formats and limits
Input and output: JPEG, PNG, WEBP. Animated image formats are not accepted. Maximum input size is 50 MB per file. Inputs are validated against their binary file signatures, not trusted MIME labels. Images above 100 megapixels are rejected to limit memory exhaustion.

## Limitations
- Processing depends on browser canvas support and available device memory.
- Metadata inspection targets common privacy-relevant fields and known container chunks; it is not a forensic parser for every vendor-specific extension.
- Browser re-encoding can change visual encoding characteristics.
- SHA-256 detects identical processed outputs, not visually similar images.

## License
MIT. See LICENSE.
