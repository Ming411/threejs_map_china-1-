import * as THREE from 'three';
// 几何体辅助合并工具
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// 创建网格对象
const gridHelper = new THREE.GridHelper(600, 100, '#87CEFA', '#87CEFA');
gridHelper.material.opacity = 0.2
gridHelper.material.transparent = true;
gridHelper.position.set(0, -10, 0);
gridHelper.name = '网格';

// 间距
let space = 600 / 100;
// 偏移
let offset = 600 / 2;
let geoArr = [];
for (let i = 0; i < 100 + 1; i++) {
    for (let j = 0; j < 100 + 1; j++) {
        let geometry = new THREE.CircleGeometry(0.5, 20, 20)
        geometry.rotateX(Math.PI / 2)
        geometry.translate(space * i - offset, 0, space * j - offset)
        geoArr.push(geometry)
    }
}
// 使用几何体合并工具合并所有geometry模型
console.log(mergeGeometries, 'mergeBufferGeometries')
let allGeometry = mergeGeometries(geoArr);
let material = new THREE.MeshBasicMaterial({
    color: '#87CEFA',
    side: THREE.DoubleSide,  // 设置双面可见
    depthWrite: false,       // 设置不受深度缓冲影响
})
// 网格标点
const meshPoint = new THREE.Mesh(allGeometry, material)
meshPoint.position.y = -10;
meshPoint.name = '网格标点';

export { gridHelper, meshPoint }
