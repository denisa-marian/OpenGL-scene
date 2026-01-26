# OpenGL-scene

## Overview
This project implements an interactive **OpenGL 4.1** 3D scene featuring first-person navigation, rendering of a complex island environment, animated water with a dedicated shader, a skybox, fog effects, and a rotating lighthouse with a spotlight and a volumetric light beam.

The application also includes looping ambient ocean wave sounds.

The goal is to practice the **modern OpenGL pipeline**, real-time lighting, procedural visual effects, and integration of **OBJ/MTL** 3D models using common libraries for windowing, asset loading, and 3D math.

---

## Scene
The scene depicts an island with terrain and static beach-themed objects such as:
- Sand beach
- Houses and harbor elements
- Boats, deck chairs, umbrellas, hammock
- Palm trees
- Lighthouse and other beach props

Lighting includes a **directional sunlight**. In the lighthouse area, a **spotlight** can be toggled with the **L** key. It rotates continuously and creates a “flash” effect when aligned with the camera.

### Dynamic Elements
- **Dolphin** – periodic jumping animation above the water
- **Seagull** – elliptical flight path above the scene, with small vertical oscillation and wing flapping
- **Water** – separate rendering pass with wave shader, UV distortion, and procedural normals
- **Lighthouse beam** – transparent cone rendered with additive blending, length attenuation, and volumetric noise

---

## Features
- **First-person camera** movement (W/A/S/D) and mouse look (yaw/pitch)
- **Simplified collision system**
  - Camera approximated as a sphere
  - Constrained within terrain bounds
  - Building collisions handled with AABB “push-out” resolution
- **Automatic camera tour** along predefined points, with smooth orientation along the path
- **Fog system**
  - Global fog
  - Local fog around the island
  - Toggle with **F**
- **Lighthouse control**
  - Spotlight + volumetric beam toggle with **L**
- **Ambient audio**
  - Looping wave sound
- **Rendering modes**
  - **1** – Solid (default)
  - **2** – Wireframe (geometry debugging)
  - **3** – Points (mesh density inspection)

---

## Implementation Notes

### Design Choices
- **Model loading:** chosen for simplicity and sufficient support for OBJ/MTL assets
- **Collisions:** simplified volumes (sphere + AABB) preferred over heavy per-triangle methods for a static educational scene
- **Water:** shader-based surface detail (procedural normals + UV distortion) used to keep performance stable on large surfaces
- **Fog:** exponential fog enhanced with fractal noise for a more natural, “wispy” look
- **Volumetric beam:** implemented as cone geometry with additive blending to make the beam visible in air, not just as a light source

### Graphics Pipeline
- Uses **modern OpenGL** with VAO/VBO/EBO where needed (including skybox and beam geometry)
- Separate shaders for:
  - main scene lighting + fog
  - water
  - skybox (cubemap)
  - volumetric beam
- **Depth testing** enabled, with the skybox rendered behind everything
- **Blending**
  - Alpha blending for water
  - Additive blending for the lighthouse beam glow

---

## Main Data Structures
- Camera tour points with cumulative distance parameterization
- **AABB** boxes for buildings/terrain bounds
- Mesh structures containing vertices, indices, textures, and GPU buffers
- Model container holding multiple meshes and a marker for water meshes rendered in a separate pass

---

## Class Structure
A minimal design focused on clear separation of responsibilities:
- **Shader**: load/use shader programs
- **Camera**: movement, rotation, view matrix, smooth look-at for tour mode
- **Model3D**: model loading and rendering (solid/water separation)
- **Mesh**: GPU buffer setup and draw calls
- **Audio module**: looping playback and listener updates based on camera position

---

## Controls
The app runs in a GLFW window with FPS-style mouse capture. Press **ESC** to exit.

| Input | Action |
|------|--------|
| **W / A / S / D** | Move forward / left / backward / right |
| **Mouse** | Look around (yaw/pitch) |
| **F** | Toggle fog (global + island fog) |
| **L** | Toggle lighthouse (spotlight + beam) |
| **T** | Start automatic camera tour |
| **Y** | Stop automatic camera tour |
| **P** | Print camera position to console |
| **1** | Solid rendering mode |
| **2** | Wireframe mode |
| **3** | Points mode |
| **ESC** | Exit |

**Note:** During the automatic camera tour, mouse input is disabled to preserve smooth orientation controlled by the tour algorithm.

<img width="899" height="506" alt="image" src="https://github.com/user-attachments/assets/9439c73c-7759-4ffe-b42b-f17df54b7883" />
<img width="898" height="511" alt="image" src="https://github.com/user-attachments/assets/681ae9a9-91de-4a7f-87bb-4dca5b492abb" />
<img width="898" height="518" alt="image" src="https://github.com/user-attachments/assets/8ecc64cd-9d08-48b8-b0b9-786a013cbc4f" />
<img width="899" height="513" alt="image" src="https://github.com/user-attachments/assets/d56b5bf6-50c3-49ad-9318-03cd31984e22" />
<img width="2879" height="1700" alt="MarianDenisa_gr30232_scr" src="https://github.com/user-attachments/assets/277c9459-2138-4052-a45e-adfbcb82ca6c" />





