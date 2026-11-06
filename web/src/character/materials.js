import * as THREE from 'three';
import { createTextures } from './textures.js';

function standard(params) {
  return new THREE.MeshStandardMaterial({
    envMapIntensity: 0.9,
    ...params,
  });
}

export function createMaterials() {
  const maps = createTextures();

  const skin = standard({ map: maps.skin, roughness: 0.78, metalness: 0 });
  const skinWarm = standard({ map: maps.skin, color: 0xb98a72, roughness: 0.8, metalness: 0 });
  const skinShadow = standard({ map: maps.skin, color: 0x956a52, roughness: 0.85, metalness: 0 });

  const beard = standard({ map: maps.beard, color: 0xd0a48c, roughness: 0.9, metalness: 0 });
  const beardLight = standard({ map: maps.beard, color: 0xe6bfa3, roughness: 0.88, metalness: 0 });
  const beardDark = standard({ map: maps.beard, color: 0xb38c76, roughness: 0.92, metalness: 0 });
  const beardShadow = standard({ map: maps.beard, color: 0x8d5f3d, roughness: 0.94, metalness: 0 });

  const leatherDark = standard({ map: maps.leatherDark, roughness: 0.76, metalness: 0 });
  const leatherMid = standard({ map: maps.leatherMid, roughness: 0.72, metalness: 0 });
  const leatherLight = standard({ map: maps.leatherLight, roughness: 0.7, metalness: 0 });
  const leatherBoot = standard({ map: maps.leatherBoot, roughness: 0.68, metalness: 0 });
  const vestLeather = standard({ map: maps.vestLeather, roughness: 0.64, metalness: 0 });
  const hatLeather = standard({ map: maps.hatLeather, roughness: 0.68, metalness: 0 });
  const shirt = standard({ map: maps.shirt, roughness: 0.94, metalness: 0 });
  const shirtShade = standard({ map: maps.shirt, color: 0xcfc0a6, roughness: 0.95, metalness: 0 });
  const pants = standard({ map: maps.pants, roughness: 0.95, metalness: 0 });
  const pantsShade = standard({ map: maps.pants, color: 0xa98c69, roughness: 0.96, metalness: 0 });
  const sole = standard({ map: maps.sole, roughness: 0.92, metalness: 0 });

  const brass = standard({ map: maps.brass, roughness: 0.52, metalness: 0.72, envMapIntensity: 0.75 });
  const brassDark = standard({ map: maps.brass, color: 0x8d794f, roughness: 0.58, metalness: 0.65, envMapIntensity: 0.7 });
  const steel = standard({ map: maps.steel, roughness: 0.34, metalness: 0.9 });
  const steelDark = standard({ map: maps.steel, color: 0x8f9394, roughness: 0.42, metalness: 0.85 });

  const lens = standard({ map: maps.lens, color: 0x505759, roughness: 0.6, metalness: 0.02, envMapIntensity: 0.12 });
  const eyeWhite = standard({ color: 0xe2d4bf, roughness: 0.38, metalness: 0 });
  const iris = standard({ map: maps.iris, roughness: 0.35, metalness: 0 });
  const pupil = standard({ color: 0x12100c, roughness: 0.3, metalness: 0 });
  const eyeSocket = standard({ color: 0x6f4b37, roughness: 0.9, metalness: 0 });
  const mouth = standard({ color: 0x48251c, roughness: 0.85, metalness: 0 });
  const watchFace = standard({ map: maps.watchFace, roughness: 0.5, metalness: 0.05 });
  const darkInterior = standard({ color: 0x24170e, roughness: 0.95, metalness: 0 });
  const leatherEdge = standard({ map: maps.leatherDark, color: 0x8d7358, roughness: 0.75, metalness: 0 });
  const black = standard({ color: 0x171310, roughness: 0.5, metalness: 0.2 });

  const all = {
    maps,
    skin,
    skinWarm,
    skinShadow,
    beard,
    beardLight,
    beardDark,
    beardShadow,
    leatherDark,
    leatherMid,
    leatherLight,
    leatherBoot,
    vestLeather,
    hatLeather,
    shirt,
    shirtShade,
    pants,
    pantsShade,
    sole,
    brass,
    brassDark,
    steel,
    steelDark,
    lens,
    eyeWhite,
    iris,
    pupil,
    eyeSocket,
    mouth,
    watchFace,
    darkInterior,
    leatherEdge,
    black,
  };

  Object.entries(all).forEach(([key, value]) => {
    if (value && value.isMaterial) value.name = `dwarf_${key}`;
  });

  return all;
}
