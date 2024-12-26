import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { provinceData } from '../provinceName/provinceData.js';
// 光柱组对象
const cylinderGroup = new THREE.Group();
cylinderGroup.position.y += 0.1;
cylinderGroup.name = '光柱组对象';
// 光柱对象
const cylinderObj = {};
// 光圈数组
const apertureArr = [];
// 光柱渐变颜色 
let color1 = new THREE.Color('#7AC5CD');
let color2 = new THREE.Color('#00868B');
// 光柱发光数组
let cylinderGlowArr = [];

// 光柱材质
const material = new THREE.MeshBasicMaterial({
    color: '#fff',
    side: THREE.DoubleSide,
    transparent: true,
})
// 材质渲染前更改shader代码
material.onBeforeCompile = shader => {
    shader.uniforms = {
        ...shader.uniforms,
        color1: {
            value: color1
        },
        color2: {
            value: color2
        }
    };

    shader.vertexShader = shader.vertexShader.replace(
        `void main() {`,
        `
        varying vec2 vUv;
        void main() {
            vUv = uv;
        `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
        `void main() {`,
        `
        varying vec2 vUv;
        uniform vec3 color1;
        uniform vec3 color2;
        void main() {
        `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
        `#include <dithering_fragment>`,
        `
        vec3 color = mix(color1, color2, vUv.y);
        gl_FragColor = vec4(color,0.5);
        #include <dithering_fragment>
        `
    )
}

// 创建光柱
async function createCylindern () {
    const waterObj = {};
    // 加载全国降水量数据
    const fileLoader = new THREE.FileLoader();
    fileLoader.responseType = 'json';
    const waterData = await fileLoader.loadAsync('./water.json');
    waterData.arr.forEach(obj => {
        waterObj[obj['name']] = obj['value'];
    });
    cylinderGlowArr = [];
    provinceData.map((item, index) => {
        // 创建光柱模型
        const h = ((waterObj[item.name] - '') / 3000).toFixed(1);
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, h, 100);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(item.x, -item.y, h / 2,);
        mesh.rotation.x += -Math.PI / 2;
        mesh.name = '光柱';
        mesh.visible = false;
        cylinderGlowArr.push(mesh);

        // 创建光柱上方的数值对象
        const dom = document.getElementById('cylinderValue').cloneNode();
        dom.innerHTML = ((waterObj[item.name] - '') / 100).toFixed(0) + '万';
        const css2DObject = new CSS2DObject(dom);
        css2DObject.position.set(0, -(h / 2) - 2, 0);
        css2DObject.visible = false;
        mesh.add(css2DObject);
        cylinderObj[item.name] = mesh;

        // 创建光柱底下的光圈
        const apertureMesh = createAperture(index);
        apertureMesh.position.y += mesh.position.z;
        mesh.add(apertureMesh);


    })
}

// 创建光柱底下的光圈
function createAperture (index) {
    // 创建纹理贴图
    const textureLoader = new THREE.TextureLoader();
    // 创建平面矩形
    const apertureGeometry = new THREE.PlaneGeometry(2, 2);
    // 创建材质开启透明设置纹理贴图
    const apertureMaterial = new THREE.MeshBasicMaterial({
        map: textureLoader.load('./light.png'),
        transparent: true,
        side: THREE.DoubleSide,
        color: '#00FFFF',
        depthTest: false,
    })
    const apertureMesh = new THREE.Mesh(apertureGeometry, apertureMaterial);
    apertureMesh.rotateX(-Math.PI / 2);
    apertureMesh.position.y -= 0.2;
    apertureMesh.name = '光圈';
    //  创建光圈时2-5倍随机放大
    let size = Math.random() * 2 + 1;
    apertureMesh.scale.set(size, size, size);
    // 保存这个随机放大倍数
    apertureMesh._s = size;
    // 设置模型渲染顺序，避免起冲突
    apertureMesh.renderOrder = index + 1;
    apertureArr.push(apertureMesh);
    return apertureMesh
}

// 光圈缩放动画
function apertureAnimation () {
    apertureArr.map((mesh) => {
        // _s缩放值累加
        mesh._s += 0.01;
        // 小于20时，逐渐透明度逐渐增加到1
        if (mesh._s <= 2.0) {
            mesh.material.opacity = (mesh._s - 1.0);
        }
        // 20-30之间时，透明度逐渐递减到0
        else if (mesh._s > 2.0 && mesh._s <= 3.0) {
            mesh.material.opacity = 1 - (mesh._s - 2.0);
        }
        // 大于30进行重置
        else {
            mesh._s = 1.0;
        }
        // 设置新的缩放值
        mesh.scale.set(mesh._s, mesh._s, mesh._s);
    });
}

export { cylinderGroup, createCylindern, cylinderGlowArr, cylinderObj, apertureArr, apertureAnimation };
