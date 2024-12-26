// threejs基础参数，配置场景、相机、渲染器、动画、灯光等
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
// 引入后处理扩展库EffectComposer.js
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
// 引入渲染器通道RenderPass
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
// 引入OutlinePass通道，模型描边效果
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
// 引入UnrealBloomPass通道，模型辉光效果
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
// ShaderPass着色器通道
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
// SMAA抗锯齿通道
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
// FXAA抗锯齿Shader
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { Reflector } from 'three/addons/objects/Reflector.js';


// 页面宽高
const width = window.innerWidth;
const height = window.innerHeight;

// 场景
const scene = new THREE.Scene();
// scene.fog = new THREE.Fog('#000', 10, 1500);
scene.fog = new THREE.FogExp2('#000', 0.0025);
scene.background = new THREE.Color('#011024');

const geometry = new THREE.PlaneGeometry(600, 600);
const mirror = new Reflector(geometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: '#fff'
});
mirror.position.y = -10.1;
mirror.rotateX(-Math.PI / 2);

// 灯光
const ambientLight = new THREE.AmbientLight(0xffffff, 5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(200, 100, 200);
scene.add(directionalLight);

// 相机
let s = 65; // 三维场景显示范围控制系数，系数越大，显示的范围越大
let k = width / height; //窗口宽高比
// const camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 10000);
const camera = new THREE.PerspectiveCamera(30, width / height, 1, 10000);
camera.position.set(0, 9000, 7000);
camera.lookAt(0, 0, 0);

// 渲染器
const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio); //防止输出模糊
// renderer.setPixelRatio(window.devicePixelRatio * 2); // 设置像素比
// renderer.setClearColor('#011024', 1); // 设置背景颜色
renderer.setSize(width, height); // 定义渲染区域大小
// renderer.toneMapping = THREE.ACESFilmicToneMapping

// CSS3D渲染器
const css3DRenderer = new CSS3DRenderer();
css3DRenderer.setSize(width, height);
css3DRenderer.domElement.style.position = 'absolute';
css3DRenderer.domElement.style.top = '0px';
css3DRenderer.domElement.style.pointerEvents = 'none';

// CSS2D渲染器
const css2DRenderer = new CSS2DRenderer();
css2DRenderer.setSize(width, height);
css2DRenderer.domElement.style.position = 'absolute';
css2DRenderer.domElement.style.top = '0px';
css2DRenderer.domElement.style.pointerEvents = 'none';

// 后处理器
const composer = new EffectComposer(renderer);
composer.renderToScreen = false;
const renderPass = new RenderPass(scene, camera); // 创建一个渲染器通道，场景和相机作为参数
composer.addPass(renderPass); // 设置renderPass通道

// OutlinePass通道
const outlinePass = new OutlinePass(new THREE.Vector2(width, height), scene, camera);
outlinePass.visibleEdgeColor.set('#00FFFF');
outlinePass.edgeThickness = 1.5;  // 发光边缘厚度
outlinePass.edgeStrength = 3;   // 发光强度
composer.addPass(outlinePass);

// UnrealBloomPass通道
const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height));
bloomPass.threshold = 0;  // 辉光强度
bloomPass.strength = 0;    // 辉光阈值
bloomPass.radius = 0;     // 辉光半径
bloomPass.renderToScreen = false;

// 着色器通道
const shaderPass = new ShaderPass(new THREE.ShaderMaterial({
    uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: composer.renderTarget2.texture },
        tDiffuse: {
            value: null
        }
    },
    vertexShader: '\t\t\tvarying vec2 vUv;\n' +
        '\n' +
        '\t\t\tvoid main() {\n' +
        '\n' +
        '\t\t\t\tvUv = uv;\n' +
        '\n' +
        '\t\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n' +
        '\n' +
        '\t\t\t}',
    fragmentShader: '\t\t\tuniform sampler2D baseTexture;\n' +
        '\t\t\tuniform sampler2D bloomTexture;\n' +
        '\n' +
        '\t\t\tvarying vec2 vUv;\n' +
        '\n' +
        '\t\t\tvoid main() {\n' +
        '\n' +
        '\t\t\t\tgl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) + vec4( 0.05 ));\n' +
        '\n' +
        '\t\t\t}',
    defines: {}
}), 'baseTexture')
shaderPass.renderToScreen = true
shaderPass.needsSwap = true

// 最终合成器
const finalComposer = new EffectComposer(renderer)
finalComposer.addPass(renderPass)
finalComposer.addPass(shaderPass)

// SMAAPass抗锯齿通道
const pixelRatio = renderer.getPixelRatio(); // 获取像素比
const smaaPass = new SMAAPass(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
finalComposer.addPass(smaaPass);

const FXAAPass = new ShaderPass(FXAAShader);
// width、height是canva画布的宽高度
FXAAPass.uniforms.resolution.value.x = 1 / (width * pixelRatio);
FXAAPass.uniforms.resolution.value.y = 1 / (height * pixelRatio);
finalComposer.addPass(FXAAPass);

// 相机轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
// controls.dampingFactor = 0.1;   // 阻尼系数
controls.enableDamping = true;   // 阻尼开启
controls.minPolarAngle = -Math.PI;    // 控制相机最小旋转角度
controls.maxPolarAngle = Math.PI / 2.5; // 控制相机最大旋转角度
controls.minDistance = 80;
controls.maxDistance = 1000;

// 画布跟随窗口变化
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    // cnavas画布宽高度重新设置
    renderer.setSize(width, height);
    css3DRenderer.setSize(width, height);
    css2DRenderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
})

export { scene, camera, controls, renderer, css3DRenderer, css2DRenderer, outlinePass, composer, bloomPass, finalComposer, mirror }






