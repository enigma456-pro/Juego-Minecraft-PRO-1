import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// ============================================================
// CONFIGURACIÓN INICIAL
// ============================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 100, 250);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 2, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, renderer.domElement);

const bloqueoDiv = document.getElementById('bloqueo');
const btnBloquear = document.getElementById('bloquearBtn');
const expandLabel = document.getElementById('expandLabel');
btnBloquear.addEventListener('click', () => controls.lock());
controls.addEventListener('lock', () => bloqueoDiv.style.display = 'none');
controls.addEventListener('unlock', () => bloqueoDiv.style.display = 'block');

// ============================================================
// LUCES
// ============================================================
const ambientLight = new THREE.AmbientLight(0x404060);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
sunLight.position.set(40, 50, 30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 200;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x88aaff, 0.3);
fillLight.position.set(-30, 20, -40);
scene.add(fillLight);

// ============================================================
// SISTEMA DE GUARDADO
// ============================================================
const SAVE_KEY = 'minecraft_isla_save_v8';
const AUTO_SAVE_INTERVAL = 2000;
let lastSaveTime = 0;

function saveGame() {
    try {
        const playerBlocks = [];
        for (const [key, data] of blocks) {
            if (data.y > groundY) {
                playerBlocks.push({ x: data.x, y: data.y, z: data.z, type: data.type });
            }
        }
        
        const removedBaseBlocks = [];
        const rangeX = Math.floor(rx + beachWidth) + 5;
        const rangeZ = Math.floor(rz + beachWidth) + 5;
        for (let x = -rangeX; x <= rangeX; x++) {
            for (let z = -rangeZ; z <= rangeZ; z++) {
                const key = `${x},${groundY},${z}`;
                if ((isGrass(x, z) || isBeach(x, z)) && !blocks.has(key)) {
                    removedBaseBlocks.push({ x, z });
                }
            }
        }
        
        const gameState = {
            version: 8,
            timestamp: Date.now(),
            rx: rx, rz: rz,
            playerBlocks: playerBlocks,
            removedBaseBlocks: removedBaseBlocks,
            player: {
                x: camera.position.x, y: camera.position.y, z: camera.position.z,
                rotX: camera.rotation.x, rotY: camera.rotation.y, rotZ: camera.rotation.z
            },
            cow: { x: cowGroup.position.x, y: cowGroup.position.y, z: cowGroup.position.z,
                dirX: cowDirX, dirZ: cowDirZ, isWalking: cowIsWalking, cycleTimer: cowCycleTimer },
            horse: { x: horseGroup.position.x, y: horseGroup.position.y, z: horseGroup.position.z,
                dirX: horseDirX, dirZ: horseDirZ, isWalking: horseIsWalking, cycleTimer: horseCycleTimer },
            pig: { x: pigGroup.position.x, y: pigGroup.position.y, z: pigGroup.position.z,
                dirX: pigDirX, dirZ: pigDirZ, isWalking: pigIsWalking, cycleTimer: pigCycleTimer },
            chicken: { x: chickenGroup.position.x, y: chickenGroup.position.y, z: chickenGroup.position.z,
                dirX: chickenDirX, dirZ: chickenDirZ, isWalking: chickenIsWalking, cycleTimer: chickenCycleTimer },
            tiger: { x: tigerGroup.position.x, y: tigerGroup.position.y, z: tigerGroup.position.z,
                dirX: tigerDirX, dirZ: tigerDirZ, isWalking: tigerIsWalking, cycleTimer: tigerCycleTimer },
            panda: { x: pandaGroup.position.x, y: pandaGroup.position.y, z: pandaGroup.position.z,
                dirX: pandaDirX, dirZ: pandaDirZ, isWalking: pandaIsWalking, cycleTimer: pandaCycleTimer },
            fox: { x: foxGroup.position.x, y: foxGroup.position.y, z: foxGroup.position.z,
                dirX: foxDirX, dirZ: foxDirZ, isWalking: foxIsWalking, cycleTimer: foxCycleTimer },
            leopard: { x: leopardGroup.position.x, y: leopardGroup.position.y, z: leopardGroup.position.z,
                dirX: leopardDirX, dirZ: leopardDirZ, isWalking: leopardIsWalking, cycleTimer: leopardCycleTimer },
            lion: { x: lionGroup.position.x, y: lionGroup.position.y, z: lionGroup.position.z,
                dirX: lionDirX, dirZ: lionDirZ, isWalking: lionIsWalking, cycleTimer: lionCycleTimer },
            selectedBlock: selectedBlock
        };
        
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
        return true;
    } catch (e) {
        console.error('❌ Error al guardar:', e);
        return false;
    }
}

function loadGame() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (!saved) {
            console.log('📂 No hay partida guardada, empezando nueva');
            return null;
        }
        const gameState = JSON.parse(saved);
        console.log('📂 Partida cargada:', new Date(gameState.timestamp).toLocaleString());
        return gameState;
    } catch (e) {
        console.error('❌ Error al cargar:', e);
        return null;
    }
}

function clearSave() {
    try {
        localStorage.removeItem(SAVE_KEY);
        console.log('🗑️ Partida borrada');
        return true;
    } catch (e) {
        console.error('❌ Error al borrar:', e);
        return false;
    }
}

// ============================================================
// SISTEMA DE BLOQUES
// ============================================================
const BLOCK_TYPES = {
    TIERRA: { id: 1, name: 'Tierra', color: 0x8d6e63, colorTop: 0x7cb342 },
    PIEDRA: { id: 2, name: 'Piedra', color: 0x9e9e9e, colorTop: 0x9e9e9e },
    MADERA: { id: 3, name: 'Madera', color: 0x8d6e63, colorTop: 0x8d6e63 },
    HOJA: { id: 4, name: 'Hoja', color: 0x2e7d32, colorTop: 0x4caf50 },
    NIEVE: { id: 5, name: 'Nieve', color: 0xf0f0f0, colorTop: 0xf0f0f0 }
};

let selectedBlock = 1;
const blocks = new Map();
const blockSize = 1.0;
const groundY = 0;

const GRASS_COLOR = 0x7cb342;
const GRASS_EMISSIVE = new THREE.Color(GRASS_COLOR).multiplyScalar(0.03);
const SAND_COLOR = 0xf5e6b0;
const SAND_EMISSIVE = 0x332200;

function createBlockMesh(typeId, x, y, z, isBeach = false) {
    const type = Object.values(BLOCK_TYPES).find(t => t.id === typeId);
    if (!type) return null;
    
    const isTop = (y === groundY && typeId === 1);
    let color, emissive;
    
    if (isBeach) {
        color = SAND_COLOR;
        emissive = new THREE.Color(SAND_EMISSIVE);
    } else if (isTop) {
        color = GRASS_COLOR;
        emissive = GRASS_EMISSIVE.clone();
    } else {
        color = type.color;
        emissive = new THREE.Color(color).multiplyScalar(0.03);
    }
    
    const geometry = new THREE.BoxGeometry(blockSize * 0.98, blockSize * 0.98, blockSize * 0.98);
    const material = new THREE.MeshStandardMaterial({
        color: color, roughness: 0.7, emissive: emissive
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y + blockSize/2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

function setBlockToGrass(data) {
    data.mesh.material.color.setHex(GRASS_COLOR);
    data.mesh.material.emissive.copy(GRASS_EMISSIVE);
    data.mesh.material.needsUpdate = true;
    data.isBeach = false;
}

function setBlockToSand(data) {
    data.mesh.material.color.setHex(SAND_COLOR);
    data.mesh.material.emissive.setHex(SAND_EMISSIVE);
    data.mesh.material.needsUpdate = true;
    data.isBeach = true;
}

// ============================================================
// ISLA
// ============================================================
let rx = 22;
let rz = 16;
const beachWidth = 2.5;
const EXPAND_AMOUNT = 7;

function isGrass(x, z) {
    const val = (x * x) / (rx * rx) + (z * z) / (rz * rz);
    return val <= 1.0;
}

function isBeach(x, z) {
    const valInner = (x * x) / (rx * rx) + (z * z) / (rz * rz);
    const rxOuter = rx + beachWidth;
    const rzOuter = rz + beachWidth;
    const valOuter = (x * x) / (rxOuter * rxOuter) + (z * z) / (rzOuter * rzOuter);
    return valInner > 1.0 && valOuter <= 1.0;
}

function isInsideIslandOrBeach(x, z) {
    return isGrass(x, z) || isBeach(x, z);
}

const islandGroup = new THREE.Group();
const waterGroup = new THREE.Group();
scene.add(islandGroup);
scene.add(waterGroup);

const landSet = new Set();
const waterSet = new Set();

function generateIslandIncremental() {
    const rangeX = Math.floor(rx + beachWidth) + 15;
    const rangeZ = Math.floor(rz + beachWidth) + 15;
    
    const keysToRemove = [];
    for (const [key, data] of blocks) {
        if (data.y !== groundY) continue;
        const x = data.x, z = data.z;
        const shouldBeGrass = isGrass(x, z);
        const shouldBeBeach = isBeach(x, z);
        
        if (shouldBeGrass) {
            if (data.isBeach) setBlockToGrass(data);
        } else if (shouldBeBeach) {
            if (!data.isBeach) setBlockToSand(data);
        } else {
            keysToRemove.push(key);
        }
    }
    
    for (const key of keysToRemove) {
        const data = blocks.get(key);
        if (data && data.mesh) {
            scene.remove(data.mesh);
            data.mesh.geometry.dispose();
            data.mesh.material.dispose();
        }
        blocks.delete(key);
        if (data) landSet.delete(`${data.x},${data.z}`);
    }
    
    for (let x = -rangeX; x <= rangeX; x++) {
        for (let z = -rangeZ; z <= rangeZ; z++) {
            const landKey = `${x},${z}`;
            const blockKey = `${x},${groundY},${z}`;
            const shouldBeGrass = isGrass(x, z);
            const shouldBeBeach = isBeach(x, z);
            
            if (shouldBeGrass || shouldBeBeach) {
                if (!blocks.has(blockKey)) {
                    const mesh = createBlockMesh(1, x, groundY, z, shouldBeBeach);
                    if (mesh) {
                        islandGroup.add(mesh);
                        blocks.set(blockKey, { mesh, type: 1, x, y: groundY, z, isBeach: shouldBeBeach });
                        landSet.add(landKey);
                    }
                }
            }
        }
    }
    
    const waterKeysToRemove = [];
    for (const waterKey of waterSet) {
        const [wx, wz] = waterKey.split(',').map(Number);
        if (isInsideIslandOrBeach(wx, wz)) {
            waterKeysToRemove.push(waterKey);
        }
    }
    for (const waterKey of waterKeysToRemove) {
        const [wx, wz] = waterKey.split(',').map(Number);
        for (let i = waterGroup.children.length - 1; i >= 0; i--) {
            const child = waterGroup.children[i];
            if (Math.abs(child.position.x - wx) < 0.1 && Math.abs(child.position.z - wz) < 0.1) {
                waterGroup.remove(child);
                child.geometry.dispose();
                child.material.dispose();
                break;
            }
        }
        waterSet.delete(waterKey);
    }
    
    const rxOuter = rx + beachWidth;
    const rzOuter = rz + beachWidth;
    const waterLimitX = rxOuter + 15;
    const waterLimitZ = rzOuter + 15;
    
    for (let x = -waterLimitX; x <= waterLimitX; x++) {
        for (let z = -waterLimitZ; z <= waterLimitZ; z++) {
            if (isInsideIslandOrBeach(x, z)) continue;
            const dist = Math.sqrt((x*x)/(rxOuter*rxOuter) + (z*z)/(rzOuter*rzOuter));
            if (dist < 1.6) {
                const waterKey = `${x},${z}`;
                if (!waterSet.has(waterKey)) {
                    const geo = new THREE.BoxGeometry(1, 0.6, 1);
                    const mat = new THREE.MeshStandardMaterial({
                        color: 0x3a7bd5, transparent: true, opacity: 0.6,
                        roughness: 0.2, metalness: 0.1
                    });
                    const water = new THREE.Mesh(geo, mat);
                    water.position.set(x, 0.2, z);
                    water.receiveShadow = true;
                    waterGroup.add(water);
                    waterSet.add(waterKey);
                }
            }
        }
    }
}

// ============================================================
// UTILIDADES DE ANIMALES
// ============================================================
const WALK_DURATION = 3.0;
const IDLE_DURATION = 9.0;

function isWaterAt(x, z) {
    if (isInsideIslandOrBeach(x, z)) return false;
    const rxOuter = rx + beachWidth;
    const rzOuter = rz + beachWidth;
    const dist = Math.sqrt((x*x)/(rxOuter*rxOuter) + (z*z)/(rzOuter*rzOuter));
    return dist < 1.6;
}

function getTerrainHeightAt(x, z) {
    const bx = Math.round(x);
    const bz = Math.round(z);
    let maxY = groundY;
    for (let y = groundY + 10; y >= groundY; y--) {
        const key = `${bx},${y},${bz}`;
        if (blocks.has(key)) {
            maxY = y + 1;
            break;
        }
    }
    return maxY;
}

function getExtraBlocksAt(x, z) {
    const bx = Math.round(x);
    const bz = Math.round(z);
    let count = 0;
    for (let y = groundY + 1; y <= groundY + 10; y++) {
        const key = `${bx},${y},${bz}`;
        if (blocks.has(key)) count++;
    }
    return count;
}

function checkObstacleAhead(x, z, dirX, dirZ, distance) {
    const checkX = x + dirX * distance;
    const checkZ = z + dirZ * distance;
    
    if (isWaterAt(checkX, checkZ)) return 'water';
    
    const extraBlocks = getExtraBlocksAt(checkX, checkZ);
    if (extraBlocks >= 2) return 'high_column';
    if (extraBlocks === 1) return 'one_block';
    return 'clear';
}

// ============================================================
// VACA
// ============================================================
function createCowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f5f5f0';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#222222';
    ctx.fillRect(28, 10, 16, 8); ctx.fillRect(30, 18, 12, 6);
    ctx.fillRect(8, 12, 14, 8); ctx.fillRect(6, 20, 12, 6);
    ctx.fillRect(40, 28, 10, 8); ctx.fillRect(42, 36, 8, 6);
    ctx.fillRect(52, 20, 8, 16); ctx.fillRect(50, 36, 10, 8);
    ctx.fillRect(4, 28, 8, 14); ctx.fillRect(6, 42, 10, 8);
    ctx.fillRect(20, 8, 12, 6); ctx.fillRect(22, 14, 8, 4);
    ctx.fillRect(16, 48, 12, 6); ctx.fillRect(14, 54, 10, 4);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

function createHeadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f5f5f0';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#222222';
    ctx.fillRect(4, 4, 8, 6); ctx.fillRect(20, 6, 6, 4);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

const bodyTexture = createCowTexture();
const bodyMat = new THREE.MeshStandardMaterial({ map: bodyTexture, roughness: 0.7 });
const headTexture = createHeadTexture();
const headMat = new THREE.MeshStandardMaterial({ map: headTexture, roughness: 0.7 });
const blackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
const pinkMat = new THREE.MeshStandardMaterial({ color: 0xffb6c1, roughness: 0.7 });
const udderMat = new THREE.MeshStandardMaterial({ color: 0xff99aa, roughness: 0.7 });
const nippleMat = new THREE.MeshStandardMaterial({ color: 0xd87093, roughness: 0.8 });
const hornMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.2 });
const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
const hoofMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });

const COW_SCALE = 0.7;
const cowGroup = new THREE.Group();
const cowBodyY = 1.35 * COW_SCALE;
const cowBodyWidth = 1.8 * COW_SCALE;
const cowBodyDepth = 1.2 * COW_SCALE;

const cowBody = new THREE.Mesh(new THREE.BoxGeometry(cowBodyDepth, 1.2 * COW_SCALE, cowBodyWidth), bodyMat);
cowBody.position.set(0, cowBodyY, 0);
cowBody.castShadow = true;
cowBody.receiveShadow = true;
cowGroup.add(cowBody);

const udderGroup = new THREE.Group();
const udderBase = new THREE.Mesh(new THREE.BoxGeometry(0.55 * COW_SCALE, 0.15 * COW_SCALE, 0.45 * COW_SCALE), udderMat);
udderBase.castShadow = true;
udderGroup.add(udderBase);
const nipple1 = new THREE.Mesh(new THREE.BoxGeometry(0.08 * COW_SCALE, 0.06 * COW_SCALE, 0.08 * COW_SCALE), nippleMat);
nipple1.position.set(0.18 * COW_SCALE, -0.1 * COW_SCALE, 0.12 * COW_SCALE);
udderGroup.add(nipple1);
const nipple2 = new THREE.Mesh(new THREE.BoxGeometry(0.08 * COW_SCALE, 0.06 * COW_SCALE, 0.08 * COW_SCALE), nippleMat);
nipple2.position.set(0.18 * COW_SCALE, -0.1 * COW_SCALE, -0.12 * COW_SCALE);
udderGroup.add(nipple2);
const nipple3 = new THREE.Mesh(new THREE.BoxGeometry(0.08 * COW_SCALE, 0.06 * COW_SCALE, 0.08 * COW_SCALE), nippleMat);
nipple3.position.set(-0.18 * COW_SCALE, -0.1 * COW_SCALE, 0.12 * COW_SCALE);
udderGroup.add(nipple3);
const nipple4 = new THREE.Mesh(new THREE.BoxGeometry(0.08 * COW_SCALE, 0.06 * COW_SCALE, 0.08 * COW_SCALE), nippleMat);
nipple4.position.set(-0.18 * COW_SCALE, -0.1 * COW_SCALE, -0.12 * COW_SCALE);
udderGroup.add(nipple4);
udderGroup.position.set(0, cowBodyY - 0.6 * COW_SCALE - 0.075 * COW_SCALE, -0.35 * COW_SCALE);
cowGroup.add(udderGroup);

const cowHeadGroup = new THREE.Group();
cowHeadGroup.position.set(0, cowBodyY + 0.35 * COW_SCALE, 1.15 * COW_SCALE);

const cowHead = new THREE.Mesh(new THREE.BoxGeometry(0.8 * COW_SCALE, 0.7 * COW_SCALE, 0.8 * COW_SCALE), headMat);
cowHead.position.set(0, 0, 0);
cowHead.castShadow = true;
cowHead.receiveShadow = true;
cowHeadGroup.add(cowHead);

const cowSnout = new THREE.Mesh(new THREE.BoxGeometry(0.4 * COW_SCALE, 0.3 * COW_SCALE, 0.3 * COW_SCALE), pinkMat);
cowSnout.position.set(0, -0.05 * COW_SCALE, 0.42 * COW_SCALE);
cowSnout.castShadow = true;
cowHeadGroup.add(cowSnout);

const noseMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
const nose1 = new THREE.Mesh(new THREE.BoxGeometry(0.06 * COW_SCALE, 0.08 * COW_SCALE, 0.08 * COW_SCALE), noseMat);
nose1.position.set(0.12 * COW_SCALE, -0.05 * COW_SCALE, 0.58 * COW_SCALE);
cowHeadGroup.add(nose1);
const nose2 = new THREE.Mesh(new THREE.BoxGeometry(0.06 * COW_SCALE, 0.08 * COW_SCALE, 0.08 * COW_SCALE), noseMat);
nose2.position.set(-0.12 * COW_SCALE, -0.05 * COW_SCALE, 0.58 * COW_SCALE);
cowHeadGroup.add(nose2);

const cowEye1 = new THREE.Mesh(new THREE.BoxGeometry(0.08 * COW_SCALE, 0.15 * COW_SCALE, 0.15 * COW_SCALE), eyeMat);
cowEye1.position.set(0.42 * COW_SCALE, 0.2 * COW_SCALE, 0.2 * COW_SCALE);
cowHeadGroup.add(cowEye1);
const cowEye2 = new THREE.Mesh(new THREE.BoxGeometry(0.08 * COW_SCALE, 0.15 * COW_SCALE, 0.15 * COW_SCALE), eyeMat);
cowEye2.position.set(-0.42 * COW_SCALE, 0.2 * COW_SCALE, 0.2 * COW_SCALE);
cowHeadGroup.add(cowEye2);

const cowPupil1 = new THREE.Mesh(new THREE.BoxGeometry(0.1 * COW_SCALE, 0.08 * COW_SCALE, 0.08 * COW_SCALE), pupilMat);
cowPupil1.position.set(0.46 * COW_SCALE, 0.2 * COW_SCALE, 0.32 * COW_SCALE);
cowHeadGroup.add(cowPupil1);
const cowPupil2 = new THREE.Mesh(new THREE.BoxGeometry(0.1 * COW_SCALE, 0.08 * COW_SCALE, 0.08 * COW_SCALE), pupilMat);
cowPupil2.position.set(-0.46 * COW_SCALE, 0.2 * COW_SCALE, 0.32 * COW_SCALE);
cowHeadGroup.add(cowPupil2);

const cowHorn1 = new THREE.Mesh(new THREE.BoxGeometry(0.08 * COW_SCALE, 0.25 * COW_SCALE, 0.08 * COW_SCALE), hornMat);
cowHorn1.rotation.x = 0.4;
cowHorn1.position.set(0.3 * COW_SCALE, 0.5 * COW_SCALE, 0.0);
cowHeadGroup.add(cowHorn1);
const cowHorn2 = new THREE.Mesh(new THREE.BoxGeometry(0.08 * COW_SCALE, 0.25 * COW_SCALE, 0.08 * COW_SCALE), hornMat);
cowHorn2.rotation.x = 0.4;
cowHorn2.position.set(-0.3 * COW_SCALE, 0.5 * COW_SCALE, 0.0);
cowHeadGroup.add(cowHorn2);

const cowEarMat = new THREE.MeshStandardMaterial({ color: 0xffb6c1, roughness: 0.7 });
const cowEar1 = new THREE.Mesh(new THREE.BoxGeometry(0.08 * COW_SCALE, 0.25 * COW_SCALE, 0.15 * COW_SCALE), cowEarMat);
cowEar1.position.set(0.5 * COW_SCALE, 0.35 * COW_SCALE, -0.1 * COW_SCALE);
cowHeadGroup.add(cowEar1);
const cowEar2 = new THREE.Mesh(new THREE.BoxGeometry(0.08 * COW_SCALE, 0.25 * COW_SCALE, 0.15 * COW_SCALE), cowEarMat);
cowEar2.position.set(-0.5 * COW_SCALE, 0.35 * COW_SCALE, -0.1 * COW_SCALE);
cowHeadGroup.add(cowEar2);

cowGroup.add(cowHeadGroup);

function createCowLeg(x, z) {
    const group = new THREE.Group();
    const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.25 * COW_SCALE, 0.9 * COW_SCALE, 0.25 * COW_SCALE),
        new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.7 })
    );
    leg.position.y = -0.45 * COW_SCALE;
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);
    const hoof = new THREE.Mesh(
        new THREE.BoxGeometry(0.27 * COW_SCALE, 0.1 * COW_SCALE, 0.27 * COW_SCALE), hoofMat
    );
    hoof.position.y = -0.95 * COW_SCALE;
    hoof.castShadow = true;
    group.add(hoof);
    group.position.set(x, cowBodyY - 0.6 * COW_SCALE, z);
    return group;
}

const cowLegFrontLeft = createCowLeg(0.35 * COW_SCALE, 0.5 * COW_SCALE);
const cowLegFrontRight = createCowLeg(-0.35 * COW_SCALE, 0.5 * COW_SCALE);
const cowLegBackLeft = createCowLeg(0.35 * COW_SCALE, -0.5 * COW_SCALE);
const cowLegBackRight = createCowLeg(-0.35 * COW_SCALE, -0.5 * COW_SCALE);

cowGroup.add(cowLegFrontLeft);
cowGroup.add(cowLegFrontRight);
cowGroup.add(cowLegBackLeft);
cowGroup.add(cowLegBackRight);

const cowTailGroup = new THREE.Group();
cowTailGroup.position.set(0, cowBodyY, -0.95 * COW_SCALE);
const cowTail1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * COW_SCALE, 0.3 * COW_SCALE, 0.06 * COW_SCALE),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.7 })
);
cowTail1.position.set(0, -0.1 * COW_SCALE, -0.15 * COW_SCALE);
cowTail1.castShadow = true;
cowTailGroup.add(cowTail1);
const cowTail2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * COW_SCALE, 0.25 * COW_SCALE, 0.06 * COW_SCALE),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.7 })
);
cowTail2.position.set(0, -0.3 * COW_SCALE, -0.35 * COW_SCALE);
cowTail2.castShadow = true;
cowTailGroup.add(cowTail2);
const cowTuft = new THREE.Mesh(
    new THREE.BoxGeometry(0.15 * COW_SCALE, 0.15 * COW_SCALE, 0.15 * COW_SCALE), blackMat
);
cowTuft.position.set(0, -0.45 * COW_SCALE, -0.5 * COW_SCALE);
cowTuft.castShadow = true;
cowTailGroup.add(cowTuft);
cowGroup.add(cowTailGroup);

cowGroup.position.set(-8, 0.0, 5);
scene.add(cowGroup);

const COW_RADIUS = 0.9 * COW_SCALE;

// ============================================================
// CABALLO
// ============================================================
const horseMat = new THREE.MeshStandardMaterial({ color: 0x8C5830, roughness: 0.7, flatShading: true });
const maneMat = new THREE.MeshStandardMaterial({ color: 0x24150B, roughness: 0.9, flatShading: true });
const horseHoofMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.5, flatShading: true });
const snoutMat = new THREE.MeshStandardMaterial({ color: 0x6E4221, roughness: 0.8, flatShading: true });
const eyeBaseGreenMat = new THREE.MeshStandardMaterial({ color: 0x32CD32, roughness: 0.1, flatShading: true });
const pupilBlackMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1, flatShading: true });

const HORSE_SCALE = 0.85;
const horseGroup = new THREE.Group();
const horseBodyY = 1.15 * HORSE_SCALE;

const horseBodyMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0 * HORSE_SCALE, 0.8 * HORSE_SCALE, 0.7 * HORSE_SCALE), horseMat);
horseBodyMesh.position.set(0, horseBodyY, 0);
horseBodyMesh.castShadow = true;
horseBodyMesh.receiveShadow = true;
horseGroup.add(horseBodyMesh);

const horseNeckGroup = new THREE.Group();
horseNeckGroup.position.set(0.7 * HORSE_SCALE, horseBodyY + 0.35 * HORSE_SCALE, 0);
horseNeckGroup.rotation.z = -0.35;

const horseNeck = new THREE.Mesh(new THREE.BoxGeometry(0.5 * HORSE_SCALE, 0.9 * HORSE_SCALE, 0.45 * HORSE_SCALE), horseMat);
horseNeck.position.set(0, 0.3 * HORSE_SCALE, 0);
horseNeck.castShadow = true;
horseNeckGroup.add(horseNeck);

const horseManeTop = new THREE.Mesh(new THREE.BoxGeometry(0.18 * HORSE_SCALE, 0.85 * HORSE_SCALE, 0.15 * HORSE_SCALE), maneMat);
horseManeTop.position.set(-0.2 * HORSE_SCALE, 0.35 * HORSE_SCALE, 0);
horseNeckGroup.add(horseManeTop);

const horseHeadGroup = new THREE.Group();
horseHeadGroup.position.set(0.1 * HORSE_SCALE, 0.75 * HORSE_SCALE, 0);

const horseHeadBase = new THREE.Mesh(new THREE.BoxGeometry(0.5 * HORSE_SCALE, 0.45 * HORSE_SCALE, 0.45 * HORSE_SCALE), horseMat);
horseHeadBase.position.set(0, 0, 0);
horseHeadBase.castShadow = true;
horseHeadGroup.add(horseHeadBase);

const horseSnoutMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65 * HORSE_SCALE, 0.35 * HORSE_SCALE, 0.38 * HORSE_SCALE), snoutMat);
horseSnoutMesh.position.set(0.45 * HORSE_SCALE, -0.05 * HORSE_SCALE, 0);
horseHeadGroup.add(horseSnoutMesh);

const horseEyeBaseY = 0.08 * HORSE_SCALE;
const horseEyeBaseZ = 0.24 * HORSE_SCALE;
const horseEyeBaseX = 0.12 * HORSE_SCALE;

const horseEyeRightBase = new THREE.Mesh(new THREE.BoxGeometry(0.05 * HORSE_SCALE, 0.11 * HORSE_SCALE, 0.12 * HORSE_SCALE), eyeBaseGreenMat);
horseEyeRightBase.position.set(horseEyeBaseX, horseEyeBaseY, horseEyeBaseZ);
horseHeadGroup.add(horseEyeRightBase);
const horsePupilRight = new THREE.Mesh(new THREE.BoxGeometry(0.015 * HORSE_SCALE, 0.07 * HORSE_SCALE, 0.06 * HORSE_SCALE), pupilBlackMat);
horsePupilRight.position.set(horseEyeBaseX + 0.02 * HORSE_SCALE, horseEyeBaseY, horseEyeBaseZ);
horseHeadGroup.add(horsePupilRight);

const horseEyeLeftBase = new THREE.Mesh(new THREE.BoxGeometry(0.05 * HORSE_SCALE, 0.11 * HORSE_SCALE, 0.12 * HORSE_SCALE), eyeBaseGreenMat);
horseEyeLeftBase.position.set(horseEyeBaseX, horseEyeBaseY, -horseEyeBaseZ);
horseHeadGroup.add(horseEyeLeftBase);
const horsePupilLeft = new THREE.Mesh(new THREE.BoxGeometry(0.015 * HORSE_SCALE, 0.07 * HORSE_SCALE, 0.06 * HORSE_SCALE), pupilBlackMat);
horsePupilLeft.position.set(horseEyeBaseX + 0.02 * HORSE_SCALE, horseEyeBaseY, -horseEyeBaseZ);
horseHeadGroup.add(horsePupilLeft);

const horseEarRight = new THREE.Mesh(new THREE.BoxGeometry(0.12 * HORSE_SCALE, 0.3 * HORSE_SCALE, 0.12 * HORSE_SCALE), horseMat);
horseEarRight.position.set(-0.1 * HORSE_SCALE, 0.35 * HORSE_SCALE, 0.15 * HORSE_SCALE);
horseEarRight.rotation.z = -0.1;
horseHeadGroup.add(horseEarRight);

const horseEarLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12 * HORSE_SCALE, 0.3 * HORSE_SCALE, 0.12 * HORSE_SCALE), horseMat);
horseEarLeft.position.set(-0.1 * HORSE_SCALE, 0.35 * HORSE_SCALE, -0.15 * HORSE_SCALE);
horseEarLeft.rotation.z = -0.1;
horseHeadGroup.add(horseEarLeft);

horseNeckGroup.add(horseHeadGroup);
horseGroup.add(horseNeckGroup);

function createHorseLeg(x, z) {
    const group = new THREE.Group();
    const upperLeg = new THREE.Mesh(new THREE.BoxGeometry(0.28 * HORSE_SCALE, 0.55 * HORSE_SCALE, 0.28 * HORSE_SCALE), horseMat);
    upperLeg.position.y = -0.275 * HORSE_SCALE;
    upperLeg.castShadow = true;
    upperLeg.receiveShadow = true;
    group.add(upperLeg);
    const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.28 * HORSE_SCALE, 0.25 * HORSE_SCALE, 0.28 * HORSE_SCALE), horseHoofMat);
    hoof.position.y = -0.675 * HORSE_SCALE;
    hoof.castShadow = true;
    group.add(hoof);
    group.position.set(x, horseBodyY - 0.4 * HORSE_SCALE, z);
    return group;
}

const hLegFrontLeft = createHorseLeg(0.65 * HORSE_SCALE, 0.22 * HORSE_SCALE);
const hLegFrontRight = createHorseLeg(0.65 * HORSE_SCALE, -0.22 * HORSE_SCALE);
const hLegBackLeft = createHorseLeg(-0.65 * HORSE_SCALE, 0.22 * HORSE_SCALE);
const hLegBackRight = createHorseLeg(-0.65 * HORSE_SCALE, -0.22 * HORSE_SCALE);

horseGroup.add(hLegFrontLeft);
horseGroup.add(hLegFrontRight);
horseGroup.add(hLegBackLeft);
horseGroup.add(hLegBackRight);

const horseTailGroup = new THREE.Group();
horseTailGroup.position.set(-1.0 * HORSE_SCALE, horseBodyY + 0.2 * HORSE_SCALE, 0);
horseTailGroup.rotation.z = -0.4;
const horseTailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22 * HORSE_SCALE, 1.2 * HORSE_SCALE, 0.22 * HORSE_SCALE), maneMat);
horseTailMesh.position.set(0.1 * HORSE_SCALE, -0.5 * HORSE_SCALE, 0);
horseTailMesh.castShadow = true;
horseTailGroup.add(horseTailMesh);
horseGroup.add(horseTailGroup);

horseGroup.position.set(8, 0.0, -5);
scene.add(horseGroup);

const HORSE_RADIUS = 1.0 * HORSE_SCALE;

// ============================================================
// CERDO
// ============================================================
function createPigTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff9eb5';
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 64; i += 2) {
        for (let j = 0; j < 64; j += 2) {
            if (Math.random() > 0.6) {
                const shade = Math.floor(Math.random() * 20) - 10;
                ctx.fillStyle = `rgb(${255 + shade}, ${158 + shade}, ${181 + shade})`;
                ctx.fillRect(i, j, 2, 2);
            }
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

const pigMat = new THREE.MeshStandardMaterial({ map: createPigTexture(), roughness: 0.7 });
const pigDarkPinkMat = new THREE.MeshStandardMaterial({ color: 0xff8fa3, roughness: 0.7 });
const pigSnoutMat = new THREE.MeshStandardMaterial({ color: 0xff758c, roughness: 0.7 });
const pigNostrilMat = new THREE.MeshStandardMaterial({ color: 0xb5455a, roughness: 0.8 });
const pigEyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });

const PIG_SCALE = 0.7;
const pigGroup = new THREE.Group();
const pigBodyY = 0.8;

const pigBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.9), pigMat);
pigBody.position.set(0, pigBodyY, 0);
pigBody.castShadow = true;
pigBody.receiveShadow = true;
pigGroup.add(pigBody);

const pigHeadGroup = new THREE.Group();
pigHeadGroup.position.set(0.85, pigBodyY + 0.05, 0);

const pigHead = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.6), pigMat);
pigHead.position.set(0, 0, 0);
pigHead.castShadow = true;
pigHead.receiveShadow = true;
pigHeadGroup.add(pigHead);

const pigSnout = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.35), pigSnoutMat);
pigSnout.position.set(0.32, -0.05, 0);
pigSnout.castShadow = true;
pigHeadGroup.add(pigSnout);

const pigNostril1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.05), pigNostrilMat);
pigNostril1.position.set(0.46, -0.05, 0.08);
pigHeadGroup.add(pigNostril1);
const pigNostril2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.05), pigNostrilMat);
pigNostril2.position.set(0.46, -0.05, -0.08);
pigHeadGroup.add(pigNostril2);

const pigEye1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), pigEyeMat);
pigEye1.position.set(0.15, 0.1, 0.32);
pigHeadGroup.add(pigEye1);
const pigEye2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), pigEyeMat);
pigEye2.position.set(0.15, 0.1, -0.32);
pigHeadGroup.add(pigEye2);

const pigEar1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.08), pigDarkPinkMat);
pigEar1.position.set(-0.1, 0.3, 0.32);
pigEar1.rotation.z = -0.2;
pigHeadGroup.add(pigEar1);
const pigEar2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.08), pigDarkPinkMat);
pigEar2.position.set(-0.1, 0.3, -0.32);
pigEar2.rotation.z = -0.2;
pigHeadGroup.add(pigEar2);

pigGroup.add(pigHeadGroup);

function createPigLeg(x, z) {
    const group = new THREE.Group();
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.22), pigMat);
    leg.position.y = -0.225;
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);
    group.position.set(x, pigBodyY - 0.4, z);
    return group;
}

const pigLegFrontLeft = createPigLeg(0.4, 0.3);
const pigLegFrontRight = createPigLeg(0.4, -0.3);
const pigLegBackLeft = createPigLeg(-0.4, 0.3);
const pigLegBackRight = createPigLeg(-0.4, -0.3);

pigGroup.add(pigLegFrontLeft);
pigGroup.add(pigLegFrontRight);
pigGroup.add(pigLegBackLeft);
pigGroup.add(pigLegBackRight);

const pigTailGroup = new THREE.Group();
pigTailGroup.position.set(-0.75, pigBodyY + 0.1, 0);
const pigTailPart1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), pigMat);
pigTailPart1.position.set(-0.05, 0, 0);
pigTailGroup.add(pigTailPart1);
const pigTailPart2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), pigMat);
pigTailPart2.position.set(-0.08, 0.06, 0);
pigTailGroup.add(pigTailPart2);
const pigTailPart3 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), pigMat);
pigTailPart3.position.set(-0.05, 0.12, 0);
pigTailGroup.add(pigTailPart3);
pigGroup.add(pigTailGroup);

pigGroup.position.set(0, 0.0, -8);
scene.add(pigGroup);

const PIG_RADIUS = 0.8 * PIG_SCALE;

// ============================================================
// GALLINA
// ============================================================
const chickenWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.7 });
const chickenRedMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.6 });
const chickenYellowMat = new THREE.MeshStandardMaterial({ color: 0xf39c12, roughness: 0.6 });
const chickenBlackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });

const CHICKEN_SCALE = 0.7;
const chickenGroup = new THREE.Group();
const chickenBodyY = 0.6;

const chickenBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.8), chickenWhiteMat);
chickenBody.position.set(0, chickenBodyY, 0);
chickenBody.castShadow = true;
chickenBody.receiveShadow = true;
chickenGroup.add(chickenBody);

const chickenHeadGroup = new THREE.Group();
chickenHeadGroup.position.set(0.35, chickenBodyY + 0.35, 0);

const chickenHead = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), chickenWhiteMat);
chickenHead.position.set(0, 0, 0);
chickenHead.castShadow = true;
chickenHead.receiveShadow = true;
chickenHeadGroup.add(chickenHead);

const chickenBeak = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.15), chickenYellowMat);
chickenBeak.position.set(0.25, -0.05, 0);
chickenBeak.castShadow = true;
chickenHeadGroup.add(chickenBeak);

const chickenWattle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), chickenRedMat);
chickenWattle.position.set(0.18, -0.15, 0);
chickenHeadGroup.add(chickenWattle);

const chickenComb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.2), chickenRedMat);
chickenComb.position.set(0, 0.22, 0);
chickenHeadGroup.add(chickenComb);

const chickenEye1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), chickenBlackMat);
chickenEye1.position.set(0.08, 0.05, 0.19);
chickenHeadGroup.add(chickenEye1);
const chickenEye2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), chickenBlackMat);
chickenEye2.position.set(0.08, 0.05, -0.19);
chickenHeadGroup.add(chickenEye2);

chickenGroup.add(chickenHeadGroup);

function createChickenLeg(x, z) {
    const group = new THREE.Group();
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), chickenYellowMat);
    leg.position.y = -0.15;
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.18), chickenYellowMat);
    foot.position.set(0.05, -0.3, 0);
    foot.castShadow = true;
    group.add(foot);
    group.position.set(x, chickenBodyY - 0.25, z);
    return group;
}

const chickenLegLeft = createChickenLeg(0.1, 0.25);
const chickenLegRight = createChickenLeg(0.1, -0.25);

chickenGroup.add(chickenLegLeft);
chickenGroup.add(chickenLegRight);

const chickenWingLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.08), chickenWhiteMat);
chickenWingLeft.position.set(0, chickenBodyY, 0.39);
chickenWingLeft.castShadow = true;
chickenGroup.add(chickenWingLeft);
const chickenWingRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.08), chickenWhiteMat);
chickenWingRight.position.set(0, chickenBodyY, -0.39);
chickenWingRight.castShadow = true;
chickenGroup.add(chickenWingRight);

const chickenTailGroup = new THREE.Group();
chickenTailGroup.position.set(-0.4, chickenBodyY + 0.15, 0);
const chickenFeatherMain = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.45, 0.35), chickenWhiteMat);
chickenFeatherMain.rotation.z = -0.45;
chickenFeatherMain.position.set(-0.1, 0.15, 0);
chickenFeatherMain.castShadow = true;
chickenTailGroup.add(chickenFeatherMain);
const chickenFeatherSide1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.1), chickenWhiteMat);
chickenFeatherSide1.rotation.z = -0.3;
chickenFeatherSide1.position.set(-0.05, 0.08, 0.22);
chickenFeatherSide1.castShadow = true;
chickenTailGroup.add(chickenFeatherSide1);
const chickenFeatherSide2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.1), chickenWhiteMat);
chickenFeatherSide2.rotation.z = -0.3;
chickenFeatherSide2.position.set(-0.05, 0.08, -0.22);
chickenFeatherSide2.castShadow = true;
chickenTailGroup.add(chickenFeatherSide2);
chickenGroup.add(chickenTailGroup);

chickenGroup.position.set(-5, 0.0, -8);
scene.add(chickenGroup);

const CHICKEN_RADIUS = 0.5 * CHICKEN_SCALE;

// ============================================================
// TIGRE
// ============================================================
function createRealisticTigerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff7b00';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#111111';
    function drawStripe(x, y, width, height, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillRect(-width/2, -height/2, width, height);
        ctx.restore();
    }
    for (let i = 20; i < 240; i += 25) {
        const randomOffset = (Math.random() - 0.5) * 10;
        ctx.fillRect(i + randomOffset, 10, 8, 35);
        ctx.fillRect(i + 12 + randomOffset, 65, 7, 45);
        drawStripe(i + 5, 55, 6, 25, 0.3);
        drawStripe(i + 18, 90, 6, 30, -0.2);
    }
    for (let x = 0; x < 256; x += 2) {
        for (let y = 0; y < 128; y += 2) {
            if (Math.random() > 0.8) {
                const p = ctx.getImageData(x, y, 1, 1).data;
                if (p[0] > 200) {
                    ctx.fillStyle = Math.random() > 0.5 ? '#e66b00' : '#ff881a';
                    ctx.fillRect(x, y, 2, 2);
                }
            }
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

const tigerTexture = createRealisticTigerTexture();
const tigerMat = new THREE.MeshStandardMaterial({ map: tigerTexture, roughness: 0.7 });
const tigerWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.7 });
const tigerBlackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
const tigerEyeMat = new THREE.MeshStandardMaterial({ color: 0x33ff22, roughness: 0.1, emissive: 0x11aa00, emissiveIntensity: 0.5 });
const tigerPupilMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1 });

const TIGER_SCALE = 0.85;
const tigerGroup = new THREE.Group();
const tigerBodyY = 0.95;

const tigerBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 0.65), tigerMat);
tigerBody.position.set(0, tigerBodyY, 0);
tigerBody.castShadow = true;
tigerBody.receiveShadow = true;
tigerGroup.add(tigerBody);

const tigerHeadGroup = new THREE.Group();
tigerHeadGroup.position.set(1.05, tigerBodyY + 0.15, 0);

const tigerHead = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.65), tigerMat);
tigerHead.position.set(0, 0, 0);
tigerHead.castShadow = true;
tigerHead.receiveShadow = true;
tigerHeadGroup.add(tigerHead);

const tigerSnout = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.38), tigerWhiteMat);
tigerSnout.position.set(0.34, -0.08, 0);
tigerSnout.castShadow = true;
tigerHeadGroup.add(tigerSnout);

const tigerNose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.12), tigerBlackMat);
tigerNose.position.set(0.5, -0.04, 0);
tigerHeadGroup.add(tigerNose);

const tigerEye1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.08), tigerEyeMat);
tigerEye1.position.set(0.33, 0.1, 0.15);
tigerHeadGroup.add(tigerEye1);
const tigerPupil1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.03), tigerPupilMat);
tigerPupil1.position.set(0.36, 0.1, 0.15);
tigerHeadGroup.add(tigerPupil1);
const tigerEye2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.08), tigerEyeMat);
tigerEye2.position.set(0.33, 0.1, -0.15);
tigerHeadGroup.add(tigerEye2);
const tigerPupil2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.03), tigerPupilMat);
tigerPupil2.position.set(0.36, 0.1, -0.15);
tigerHeadGroup.add(tigerPupil2);

const tigerEar1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.12), tigerMat);
tigerEar1.position.set(-0.08, 0.36, 0.22);
tigerEar1.rotation.z = -0.2;
tigerHeadGroup.add(tigerEar1);
const tigerEar2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.12), tigerMat);
tigerEar2.position.set(-0.08, 0.36, -0.22);
tigerEar2.rotation.z = -0.2;
tigerHeadGroup.add(tigerEar2);

tigerGroup.add(tigerHeadGroup);

function createTigerLeg(x, z) {
    const group = new THREE.Group();
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22), tigerMat);
    leg.position.y = -0.325;
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);
    const paw = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.24), tigerBlackMat);
    paw.position.y = -0.65;
    paw.castShadow = true;
    group.add(paw);
    group.position.set(x, tigerBodyY - 0.325, z);
    return group;
}

const tigerLegFrontLeft = createTigerLeg(0.55, 0.22);
const tigerLegFrontRight = createTigerLeg(0.55, -0.22);
const tigerLegBackLeft = createTigerLeg(-0.55, 0.22);
const tigerLegBackRight = createTigerLeg(-0.55, -0.22);

tigerGroup.add(tigerLegFrontLeft);
tigerGroup.add(tigerLegFrontRight);
tigerGroup.add(tigerLegBackLeft);
tigerGroup.add(tigerLegBackRight);

const tigerTailGroup = new THREE.Group();
tigerTailGroup.position.set(-0.95, tigerBodyY + 0.05, 0);
const tigerTailPart1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.14, 0.14), tigerMat);
tigerTailPart1.position.set(-0.3, -0.1, 0);
tigerTailPart1.rotation.z = 0.3;
tigerTailPart1.castShadow = true;
tigerTailGroup.add(tigerTailPart1);
const tigerTailPart2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.12), tigerBlackMat);
tigerTailPart2.position.set(-0.75, -0.28, 0);
tigerTailPart2.rotation.z = 0.6;
tigerTailPart2.castShadow = true;
tigerTailGroup.add(tigerTailPart2);
tigerGroup.add(tigerTailGroup);

tigerGroup.position.set(12, 0.0, -8);
scene.add(tigerGroup);

const TIGER_RADIUS = 0.9 * TIGER_SCALE;

// ============================================================
// OSO PANDA
// ============================================================
const pandaWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.8 });
const pandaBlackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
const pandaNoseMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4 });

const PANDA_SCALE = 0.8;
const pandaGroup = new THREE.Group();
const pandaBodyY = 0.8;

const pandaBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 1.0), pandaWhiteMat);
pandaBody.position.set(0, pandaBodyY, 0);
pandaBody.castShadow = true;
pandaBody.receiveShadow = true;
pandaGroup.add(pandaBody);

const pandaSpot1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.97, 0.35), pandaBlackMat);
pandaSpot1.position.set(0.05, pandaBodyY, -0.34);
pandaSpot1.castShadow = true;
pandaGroup.add(pandaSpot1);
const pandaSpot2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.97, 0.35), pandaBlackMat);
pandaSpot2.position.set(0.05, pandaBodyY, 0.34);
pandaSpot2.castShadow = true;
pandaGroup.add(pandaSpot2);

const pandaHeadGroup = new THREE.Group();
pandaHeadGroup.position.set(0.75, pandaBodyY + 0.35, 0);

const pandaHead = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.6), pandaWhiteMat);
pandaHead.position.set(0, 0, 0);
pandaHead.castShadow = true;
pandaHead.receiveShadow = true;
pandaHeadGroup.add(pandaHead);

const pandaEyeY = 0.06;
const pandaEyeSpot1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.2), pandaBlackMat);
pandaEyeSpot1.position.set(0.327, pandaEyeY, 0.16);
pandaEyeSpot1.castShadow = true;
pandaHeadGroup.add(pandaEyeSpot1);
const pandaEye1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), pandaWhiteMat);
pandaEye1.position.set(0.36, pandaEyeY, 0.16);
pandaHeadGroup.add(pandaEye1);
const pandaPupil1 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.04), pandaBlackMat);
pandaPupil1.position.set(0.375, pandaEyeY, 0.16);
pandaHeadGroup.add(pandaPupil1);

const pandaEyeSpot2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.2), pandaBlackMat);
pandaEyeSpot2.position.set(0.327, pandaEyeY, -0.16);
pandaEyeSpot2.castShadow = true;
pandaHeadGroup.add(pandaEyeSpot2);
const pandaEye2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), pandaWhiteMat);
pandaEye2.position.set(0.36, pandaEyeY, -0.16);
pandaHeadGroup.add(pandaEye2);
const pandaPupil2 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.04), pandaBlackMat);
pandaPupil2.position.set(0.375, pandaEyeY, -0.16);
pandaHeadGroup.add(pandaPupil2);

const pandaSnout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.25), pandaBlackMat);
pandaSnout.position.set(0.33, -0.1, 0);
pandaHeadGroup.add(pandaSnout);
const pandaNose = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.12), pandaNoseMat);
pandaNose.position.set(0.43, -0.06, 0);
pandaHeadGroup.add(pandaNose);

const pandaEar1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.1), pandaBlackMat);
pandaEar1.position.set(-0.05, 0.38, 0.22);
pandaEar1.castShadow = true;
pandaHeadGroup.add(pandaEar1);
const pandaEar2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.1), pandaBlackMat);
pandaEar2.position.set(-0.05, 0.38, -0.22);
pandaEar2.castShadow = true;
pandaHeadGroup.add(pandaEar2);

pandaGroup.add(pandaHeadGroup);

function createPandaLeg(x, z) {
    const group = new THREE.Group();
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 0.42), pandaBlackMat);
    leg.position.y = -0.3;
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);
    group.position.set(x, pandaBodyY - 0.3, z);
    return group;
}

const pandaLegFrontLeft = createPandaLeg(0.4, 0.28);
const pandaLegFrontRight = createPandaLeg(0.4, -0.28);
const pandaLegBackLeft = createPandaLeg(-0.4, 0.28);
const pandaLegBackRight = createPandaLeg(-0.4, -0.28);

pandaGroup.add(pandaLegFrontLeft);
pandaGroup.add(pandaLegFrontRight);
pandaGroup.add(pandaLegBackLeft);
pandaGroup.add(pandaLegBackRight);

const pandaTail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), pandaWhiteMat);
pandaTail.position.set(-0.72, pandaBodyY + 0.05, 0);
pandaTail.castShadow = true;
pandaGroup.add(pandaTail);

pandaGroup.position.set(-12, 0.0, -8);
scene.add(pandaGroup);

const PANDA_RADIUS = 1.0 * PANDA_SCALE;

// ============================================================
// ZORRO
// ============================================================
const foxOrangeMat = new THREE.MeshStandardMaterial({ color: 0xD35400, roughness: 0.8 });
const foxWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.8 });
const foxBlackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
const foxNoseMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4 });

const FOX_SCALE = 0.8;
const foxGroup = new THREE.Group();
const foxBodyY = 0.6;

const foxBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.6), foxOrangeMat);
foxBody.position.set(0, foxBodyY, 0);
foxBody.castShadow = true;
foxBody.receiveShadow = true;
foxGroup.add(foxBody);

const foxBelly = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.2, 0.58), foxWhiteMat);
foxBelly.position.set(0, foxBodyY - 0.2, 0);
foxBelly.castShadow = true;
foxGroup.add(foxBelly);

const foxHeadGroup = new THREE.Group();
foxHeadGroup.position.set(0.65, foxBodyY + 0.25, 0);

const foxHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), foxOrangeMat);
foxHead.position.set(0, 0, 0);
foxHead.castShadow = true;
foxHead.receiveShadow = true;
foxHeadGroup.add(foxHead);

const foxSnout = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.3), foxOrangeMat);
foxSnout.position.set(0.35, -0.1, 0);
foxHeadGroup.add(foxSnout);

const foxChinWhite = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.08, 0.33), foxWhiteMat);
foxChinWhite.position.set(0.35, -0.18, 0);
foxChinWhite.castShadow = true;
foxHeadGroup.add(foxChinWhite);

const foxNose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.1), foxNoseMat);
foxNose.position.set(0.53, -0.05, 0);
foxHeadGroup.add(foxNose);

const foxEyeY = 0.05;
const foxEye1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.04), foxBlackMat);
foxEye1.position.set(0.2, foxEyeY, 0.26);
foxHeadGroup.add(foxEye1);
const foxEye2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.04), foxBlackMat);
foxEye2.position.set(0.2, foxEyeY, -0.26);
foxHeadGroup.add(foxEye2);

const foxEar1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.12), foxBlackMat);
foxEar1.position.set(-0.1, 0.35, 0.16);
foxEar1.rotation.z = -0.2;
foxEar1.castShadow = true;
foxHeadGroup.add(foxEar1);
const foxEar2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.12), foxBlackMat);
foxEar2.position.set(-0.1, 0.35, -0.16);
foxEar2.rotation.z = -0.2;
foxEar2.castShadow = true;
foxHeadGroup.add(foxEar2);

foxGroup.add(foxHeadGroup);

function createFoxLeg(x, z) {
    const group = new THREE.Group();
    const upperLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.25, 0.22), foxOrangeMat);
    upperLeg.position.y = -0.125;
    upperLeg.castShadow = true;
    group.add(upperLeg);
    const lowerLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), foxBlackMat);
    lowerLeg.position.y = -0.35;
    lowerLeg.castShadow = true;
    lowerLeg.receiveShadow = true;
    group.add(lowerLeg);
    group.position.set(x, foxBodyY - 0.3, z);
    return group;
}

const foxLegFrontLeft = createFoxLeg(0.35, 0.18);
const foxLegFrontRight = createFoxLeg(0.35, -0.18);
const foxLegBackLeft = createFoxLeg(-0.35, 0.18);
const foxLegBackRight = createFoxLeg(-0.35, -0.18);

foxGroup.add(foxLegFrontLeft);
foxGroup.add(foxLegFrontRight);
foxGroup.add(foxLegBackLeft);
foxGroup.add(foxLegBackRight);

const foxTailGroup = new THREE.Group();
foxTailGroup.position.set(-0.6, foxBodyY + 0.1, 0);
const foxTailBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.35), foxOrangeMat);
foxTailBase.position.set(-0.2, 0, 0);
foxTailBase.rotation.z = 0.4;
foxTailBase.castShadow = true;
foxTailGroup.add(foxTailBase);
const foxTailTip = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), foxWhiteMat);
foxTailTip.position.set(-0.5, -0.12, 0);
foxTailTip.rotation.z = 0.4;
foxTailTip.castShadow = true;
foxTailGroup.add(foxTailTip);
foxGroup.add(foxTailGroup);

foxGroup.position.set(15, 0.0, 5);
scene.add(foxGroup);

const FOX_RADIUS = 0.7 * FOX_SCALE;

// ============================================================
// LEOPARDO
// ============================================================
function createLeopardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#F1C40F'; ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#111111';
    for (let i = 0; i < 160; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 6 + 3, 0, Math.PI * 2);
        ctx.fill();
        if (Math.random() > 0.5) {
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 3 + 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#111111';
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

const leopardMat = new THREE.MeshStandardMaterial({ map: createLeopardTexture(), roughness: 0.7 });
const leopardWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.8, flatShading: true });
const leopardNoseMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4, flatShading: true });
const leopardEyeBaseGreenMat = new THREE.MeshStandardMaterial({ color: 0x32CD32, roughness: 0.1, flatShading: true });
const leopardPupilBlackMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1, flatShading: true });

const LEOPARD_SCALE = 0.85;
const leopardGroup = new THREE.Group();
const leopardBodyY = 0.95;

const leopardBody = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 0.6), leopardMat);
leopardBody.position.set(0, leopardBodyY, 0);
leopardBody.castShadow = true;
leopardBody.receiveShadow = true;
leopardGroup.add(leopardBody);

const leopardBelly = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.25, 0.58), leopardWhiteMat);
leopardBelly.position.set(0, leopardBodyY - 0.22, 0);
leopardGroup.add(leopardBelly);

const leopardHeadGroup = new THREE.Group();
leopardHeadGroup.position.set(0.95, leopardBodyY + 0.2, 0);

const leopardHeadBase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.55), leopardMat);
leopardHeadBase.castShadow = true;
leopardHeadGroup.add(leopardHeadBase);

const leopardSnout = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.38), leopardMat);
leopardSnout.position.set(0.3, -0.1, 0);
leopardHeadGroup.add(leopardSnout);

const leopardNose = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.14), leopardNoseMat);
leopardNose.position.set(0.48, -0.06, 0);
leopardHeadGroup.add(leopardNose);

const leopardEyeBaseY = 0.08;
const leopardEyeBaseZ = 0.18;
const leopardEyeBaseX = 0.29;
const leopardEyeBaseWidth = 0.12;
const leopardEyeBaseHeight = 0.11;
const leopardEyeBaseDepth = 0.03;

const leopardEyeRightBase = new THREE.Mesh(new THREE.BoxGeometry(leopardEyeBaseDepth, leopardEyeBaseHeight, leopardEyeBaseWidth), leopardEyeBaseGreenMat);
leopardEyeRightBase.position.set(leopardEyeBaseX, leopardEyeBaseY, leopardEyeBaseZ);
leopardHeadGroup.add(leopardEyeRightBase);
const leopardPupilRight = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.07, 0.06), leopardPupilBlackMat);
leopardPupilRight.position.set(leopardEyeBaseX + 0.015, leopardEyeBaseY, leopardEyeBaseZ);
leopardHeadGroup.add(leopardPupilRight);

const leopardEyeLeftBase = new THREE.Mesh(new THREE.BoxGeometry(leopardEyeBaseDepth, leopardEyeBaseHeight, leopardEyeBaseWidth), leopardEyeBaseGreenMat);
leopardEyeLeftBase.position.set(leopardEyeBaseX, leopardEyeBaseY, -leopardEyeBaseZ);
leopardHeadGroup.add(leopardEyeLeftBase);
const leopardPupilLeft = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.07, 0.06), leopardPupilBlackMat);
leopardPupilLeft.position.set(leopardEyeBaseX + 0.015, leopardEyeBaseY, -leopardEyeBaseZ);
leopardHeadGroup.add(leopardPupilLeft);

const leopardEarRight = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.14), leopardMat);
leopardEarRight.position.set(-0.15, 0.24, 0.22);
leopardHeadGroup.add(leopardEarRight);
const leopardEarLeft = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.14), leopardMat);
leopardEarLeft.position.set(-0.15, 0.24, -0.22);
leopardHeadGroup.add(leopardEarLeft);

leopardGroup.add(leopardHeadGroup);

function createLeopardLeg(x, z) {
    const group = new THREE.Group();
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.65, 0.24), leopardMat);
    leg.position.y = -0.325;
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);
    group.position.set(x, leopardBodyY - 0.325, z);
    return group;
}

const leopardLegFrontLeft = createLeopardLeg(0.5, 0.18);
const leopardLegFrontRight = createLeopardLeg(0.5, -0.18);
const leopardLegBackLeft = createLeopardLeg(-0.5, 0.18);
const leopardLegBackRight = createLeopardLeg(-0.5, -0.18);

leopardGroup.add(leopardLegFrontLeft);
leopardGroup.add(leopardLegFrontRight);
leopardGroup.add(leopardLegBackLeft);
leopardGroup.add(leopardLegBackRight);

const leopardTailGroup = new THREE.Group();
leopardTailGroup.position.set(-0.85, leopardBodyY + 0.05, 0);
const leopardTail = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.14), leopardMat);
leopardTail.position.set(-0.4, -0.1, 0);
leopardTail.rotation.z = 0.6;
leopardTail.castShadow = true;
leopardTailGroup.add(leopardTail);
const leopardTailTip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.12), leopardNoseMat);
leopardTailTip.position.set(-0.75, -0.3, 0);
leopardTailTip.rotation.z = 1.0;
leopardTailTip.castShadow = true;
leopardTailGroup.add(leopardTailTip);
leopardGroup.add(leopardTailGroup);

leopardGroup.position.set(-15, 0.0, 5);
scene.add(leopardGroup);

const LEOPARD_RADIUS = 0.85 * LEOPARD_SCALE;

// ============================================================
// LEÓN (nuevo, con la misma IA que los demás)
// ============================================================
function createLionTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#E5C158'; 
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

const lionMat = new THREE.MeshStandardMaterial({ map: createLionTexture(), roughness: 0.7 });
const lionManeMat = new THREE.MeshStandardMaterial({ color: 0x4A2E18, roughness: 0.9, flatShading: true });
const lionBellyMat = new THREE.MeshStandardMaterial({ color: 0xF4E8C1, roughness: 0.8, flatShading: true });
const lionNoseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, flatShading: true });
const lionEyeBaseGreenMat = new THREE.MeshStandardMaterial({ color: 0x32CD32, roughness: 0.1, flatShading: true });
const lionPupilBlackMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1, flatShading: true });

const LION_SCALE = 0.9;
const lionGroup = new THREE.Group();
const lionBodyY = 0.95;

// Cuerpo
const lionBodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 0.65), lionMat);
lionBodyMesh.position.set(0, lionBodyY, 0);
lionBodyMesh.castShadow = true;
lionBodyMesh.receiveShadow = true;
lionGroup.add(lionBodyMesh);

const lionBelly = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.28, 0.63), lionBellyMat);
lionBelly.position.set(0, lionBodyY - 0.24, 0);
lionGroup.add(lionBelly);

// Cabeza
const lionHeadGroup = new THREE.Group();
lionHeadGroup.position.set(0.98, lionBodyY + 0.2, 0);

// Melena grande atrás
const lionMane = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.9), lionManeMat);
lionMane.position.set(-0.2, 0.05, 0);
lionMane.castShadow = true;
lionHeadGroup.add(lionMane);

// Base de la cabeza
const lionHeadBase = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.4, 0.52), lionMat);
lionHeadBase.position.set(0.08, 0, 0);
lionHeadBase.castShadow = true;
lionHeadGroup.add(lionHeadBase);

// Hocico
const lionSnout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.36), lionMat);
lionSnout.position.set(0.26, -0.08, 0);
lionHeadGroup.add(lionSnout);

const lionNose = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.12), lionNoseMat);
lionNose.position.set(0.39, -0.05, 0);
lionHeadGroup.add(lionNose);

// Ojos sobresalientes
const lionEyeBaseY = 0.08;
const lionEyeBaseZ = 0.18;
const lionEyeBaseX = 0.32;
const lionEyeBaseWidth = 0.12;
const lionEyeBaseHeight = 0.11;
const lionEyeBaseDepth = 0.05;

const lionEyeRightBase = new THREE.Mesh(new THREE.BoxGeometry(lionEyeBaseDepth, lionEyeBaseHeight, lionEyeBaseWidth), lionEyeBaseGreenMat);
lionEyeRightBase.position.set(lionEyeBaseX + 0.01, lionEyeBaseY, lionEyeBaseZ);
lionHeadGroup.add(lionEyeRightBase);
const lionPupilRight = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.07, 0.06), lionPupilBlackMat);
lionPupilRight.position.set(lionEyeBaseX + 0.03, lionEyeBaseY, lionEyeBaseZ);
lionHeadGroup.add(lionPupilRight);

const lionEyeLeftBase = new THREE.Mesh(new THREE.BoxGeometry(lionEyeBaseDepth, lionEyeBaseHeight, lionEyeBaseWidth), lionEyeBaseGreenMat);
lionEyeLeftBase.position.set(lionEyeBaseX + 0.01, lionEyeBaseY, -lionEyeBaseZ);
lionHeadGroup.add(lionEyeLeftBase);
const lionPupilLeft = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.07, 0.06), lionPupilBlackMat);
lionPupilLeft.position.set(lionEyeBaseX + 0.03, lionEyeBaseY, -lionEyeBaseZ);
lionHeadGroup.add(lionPupilLeft);

// Orejas
const lionEarRight = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.14), lionManeMat);
lionEarRight.position.set(-0.3, 0.45, 0.32);
lionHeadGroup.add(lionEarRight);
const lionEarLeft = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.14), lionManeMat);
lionEarLeft.position.set(-0.3, 0.45, -0.32);
lionHeadGroup.add(lionEarLeft);

lionGroup.add(lionHeadGroup);

// Patas robustas
function createLionLeg(x, z) {
    const group = new THREE.Group();
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.65, 0.28), lionMat);
    leg.position.y = -0.325;
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);
    group.position.set(x, lionBodyY - 0.325, z);
    return group;
}

const lionLegFrontLeft = createLionLeg(0.55, 0.2);
const lionLegFrontRight = createLionLeg(0.55, -0.2);
const lionLegBackLeft = createLionLeg(-0.55, 0.2);
const lionLegBackRight = createLionLeg(-0.55, -0.2);

lionGroup.add(lionLegFrontLeft);
lionGroup.add(lionLegFrontRight);
lionGroup.add(lionLegBackLeft);
lionGroup.add(lionLegBackRight);

// Cola con borla negra
const lionTailGroup = new THREE.Group();
lionTailGroup.position.set(-0.9, lionBodyY + 0.05, 0);
const lionTail = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 0.14), lionMat);
lionTail.position.set(-0.4, -0.1, 0);
lionTail.rotation.z = 0.6;
lionTail.castShadow = true;
lionTailGroup.add(lionTail);
const lionTailTip = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.22), lionNoseMat);
lionTailTip.position.set(-0.8, -0.32, 0);
lionTailTip.rotation.z = 1.0;
lionTailTip.castShadow = true;
lionTailGroup.add(lionTailTip);
lionGroup.add(lionTailGroup);

lionGroup.position.set(18, 0.0, -8);
scene.add(lionGroup);

const LION_RADIUS = 0.95 * LION_SCALE;

// ============================================================
// VARIABLES DE ESTADO DE LOS ANIMALES
// ============================================================
let cowSpeed = 1.5, cowDirX = 0, cowDirZ = 1, cowTime = 0;
let cowIsTurning = false, cowTurnTargetX = 0, cowTurnTargetZ = 1;
const cowTurnSpeed = 3.0;
let cowCycleTimer = 0, cowIsWalking = true;

let horseSpeed = 1.5, horseDirX = 0, horseDirZ = 1, horseTime = 0;
let horseIsTurning = false, horseTurnTargetX = 0, horseTurnTargetZ = 1;
const horseTurnSpeed = 3.0;
let horseCycleTimer = 0, horseIsWalking = true;

let pigSpeed = 1.2, pigDirX = 0, pigDirZ = 1, pigTime = 0;
let pigIsTurning = false, pigTurnTargetX = 0, pigTurnTargetZ = 1;
const pigTurnSpeed = 3.0;
let pigCycleTimer = 0, pigIsWalking = true;

let chickenSpeed = 1.0, chickenDirX = 0, chickenDirZ = 1, chickenTime = 0;
let chickenIsTurning = false, chickenTurnTargetX = 0, chickenTurnTargetZ = 1;
const chickenTurnSpeed = 3.5;
let chickenCycleTimer = 0, chickenIsWalking = true;

let tigerSpeed = 1.8, tigerDirX = 0, tigerDirZ = 1, tigerTime = 0;
let tigerIsTurning = false, tigerTurnTargetX = 0, tigerTurnTargetZ = 1;
const tigerTurnSpeed = 3.0;
let tigerCycleTimer = 0, tigerIsWalking = true;

let pandaSpeed = 1.0, pandaDirX = 0, pandaDirZ = 1, pandaTime = 0;
let pandaIsTurning = false, pandaTurnTargetX = 0, pandaTurnTargetZ = 1;
const pandaTurnSpeed = 2.5;
let pandaCycleTimer = 0, pandaIsWalking = true;

let foxSpeed = 2.0, foxDirX = 0, foxDirZ = 1, foxTime = 0;
let foxIsTurning = false, foxTurnTargetX = 0, foxTurnTargetZ = 1;
const foxTurnSpeed = 3.5;
let foxCycleTimer = 0, foxIsWalking = true;

let leopardSpeed = 2.0, leopardDirX = 0, leopardDirZ = 1, leopardTime = 0;
let leopardIsTurning = false, leopardTurnTargetX = 0, leopardTurnTargetZ = 1;
const leopardTurnSpeed = 3.2;
let leopardCycleTimer = 0, leopardIsWalking = true;

let lionSpeed = 1.8, lionDirX = 0, lionDirZ = 1, lionTime = 0;
let lionIsTurning = false, lionTurnTargetX = 0, lionTurnTargetZ = 1;
const lionTurnSpeed = 2.8;
let lionCycleTimer = 0, lionIsWalking = true;

// ============================================================
// CARGAR PARTIDA
// ============================================================
const savedGame = loadGame();

if (savedGame) {
    if (savedGame.rx) rx = savedGame.rx;
    if (savedGame.rz) rz = savedGame.rz;
    
    generateIslandIncremental();
    
    if (savedGame.removedBaseBlocks) {
        for (const pos of savedGame.removedBaseBlocks) {
            const key = `${pos.x},${groundY},${pos.z}`;
            const data = blocks.get(key);
            if (data && data.mesh) {
                scene.remove(data.mesh);
                data.mesh.geometry.dispose();
                data.mesh.material.dispose();
            }
            blocks.delete(key);
        }
    }
    
    if (savedGame.playerBlocks) {
        for (const b of savedGame.playerBlocks) {
            const key = `${b.x},${b.y},${b.z}`;
            if (!blocks.has(key)) {
                const mesh = createBlockMesh(b.type, b.x, b.y, b.z);
                if (mesh) {
                    scene.add(mesh);
                    blocks.set(key, { mesh, type: b.type, x: b.x, y: b.y, z: b.z });
                }
            }
        }
    }
    
    if (savedGame.player) {
        camera.position.set(savedGame.player.x, savedGame.player.y, savedGame.player.z);
        camera.rotation.x = savedGame.player.rotX || 0;
        camera.rotation.y = savedGame.player.rotY || 0;
        camera.rotation.z = savedGame.player.rotZ || 0;
    }
    
    if (savedGame.cow) {
        cowGroup.position.set(savedGame.cow.x, savedGame.cow.y, savedGame.cow.z);
        cowDirX = savedGame.cow.dirX; cowDirZ = savedGame.cow.dirZ;
        cowIsWalking = savedGame.cow.isWalking; cowCycleTimer = savedGame.cow.cycleTimer;
        cowGroup.rotation.y = Math.atan2(cowDirX, cowDirZ);
    }
    if (savedGame.horse) {
        horseGroup.position.set(savedGame.horse.x, savedGame.horse.y, savedGame.horse.z);
        horseDirX = savedGame.horse.dirX; horseDirZ = savedGame.horse.dirZ;
        horseIsWalking = savedGame.horse.isWalking; horseCycleTimer = savedGame.horse.cycleTimer;
        horseGroup.rotation.y = Math.atan2(horseDirX, horseDirZ) - Math.PI / 2;
    }
    if (savedGame.pig) {
        pigGroup.position.set(savedGame.pig.x, savedGame.pig.y, savedGame.pig.z);
        pigDirX = savedGame.pig.dirX; pigDirZ = savedGame.pig.dirZ;
        pigIsWalking = savedGame.pig.isWalking; pigCycleTimer = savedGame.pig.cycleTimer;
        pigGroup.rotation.y = Math.atan2(pigDirX, pigDirZ) - Math.PI / 2;
    }
    if (savedGame.chicken) {
        chickenGroup.position.set(savedGame.chicken.x, savedGame.chicken.y, savedGame.chicken.z);
        chickenDirX = savedGame.chicken.dirX; chickenDirZ = savedGame.chicken.dirZ;
        chickenIsWalking = savedGame.chicken.isWalking; chickenCycleTimer = savedGame.chicken.cycleTimer;
        chickenGroup.rotation.y = Math.atan2(chickenDirX, chickenDirZ) - Math.PI / 2;
    }
    if (savedGame.tiger) {
        tigerGroup.position.set(savedGame.tiger.x, savedGame.tiger.y, savedGame.tiger.z);
        tigerDirX = savedGame.tiger.dirX; tigerDirZ = savedGame.tiger.dirZ;
        tigerIsWalking = savedGame.tiger.isWalking; tigerCycleTimer = savedGame.tiger.cycleTimer;
        tigerGroup.rotation.y = Math.atan2(tigerDirX, tigerDirZ) - Math.PI / 2;
    }
    if (savedGame.panda) {
        pandaGroup.position.set(savedGame.panda.x, savedGame.panda.y, savedGame.panda.z);
        pandaDirX = savedGame.panda.dirX; pandaDirZ = savedGame.panda.dirZ;
        pandaIsWalking = savedGame.panda.isWalking; pandaCycleTimer = savedGame.panda.cycleTimer;
        pandaGroup.rotation.y = Math.atan2(pandaDirX, pandaDirZ) - Math.PI / 2;
    }
    if (savedGame.fox) {
        foxGroup.position.set(savedGame.fox.x, savedGame.fox.y, savedGame.fox.z);
        foxDirX = savedGame.fox.dirX; foxDirZ = savedGame.fox.dirZ;
        foxIsWalking = savedGame.fox.isWalking; foxCycleTimer = savedGame.fox.cycleTimer;
        foxGroup.rotation.y = Math.atan2(foxDirX, foxDirZ) - Math.PI / 2;
    }
    if (savedGame.leopard) {
        leopardGroup.position.set(savedGame.leopard.x, savedGame.leopard.y, savedGame.leopard.z);
        leopardDirX = savedGame.leopard.dirX; leopardDirZ = savedGame.leopard.dirZ;
        leopardIsWalking = savedGame.leopard.isWalking; leopardCycleTimer = savedGame.leopard.cycleTimer;
        leopardGroup.rotation.y = Math.atan2(leopardDirX, leopardDirZ) - Math.PI / 2;
    }
    if (savedGame.lion) {
        lionGroup.position.set(savedGame.lion.x, savedGame.lion.y, savedGame.lion.z);
        lionDirX = savedGame.lion.dirX; lionDirZ = savedGame.lion.dirZ;
        lionIsWalking = savedGame.lion.isWalking; lionCycleTimer = savedGame.lion.cycleTimer;
        lionGroup.rotation.y = Math.atan2(lionDirX, lionDirZ) - Math.PI / 2;
    }
    
    if (savedGame.selectedBlock) {
        selectedBlock = savedGame.selectedBlock;
    }
    
    console.log('✅ Partida restaurada');
} else {
    generateIslandIncremental();
}

// ============================================================
// IA DE LA VACA
// ============================================================
function updateCowMovement(delta) {
    cowCycleTimer += delta;
    if (cowIsWalking) {
        if (cowCycleTimer >= WALK_DURATION) { cowIsWalking = false; cowCycleTimer = 0; }
    } else {
        if (cowCycleTimer >= IDLE_DURATION) { cowIsWalking = true; cowCycleTimer = 0; }
    }

    if (cowIsWalking) cowTime += delta;
    const currentX = cowGroup.position.x;
    const currentZ = cowGroup.position.z;

    if (cowIsWalking) {
        const obstacle1 = checkObstacleAhead(currentX, currentZ, cowDirX, cowDirZ, 0.6);
        const obstacle2 = checkObstacleAhead(currentX, currentZ, cowDirX, cowDirZ, 1.0);
        const obstacle3 = checkObstacleAhead(currentX, currentZ, cowDirX, cowDirZ, 1.4);
        let shouldTurn = false;
        if (obstacle1 === 'water' || obstacle2 === 'water' || obstacle3 === 'water' ||
            obstacle1 === 'high_column' || obstacle2 === 'high_column' || obstacle3 === 'high_column') {
            shouldTurn = true;
        }
        if (shouldTurn && !cowIsTurning) {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = cowDirX * Math.cos(turnSign * Math.PI/2) - cowDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = cowDirX * Math.sin(turnSign * Math.PI/2) + cowDirZ * Math.cos(turnSign * Math.PI/2);
            cowTurnTargetX = newDirX; cowTurnTargetZ = newDirZ; cowIsTurning = true;
        }
    }

    if (cowIsTurning) {
        cowDirX += (cowTurnTargetX - cowDirX) * Math.min(1, cowTurnSpeed * delta);
        cowDirZ += (cowTurnTargetZ - cowDirZ) * Math.min(1, cowTurnSpeed * delta);
        const len = Math.sqrt(cowDirX * cowDirX + cowDirZ * cowDirZ);
        if (len > 0.0001) { cowDirX /= len; cowDirZ /= len; }
        const dot = cowDirX * cowTurnTargetX + cowDirZ * cowTurnTargetZ;
        if (dot > 0.999) {
            cowDirX = cowTurnTargetX; cowDirZ = cowTurnTargetZ; cowIsTurning = false;
        }
    }

    if (cowIsWalking && !cowIsTurning) {
        const moveSpeed = cowSpeed * delta;
        const newX = currentX + cowDirX * moveSpeed;
        const newZ = currentZ + cowDirZ * moveSpeed;
        if (isInsideIslandOrBeach(newX, newZ)) {
            cowGroup.position.x = newX; cowGroup.position.z = newZ;
        } else {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = cowDirX * Math.cos(turnSign * Math.PI/2) - cowDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = cowDirX * Math.sin(turnSign * Math.PI/2) + cowDirZ * Math.cos(turnSign * Math.PI/2);
            cowTurnTargetX = newDirX; cowTurnTargetZ = newDirZ; cowIsTurning = true;
        }
    }
    
    cowGroup.rotation.y = Math.atan2(cowDirX, cowDirZ);
    const terrainHeight = getTerrainHeightAt(cowGroup.position.x, cowGroup.position.z);
    cowGroup.position.y = terrainHeight;
    
    const legSpeed = 3.5, legAngle = 0.5;
    if (cowIsWalking && !cowIsTurning) {
        cowLegFrontLeft.rotation.x = Math.sin(cowTime * legSpeed) * legAngle;
        cowLegFrontRight.rotation.x = Math.sin(cowTime * legSpeed + Math.PI) * legAngle;
        cowLegBackLeft.rotation.x = Math.sin(cowTime * legSpeed + Math.PI) * legAngle;
        cowLegBackRight.rotation.x = Math.sin(cowTime * legSpeed) * legAngle;
        cowGroup.position.y += Math.abs(Math.sin(cowTime * legSpeed)) * 0.03;
    } else {
        cowLegFrontLeft.rotation.x = 0; cowLegFrontRight.rotation.x = 0;
        cowLegBackLeft.rotation.x = 0; cowLegBackRight.rotation.x = 0;
    }
    
    if (cowIsWalking) {
        cowTailGroup.rotation.z = Math.sin(cowTime * 0.8) * 0.15;
        cowTailGroup.rotation.x = 0.1 + Math.sin(cowTime * 0.6) * 0.05;
    } else {
        cowTailGroup.rotation.z *= 0.95; cowTailGroup.rotation.x *= 0.95;
    }
    cowHeadGroup.rotation.z = Math.sin(cowTime * 0.5) * 0.03;
}

// ============================================================
// IA DEL CABALLO
// ============================================================
function updateHorseMovement(delta) {
    horseCycleTimer += delta;
    if (horseIsWalking) {
        if (horseCycleTimer >= WALK_DURATION) { horseIsWalking = false; horseCycleTimer = 0; }
    } else {
        if (horseCycleTimer >= IDLE_DURATION) { horseIsWalking = true; horseCycleTimer = 0; }
    }

    if (horseIsWalking) horseTime += delta;
    const currentX = horseGroup.position.x;
    const currentZ = horseGroup.position.z;

    if (horseIsWalking) {
        const obstacle1 = checkObstacleAhead(currentX, currentZ, horseDirX, horseDirZ, 0.7);
        const obstacle2 = checkObstacleAhead(currentX, currentZ, horseDirX, horseDirZ, 1.1);
        const obstacle3 = checkObstacleAhead(currentX, currentZ, horseDirX, horseDirZ, 1.5);
        let shouldTurn = false;
        if (obstacle1 === 'water' || obstacle2 === 'water' || obstacle3 === 'water' ||
            obstacle1 === 'high_column' || obstacle2 === 'high_column' || obstacle3 === 'high_column') {
            shouldTurn = true;
        }
        if (shouldTurn && !horseIsTurning) {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = horseDirX * Math.cos(turnSign * Math.PI/2) - horseDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = horseDirX * Math.sin(turnSign * Math.PI/2) + horseDirZ * Math.cos(turnSign * Math.PI/2);
            horseTurnTargetX = newDirX; horseTurnTargetZ = newDirZ; horseIsTurning = true;
        }
    }

    if (horseIsTurning) {
        horseDirX += (horseTurnTargetX - horseDirX) * Math.min(1, horseTurnSpeed * delta);
        horseDirZ += (horseTurnTargetZ - horseDirZ) * Math.min(1, horseTurnSpeed * delta);
        const len = Math.sqrt(horseDirX * horseDirX + horseDirZ * horseDirZ);
        if (len > 0.0001) { horseDirX /= len; horseDirZ /= len; }
        const dot = horseDirX * horseTurnTargetX + horseDirZ * horseTurnTargetZ;
        if (dot > 0.999) {
            horseDirX = horseTurnTargetX; horseDirZ = horseTurnTargetZ; horseIsTurning = false;
        }
    }

    if (horseIsWalking && !horseIsTurning) {
        const moveSpeed = horseSpeed * delta;
        const newX = currentX + horseDirX * moveSpeed;
        const newZ = currentZ + horseDirZ * moveSpeed;
        if (isInsideIslandOrBeach(newX, newZ)) {
            horseGroup.position.x = newX; horseGroup.position.z = newZ;
        } else {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = horseDirX * Math.cos(turnSign * Math.PI/2) - horseDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = horseDirX * Math.sin(turnSign * Math.PI/2) + horseDirZ * Math.cos(turnSign * Math.PI/2);
            horseTurnTargetX = newDirX; horseTurnTargetZ = newDirZ; horseIsTurning = true;
        }
    }
    
    horseGroup.rotation.y = Math.atan2(horseDirX, horseDirZ) - Math.PI / 2;
    const terrainHeight = getTerrainHeightAt(horseGroup.position.x, horseGroup.position.z);
    horseGroup.position.y = terrainHeight;
    
    const legSpeed = 3.5, legAngle = 0.5;
    if (horseIsWalking && !horseIsTurning) {
        hLegFrontLeft.rotation.z = Math.sin(horseTime * legSpeed) * legAngle;
        hLegFrontRight.rotation.z = Math.sin(horseTime * legSpeed + Math.PI) * legAngle;
        hLegBackLeft.rotation.z = Math.sin(horseTime * legSpeed + Math.PI) * legAngle;
        hLegBackRight.rotation.z = Math.sin(horseTime * legSpeed) * legAngle;
        horseGroup.position.y += Math.abs(Math.sin(horseTime * legSpeed)) * 0.03;
    } else {
        hLegFrontLeft.rotation.z = 0; hLegFrontRight.rotation.z = 0;
        hLegBackLeft.rotation.z = 0; hLegBackRight.rotation.z = 0;
    }
    
    if (horseIsWalking) {
        horseTailGroup.rotation.z = -0.4 + Math.sin(horseTime * 0.8) * 0.15;
    } else {
        horseTailGroup.rotation.z = -0.4;
    }
    horseNeckGroup.rotation.z = -0.35 + Math.sin(horseTime * 0.5) * 0.03;
}

// ============================================================
// IA DEL CERDO
// ============================================================
function updatePigMovement(delta) {
    pigCycleTimer += delta;
    if (pigIsWalking) {
        if (pigCycleTimer >= WALK_DURATION) { pigIsWalking = false; pigCycleTimer = 0; }
    } else {
        if (pigCycleTimer >= IDLE_DURATION) { pigIsWalking = true; pigCycleTimer = 0; }
    }

    if (pigIsWalking) pigTime += delta;
    const currentX = pigGroup.position.x;
    const currentZ = pigGroup.position.z;

    if (pigIsWalking) {
        const obstacle1 = checkObstacleAhead(currentX, currentZ, pigDirX, pigDirZ, 0.6);
        const obstacle2 = checkObstacleAhead(currentX, currentZ, pigDirX, pigDirZ, 1.0);
        const obstacle3 = checkObstacleAhead(currentX, currentZ, pigDirX, pigDirZ, 1.4);
        let shouldTurn = false;
        if (obstacle1 === 'water' || obstacle2 === 'water' || obstacle3 === 'water' ||
            obstacle1 === 'high_column' || obstacle2 === 'high_column' || obstacle3 === 'high_column') {
            shouldTurn = true;
        }
        if (shouldTurn && !pigIsTurning) {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = pigDirX * Math.cos(turnSign * Math.PI/2) - pigDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = pigDirX * Math.sin(turnSign * Math.PI/2) + pigDirZ * Math.cos(turnSign * Math.PI/2);
            pigTurnTargetX = newDirX; pigTurnTargetZ = newDirZ; pigIsTurning = true;
        }
    }

    if (pigIsTurning) {
        pigDirX += (pigTurnTargetX - pigDirX) * Math.min(1, pigTurnSpeed * delta);
        pigDirZ += (pigTurnTargetZ - pigDirZ) * Math.min(1, pigTurnSpeed * delta);
        const len = Math.sqrt(pigDirX * pigDirX + pigDirZ * pigDirZ);
        if (len > 0.0001) { pigDirX /= len; pigDirZ /= len; }
        const dot = pigDirX * pigTurnTargetX + pigDirZ * pigTurnTargetZ;
        if (dot > 0.999) {
            pigDirX = pigTurnTargetX; pigDirZ = pigTurnTargetZ; pigIsTurning = false;
        }
    }

    if (pigIsWalking && !pigIsTurning) {
        const moveSpeed = pigSpeed * delta;
        const newX = currentX + pigDirX * moveSpeed;
        const newZ = currentZ + pigDirZ * moveSpeed;
        if (isInsideIslandOrBeach(newX, newZ)) {
            pigGroup.position.x = newX; pigGroup.position.z = newZ;
        } else {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = pigDirX * Math.cos(turnSign * Math.PI/2) - pigDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = pigDirX * Math.sin(turnSign * Math.PI/2) + pigDirZ * Math.cos(turnSign * Math.PI/2);
            pigTurnTargetX = newDirX; pigTurnTargetZ = newDirZ; pigIsTurning = true;
        }
    }
    
    pigGroup.rotation.y = Math.atan2(pigDirX, pigDirZ) - Math.PI / 2;
    const terrainHeight = getTerrainHeightAt(pigGroup.position.x, pigGroup.position.z);
    pigGroup.position.y = terrainHeight;
    
    const legSpeed = 3.5, legAngle = 0.4;
    if (pigIsWalking && !pigIsTurning) {
        pigLegFrontLeft.rotation.z = Math.sin(pigTime * legSpeed) * legAngle;
        pigLegFrontRight.rotation.z = Math.sin(pigTime * legSpeed + Math.PI) * legAngle;
        pigLegBackLeft.rotation.z = Math.sin(pigTime * legSpeed + Math.PI) * legAngle;
        pigLegBackRight.rotation.z = Math.sin(pigTime * legSpeed) * legAngle;
        pigGroup.position.y += Math.abs(Math.sin(pigTime * legSpeed)) * 0.025;
    } else {
        pigLegFrontLeft.rotation.z = 0; pigLegFrontRight.rotation.z = 0;
        pigLegBackLeft.rotation.z = 0; pigLegBackRight.rotation.z = 0;
    }
    
    if (pigIsWalking) {
        pigTailGroup.rotation.z = Math.sin(pigTime * 2) * 0.2;
    } else {
        pigTailGroup.rotation.z *= 0.95;
    }
    pigHeadGroup.rotation.z = Math.sin(pigTime * 0.5) * 0.03;
}

// ============================================================
// IA DE LA GALLINA
// ============================================================
function updateChickenMovement(delta) {
    chickenCycleTimer += delta;
    if (chickenIsWalking) {
        if (chickenCycleTimer >= WALK_DURATION) { chickenIsWalking = false; chickenCycleTimer = 0; }
    } else {
        if (chickenCycleTimer >= IDLE_DURATION) { chickenIsWalking = true; chickenCycleTimer = 0; }
    }

    if (chickenIsWalking) chickenTime += delta;
    const currentX = chickenGroup.position.x;
    const currentZ = chickenGroup.position.z;

    if (chickenIsWalking) {
        const obstacle1 = checkObstacleAhead(currentX, currentZ, chickenDirX, chickenDirZ, 0.5);
        const obstacle2 = checkObstacleAhead(currentX, currentZ, chickenDirX, chickenDirZ, 0.9);
        const obstacle3 = checkObstacleAhead(currentX, currentZ, chickenDirX, chickenDirZ, 1.3);
        let shouldTurn = false;
        if (obstacle1 === 'water' || obstacle2 === 'water' || obstacle3 === 'water' ||
            obstacle1 === 'high_column' || obstacle2 === 'high_column' || obstacle3 === 'high_column') {
            shouldTurn = true;
        }
        if (shouldTurn && !chickenIsTurning) {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = chickenDirX * Math.cos(turnSign * Math.PI/2) - chickenDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = chickenDirX * Math.sin(turnSign * Math.PI/2) + chickenDirZ * Math.cos(turnSign * Math.PI/2);
            chickenTurnTargetX = newDirX; chickenTurnTargetZ = newDirZ; chickenIsTurning = true;
        }
    }

    if (chickenIsTurning) {
        chickenDirX += (chickenTurnTargetX - chickenDirX) * Math.min(1, chickenTurnSpeed * delta);
        chickenDirZ += (chickenTurnTargetZ - chickenDirZ) * Math.min(1, chickenTurnSpeed * delta);
        const len = Math.sqrt(chickenDirX * chickenDirX + chickenDirZ * chickenDirZ);
        if (len > 0.0001) { chickenDirX /= len; chickenDirZ /= len; }
        const dot = chickenDirX * chickenTurnTargetX + chickenDirZ * chickenTurnTargetZ;
        if (dot > 0.999) {
            chickenDirX = chickenTurnTargetX; chickenDirZ = chickenTurnTargetZ; chickenIsTurning = false;
        }
    }

    if (chickenIsWalking && !chickenIsTurning) {
        const moveSpeed = chickenSpeed * delta;
        const newX = currentX + chickenDirX * moveSpeed;
        const newZ = currentZ + chickenDirZ * moveSpeed;
        if (isInsideIslandOrBeach(newX, newZ)) {
            chickenGroup.position.x = newX; chickenGroup.position.z = newZ;
        } else {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = chickenDirX * Math.cos(turnSign * Math.PI/2) - chickenDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = chickenDirX * Math.sin(turnSign * Math.PI/2) + chickenDirZ * Math.cos(turnSign * Math.PI/2);
            chickenTurnTargetX = newDirX; chickenTurnTargetZ = newDirZ; chickenIsTurning = true;
        }
    }
    
    chickenGroup.rotation.y = Math.atan2(chickenDirX, chickenDirZ) - Math.PI / 2;
    const terrainHeight = getTerrainHeightAt(chickenGroup.position.x, chickenGroup.position.z);
    chickenGroup.position.y = terrainHeight;
    
    const legSpeed = 4.0, legAngle = 0.4;
    if (chickenIsWalking && !chickenIsTurning) {
        chickenLegLeft.rotation.z = Math.sin(chickenTime * legSpeed) * legAngle;
        chickenLegRight.rotation.z = Math.sin(chickenTime * legSpeed + Math.PI) * legAngle;
        chickenGroup.position.y += Math.abs(Math.sin(chickenTime * legSpeed)) * 0.04;
        chickenHeadGroup.rotation.z = Math.sin(chickenTime * 2) * 0.05;
        chickenTailGroup.rotation.x = Math.sin(chickenTime * legSpeed * 2) * 0.05;
    } else {
        chickenLegLeft.rotation.z = 0; chickenLegRight.rotation.z = 0;
        chickenHeadGroup.rotation.z *= 0.95; chickenTailGroup.rotation.x *= 0.95;
    }
}

// ============================================================
// IA DEL TIGRE
// ============================================================
function updateTigerMovement(delta) {
    tigerCycleTimer += delta;
    if (tigerIsWalking) {
        if (tigerCycleTimer >= WALK_DURATION) { tigerIsWalking = false; tigerCycleTimer = 0; }
    } else {
        if (tigerCycleTimer >= IDLE_DURATION) { tigerIsWalking = true; tigerCycleTimer = 0; }
    }

    if (tigerIsWalking) tigerTime += delta;
    const currentX = tigerGroup.position.x;
    const currentZ = tigerGroup.position.z;

    if (tigerIsWalking) {
        const obstacle1 = checkObstacleAhead(currentX, currentZ, tigerDirX, tigerDirZ, 0.7);
        const obstacle2 = checkObstacleAhead(currentX, currentZ, tigerDirX, tigerDirZ, 1.1);
        const obstacle3 = checkObstacleAhead(currentX, currentZ, tigerDirX, tigerDirZ, 1.5);
        let shouldTurn = false;
        if (obstacle1 === 'water' || obstacle2 === 'water' || obstacle3 === 'water' ||
            obstacle1 === 'high_column' || obstacle2 === 'high_column' || obstacle3 === 'high_column') {
            shouldTurn = true;
        }
        if (shouldTurn && !tigerIsTurning) {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = tigerDirX * Math.cos(turnSign * Math.PI/2) - tigerDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = tigerDirX * Math.sin(turnSign * Math.PI/2) + tigerDirZ * Math.cos(turnSign * Math.PI/2);
            tigerTurnTargetX = newDirX; tigerTurnTargetZ = newDirZ; tigerIsTurning = true;
        }
    }

    if (tigerIsTurning) {
        tigerDirX += (tigerTurnTargetX - tigerDirX) * Math.min(1, tigerTurnSpeed * delta);
        tigerDirZ += (tigerTurnTargetZ - tigerDirZ) * Math.min(1, tigerTurnSpeed * delta);
        const len = Math.sqrt(tigerDirX * tigerDirX + tigerDirZ * tigerDirZ);
        if (len > 0.0001) { tigerDirX /= len; tigerDirZ /= len; }
        const dot = tigerDirX * tigerTurnTargetX + tigerDirZ * tigerTurnTargetZ;
        if (dot > 0.999) {
            tigerDirX = tigerTurnTargetX; tigerDirZ = tigerTurnTargetZ; tigerIsTurning = false;
        }
    }

    if (tigerIsWalking && !tigerIsTurning) {
        const moveSpeed = tigerSpeed * delta;
        const newX = currentX + tigerDirX * moveSpeed;
        const newZ = currentZ + tigerDirZ * moveSpeed;
        if (isInsideIslandOrBeach(newX, newZ)) {
            tigerGroup.position.x = newX; tigerGroup.position.z = newZ;
        } else {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = tigerDirX * Math.cos(turnSign * Math.PI/2) - tigerDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = tigerDirX * Math.sin(turnSign * Math.PI/2) + tigerDirZ * Math.cos(turnSign * Math.PI/2);
            tigerTurnTargetX = newDirX; tigerTurnTargetZ = newDirZ; tigerIsTurning = true;
        }
    }
    
    tigerGroup.rotation.y = Math.atan2(tigerDirX, tigerDirZ) - Math.PI / 2;
    const terrainHeight = getTerrainHeightAt(tigerGroup.position.x, tigerGroup.position.z);
    tigerGroup.position.y = terrainHeight;
    
    const legSpeed = 2.8, legAngle = 0.38;
    if (tigerIsWalking && !tigerIsTurning) {
        tigerLegFrontLeft.rotation.z = Math.sin(tigerTime * legSpeed) * legAngle;
        tigerLegFrontRight.rotation.z = Math.sin(tigerTime * legSpeed + Math.PI) * legAngle;
        tigerLegBackLeft.rotation.z = Math.sin(tigerTime * legSpeed + Math.PI) * legAngle;
        tigerLegBackRight.rotation.z = Math.sin(tigerTime * legSpeed) * legAngle;
        tigerGroup.position.y += Math.abs(Math.sin(tigerTime * legSpeed)) * 0.025;
    } else {
        tigerLegFrontLeft.rotation.z = 0; tigerLegFrontRight.rotation.z = 0;
        tigerLegBackLeft.rotation.z = 0; tigerLegBackRight.rotation.z = 0;
    }
    
    if (tigerIsWalking) {
        tigerTailGroup.rotation.z = Math.sin(tigerTime * 1.5) * 0.15;
    } else {
        tigerTailGroup.rotation.z *= 0.95;
    }
    tigerHeadGroup.rotation.z = Math.sin(tigerTime * 0.8) * 0.04;
}

// ============================================================
// IA DEL OSO PANDA
// ============================================================
function updatePandaMovement(delta) {
    pandaCycleTimer += delta;
    if (pandaIsWalking) {
        if (pandaCycleTimer >= WALK_DURATION) { pandaIsWalking = false; pandaCycleTimer = 0; }
    } else {
        if (pandaCycleTimer >= IDLE_DURATION) { pandaIsWalking = true; pandaCycleTimer = 0; }
    }

    if (pandaIsWalking) pandaTime += delta;
    const currentX = pandaGroup.position.x;
    const currentZ = pandaGroup.position.z;

    if (pandaIsWalking) {
        const obstacle1 = checkObstacleAhead(currentX, currentZ, pandaDirX, pandaDirZ, 0.6);
        const obstacle2 = checkObstacleAhead(currentX, currentZ, pandaDirX, pandaDirZ, 1.0);
        const obstacle3 = checkObstacleAhead(currentX, currentZ, pandaDirX, pandaDirZ, 1.4);
        let shouldTurn = false;
        if (obstacle1 === 'water' || obstacle2 === 'water' || obstacle3 === 'water' ||
            obstacle1 === 'high_column' || obstacle2 === 'high_column' || obstacle3 === 'high_column') {
            shouldTurn = true;
        }
        if (shouldTurn && !pandaIsTurning) {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = pandaDirX * Math.cos(turnSign * Math.PI/2) - pandaDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = pandaDirX * Math.sin(turnSign * Math.PI/2) + pandaDirZ * Math.cos(turnSign * Math.PI/2);
            pandaTurnTargetX = newDirX; pandaTurnTargetZ = newDirZ; pandaIsTurning = true;
        }
    }

    if (pandaIsTurning) {
        pandaDirX += (pandaTurnTargetX - pandaDirX) * Math.min(1, pandaTurnSpeed * delta);
        pandaDirZ += (pandaTurnTargetZ - pandaDirZ) * Math.min(1, pandaTurnSpeed * delta);
        const len = Math.sqrt(pandaDirX * pandaDirX + pandaDirZ * pandaDirZ);
        if (len > 0.0001) { pandaDirX /= len; pandaDirZ /= len; }
        const dot = pandaDirX * pandaTurnTargetX + pandaDirZ * pandaTurnTargetZ;
        if (dot > 0.999) {
            pandaDirX = pandaTurnTargetX; pandaDirZ = pandaTurnTargetZ; pandaIsTurning = false;
        }
    }

    if (pandaIsWalking && !pandaIsTurning) {
        const moveSpeed = pandaSpeed * delta;
        const newX = currentX + pandaDirX * moveSpeed;
        const newZ = currentZ + pandaDirZ * moveSpeed;
        if (isInsideIslandOrBeach(newX, newZ)) {
            pandaGroup.position.x = newX; pandaGroup.position.z = newZ;
        } else {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = pandaDirX * Math.cos(turnSign * Math.PI/2) - pandaDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = pandaDirX * Math.sin(turnSign * Math.PI/2) + pandaDirZ * Math.cos(turnSign * Math.PI/2);
            pandaTurnTargetX = newDirX; pandaTurnTargetZ = newDirZ; pandaIsTurning = true;
        }
    }
    
    pandaGroup.rotation.y = Math.atan2(pandaDirX, pandaDirZ) - Math.PI / 2;
    const terrainHeight = getTerrainHeightAt(pandaGroup.position.x, pandaGroup.position.z);
    pandaGroup.position.y = terrainHeight;
    
    const legSpeed = 3.0, legAngle = 0.35;
    if (pandaIsWalking && !pandaIsTurning) {
        pandaLegFrontLeft.rotation.z = Math.sin(pandaTime * legSpeed) * legAngle;
        pandaLegFrontRight.rotation.z = Math.sin(pandaTime * legSpeed + Math.PI) * legAngle;
        pandaLegBackLeft.rotation.z = Math.sin(pandaTime * legSpeed + Math.PI) * legAngle;
        pandaLegBackRight.rotation.z = Math.sin(pandaTime * legSpeed) * legAngle;
        pandaGroup.position.y += Math.abs(Math.sin(pandaTime * legSpeed)) * 0.025;
    } else {
        pandaLegFrontLeft.rotation.z = 0; pandaLegFrontRight.rotation.z = 0;
        pandaLegBackLeft.rotation.z = 0; pandaLegBackRight.rotation.z = 0;
    }
    
    if (pandaIsWalking) {
        pandaHeadGroup.rotation.z = Math.sin(pandaTime * 1.5) * 0.04;
    } else {
        pandaHeadGroup.rotation.z *= 0.95;
    }
}

// ============================================================
// IA DEL ZORRO
// ============================================================
function updateFoxMovement(delta) {
    foxCycleTimer += delta;
    if (foxIsWalking) {
        if (foxCycleTimer >= WALK_DURATION) { foxIsWalking = false; foxCycleTimer = 0; }
    } else {
        if (foxCycleTimer >= IDLE_DURATION) { foxIsWalking = true; foxCycleTimer = 0; }
    }

    if (foxIsWalking) foxTime += delta;
    const currentX = foxGroup.position.x;
    const currentZ = foxGroup.position.z;

    if (foxIsWalking) {
        const obstacle1 = checkObstacleAhead(currentX, currentZ, foxDirX, foxDirZ, 0.5);
        const obstacle2 = checkObstacleAhead(currentX, currentZ, foxDirX, foxDirZ, 0.9);
        const obstacle3 = checkObstacleAhead(currentX, currentZ, foxDirX, foxDirZ, 1.3);
        let shouldTurn = false;
        if (obstacle1 === 'water' || obstacle2 === 'water' || obstacle3 === 'water' ||
            obstacle1 === 'high_column' || obstacle2 === 'high_column' || obstacle3 === 'high_column') {
            shouldTurn = true;
        }
        if (shouldTurn && !foxIsTurning) {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = foxDirX * Math.cos(turnSign * Math.PI/2) - foxDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = foxDirX * Math.sin(turnSign * Math.PI/2) + foxDirZ * Math.cos(turnSign * Math.PI/2);
            foxTurnTargetX = newDirX; foxTurnTargetZ = newDirZ; foxIsTurning = true;
        }
    }

    if (foxIsTurning) {
        foxDirX += (foxTurnTargetX - foxDirX) * Math.min(1, foxTurnSpeed * delta);
        foxDirZ += (foxTurnTargetZ - foxDirZ) * Math.min(1, foxTurnSpeed * delta);
        const len = Math.sqrt(foxDirX * foxDirX + foxDirZ * foxDirZ);
        if (len > 0.0001) { foxDirX /= len; foxDirZ /= len; }
        const dot = foxDirX * foxTurnTargetX + foxDirZ * foxTurnTargetZ;
        if (dot > 0.999) {
            foxDirX = foxTurnTargetX; foxDirZ = foxTurnTargetZ; foxIsTurning = false;
        }
    }

    if (foxIsWalking && !foxIsTurning) {
        const moveSpeed = foxSpeed * delta;
        const newX = currentX + foxDirX * moveSpeed;
        const newZ = currentZ + foxDirZ * moveSpeed;
        if (isInsideIslandOrBeach(newX, newZ)) {
            foxGroup.position.x = newX; foxGroup.position.z = newZ;
        } else {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = foxDirX * Math.cos(turnSign * Math.PI/2) - foxDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = foxDirX * Math.sin(turnSign * Math.PI/2) + foxDirZ * Math.cos(turnSign * Math.PI/2);
            foxTurnTargetX = newDirX; foxTurnTargetZ = newDirZ; foxIsTurning = true;
        }
    }
    
    foxGroup.rotation.y = Math.atan2(foxDirX, foxDirZ) - Math.PI / 2;
    const terrainHeight = getTerrainHeightAt(foxGroup.position.x, foxGroup.position.z);
    foxGroup.position.y = terrainHeight;
    
    const legSpeed = 3.5, legAngle = 0.3;
    if (foxIsWalking && !foxIsTurning) {
        foxLegFrontLeft.rotation.z = Math.sin(foxTime * legSpeed) * legAngle;
        foxLegFrontRight.rotation.z = Math.sin(foxTime * legSpeed + Math.PI) * legAngle;
        foxLegBackLeft.rotation.z = Math.sin(foxTime * legSpeed + Math.PI) * legAngle;
        foxLegBackRight.rotation.z = Math.sin(foxTime * legSpeed) * legAngle;
        foxGroup.position.y += Math.abs(Math.sin(foxTime * legSpeed)) * 0.03;
    } else {
        foxLegFrontLeft.rotation.z = 0; foxLegFrontRight.rotation.z = 0;
        foxLegBackLeft.rotation.z = 0; foxLegBackRight.rotation.z = 0;
    }
    
    if (foxIsWalking) {
        foxHeadGroup.rotation.z = Math.sin(foxTime * 1.5) * 0.05;
        foxTailGroup.rotation.y = Math.sin(foxTime * 2) * 0.1;
    } else {
        foxHeadGroup.rotation.z *= 0.95;
        foxTailGroup.rotation.y *= 0.95;
    }
}

// ============================================================
// IA DEL LEOPARDO
// ============================================================
function updateLeopardMovement(delta) {
    leopardCycleTimer += delta;
    if (leopardIsWalking) {
        if (leopardCycleTimer >= WALK_DURATION) { leopardIsWalking = false; leopardCycleTimer = 0; }
    } else {
        if (leopardCycleTimer >= IDLE_DURATION) { leopardIsWalking = true; leopardCycleTimer = 0; }
    }

    if (leopardIsWalking) leopardTime += delta;
    const currentX = leopardGroup.position.x;
    const currentZ = leopardGroup.position.z;

    if (leopardIsWalking) {
        const obstacle1 = checkObstacleAhead(currentX, currentZ, leopardDirX, leopardDirZ, 0.7);
        const obstacle2 = checkObstacleAhead(currentX, currentZ, leopardDirX, leopardDirZ, 1.1);
        const obstacle3 = checkObstacleAhead(currentX, currentZ, leopardDirX, leopardDirZ, 1.5);
        let shouldTurn = false;
        if (obstacle1 === 'water' || obstacle2 === 'water' || obstacle3 === 'water' ||
            obstacle1 === 'high_column' || obstacle2 === 'high_column' || obstacle3 === 'high_column') {
            shouldTurn = true;
        }
        if (shouldTurn && !leopardIsTurning) {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = leopardDirX * Math.cos(turnSign * Math.PI/2) - leopardDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = leopardDirX * Math.sin(turnSign * Math.PI/2) + leopardDirZ * Math.cos(turnSign * Math.PI/2);
            leopardTurnTargetX = newDirX; leopardTurnTargetZ = newDirZ; leopardIsTurning = true;
        }
    }

    if (leopardIsTurning) {
        leopardDirX += (leopardTurnTargetX - leopardDirX) * Math.min(1, leopardTurnSpeed * delta);
        leopardDirZ += (leopardTurnTargetZ - leopardDirZ) * Math.min(1, leopardTurnSpeed * delta);
        const len = Math.sqrt(leopardDirX * leopardDirX + leopardDirZ * leopardDirZ);
        if (len > 0.0001) { leopardDirX /= len; leopardDirZ /= len; }
        const dot = leopardDirX * leopardTurnTargetX + leopardDirZ * leopardTurnTargetZ;
        if (dot > 0.999) {
            leopardDirX = leopardTurnTargetX; leopardDirZ = leopardTurnTargetZ; leopardIsTurning = false;
        }
    }

    if (leopardIsWalking && !leopardIsTurning) {
        const moveSpeed = leopardSpeed * delta;
        const newX = currentX + leopardDirX * moveSpeed;
        const newZ = currentZ + leopardDirZ * moveSpeed;
        if (isInsideIslandOrBeach(newX, newZ)) {
            leopardGroup.position.x = newX; leopardGroup.position.z = newZ;
        } else {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = leopardDirX * Math.cos(turnSign * Math.PI/2) - leopardDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = leopardDirX * Math.sin(turnSign * Math.PI/2) + leopardDirZ * Math.cos(turnSign * Math.PI/2);
            leopardTurnTargetX = newDirX; leopardTurnTargetZ = newDirZ; leopardIsTurning = true;
        }
    }
    
    leopardGroup.rotation.y = Math.atan2(leopardDirX, leopardDirZ) - Math.PI / 2;
    const terrainHeight = getTerrainHeightAt(leopardGroup.position.x, leopardGroup.position.z);
    leopardGroup.position.y = terrainHeight;
    
    const legSpeed = 3.0, legAngle = 0.4;
    if (leopardIsWalking && !leopardIsTurning) {
        leopardLegFrontLeft.rotation.z = Math.sin(leopardTime * legSpeed) * legAngle;
        leopardLegFrontRight.rotation.z = Math.sin(leopardTime * legSpeed + Math.PI) * legAngle;
        leopardLegBackLeft.rotation.z = Math.sin(leopardTime * legSpeed + Math.PI) * legAngle;
        leopardLegBackRight.rotation.z = Math.sin(leopardTime * legSpeed) * legAngle;
        leopardGroup.position.y += Math.abs(Math.sin(leopardTime * legSpeed)) * 0.025;
    } else {
        leopardLegFrontLeft.rotation.z = 0; leopardLegFrontRight.rotation.z = 0;
        leopardLegBackLeft.rotation.z = 0; leopardLegBackRight.rotation.z = 0;
    }
    
    if (leopardIsWalking) {
        leopardHeadGroup.rotation.z = Math.sin(leopardTime * 1.5) * 0.05;
        leopardTailGroup.rotation.y = Math.sin(leopardTime * 2) * 0.1;
    } else {
        leopardHeadGroup.rotation.z *= 0.95;
        leopardTailGroup.rotation.y *= 0.95;
    }
}

// ============================================================
// IA DEL LEÓN
// ============================================================
function updateLionMovement(delta) {
    lionCycleTimer += delta;
    if (lionIsWalking) {
        if (lionCycleTimer >= WALK_DURATION) { lionIsWalking = false; lionCycleTimer = 0; }
    } else {
        if (lionCycleTimer >= IDLE_DURATION) { lionIsWalking = true; lionCycleTimer = 0; }
    }

    if (lionIsWalking) lionTime += delta;
    const currentX = lionGroup.position.x;
    const currentZ = lionGroup.position.z;

    if (lionIsWalking) {
        const obstacle1 = checkObstacleAhead(currentX, currentZ, lionDirX, lionDirZ, 0.7);
        const obstacle2 = checkObstacleAhead(currentX, currentZ, lionDirX, lionDirZ, 1.1);
        const obstacle3 = checkObstacleAhead(currentX, currentZ, lionDirX, lionDirZ, 1.5);
        let shouldTurn = false;
        if (obstacle1 === 'water' || obstacle2 === 'water' || obstacle3 === 'water' ||
            obstacle1 === 'high_column' || obstacle2 === 'high_column' || obstacle3 === 'high_column') {
            shouldTurn = true;
        }
        if (shouldTurn && !lionIsTurning) {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = lionDirX * Math.cos(turnSign * Math.PI/2) - lionDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = lionDirX * Math.sin(turnSign * Math.PI/2) + lionDirZ * Math.cos(turnSign * Math.PI/2);
            lionTurnTargetX = newDirX; lionTurnTargetZ = newDirZ; lionIsTurning = true;
        }
    }

    if (lionIsTurning) {
        lionDirX += (lionTurnTargetX - lionDirX) * Math.min(1, lionTurnSpeed * delta);
        lionDirZ += (lionTurnTargetZ - lionDirZ) * Math.min(1, lionTurnSpeed * delta);
        const len = Math.sqrt(lionDirX * lionDirX + lionDirZ * lionDirZ);
        if (len > 0.0001) { lionDirX /= len; lionDirZ /= len; }
        const dot = lionDirX * lionTurnTargetX + lionDirZ * lionTurnTargetZ;
        if (dot > 0.999) {
            lionDirX = lionTurnTargetX; lionDirZ = lionTurnTargetZ; lionIsTurning = false;
        }
    }

    if (lionIsWalking && !lionIsTurning) {
        const moveSpeed = lionSpeed * delta;
        const newX = currentX + lionDirX * moveSpeed;
        const newZ = currentZ + lionDirZ * moveSpeed;
        if (isInsideIslandOrBeach(newX, newZ)) {
            lionGroup.position.x = newX; lionGroup.position.z = newZ;
        } else {
            const turnSign = Math.random() > 0.5 ? 1 : -1;
            const newDirX = lionDirX * Math.cos(turnSign * Math.PI/2) - lionDirZ * Math.sin(turnSign * Math.PI/2);
            const newDirZ = lionDirX * Math.sin(turnSign * Math.PI/2) + lionDirZ * Math.cos(turnSign * Math.PI/2);
            lionTurnTargetX = newDirX; lionTurnTargetZ = newDirZ; lionIsTurning = true;
        }
    }
    
    // El león está construido mirando hacia +X local
    lionGroup.rotation.y = Math.atan2(lionDirX, lionDirZ) - Math.PI / 2;
    const terrainHeight = getTerrainHeightAt(lionGroup.position.x, lionGroup.position.z);
    lionGroup.position.y = terrainHeight;
    
    const legSpeed = 2.8, legAngle = 0.35;
    if (lionIsWalking && !lionIsTurning) {
        lionLegFrontLeft.rotation.z = Math.sin(lionTime * legSpeed) * legAngle;
        lionLegFrontRight.rotation.z = Math.sin(lionTime * legSpeed + Math.PI) * legAngle;
        lionLegBackLeft.rotation.z = Math.sin(lionTime * legSpeed + Math.PI) * legAngle;
        lionLegBackRight.rotation.z = Math.sin(lionTime * legSpeed) * legAngle;
        lionGroup.position.y += Math.abs(Math.sin(lionTime * legSpeed)) * 0.025;
    } else {
        lionLegFrontLeft.rotation.z = 0; lionLegFrontRight.rotation.z = 0;
        lionLegBackLeft.rotation.z = 0; lionLegBackRight.rotation.z = 0;
    }
    
    if (lionIsWalking) {
        lionHeadGroup.rotation.z = Math.sin(lionTime * 1.5) * 0.04;
        lionTailGroup.rotation.y = Math.sin(lionTime * 2) * 0.1;
    } else {
        lionHeadGroup.rotation.z *= 0.95;
        lionTailGroup.rotation.y *= 0.95;
    }
}

// ============================================================
// FÍSICA DEL JUGADOR
// ============================================================
const PLAYER_HEIGHT = 2.0;
const eyeHeight = 1.6;
const gravity = -25;
const jumpSpeed = 7;
const STEP_HEIGHT = 1.0;

let velocityY = 0;
let isOnGround = false;

let playerLimitRx = rx + beachWidth + 0.5;
let playerLimitRz = rz + beachWidth + 0.5;

function updatePlayerLimit() {
    playerLimitRx = rx + beachWidth + 0.5;
    playerLimitRz = rz + beachWidth + 0.5;
}

function getFloorHeightAt(x, z, maxY) {
    const bx = Math.round(x);
    const bz = Math.round(z);
    for (let y = Math.floor(maxY); y >= groundY; y--) {
        const key = `${bx},${y},${bz}`;
        if (blocks.has(key)) return y + 1;
    }
    return groundY;
}

function hasBlockBetween(x, z, y1, y2) {
    const bx = Math.round(x);
    const bz = Math.round(z);
    const startY = Math.floor(Math.min(y1, y2));
    const endY = Math.ceil(Math.max(y1, y2));
    for (let y = startY; y <= endY; y++) {
        const key = `${bx},${y},${bz}`;
        if (blocks.has(key)) return true;
    }
    return false;
}

function tryMovePlayer(oldX, oldZ, newX, newZ, baseY) {
    const newFloorY = getFloorHeightAt(newX, newZ, baseY + STEP_HEIGHT);
    const heightDiff = newFloorY - baseY;
    
    if (heightDiff > STEP_HEIGHT) {
        return { x: oldX, z: oldZ, baseY: baseY, blocked: true };
    }
    
    if (heightDiff < 0) {
        if (hasBlockBetween(newX, newZ, newFloorY, newFloorY + PLAYER_HEIGHT)) {
            return { x: oldX, z: oldZ, baseY: baseY, blocked: true };
        }
        return { x: newX, z: newZ, baseY: newFloorY };
    }
    
    if (hasBlockBetween(newX, newZ, newFloorY, newFloorY + PLAYER_HEIGHT)) {
        return { x: oldX, z: oldZ, baseY: baseY, blocked: true };
    }
    
    return { x: newX, z: newZ, baseY: newFloorY };
}

// ============================================================
// COLISIONES CON ANIMALES
// ============================================================
function pushPlayerFromCow(playerX, playerZ) {
    const dx = playerX - cowGroup.position.x;
    const dz = playerZ - cowGroup.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = COW_RADIUS + 0.4;
    if (dist < minDist && dist > 0.0001) {
        const pushX = (dx / dist) * (minDist - dist);
        const pushZ = (dz / dist) * (minDist - dist);
        return { x: playerX + pushX, z: playerZ + pushZ };
    }
    return { x: playerX, z: playerZ };
}

function pushPlayerFromHorse(playerX, playerZ) {
    const dx = playerX - horseGroup.position.x;
    const dz = playerZ - horseGroup.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = HORSE_RADIUS + 0.4;
    if (dist < minDist && dist > 0.0001) {
        const pushX = (dx / dist) * (minDist - dist);
        const pushZ = (dz / dist) * (minDist - dist);
        return { x: playerX + pushX, z: playerZ + pushZ };
    }
    return { x: playerX, z: playerZ };
}

function pushPlayerFromPig(playerX, playerZ) {
    const dx = playerX - pigGroup.position.x;
    const dz = playerZ - pigGroup.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = PIG_RADIUS + 0.4;
    if (dist < minDist && dist > 0.0001) {
        const pushX = (dx / dist) * (minDist - dist);
        const pushZ = (dz / dist) * (minDist - dist);
        return { x: playerX + pushX, z: playerZ + pushZ };
    }
    return { x: playerX, z: playerZ };
}

function pushPlayerFromChicken(playerX, playerZ) {
    const dx = playerX - chickenGroup.position.x;
    const dz = playerZ - chickenGroup.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = CHICKEN_RADIUS + 0.4;
    if (dist < minDist && dist > 0.0001) {
        const pushX = (dx / dist) * (minDist - dist);
        const pushZ = (dz / dist) * (minDist - dist);
        return { x: playerX + pushX, z: playerZ + pushZ };
    }
    return { x: playerX, z: playerZ };
}

function pushPlayerFromTiger(playerX, playerZ) {
    const dx = playerX - tigerGroup.position.x;
    const dz = playerZ - tigerGroup.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = TIGER_RADIUS + 0.4;
    if (dist < minDist && dist > 0.0001) {
        const pushX = (dx / dist) * (minDist - dist);
        const pushZ = (dz / dist) * (minDist - dist);
        return { x: playerX + pushX, z: playerZ + pushZ };
    }
    return { x: playerX, z: playerZ };
}

function pushPlayerFromPanda(playerX, playerZ) {
    const dx = playerX - pandaGroup.position.x;
    const dz = playerZ - pandaGroup.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = PANDA_RADIUS + 0.4;
    if (dist < minDist && dist > 0.0001) {
        const pushX = (dx / dist) * (minDist - dist);
        const pushZ = (dz / dist) * (minDist - dist);
        return { x: playerX + pushX, z: playerZ + pushZ };
    }
    return { x: playerX, z: playerZ };
}

function pushPlayerFromFox(playerX, playerZ) {
    const dx = playerX - foxGroup.position.x;
    const dz = playerZ - foxGroup.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = FOX_RADIUS + 0.4;
    if (dist < minDist && dist > 0.0001) {
        const pushX = (dx / dist) * (minDist - dist);
        const pushZ = (dz / dist) * (minDist - dist);
        return { x: playerX + pushX, z: playerZ + pushZ };
    }
    return { x: playerX, z: playerZ };
}

function pushPlayerFromLeopard(playerX, playerZ) {
    const dx = playerX - leopardGroup.position.x;
    const dz = playerZ - leopardGroup.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = LEOPARD_RADIUS + 0.4;
    if (dist < minDist && dist > 0.0001) {
        const pushX = (dx / dist) * (minDist - dist);
        const pushZ = (dz / dist) * (minDist - dist);
        return { x: playerX + pushX, z: playerZ + pushZ };
    }
    return { x: playerX, z: playerZ };
}

function pushPlayerFromLion(playerX, playerZ) {
    const dx = playerX - lionGroup.position.x;
    const dz = playerZ - lionGroup.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = LION_RADIUS + 0.4;
    if (dist < minDist && dist > 0.0001) {
        const pushX = (dx / dist) * (minDist - dist);
        const pushZ = (dz / dist) * (minDist - dist);
        return { x: playerX + pushX, z: playerZ + pushZ };
    }
    return { x: playerX, z: playerZ };
}

// ============================================================
// PONER/DESTRUIR BLOQUES
// ============================================================
function placeBlock(x, y, z, typeId) {
    const bx = Math.round(x);
    const by = Math.round(y);
    const bz = Math.round(z);
    
    if (!isInsideIslandOrBeach(bx, bz)) return false;
    if (by === groundY && blocks.has(`${bx},${groundY},${bz}`)) return false;
    
    const key = `${bx},${by},${bz}`;
    if (blocks.has(key)) return false;
    
    const mesh = createBlockMesh(typeId, bx, by, bz);
    if (!mesh) return false;
    
    scene.add(mesh);
    blocks.set(key, { mesh, type: typeId, x: bx, y: by, z: bz });
    return true;
}

function removeBlock(x, y, z) {
    const bx = Math.round(x);
    const by = Math.round(y);
    const bz = Math.round(z);
    
    if (by === groundY) return false;
    
    const key = `${bx},${by},${bz}`;
    if (!blocks.has(key)) return false;
    
    const data = blocks.get(key);
    scene.remove(data.mesh);
    data.mesh.geometry.dispose();
    data.mesh.material.dispose();
    blocks.delete(key);
    return true;
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ============================================================
// TECLADO
// ============================================================
const keyState = { w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false };

document.addEventListener('keydown', (event) => {
    const code = event.code;
    
    if (code === 'KeyW') { keyState.w = true; event.preventDefault(); }
    else if (code === 'KeyA') { keyState.a = true; event.preventDefault(); }
    else if (code === 'KeyS') { keyState.s = true; event.preventDefault(); }
    else if (code === 'KeyD') { keyState.d = true; event.preventDefault(); }
    else if (code === 'ArrowUp') { keyState.up = true; event.preventDefault(); }
    else if (code === 'ArrowDown') { keyState.down = true; event.preventDefault(); }
    else if (code === 'ArrowLeft') { keyState.left = true; event.preventDefault(); }
    else if (code === 'ArrowRight') { keyState.right = true; event.preventDefault(); }
    else if (code === 'KeyZ') {
        event.preventDefault();
        rx += EXPAND_AMOUNT;
        rz += EXPAND_AMOUNT;
        generateIslandIncremental();
        updatePlayerLimit();
        expandLabel.classList.add('key-pressed');
        setTimeout(() => expandLabel.classList.remove('key-pressed'), 200);
        console.log(`🌍 Isla expandida: rx=${rx}, rz=${rz}`);
    }
    else if (code === 'KeyR') {
        event.preventDefault();
        if (confirm('¿Seguro que quieres borrar la partida guardada y empezar de cero?')) {
            clearSave();
            location.reload();
        }
    }
    else if (code === 'Space') {
        event.preventDefault();
        if (isOnGround) {
            velocityY = jumpSpeed;
            isOnGround = false;
        }
    }
    else if (code === 'Digit1') { selectedBlock = 1; event.preventDefault(); }
    else if (code === 'Digit2') { selectedBlock = 2; event.preventDefault(); }
    else if (code === 'Digit3') { selectedBlock = 3; event.preventDefault(); }
    else if (code === 'Digit4') { selectedBlock = 4; event.preventDefault(); }
    else if (code === 'Digit5') { selectedBlock = 5; event.preventDefault(); }
});

document.addEventListener('keyup', (event) => {
    const code = event.code;
    
    if (code === 'KeyW') { keyState.w = false; event.preventDefault(); }
    else if (code === 'KeyA') { keyState.a = false; event.preventDefault(); }
    else if (code === 'KeyS') { keyState.s = false; event.preventDefault(); }
    else if (code === 'KeyD') { keyState.d = false; event.preventDefault(); }
    else if (code === 'ArrowUp') { keyState.up = false; event.preventDefault(); }
    else if (code === 'ArrowDown') { keyState.down = false; event.preventDefault(); }
    else if (code === 'ArrowLeft') { keyState.left = false; event.preventDefault(); }
    else if (code === 'ArrowRight') { keyState.right = false; event.preventDefault(); }
});

// ============================================================
// RATÓN
// ============================================================
renderer.domElement.addEventListener('mousedown', (event) => {
    if (!controls.isLocked) return;
    event.preventDefault();
    
    mouse.x = 0;
    mouse.y = 0;
    raycaster.setFromCamera(mouse, camera);
    
    const objects = [];
    for (const [key, data] of blocks) {
        if (data.mesh) objects.push(data.mesh);
    }
    
    const intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
        const hit = intersects[0];
        const mesh = hit.object;
        
        let blockData = null;
        for (const [key, data] of blocks) {
            if (data.mesh === mesh) {
                blockData = data;
                break;
            }
        }
        
        if (!blockData) return;
        
        if (event.button === 0) {
            const normal = hit.face.normal.clone();
            normal.transformDirection(mesh.matrixWorld);
            const newX = Math.round(blockData.x + normal.x);
            const newY = Math.round(blockData.y + normal.y);
            const newZ = Math.round(blockData.z + normal.z);
            
            if (!isInsideIslandOrBeach(newX, newZ)) return;
            placeBlock(newX, newY, newZ, selectedBlock);
            saveGame();
        }
        else if (event.button === 2) {
            removeBlock(blockData.x, blockData.y, blockData.z);
            saveGame();
        }
    }
});

renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

// ============================================================
// GUARDAR AL CERRAR
// ============================================================
window.addEventListener('beforeunload', () => {
    saveGame();
});

// ============================================================
// BUCLE PRINCIPAL
// ============================================================
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const currentTime = performance.now();
    const delta = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;

    if (currentTime - lastSaveTime > AUTO_SAVE_INTERVAL) {
        lastSaveTime = currentTime;
        saveGame();
    }

    // Actualizar animales
    updateCowMovement(delta);
    updateHorseMovement(delta);
    updatePigMovement(delta);
    updateChickenMovement(delta);
    updateTigerMovement(delta);
    updatePandaMovement(delta);
    updateFoxMovement(delta);
    updateLeopardMovement(delta);
    updateLionMovement(delta);

    // Movimiento del jugador
    if (controls.isLocked) {
        const speed = 6.0;
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(camera.quaternion);
        right.y = 0;
        right.normalize();

        const moveVector = new THREE.Vector3(0, 0, 0);
        if (keyState.w) moveVector.add(forward);
        if (keyState.s) moveVector.sub(forward);
        if (keyState.a) moveVector.sub(right);
        if (keyState.d) moveVector.add(right);
        if (keyState.up) moveVector.add(forward);
        if (keyState.down) moveVector.sub(forward);
        if (keyState.left) moveVector.sub(right);
        if (keyState.right) moveVector.add(right);

        let currentBaseY = camera.position.y - eyeHeight;

        if (moveVector.length() > 0) {
            moveVector.normalize();
            moveVector.multiplyScalar(speed * delta);
            
            const oldX = camera.position.x;
            const oldZ = camera.position.z;
            
            let resultX = tryMovePlayer(oldX, oldZ, oldX + moveVector.x, oldZ, currentBaseY);
            let resultZ = tryMovePlayer(resultX.x, resultX.z, resultX.x, resultX.z + moveVector.z, resultX.baseY);
            
            camera.position.x = resultZ.x;
            camera.position.z = resultZ.z;
            currentBaseY = resultZ.baseY;
        }

        const p1 = pushPlayerFromCow(camera.position.x, camera.position.z);
        camera.position.x = p1.x; camera.position.z = p1.z;
        const p2 = pushPlayerFromHorse(camera.position.x, camera.position.z);
        camera.position.x = p2.x; camera.position.z = p2.z;
        const p3 = pushPlayerFromPig(camera.position.x, camera.position.z);
        camera.position.x = p3.x; camera.position.z = p3.z;
        const p4 = pushPlayerFromChicken(camera.position.x, camera.position.z);
        camera.position.x = p4.x; camera.position.z = p4.z;
        const p5 = pushPlayerFromTiger(camera.position.x, camera.position.z);
        camera.position.x = p5.x; camera.position.z = p5.z;
        const p6 = pushPlayerFromPanda(camera.position.x, camera.position.z);
        camera.position.x = p6.x; camera.position.z = p6.z;
        const p7 = pushPlayerFromFox(camera.position.x, camera.position.z);
        camera.position.x = p7.x; camera.position.z = p7.z;
        const p8 = pushPlayerFromLeopard(camera.position.x, camera.position.z);
        camera.position.x = p8.x; camera.position.z = p8.z;
        const p9 = pushPlayerFromLion(camera.position.x, camera.position.z);
        camera.position.x = p9.x; camera.position.z = p9.z;

        const posX = camera.position.x;
        const posZ = camera.position.z;
        const val = (posX * posX) / (playerLimitRx * playerLimitRx) + (posZ * posZ) / (playerLimitRz * playerLimitRz);
        if (val > 1.0) {
            const ratio = 1.0 / Math.sqrt(val);
            camera.position.x *= ratio * 0.99;
            camera.position.z *= ratio * 0.99;
        }

        const floorY = getFloorHeightAt(camera.position.x, camera.position.z, camera.position.y - eyeHeight + 0.1);
        
        velocityY += gravity * delta;
        camera.position.y += velocityY * delta;
        
        const currentBase = camera.position.y - eyeHeight;
        if (currentBase < floorY) {
            camera.position.y = floorY + eyeHeight;
            velocityY = 0;
            isOnGround = true;
        } else {
            isOnGround = false;
        }

        if (velocityY > 0) {
            const headY = camera.position.y - eyeHeight + PLAYER_HEIGHT;
            const bx = Math.round(camera.position.x);
            const bz = Math.round(camera.position.z);
            const checkY = Math.floor(headY);
            const key = `${bx},${checkY},${bz}`;
            if (blocks.has(key)) {
                velocityY = 0;
                camera.position.y = (checkY - PLAYER_HEIGHT) + eyeHeight - 0.01;
            }
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log('🐄 Vaca + 🐴 Caballo + 🐷 Cerdo + 🐔 Gallina + 🐅 Tigre + 🐼 Panda + 🦊 Zorro + 🐆 Leopardo + 🦁 León');
console.log('💾 Guardado automático activado');
