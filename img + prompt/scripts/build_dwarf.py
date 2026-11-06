"""Build the steampunk dwarf character (T-pose) in Blender.

Run inside Blender:  exec(open("<project>/scripts/build_dwarf.py").read())
"""
import bpy
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else None
if HERE and HERE not in sys.path:
    sys.path.insert(0, HERE)

import dwarf_lib as L
from dwarf_lib import (hx, make_mat, ring_xy, ring_yz, ring_xz, loft, tube,
                       box, cyl, frame_poly, ring_frame_xz, rivet, torus,
                       transform_obj, add_camera, add_area, setup_render,
                       render_to, tri_count)

PROJECT = "/Users/konstantin/Documents/Dev/DeepSeek 4.1 flash Blender/img + prompt"
RENDERS = os.path.join(PROJECT, "renders")
os.makedirs(RENDERS, exist_ok=True)

TAU = math.pi * 2
# ----------------------------------------------------------------------------
# scene + materials
# ----------------------------------------------------------------------------
L.reset_scene("SteampunkDwarf")

MAT = {}
MAT['skin'] = make_mat("Skin", "#C68B63", rough=0.62, variation=0.10,
                       var_scale=9.0, bump=0.06, bump_scale=150)
MAT['skin_nose'] = make_mat("Skin_Nose", "#C47C58", rough=0.6,
                            variation=0.10, var_scale=12, bump=0.06, bump_scale=150)
MAT['skin_cheek'] = make_mat("Skin_Cheek", "#C88463", rough=0.62,
                             variation=0.10, var_scale=10)
MAT['lip'] = make_mat("Skin_Lip", "#A96852", rough=0.55, variation=0.08)
MAT['beard'] = make_mat("Beard_Copper", "#A9582B", rough=0.58,
                        variation=0.20, var_scale=12, bump=0.14,
                        bump_scale=170)
MAT['beard_dark'] = make_mat("Beard_CopperDark", "#8C4520", rough=0.6,
                             variation=0.18, var_scale=13, bump=0.14,
                             bump_scale=170)
MAT['brow'] = make_mat("Brow_Copper", "#94481F", rough=0.6,
                       variation=0.16, var_scale=14)
MAT['hat'] = make_mat("Leather_Hat", "#5A3523", rough=0.66, variation=0.16,
                      var_scale=7, bump=0.10, bump_scale=110)
MAT['hat_dark'] = make_mat("Leather_HatDark", "#40251A", rough=0.7,
                           variation=0.12, var_scale=9, bump=0.08)
MAT['vest'] = make_mat("Leather_Vest", "#6A3C25", rough=0.62,
                       variation=0.18, var_scale=6, bump=0.10,
                       bump_scale=120)
MAT['vest_dark'] = make_mat("Leather_VestDark", "#482819", rough=0.66,
                            variation=0.14, var_scale=8, bump=0.08)
MAT['belt'] = make_mat("Leather_Belt", "#8A4C2C", rough=0.6,
                       variation=0.16, var_scale=8, bump=0.08,
                       bump_scale=130)
MAT['shirt'] = make_mat("Cloth_Shirt", "#C4B18C", rough=0.82,
                        variation=0.12, var_scale=10, bump=0.06,
                        bump_scale=180)
MAT['shirt_dark'] = make_mat("Cloth_ShirtShade", "#A8946F", rough=0.85,
                             variation=0.10, var_scale=10)
MAT['pants'] = make_mat("Cloth_Pants", "#7A5935", rough=0.85,
                        variation=0.14, var_scale=8, bump=0.06,
                        bump_scale=150)
MAT['boot'] = make_mat("Leather_Boot", "#5A3321", rough=0.62,
                       variation=0.16, var_scale=7, bump=0.10,
                       bump_scale=120)
MAT['sole'] = make_mat("Leather_Sole", "#352216", rough=0.8,
                       variation=0.10, var_scale=8)
MAT['brass'] = make_mat("Brass", "#B18A45", rough=0.34, metal=1.0,
                        variation=0.30, var_scale=14, dark_hex="#6B4E21",
                        bump=0.05, bump_scale=140, spec=0.6)
MAT['brass_dark'] = make_mat("Brass_Dark", "#8A6A32", rough=0.5, metal=1.0,
                             variation=0.22, var_scale=16, dark_hex="#503A16")
MAT['steel'] = make_mat("Steel", "#A6A6A2", rough=0.3, metal=1.0,
                        variation=0.10, var_scale=10)
MAT['glass'] = make_mat("Lens_Glass", "#7E8787", rough=0.12, metal=0.15,
                        variation=0.06, var_scale=8, spec=0.8)
MAT['eye_white'] = make_mat("Eye_White", "#E8DECE", rough=0.3, variation=0.03)
MAT['iris'] = make_mat("Eye_Iris", "#4B2C16", rough=0.35, variation=0.05)
MAT['pupil'] = make_mat("Eye_Pupil", "#0B0806", rough=0.4, variation=0.0)
MAT['watch_face'] = make_mat("Watch_Face", "#D9CBA8", rough=0.5,
                             variation=0.05)
MAT['dark'] = make_mat("Dark_Detail", "#2A1C12", rough=0.7, variation=0.05)

# ----------------------------------------------------------------------------
# torso / shirt
# ----------------------------------------------------------------------------
SHIRT_Z = 1.15


def build_shirt():
    rings = [
        ring_xy(0, 0, 0.695, 0.250, 0.163, 14, 0.82),
        ring_xy(0, 0, 0.760, 0.258, 0.168, 14, 0.82),
        ring_xy(0, 0, 0.850, 0.264, 0.174, 14, 0.82),
        ring_xy(0, 0, 0.950, 0.270, 0.180, 14, 0.82),
        ring_xy(0, 0, 1.040, 0.268, 0.182, 14, 0.82),
        ring_xy(0, 0, 1.115, 0.250, 0.172, 14, 0.82),
        ring_xy(0, 0, 1.175, 0.205, 0.150, 14, 0.82),
        ring_xy(0, 0, 1.215, 0.140, 0.115, 14, 0.82),
        ring_xy(0, 0, 1.235, 0.100, 0.092, 14, 0.82),
    ]
    loft("Shirt_Torso", rings, MAT['shirt'], smooth=True)
    # collar rim
    cr = [ring_xy(0, 0, 1.205, 0.108, 0.098, 12, 0.9),
          ring_xy(0, 0, 1.238, 0.112, 0.102, 12, 0.9)]
    loft("Shirt_Collar", cr, MAT['shirt_dark'], smooth=True, caps=(False, False))


def build_sleeves():
    for s, side in ((1, 'L'), (-1, 'R')):
        rings = []
        data = [(0.225, 0.112, 0.122), (0.255, 0.126, 0.136),
                (0.290, 0.130, 0.140), (0.335, 0.121, 0.128),
                (0.395, 0.113, 0.118), (0.465, 0.109, 0.113),
                (0.520, 0.106, 0.109), (0.548, 0.104, 0.106)]
        for x, ry, rz in data:
            rings.append(ring_yz(s * x, 0, SHIRT_Z, ry, rz, 10, 0.86))
        loft("Sleeve." + side, rings, MAT['shirt'], smooth=True)
        # rolled cuff
        crings = []
        cdata = [(0.535, 0.110, 0.112), (0.548, 0.124, 0.126),
                 (0.578, 0.128, 0.130), (0.604, 0.120, 0.122),
                 (0.616, 0.108, 0.110)]
        for x, ry, rz in cdata:
            crings.append(ring_yz(s * x, 0, SHIRT_Z, ry, rz, 10, 0.86))
        loft("SleeveCuff." + side, crings, MAT['shirt_dark'], smooth=True)
        # a couple of fabric fold ridges on the upper sleeve
        for k, (x, ang) in enumerate(((0.34, 0.6), (0.43, 2.4))):
            pts = []
            for i in range(5):
                a = ang + i * 0.25
                pts.append((s * (x + i * 0.018), math.sin(a) * 0.105,
                            SHIRT_Z + math.cos(a) * 0.112))
            tube("SleeveFold_%s%d" % (side, k), pts,
                 [0.006, 0.009, 0.010, 0.008, 0.005], MAT['shirt_dark'],
                 n=5, smooth=True)


# ----------------------------------------------------------------------------
# vest
# ----------------------------------------------------------------------------

def build_vest():
    rings = [
        ring_xy(0, 0, 0.635, 0.263, 0.174, 16, 0.82),
        ring_xy(0, 0, 0.720, 0.272, 0.181, 16, 0.82),
        ring_xy(0, 0, 0.820, 0.279, 0.187, 16, 0.82),
        ring_xy(0, 0, 0.930, 0.283, 0.191, 16, 0.82),
        ring_xy(0, 0, 1.020, 0.280, 0.190, 16, 0.82),
        ring_xy(0, 0, 1.085, 0.262, 0.181, 16, 0.82),
        ring_xy(0, 0, 1.125, 0.230, 0.164, 16, 0.82),
    ]
    loft("Vest", rings, MAT['vest'], smooth=True, caps=(True, False))
    # front placket
    box("Vest_Placket", (0, -0.196, 0.86), (0.032, 0.014, 0.30),
        MAT['vest_dark'], bevel=0.004)
    # buttons
    for z in (0.945, 0.885, 0.825):
        cyl("Vest_Button_%d" % int(z * 1000), (0, -0.209, z), 0.014, 0.010,
            axis='Y', n=10, mat=MAT['brass'])
    # left chest pocket (viewer left, x<0) with watch chain
    box("Vest_PocketL", (-0.163, -0.196, 0.958), (0.088, 0.024, 0.078),
        MAT['vest_dark'], bevel=0.006)
    box("Vest_PocketL_Flap", (-0.163, -0.209, 0.995), (0.096, 0.022, 0.032),
        MAT['vest'], bevel=0.005)
    rivet("Vest_PocketL_Riv1", (-0.196, -0.202, 0.963), MAT['brass'], 0.007)
    rivet("Vest_PocketL_Riv2", (-0.130, -0.202, 0.963), MAT['brass'], 0.007)
    rivet("Vest_PocketL_Riv3", (-0.163, -0.216, 0.995), MAT['brass'], 0.006)
    # right lower pocket (viewer right, x>0)
    box("Vest_PocketR", (0.160, -0.197, 0.848), (0.112, 0.024, 0.088),
        MAT['vest_dark'], bevel=0.006)
    box("Vest_PocketR_Flap", (0.160, -0.209, 0.895), (0.120, 0.022, 0.034),
        MAT['vest'], bevel=0.005)
    cyl("Vest_PocketR_Button", (0.160, -0.222, 0.886), 0.011, 0.008,
        axis='Y', n=8, mat=MAT['brass'])
    # gear brooch
    build_gear("Vest_Gear", (0.166, -0.202, 0.995), 0.052, 0.020)
    # rivets along armhole / shoulder edges
    for s, side in ((1, 'L'), (-1, 'R')):
        pts = [(0.236, -0.120, 1.070), (0.252, -0.075, 1.095),
               (0.258, -0.020, 1.105), (0.252, 0.040, 1.098),
               (0.236, 0.095, 1.078)]
        for i, p in enumerate(pts):
            rivet("Vest_Riv_%s%d" % (side, i), (s * p[0], p[1], p[2]),
                  MAT['brass'], 0.0075)
        # front edge rivets
        for i, z in enumerate((0.79, 0.86, 0.93, 1.00, 1.06)):
            rivet("Vest_FrontRiv_%s%d" % (side, i),
                  (s * 0.055, -0.198 - 0.006 * (z > 0.9), z),
                  MAT['brass'], 0.0065)


def build_gear(name, center, radius, depth):
    cx, cy, cz = center
    teeth = 9
    pts = []
    n = teeth * 2
    for i in range(n):
        a = TAU * i / n
        r = radius if i % 2 == 0 else radius * 0.78
        pts.append((cx + math.cos(a) * r, cz + math.sin(a) * r))
    verts = []
    for y in (cy - depth / 2, cy + depth / 2):
        for x, z in pts:
            verts.append((x, y, z))
    faces = []
    for i in range(n):
        i2 = (i + 1) % n
        faces.append((i, i2, n + i2, n + i))
    faces.append(tuple(reversed(range(n))))
    faces.append(tuple(n + i for i in range(n)))
    ob = L._finish(name, verts, faces, MAT['brass'], smooth=False)
    cyl(name + "_Inset", (cx, cy - depth / 2 - 0.002, cz), radius * 0.48,
        0.006, axis='Y', n=12, mat=MAT['dark'])
    cyl(name + "_Hub", (cx, cy - depth / 2 - 0.006, cz), radius * 0.20,
        0.012, axis='Y', n=8, mat=MAT['brass'])
    # spokes
    for i in range(6):
        a = TAU * i / 6
        box(name + "_Spoke%d" % i,
            (cx + math.cos(a) * radius * 0.33, cy - depth / 2 - 0.004,
             cz + math.sin(a) * radius * 0.33),
            (radius * 0.36, 0.006, radius * 0.10), MAT['brass'],
            rot=(0, -a, 0))
    return ob


# ----------------------------------------------------------------------------
# pants / pelvis
# ----------------------------------------------------------------------------

def build_pants():
    rings = [
        ring_xy(0, 0, 0.790, 0.262, 0.176, 14, 0.84),
        ring_xy(0, 0, 0.730, 0.280, 0.184, 14, 0.84),
        ring_xy(0, 0, 0.660, 0.291, 0.190, 14, 0.84),
        ring_xy(0, 0, 0.590, 0.292, 0.188, 14, 0.84),
        ring_xy(0, 0, 0.530, 0.278, 0.178, 14, 0.84),
        ring_xy(0, 0, 0.490, 0.250, 0.164, 14, 0.84),
    ]
    loft("Pants_Pelvis", rings, MAT['pants'], smooth=True)
    for s, side in ((1, 'L'), (-1, 'R')):
        data = [(0.640, 0.154, 0.164, 0.163),
                (0.575, 0.161, 0.170, 0.170),
                (0.510, 0.159, 0.166, 0.176),
                (0.455, 0.151, 0.157, 0.180),
                (0.410, 0.146, 0.151, 0.182),
                (0.375, 0.151, 0.155, 0.184),
                (0.350, 0.140, 0.144, 0.185),
                (0.334, 0.124, 0.130, 0.185)]
        rings = []
        for z, rx, ry, cx in data:
            rings.append(ring_xy(s * cx, 0, z, rx, ry, 12, 0.84))
        loft("Pants_Leg." + side, rings, MAT['pants'], smooth=True)
        # fly / crease strip
        if s == 1:
            box("Pants_Fly", (0.016, -0.166, 0.585), (0.020, 0.010, 0.115),
                MAT['pants'], rot=(0, 0, -0.05))
            cyl("Pants_Button", (0.016, -0.174, 0.636), 0.012, 0.008,
                axis='Y', n=8, mat=MAT['brass'])
    # knee / crotch folds
    for s, side in ((1, 'L'), (-1, 'R')):
        for i, (x, z, ln) in enumerate(((0.185, 0.455, 0.10),
                                        (0.235, 0.405, 0.085),
                                        (0.150, 0.560, 0.09))):
            tube("Pants_Fold_%s%d" % (side, i),
                 [(s * (x - 0.02), -0.165, z + ln / 2),
                  (s * x, -0.172, z),
                  (s * (x + 0.012), -0.160, z - ln / 2)],
                 [0.004, 0.006, 0.004], MAT['pants'], n=4, smooth=True)


# ----------------------------------------------------------------------------
# boots
# ----------------------------------------------------------------------------

BOOT_X = 0.185


def build_boots():
    for s, side in ((1, 'L'), (-1, 'R')):
        bx = s * BOOT_X
        # sole
        srings = [
            ring_xy(bx, -0.06, 0.000, 0.105, 0.170, 14, 0.5),
            ring_xy(bx, -0.06, 0.018, 0.123, 0.192, 14, 0.5),
            ring_xy(bx, -0.06, 0.045, 0.119, 0.188, 14, 0.5),
        ]
        loft("Boot_Sole." + side, srings, MAT['sole'], smooth=False)
        # foot upper
        data = [(0.038, 0.116, 0.188, -0.060),
                (0.065, 0.117, 0.184, -0.060),
                (0.095, 0.114, 0.174, -0.055),
                (0.125, 0.107, 0.160, -0.045),
                (0.155, 0.098, 0.140, -0.030),
                (0.185, 0.090, 0.118, -0.012),
                (0.210, 0.085, 0.102, 0.000),
                (0.225, 0.083, 0.096, 0.004)]
        rings = []
        for z, rx, ry, cy in data:
            rings.append(ring_xy(bx, cy, z, rx, ry, 12, 0.64))
        loft("Boot_Foot." + side, rings, MAT['boot'], smooth=True)
        # shaft
        rings = [ring_xy(bx, 0.004, 0.190, 0.088, 0.100, 10, 0.74),
                 ring_xy(bx, 0.002, 0.245, 0.094, 0.108, 10, 0.74),
                 ring_xy(bx, 0.002, 0.300, 0.099, 0.113, 10, 0.74),
                 ring_xy(bx, 0.002, 0.330, 0.103, 0.117, 10, 0.74)]
        loft("Boot_Shaft." + side, rings, MAT['boot'], smooth=True)
        # top rolled band
        rings = [ring_xy(bx, 0.002, 0.318, 0.108, 0.122, 10, 0.74),
                 ring_xy(bx, 0.002, 0.338, 0.109, 0.123, 10, 0.74)]
        loft("Boot_TopBand." + side, rings, MAT['hat_dark'],
             smooth=False, caps=(False, False))
        # brass toe cap
        caps = [(-0.238, 0.023, 0.027, 0.074),
                (-0.215, 0.062, 0.040, 0.082),
                (-0.180, 0.096, 0.055, 0.090),
                (-0.145, 0.113, 0.062, 0.099),
                (-0.108, 0.119, 0.066, 0.104)]
        rings = []
        for y, rx, rz, cz in caps:
            rings.append(ring_xz(bx, y, cz, rx, rz, 10, 0.55))
        loft("Boot_ToeCap." + side, rings, MAT['brass'], smooth=False)
        # toe rivets
        for i, (x, y, z) in enumerate(((-0.060, -0.193, 0.122),
                                       (0.060, -0.193, 0.122),
                                       (-0.094, -0.155, 0.104),
                                       (0.094, -0.155, 0.104),
                                       (0.0, -0.208, 0.135))):
            rivet("Boot_ToeRiv_%s%d" % (side, i), (bx + x, y, z),
                  MAT['brass'], 0.0085)
        # ankle strap
        rings = [ring_xy(bx, 0.002, 0.286, 0.104, 0.118, 10, 0.74),
                 ring_xy(bx, 0.002, 0.322, 0.106, 0.120, 10, 0.74)]
        loft("Boot_Strap." + side, rings, MAT['belt'], smooth=False,
             caps=(False, False))
        ring_frame_xz("Boot_Buckle." + side,
                      (bx + s * 0.030, -0.113, 0.306),
                      0.050, 0.044, 0.008, 0.012, MAT['brass'], n=12)
        box("Boot_BuckleProng." + side,
            (bx + s * 0.030, -0.121, 0.306), (0.006, 0.006, 0.032),
            MAT['brass'])
        # shaft strap rivets
        for i, (x, y, z) in enumerate(((-0.090, -0.060, 0.304),
                                       (0.090, -0.060, 0.304))):
            rivet("Boot_StrapRiv_%s%d" % (side, i), (bx + x, y, z),
                  MAT['brass'], 0.007)
        # heel
        box("Boot_Heel." + side, (bx, 0.075, 0.022), (0.170, 0.085, 0.044),
            MAT['sole'], bevel=0.008)


# ----------------------------------------------------------------------------
# arms / hands
# ----------------------------------------------------------------------------

def build_arms():
    for s, side in ((1, 'L'), (-1, 'R')):
        data = [(0.555, 0.089, 0.094, 0.0),
                (0.600, 0.092, 0.097, 0.0),
                (0.650, 0.088, 0.092, 0.0),
                (0.710, 0.080, 0.084, 0.0),
                (0.770, 0.070, 0.074, 0.0),
                (0.820, 0.060, 0.064, 0.0),
                (0.850, 0.050, 0.055, 0.0)]
        rings = []
        for x, ry, rz, dy in data:
            rings.append(ring_yz(s * x, dy, SHIRT_Z, ry, rz, 10, 0.9))
        loft("Forearm." + side, rings, MAT['skin'], smooth=True)
        # elbow crease
        tube("ElbowCrease." + side,
             [(s * 0.600, -0.075, SHIRT_Z + 0.04),
              (s * 0.605, -0.088, SHIRT_Z),
              (s * 0.600, -0.075, SHIRT_Z - 0.04)],
             [0.004, 0.006, 0.004], MAT['skin'], n=4, smooth=True)
        build_hand(s, side)


def build_hand(s, side):
    # palm, rings along X
    palm = [(0.838, 0.048, 0.060), (0.852, 0.049, 0.072),
            (0.878, 0.047, 0.083), (0.912, 0.043, 0.091),
            (0.945, 0.039, 0.093), (0.958, 0.036, 0.088)]
    rings = []
    for x, ry, rz in palm:
        rings.append(ring_yz(s * x, -0.004, SHIRT_Z, ry, rz, 10, 0.66))
    loft("Palm." + side, rings, MAT['skin'], smooth=True)
    # four fingers
    fingers = [(-0.002, 0.062, 0.152, 0.0195, 0.022),
               (0.001, 0.021, 0.165, 0.0205, 0.012),
               (0.001, -0.021, 0.152, 0.0195, -0.004),
               (0.000, -0.060, 0.126, 0.0175, -0.018)]
    for i, (dy, dz, ln, rad, splay) in enumerate(fingers):
        x0 = 0.952
        z0 = SHIRT_Z + dz
        pts = [(s * x0, -0.004 + dy, z0),
               (s * (x0 + ln * 0.40), -0.010 + dy, z0 + splay * 0.4),
               (s * (x0 + ln * 0.76), -0.013 + dy, z0 + splay * 0.78),
               (s * (x0 + ln), -0.010 + dy, z0 + splay)]
        tube("Finger_%s%d" % (side, i), pts,
             [rad, rad * 1.05, rad * 0.82, rad * 0.55],
             MAT['skin'], n=8, k=0.9, smooth=True)
        # knuckle bump
        cyl("Knuckle_%s%d" % (side, i),
            (s * (x0 + 0.012), -0.008 + dy, z0 + 0.004), rad * 0.55,
            0.006, axis='Y', n=6, mat=MAT['skin'], smooth=True)
    # thumb
    pts = [(s * 0.868, -0.016, SHIRT_Z + 0.072),
           (s * 0.902, -0.030, SHIRT_Z + 0.115),
           (s * 0.938, -0.032, SHIRT_Z + 0.152),
           (s * 0.952, -0.026, SHIRT_Z + 0.163)]
    tube("Thumb." + side, pts, [0.030, 0.028, 0.021, 0.013],
         MAT['skin'], n=8, k=0.9, smooth=True)


# ----------------------------------------------------------------------------
# head / face
# ----------------------------------------------------------------------------

def build_head():
    rings = [
        ring_xy(0, 0.012, 1.180, 0.070, 0.076, 14, 0.78),
        ring_xy(0, 0.012, 1.212, 0.104, 0.114, 14, 0.78),
        ring_xy(0, 0.012, 1.252, 0.127, 0.138, 14, 0.78),
        ring_xy(0, 0.012, 1.292, 0.139, 0.147, 14, 0.78),
        ring_xy(0, 0.012, 1.338, 0.142, 0.150, 14, 0.78),
        ring_xy(0, 0.012, 1.382, 0.137, 0.148, 14, 0.78),
        ring_xy(0, 0.012, 1.422, 0.125, 0.140, 14, 0.78),
        ring_xy(0, 0.012, 1.455, 0.100, 0.120, 14, 0.78),
        ring_xy(0, 0.012, 1.476, 0.064, 0.086, 14, 0.78),
        ring_xy(0, 0.012, 1.487, 0.026, 0.036, 14, 0.78),
    ]
    loft("Head", rings, MAT['skin'], smooth=True)
    # neck
    cyl("Neck", (0, 0.012, 1.205), 0.077, 0.11, axis='Z', n=10,
        mat=MAT['skin'], smooth=True)


def build_face():
    # cheeks
    for s, side in ((1, 'L'), (-1, 'R')):
        import bmesh as _bm
        bm = _bm.new()
        _bm.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
        for v in bm.verts:
            v.co.x *= 0.056
            v.co.y *= 0.034
            v.co.z *= 0.048
            v.co.x += s * 0.077
            v.co.y += -0.122
            v.co.z += 1.332
        me = bpy.data.meshes.new("Cheek." + side)
        bm.to_mesh(me)
        bm.free()
        ob = bpy.data.objects.new("Cheek." + side, me)
        L.COL.objects.link(ob)
        me.materials.append(MAT['skin_cheek'])
        for p in me.polygons:
            p.use_smooth = True
        # eye bags
        bm = _bm.new()
        _bm.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
        for v in bm.verts:
            v.co.x *= 0.033
            v.co.y *= 0.015
            v.co.z *= 0.012
            v.co.x += s * 0.064
            v.co.y += -0.136
            v.co.z += 1.349
        me = bpy.data.meshes.new("EyeBag." + side)
        bm.to_mesh(me)
        bm.free()
        ob = bpy.data.objects.new("EyeBag." + side, me)
        L.COL.objects.link(ob)
        me.materials.append(MAT['skin'])
        for p in me.polygons:
            p.use_smooth = True
    # brow ridge
    pts = [(-0.125, -0.126, 1.392), (-0.07, -0.150, 1.402),
           (0, -0.158, 1.408), (0.07, -0.150, 1.402),
           (0.125, -0.126, 1.392)]
    tube("BrowRidge", pts, [(0.018, 0.016), (0.026, 0.020),
                            (0.028, 0.021), (0.026, 0.020),
                            (0.018, 0.016)], MAT['skin'], n=7,
         smooth=True)
    # eyes
    for s, side in ((1, 'L'), (-1, 'R')):
        ex = s * 0.064
        import bmesh as _bm
        bm = _bm.new()
        _bm.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.0225)
        for v in bm.verts:
            v.co.x += ex
            v.co.y += -0.126
            v.co.z += 1.373
        me = bpy.data.meshes.new("Eyeball." + side)
        bm.to_mesh(me)
        bm.free()
        ob = bpy.data.objects.new("Eyeball." + side, me)
        L.COL.objects.link(ob)
        me.materials.append(MAT['eye_white'])
        for p in me.polygons:
            p.use_smooth = True
        cyl("Iris." + side, (ex, -0.1465, 1.372), 0.0122, 0.0025,
            axis='Y', n=12, mat=MAT['iris'], smooth=True)
        cyl("Pupil." + side, (ex, -0.1482, 1.372), 0.0060, 0.0015,
            axis='Y', n=10, mat=MAT['pupil'], smooth=True)
        # upper lid
        bm = _bm.new()
        _bm.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
        for v in bm.verts:
            v.co.x *= 0.033
            v.co.y *= 0.019
            v.co.z *= 0.013
            v.co.x += ex
            v.co.y += -0.133
            v.co.z += 1.386
        me = bpy.data.meshes.new("UpperLid." + side)
        bm.to_mesh(me)
        bm.free()
        ob = bpy.data.objects.new("UpperLid." + side, me)
        L.COL.objects.link(ob)
        me.materials.append(MAT['skin'])
        for p in me.polygons:
            p.use_smooth = True
        # eyebrow
        tube("Eyebrow." + side,
             [(s * 0.020, -0.156, 1.397), (s * 0.065, -0.164, 1.409),
              (s * 0.108, -0.152, 1.415), (s * 0.136, -0.125, 1.407)],
             [(0.014, 0.012), (0.020, 0.015), (0.017, 0.012),
              (0.006, 0.005)], MAT['brow'], n=7, smooth=False)
    # nose
    nose_rings = [
        ring_xy(0, -0.132, 1.420, 0.017, 0.018, 10, 0.85),
        ring_xy(0, -0.145, 1.390, 0.021, 0.024, 10, 0.85),
        ring_xy(0, -0.160, 1.355, 0.029, 0.032, 10, 0.85),
        ring_xy(0, -0.176, 1.325, 0.037, 0.040, 10, 0.85),
        ring_xy(0, -0.182, 1.302, 0.046, 0.045, 10, 0.85),
        ring_xy(0, -0.174, 1.284, 0.049, 0.039, 10, 0.85),
        ring_xy(0, -0.158, 1.272, 0.041, 0.028, 10, 0.85),
    ]
    loft("Nose", nose_rings, MAT['skin_nose'], smooth=True)
    for s, side in ((1, 'L'), (-1, 'R')):
        import bmesh as _bm
        bm = _bm.new()
        _bm.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
        for v in bm.verts:
            v.co.x *= 0.013
            v.co.y *= 0.008
            v.co.z *= 0.007
            v.co.x += s * 0.029
            v.co.y += -0.192
            v.co.z += 1.279
        me = bpy.data.meshes.new("Nostril." + side)
        bm.to_mesh(me)
        bm.free()
        ob = bpy.data.objects.new("Nostril." + side, me)
        L.COL.objects.link(ob)
        me.materials.append(MAT['dark'])
        for p in me.polygons:
            p.use_smooth = True
    # mouth line + lower lip
    box("MouthLine", (0, -0.156, 1.259), (0.052, 0.006, 0.005),
        MAT['dark'], bevel=0.002)
    import bmesh as _bm
    bm = _bm.new()
    _bm.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
    for v in bm.verts:
        v.co.x *= 0.030
        v.co.y *= 0.012
        v.co.z *= 0.010
        v.co.y += -0.153
        v.co.z += 1.245
    me = bpy.data.meshes.new("LowerLip")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("LowerLip", me)
    L.COL.objects.link(ob)
    me.materials.append(MAT['lip'])
    for p in me.polygons:
        p.use_smooth = True


# ----------------------------------------------------------------------------
# hat + goggles
# ----------------------------------------------------------------------------

def build_hat():
    n = 14
    bottom = []
    for i in range(n):
        c, s = L.se(TAU * i / n, 0.8)
        x = 0.145 * c
        y = 0.165 * s + 0.012
        z = 1.405 - 0.030 * s
        bottom.append((x, y, z))
    rings = [bottom,
             ring_xy(0, 0.012, 1.442, 0.142, 0.162, n, 0.8),
             ring_xy(0, 0.012, 1.478, 0.132, 0.153, n, 0.8),
             ring_xy(0, 0.012, 1.507, 0.112, 0.135, n, 0.8),
             ring_xy(0, 0.012, 1.531, 0.082, 0.105, n, 0.8),
             ring_xy(0, 0.012, 1.546, 0.041, 0.060, n, 0.8),
             ring_xy(0, 0.012, 1.552, 0.013, 0.020, n, 0.8)]
    loft("Hat_Cap", rings, MAT['hat'], smooth=True, caps=(False, True))
    # brim rolled band
    rings = []
    nband = 5
    for i in range(n):
        p = L.Vector(bottom[i])
        nxt = L.Vector(bottom[(i + 1) % n])
        prv = L.Vector(bottom[(i - 1) % n])
        t = (nxt - prv).normalized()
        radial = L.Vector((p.x, p.y - 0.012, 0.0))
        if radial.length < 1e-5:
            radial = L.Vector((1, 0, 0))
        radial.normalize()
        rr = []
        for j in range(nband):
            a = TAU * j / nband
            rr.append(p + radial * (0.011 * math.cos(a)) +
                      L.Vector((0, 0, 1)) * (0.011 * math.sin(a)))
        rings.append(rr)
    loft("Hat_Brim", rings, MAT['hat_dark'], smooth=True,
         closed_path=True)
    # small brim rivets
    for i, a in enumerate((-0.75, -0.35, 0.35, 0.75)):
        c, s = L.se(a, 0.8)
        x = 0.152 * c
        y = 0.174 * s + 0.012
        z = 1.405 - 0.030 * s
        rivet("Hat_Rivet%d" % i, (x, y, z), MAT['brass'], 0.0075)
    # ear flaps
    for s, side in ((1, 'L'), (-1, 'R')):
        data = [(1.405, 0.021, 0.086), (1.370, 0.024, 0.096),
                (1.335, 0.024, 0.093), (1.300, 0.019, 0.077),
                (1.266, 0.012, 0.050)]
        rings = []
        for z, rx, ry in data:
            rings.append(ring_xy(s * 0.158, 0.012, z, rx, ry, 8, 0.8))
        loft("Hat_EarFlap." + side, rings, MAT['hat'], smooth=False)
        # brass square plate
        box("Hat_FlapPlate." + side, (s * 0.181, -0.006, 1.293),
            (0.008, 0.032, 0.032), MAT['brass'], bevel=0.004)
        rivet("Hat_FlapRivet." + side, (s * 0.186, -0.006, 1.293),
              MAT['brass'], 0.006)
    # back neck flap
    bpts = []
    for i in range(7):
        a = math.pi * 0.18 + (math.pi * 0.64) * i / 6
        x = math.cos(a) * 0.145
        y = math.sin(a) * 0.165 + 0.012
        bpts.append((x, y, 1.395))
    loft("Hat_BackFlap",
         [bpts, [(x, y * 1.04, 1.315) for x, y, z in bpts]],
         MAT['hat'], smooth=True, caps=(False, False))


def build_goggles():
    for s, side in ((1, 'L'), (-1, 'R')):
        M = (L.Matrix.Translation(L.Vector((s * 0.068, -0.143, 1.489))) @
             L.Euler((math.radians(-24), 0, 0), 'XYZ').to_matrix().to_4x4())
        rim = frame_poly("Goggle_Rim." + side, 8, 0.061, 0.045, 0.030,
                         MAT['brass'])
        rim.matrix_world = M
        glass = cyl("Goggle_Glass." + side, (0, 0, 0), 0.0475, 0.006,
                    axis='Y', n=8, mat=MAT['glass'], smooth=False)
        glass.matrix_world = M @ L.Matrix.Translation(L.Vector((0, -0.008, 0)))
        for i, (x, z) in enumerate(((0.050, 0.016), (-0.050, 0.016),
                                    (0.050, -0.016), (-0.050, -0.016))):
            rv = rivet("Goggle_Riv_%s%d" % (side, i), (0, 0, 0),
                       MAT['brass'], 0.005)
            rv.matrix_world = M @ L.Matrix.Translation(
                L.Vector((x, -0.017, z)))
    # bridge
    M = (L.Matrix.Translation(L.Vector((0, -0.143, 1.492))) @
         L.Euler((math.radians(-24), 0, 0), 'XYZ').to_matrix().to_4x4())
    bridge = box("Goggle_Bridge", (0, 0, 0), (0.028, 0.030, 0.014),
                 MAT['brass'], bevel=0.003)
    bridge.matrix_world = M
    # strap around hat
    rings = [ring_xy(0, 0.012, 1.460, 0.140, 0.160, 14, 0.8),
             ring_xy(0, 0.012, 1.496, 0.135, 0.156, 14, 0.8)]
    loft("Goggle_Strap", rings, MAT['hat_dark'], smooth=True,
         caps=(False, False))
    for s, side in ((1, 'L'), (-1, 'R')):
        box("Goggle_StrapBuckle." + side,
            (s * 0.150, 0.020, 1.478), (0.012, 0.026, 0.026),
            MAT['brass'], bevel=0.003)
        rivet("Goggle_StrapBuckleRiv." + side,
              (s * 0.157, 0.020, 1.478), MAT['brass'], 0.005)


# ----------------------------------------------------------------------------
# beard / moustache
# ----------------------------------------------------------------------------

def _beard_front_y(x, z):
    # approximate front surface of the beard mass
    if z > 1.28:
        ry, cy, rx = 0.10, -0.025, 0.13
    elif z > 1.22:
        ry, cy, rx = 0.12, -0.03, 0.148
    elif z > 1.11:
        ry, cy, rx = 0.13, -0.04, 0.15
    else:
        ry, cy, rx = 0.11, -0.05, 0.12
    q = max(0.0, 1.0 - (abs(x) / rx) ** 2)
    return cy - ry * math.sqrt(q)


def build_beard():
    rings = [
        ring_xy(0, -0.015, 1.315, 0.105, 0.070, 18, 0.9),
        ring_xy(0, -0.025, 1.275, 0.130, 0.100, 18, 0.9),
        ring_xy(0, -0.030, 1.230, 0.148, 0.120, 18, 0.9),
        ring_xy(0, -0.035, 1.170, 0.150, 0.132, 18, 0.9),
        ring_xy(0, -0.045, 1.110, 0.135, 0.125, 18, 0.9),
        ring_xy(0, -0.055, 1.065, 0.100, 0.100, 18, 0.9),
        ring_xy(0, -0.060, 1.035, 0.072, 0.072, 18, 0.9),
    ]
    # vertical ripple
    for ri, r in enumerate(rings[1:], 1):
        for j, v in enumerate(r):
            a = TAU * j / len(r)
            f = 1.0 + 0.022 * math.cos(7 * a + 0.4)
            v.x *= f
            v.y = (v.y + 0.035) * f - 0.035
    loft("Beard_Mass", rings, MAT['beard'], smooth=False)

    # sideburns
    for s, side in ((1, 'L'), (-1, 'R')):
        tube("Sideburn." + side,
             [(s * 0.128, -0.025, 1.368), (s * 0.142, -0.045, 1.325),
              (s * 0.150, -0.070, 1.285), (s * 0.145, -0.095, 1.255)],
             [(0.014, 0.010), (0.020, 0.013), (0.021, 0.014),
              (0.012, 0.010)], MAT['beard'], n=6, smooth=False)

    # chunky locks over the beard
    xs = [-0.115, -0.076, -0.038, 0.0, 0.038, 0.076, 0.115]
    for i, x in enumerate(xs):
        x0 = x * 0.85
        y_top = _beard_front_y(x0, 1.28) - 0.010
        y_mid = _beard_front_y(x * 0.95, 1.18) - 0.012
        y_low = _beard_front_y(x * 0.8, 1.10) - 0.008
        pts = [(x0, y_top, 1.285),
               (x * 0.98, y_mid, 1.195),
               (x * 0.85, y_low, 1.115),
               (x * 0.55, y_low - 0.012, 1.062)]
        rad = [(0.020, 0.012), (0.026, 0.016), (0.022, 0.014),
               (0.007, 0.005)]
        mat = MAT['beard'] if i % 2 == 0 else MAT['beard_dark']
        tube("BeardLock%d" % i, pts, rad, mat, n=6, smooth=False)

    # moustache
    for s, side in ((1, 'L'), (-1, 'R')):
        pts = [(s * 0.012, -0.193, 1.286),
               (s * 0.045, -0.198, 1.268),
               (s * 0.083, -0.186, 1.246),
               (s * 0.113, -0.160, 1.217),
               (s * 0.122, -0.130, 1.198)]
        tube("Moustache." + side, pts,
             [(0.016, 0.013), (0.024, 0.018), (0.024, 0.017),
              (0.018, 0.012), (0.009, 0.006)],
             MAT['beard'], n=7, smooth=False)

    # side braids
    for s, side in ((1, 'L'), (-1, 'R')):
        pts = []
        rad = []
        nseg = 8
        for i in range(nseg + 1):
            t = i / nseg
            z = 1.250 - 0.190 * t
            x = s * (0.112 + 0.012 * math.sin(t * 2.2))
            y = -0.135 - 0.035 * math.sin(t * 1.6)
            pts.append((x, y, z))
            r = 0.027 * (1.0 - 0.55 * t) * (1.0 + 0.14 * math.sin(t * 26))
            if i == nseg:
                r = 0.004
            rad.append(r)
        tube("SideBraid." + side, pts, rad, MAT['beard_dark'], n=7,
             smooth=False)
        cyl("BraidCuff." + side,
            (s * 0.116, -0.143, 1.225), 0.036, 0.036, axis='Z',
            n=10, mat=MAT['brass'], smooth=False)

    # central braid + wide brass cuff
    cyl("CentralCuff", (0, -0.145, 1.043), 0.079, 0.052, axis='Z', n=12,
        mat=MAT['brass'], smooth=False)
    cyl("CentralCuffRimT", (0, -0.145, 1.072), 0.083, 0.010, axis='Z',
        n=12, mat=MAT['brass_dark'], smooth=False)
    cyl("CentralCuffRimB", (0, -0.145, 1.014), 0.083, 0.010, axis='Z',
        n=12, mat=MAT['brass_dark'], smooth=False)
    pts = [(0, -0.150, 1.045), (0.006, -0.155, 1.010),
           (0, -0.152, 0.982), (-0.004, -0.143, 0.958),
           (0, -0.135, 0.944)]
    tube("CentralBraidTuft", pts,
         [(0.058, 0.052), (0.052, 0.046), (0.036, 0.032),
          (0.022, 0.020), (0.006, 0.005)], MAT['beard'], n=9,
         smooth=False)


# ----------------------------------------------------------------------------
# belt (base)
# ----------------------------------------------------------------------------

def build_belt():
    rings = [ring_xy(0, 0, 0.632, 0.286, 0.192, 16, 0.82),
             ring_xy(0, 0, 0.724, 0.291, 0.196, 16, 0.82)]
    loft("Belt", rings, MAT['belt'], smooth=False,
         caps=(False, False))
    ring_frame_xz("Belt_Buckle", (0, -0.207, 0.678),
                  0.118, 0.100, 0.017, 0.020, MAT['brass'], n=16)
    box("Belt_BuckleProng", (0, -0.217, 0.678), (0.010, 0.010, 0.083),
        MAT['brass'], bevel=0.002)
    for s, side in ((1, 'L'), (-1, 'R')):
        for i, x in enumerate((0.080, 0.108, 0.136)):
            cyl("Belt_Hole_%s%d" % (side, i), (s * x, -0.193, 0.678),
                0.006, 0.004, axis='Y', n=6, mat=MAT['dark'])
        rivet("Belt_Riv_%s" % side, (s * 0.180, -0.191, 0.678),
              MAT['brass'], 0.008)


# ----------------------------------------------------------------------------
# build + preview
# ----------------------------------------------------------------------------

build_shirt()
build_sleeves()
build_vest()
build_pants()
build_boots()
build_arms()
build_head()
build_face()
build_hat()
build_goggles()
build_beard()
build_belt()

# ---------------------------------------------------------------------------
# cameras / lights
# ---------------------------------------------------------------------------
scene = setup_render((1200, 900), samples=32)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.55

key = add_area("Key_Light", (-2.4, -3.4, 3.4), 550, 3.0,
               color=(1.0, 0.94, 0.86))
fill = add_area("Fill_Light", (3.2, -2.4, 1.8), 220, 3.5,
                color=(0.82, 0.9, 1.0))
rim = add_area("Rim_Light", (0.6, 3.2, 3.0), 320, 2.5,
               color=(1.0, 0.9, 0.8))
add_area("Bounce_Light", (0, -1.6, 0.25), 80, 2.0,
         color=(1.0, 0.85, 0.7), look_at=(0, 0, 1.0))

cam_front = add_camera("Cam_Front", (0, -6.0, 0.80),
                       rot=(math.radians(90), 0, 0), ortho=2.45)
cam_side = add_camera("Cam_Side", (6.0, 0, 0.80),
                      rot=(math.radians(90), 0, math.radians(90)),
                      ortho=2.45)
cam_back = add_camera("Cam_Back", (0, 6.0, 0.80),
                      rot=(math.radians(90), 0, math.radians(180)),
                      ortho=2.45)
cam_three = add_camera("Cam_ThreeQuarter", (3.4, -4.4, 2.3),
                       look_at=(0, 0, 0.82), lens=52)

if __name__ == "__main__":
    total, per = tri_count()
    print("TRIANGLES TOTAL:", total)
    render_to(os.path.join(RENDERS, "front_01.png"), cam_front)
    print("RENDERED FRONT")
    bpy.ops.wm.save_as_mainfile(
        filepath=os.path.join(PROJECT, "steampunk_dwarf.blend"))
    print("SAVED")
