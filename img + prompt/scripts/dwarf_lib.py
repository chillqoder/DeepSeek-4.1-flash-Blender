"""Shared helpers for building the steampunk dwarf in Blender.

All geometry is authored directly in world coordinates (metres, Z up,
character facing -Y).  The scene is rebuilt from scratch on every run.
"""
import bpy
import bmesh
import math
from mathutils import Vector, Matrix, Euler

COL = None
TAU = math.pi * 2.0

# ----------------------------------------------------------------------------
# colour helpers
# ----------------------------------------------------------------------------

def _s2l(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hx(h, a=1.0):
    """sRGB hex -> linear RGBA."""
    h = h.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    return (_s2l(r), _s2l(g), _s2l(b), a)


def darken(col, f):
    return (col[0] * f, col[1] * f, col[2] * f, col[3])


# ----------------------------------------------------------------------------
# scene / collection
# ----------------------------------------------------------------------------

def reset_scene(col_name="SteampunkDwarf"):
    global COL
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for lib in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras,
                bpy.data.lights, bpy.data.images, bpy.data.curves):
        for block in list(lib):
            if block.users == 0:
                try:
                    lib.remove(block)
                except Exception:
                    pass
    COL = bpy.data.collections.new(col_name)
    bpy.context.scene.collection.children.link(COL)
    return COL


# ----------------------------------------------------------------------------
# materials  (simple painted look: base colour + large mottling + gentle bump)
# ----------------------------------------------------------------------------

def make_mat(name, hexcol, rough=0.6, metal=0.0, variation=0.10,
             var_scale=6.0, dark_hex=None, bump=0.0, bump_scale=90.0,
             spec=0.5, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.use_backface_culling = False
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (600, 0)
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (280, 0)
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

    base = hx(hexcol)
    bsdf.inputs['Base Color'].default_value = base
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = spec
    if emission is not None:
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = hx(emission)
            bsdf.inputs['Emission Strength'].default_value = emission_strength
    mat.diffuse_color = base

    tc = None
    if variation > 0.0 or bump > 0.0:
        tc = nt.nodes.new('ShaderNodeTexCoord')
        tc.location = (-800, 200)

    if variation > 0.0:
        noise = nt.nodes.new('ShaderNodeTexNoise')
        noise.location = (-600, 250)
        noise.inputs['Scale'].default_value = var_scale
        noise.inputs['Detail'].default_value = 3.0
        noise.inputs['Roughness'].default_value = 0.55
        nt.links.new(tc.outputs['Object'], noise.inputs['Vector'])

        ramp = nt.nodes.new('ShaderNodeValToRGB')
        ramp.location = (-350, 250)
        ramp.color_ramp.elements[0].position = 0.34
        ramp.color_ramp.elements[1].position = 0.70
        dark = hx(dark_hex) if dark_hex else darken(base, max(0.0, 1.0 - variation * 2.4))
        ramp.color_ramp.elements[0].color = dark
        ramp.color_ramp.elements[1].color = base
        nt.links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
        nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])

    if bump > 0.0:
        n2 = nt.nodes.new('ShaderNodeTexNoise')
        n2.location = (-600, -100)
        n2.inputs['Scale'].default_value = bump_scale
        n2.inputs['Detail'].default_value = 4.0
        n2.inputs['Roughness'].default_value = 0.6
        nt.links.new(tc.outputs['Object'], n2.inputs['Vector'])
        bmp = nt.nodes.new('ShaderNodeBump')
        bmp.location = (-250, -100)
        bmp.inputs['Strength'].default_value = bump
        bmp.inputs['Distance'].default_value = 0.0015
        nt.links.new(n2.outputs['Fac'], bmp.inputs['Height'])
        nt.links.new(bmp.outputs['Normal'], bsdf.inputs['Normal'])

    return mat


# ----------------------------------------------------------------------------
# low level mesh helpers
# ----------------------------------------------------------------------------

def _finish(name, verts, faces, mat=None, smooth=False):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    me.validate(verbose=False)
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    COL.objects.link(ob)
    if mat is not None:
        me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = smooth
    return ob


def se(a, k):
    c, s = math.cos(a), math.sin(a)
    if k == 1.0:
        return c, s
    return (math.copysign(abs(c) ** k, c), math.copysign(abs(s) ** k, s))


def ring_xy(cx, cy, z, rx, ry, n=12, k=1.0, phase=0.0):
    out = []
    for i in range(n):
        c, s = se(TAU * i / n + phase, k)
        out.append(Vector((cx + rx * c, cy + ry * s, z)))
    return out


def ring_yz(x, cy, cz, ry, rz, n=10, k=1.0, phase=0.0):
    out = []
    for i in range(n):
        c, s = se(TAU * i / n + phase, k)
        out.append(Vector((x, cy + ry * c, cz + rz * s)))
    return out


def ring_xz(cx, y, cz, rx, rz, n=12, k=1.0, phase=0.0):
    out = []
    for i in range(n):
        c, s = se(TAU * i / n + phase, k)
        out.append(Vector((cx + rx * c, y, cz + rz * s)))
    return out


def loft(name, rings, mat=None, smooth=False, caps=(True, True),
         closed_path=False):
    n = len(rings[0])
    verts = []
    for r in rings:
        verts.extend(r)
    faces = []
    m = len(rings)
    count = m if closed_path else m - 1
    for i in range(count):
        i2 = (i + 1) % m
        for j in range(n):
            j2 = (j + 1) % n
            faces.append((i * n + j, i * n + j2, i2 * n + j2, i2 * n + j))
    if not closed_path:
        if caps[0]:
            faces.append(tuple(reversed(range(n))))
        if caps[1]:
            faces.append(tuple((m - 1) * n + j for j in range(n)))
    return _finish(name, verts, faces, mat, smooth)


def tube(name, pts, radii, mat=None, n=8, k=1.0, smooth=False,
         up=(0, 0, 1), phase=0.0, caps=True):
    pts = [Vector(p) for p in pts]
    rings = []
    for i, p in enumerate(pts):
        if i == 0:
            t = pts[1] - p
        elif i == len(pts) - 1:
            t = p - pts[-2]
        else:
            t = pts[i + 1] - pts[i - 1]
        t.normalize()
        ref = Vector(up)
        if abs(t.dot(ref)) > 0.95:
            ref = Vector((0, 1, 0)) if abs(t.y) < 0.9 else Vector((1, 0, 0))
        side = t.cross(ref).normalized()
        up2 = side.cross(t).normalized()
        r = radii[i]
        rs, ru = (r, r) if isinstance(r, (int, float)) else (r[0], r[1])
        ring = []
        for j in range(n):
            c, s = se(TAU * j / n + phase, k)
            ring.append(p + side * (rs * c) + up2 * (ru * s))
        rings.append(ring)
    return loft(name, rings, mat, smooth, caps, caps)


def box(name, center, size, mat=None, rot=(0, 0, 0), bevel=0.0,
        smooth=False):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
    if bevel > 0.0:
        try:
            bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel,
                            segments=1, affect='EDGES')
        except Exception:
            pass
    M = Matrix.Translation(Vector(center)) @ Euler(rot, 'XYZ').to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    COL.objects.link(ob)
    if mat:
        me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = smooth
    return ob


def cyl(name, center, r, depth, axis='Z', n=12, mat=None, smooth=False,
        taper=1.0, k=1.0, caps=True):
    cx, cy, cz = center
    if axis == 'Z':
        rings = [ring_xy(cx, cy, cz - depth / 2, r, r, n, k),
                 ring_xy(cx, cy, cz + depth / 2, r * taper, r * taper, n, k)]
    elif axis == 'Y':
        rings = [ring_xz(cx, cy - depth / 2, cz, r, r, n, k),
                 ring_xz(cx, cy + depth / 2, cz, r * taper, r * taper, n, k)]
    else:
        rings = [ring_yz(cx - depth / 2, cy, cz, r, r, n, k),
                 ring_yz(cx + depth / 2, cy, cz, r * taper, r * taper, n, k)]
    return loft(name, rings, mat, smooth, caps, caps)


def frame_poly(name, n, ro, ri, depth, mat, M=None, phase=math.pi / 8,
               smooth=False):
    """Octagonal / polygonal washer in local XZ plane, thickness along Y."""
    verts = []
    for y in (-depth / 2, depth / 2):
        for rr in (ro, ri):
            for j in range(n):
                a = TAU * j / n + phase
                verts.append(Vector((rr * math.cos(a), y, rr * math.sin(a))))
    # index blocks: 0 outer front, n inner front, 2n outer back, 3n inner back
    faces = []
    for j in range(n):
        j2 = (j + 1) % n
        of, of2 = j, j2
        inf, inf2 = n + j, n + j2
        ob_, ob2 = 2 * n + j, 2 * n + j2
        ib, ib2 = 3 * n + j, 3 * n + j2
        faces.append((of, of2, inf2, inf))
        faces.append((ob_, ib, ib2, ob2))
        faces.append((of, ob_, ob2, of2))
        faces.append((inf, inf2, ib2, ib))
    if M is not None:
        verts = [M @ v for v in verts]
    return _finish(name, verts, faces, mat, smooth)


def ring_frame_xz(name, cx, cy, cz, ow, oh, th, depth, mat, bevel=0.0,
                  n=20, k=0.35, smooth=False):
    """Rounded rectangular ring (buckle) facing -Y."""
    verts = []
    for y in (cy - depth / 2, cy + depth / 2):
        for hw, hh in ((ow / 2, oh / 2), (ow / 2 - th, oh / 2 - th)):
            for j in range(n):
                c, s = se(TAU * j / n + math.pi / n, k)
                verts.append(Vector((cx + hw * c, y, cz + hh * s)))
    faces = []
    for j in range(n):
        j2 = (j + 1) % n
        of, of2 = j, j2
        inf, inf2 = n + j, n + j2
        ob_, ob2 = 2 * n + j, 2 * n + j2
        ib, ib2 = 3 * n + j, 3 * n + j2
        faces.append((of, of2, inf2, inf))
        faces.append((ob_, ib, ib2, ob2))
        faces.append((of, ob_, ob2, of2))
        faces.append((inf, inf2, ib2, ib))
    return _finish(name, verts, faces, mat, smooth)


def transform_obj(ob, loc=(0, 0, 0), rot=(0, 0, 0)):
    ob.matrix_world = (Matrix.Translation(Vector(loc)) @
                       Euler(rot, 'XYZ').to_matrix().to_4x4())
    return ob


def rivet(name, pos, mat, r=0.008):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=r)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(pos)),
                        verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    COL.objects.link(ob)
    me.materials.append(mat)
    return ob


def torus(name, center, R, r, mat, n_major=10, n_minor=4, axis='Y'):
    """Small torus, major ring in the plane perpendicular to axis."""
    verts = []
    for i in range(n_major):
        a = TAU * i / n_major
        cx, cy, cz = math.cos(a) * R, 0.0, math.sin(a) * R
        for j in range(n_minor):
            b = TAU * j / n_minor
            rr = R + r * math.cos(b)
            x = rr * math.cos(a)
            z = rr * math.sin(a)
            y = r * math.sin(b)
            verts.append(Vector((x, y, z)))
    faces = []
    for i in range(n_major):
        i2 = (i + 1) % n_major
        for j in range(n_minor):
            j2 = (j + 1) % n_minor
            faces.append((i * n_minor + j, i2 * n_minor + j,
                          i2 * n_minor + j2, i * n_minor + j2))
    ob = _finish(name, verts, faces, mat, smooth=True)
    ob.location = Vector(center)
    if axis == 'Z':
        ob.rotation_euler = (math.pi / 2, 0, 0)
    elif axis == 'X':
        ob.rotation_euler = (0, math.pi / 2, 0)
    return ob


# ----------------------------------------------------------------------------
# scene setup
# ----------------------------------------------------------------------------

def add_camera(name, loc, rot=None, ortho=None, lens=50.0, look_at=None):
    cam_data = bpy.data.cameras.new(name)
    cam = bpy.data.objects.new(name, cam_data)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = Vector(loc)
    if look_at is not None:
        d = Vector(look_at) - Vector(loc)
        cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    elif rot is not None:
        cam.rotation_euler = Euler(rot, 'XYZ')
    if ortho is not None:
        cam_data.type = 'ORTHO'
        cam_data.ortho_scale = ortho
    else:
        cam_data.lens = lens
    return cam


def add_area(name, loc, energy, size, color=(1, 1, 1), look_at=(0, 0, 0.9)):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.energy = energy
    ld.shape = 'DISK'
    ld.size = size
    ld.color = color
    ob = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = Vector(loc)
    d = Vector(look_at) - Vector(loc)
    ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return ob


def setup_render(res=(1200, 900), samples=48):
    scene = bpy.context.scene
    for engine in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE', 'BLENDER_EEVEE_LEGACY'):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    try:
        scene.eevee.taa_render_samples = samples
    except Exception:
        try:
            scene.eevee.taa_samples = samples
        except Exception:
            pass
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = False
    scene.view_settings.view_transform = 'AgX'
    try:
        scene.view_settings.look = 'AgX - Medium High Contrast'
    except Exception:
        pass
    scene.view_settings.exposure = 0.35
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    bg = nt.nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.92, 0.92, 0.92, 1.0)
    bg.inputs['Strength'].default_value = 0.7
    out = nt.nodes.new('ShaderNodeOutputWorld')
    nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
    return scene


def render_to(path, cam):
    scene = bpy.context.scene
    scene.camera = cam
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return path


def tri_count():
    total = 0
    per = {}
    for ob in COL.objects if COL else []:
        if ob.type == 'MESH':
            me = ob.data
            me.calc_loop_triangles()
            n = len(me.loop_triangles)
            per[ob.name] = n
            total += n
    return total, per
