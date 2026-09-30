# Images folder

The site works fine with no images here at all — each level falls back to a
themed emoji automatically. To show real photos instead, add files with
these **exact names** (any roughly-square photo works; it's auto-cropped
into a circle):

| File name              | Level          |
|-------------------------|----------------|
| `quantum.jpg`            | Quantum Foam   |
| `microworld.jpg`         | Micro World    |
| `earth.jpg`              | Earth          |
| `solarsystem.jpg`        | Solar System   |
| `milkyway.jpg`           | Milky Way      |
| `universe.jpg`           | Universe       |
| `multiverse.jpg`         | Multiverse     |

Good free, real-photo sources:
- **NASA Image and Video Library** – images.nasa.gov (public domain)
- **ESA/Hubble** – esahubble.org (free for non-commercial use, credit required)
- **Unsplash** / **Pixabay** – good for microscope/abstract shots (Quantum
  Foam, Micro World, Multiverse have no literal "real photo," since they're
  either too small to photograph or theoretical)

`.jpg` is just the suggested format — `.png` or `.webp` also work, just
update the `src` in `index.html` to match.
