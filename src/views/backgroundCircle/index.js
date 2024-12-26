import * as THREE from 'three';
import outputFragment from './output_fragment.glsl.js'

const texture1 = new THREE.TextureLoader().load('./rotationBorder1.png')
const texture2 = new THREE.TextureLoader().load('./rotationBorder2.png')

// 背景外圆圈
const plane1 = new THREE.PlaneGeometry(170, 170);
const material1 = new THREE.MeshBasicMaterial({
    map: texture1,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
    depthWrite: false,
})
const outerCircle = new THREE.Mesh(plane1, material1);
outerCircle.renderOrder = 100;
outerCircle.position.set(0, -10, 0);
outerCircle.rotateX(Math.PI / 2);

// 背景内圆圈
const plane2 = new THREE.PlaneGeometry(130, 130);
const material2 = new THREE.MeshBasicMaterial({
    map: texture2,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
    depthWrite: false,
})
const innerCircle = new THREE.Mesh(plane2, material2);
innerCircle.renderOrder = 100;
innerCircle.position.set(0, -10, 0);
innerCircle.rotateX(Math.PI / 2);

// 四周扩散圆圈
const plane3 = new THREE.PlaneGeometry(400, 400);
const material3 = new THREE.MeshLambertMaterial({
    color: 0x011d4d,
    transparent: true,
    depthWrite: false,
})
const diffuseCircle = new THREE.Mesh(plane3, material3);
diffuseCircle.position.set(0, -10, -8);
diffuseCircle.rotateX(-Math.PI / 2)

const circleUf = {
    uTime: { value: 0.0 },
    uWidth: { value: 2 },
    uRadius: { value: 10 },
    uCenter: { value: new THREE.Vector3(0, -10, 0) },
    uColor: { value: new THREE.Color('#1EB4E6') },
    uSpeed: { value: 80.0 },
}
material3.onBeforeCompile = shader => {
    shader.uniforms = {
        ...shader.uniforms,
        ...circleUf,
    }
    shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `
          varying vec3 vPosition;
          void main() {
            vPosition = position;
        `,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `
          varying vec3 vPosition;
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uSpeed;
          uniform float uRadius;
          uniform vec3 uCenter;
          uniform float uWidth;
          void main() {
        `,
    )
    shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', outputFragment)
}

const plane4 = new THREE.PlaneGeometry(600, 600);
const material4 = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
})
const planeUf = {
    center: {
        value: new THREE.Vector2(0.5, 0.5)
    },
    radius: {
        value: 0.35
    },
    color1: {
        value: new THREE.Color('#000')
    },
    color2: {
        value: new THREE.Color('#10BEE5')
    },
    opacitys: {
        value: 0.7
    }
}
material4.onBeforeCompile = shader => {
    shader.uniforms = {
        ...shader.uniforms,
        ...planeUf,
    }
    shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `
          varying vec2 vUv;
          void main() {
            vUv = uv;
        `,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `
            varying vec2 vUv;
            uniform vec2 center;
            uniform float radius;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform float opacitys;
            void main() {
        `,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
            float dist = distance(vUv, center);
            float alpha = smoothstep(radius, radius - 0.4, dist); 
            vec3 color = mix(color1, color2, alpha);
            gl_FragColor = vec4(color, opacitys);
            #include <dithering_fragment>
        `
    );
}
const gradientPlane = new THREE.Mesh(plane4, material4);
gradientPlane.position.set(0, -9.9, 10);
gradientPlane.rotateX(-Math.PI / 2)

export { circleUf, outerCircle, innerCircle, diffuseCircle, gradientPlane, planeUf }
