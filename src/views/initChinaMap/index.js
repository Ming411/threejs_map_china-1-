import * as THREE from 'three';
// 引入d3.js
import * as d3 from "d3";
// 片元着色器代码
import outputFragment from './output_fragment.glsl.js';
// 省份名称对象
// import { provinceNameObj } from '../provinceName/index.js';
// 棱锥对象
import { cylinderObj } from '../cylinder/index.js';
// 创建省份名称函数
import { createProvinceName } from '../provinceName/index.js';

const waterObj = {};


// 墨卡托投影转换
const projection = d3.geoMercator().center([107.067641, 36.226277]).translate([0, 0]);
// 省会城市数据
const cityData = [];
// 地图模型侧边材质
const sideMaterial = new THREE.MeshBasicMaterial({
    color: '#00E6E6',
    transparent: true,
    opacity: 1,
})
// 侧边材质uniform
let mapUf = {
    uTime: { value: 0.0 },
    uHeight: { value: 10 },
    uColor: { value: new THREE.Color('#00ffff') },
    uStart: { value: -10 },
    uSpeed: { value: 6 },
};
// 渲染前更改材质shader代码
sideMaterial.onBeforeCompile = (shader) => {
    shader.uniforms = {
        ...shader.uniforms,
        ...mapUf,
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
              uniform float uStart;
              uniform float uHeight;
              void main() {
            `,
    )
    shader.fragmentShader = shader.fragmentShader.replace('vec3 outgoingLight = reflectedLight.indirectDiffuse;', outputFragment);
}
// 全国地图纹理
const quanGuoTexture = new THREE.TextureLoader().load("./quanGuo.png");
// 禁止纹理纵向翻转
quanGuoTexture.flipY = false;
// 设置纹理重复
quanGuoTexture.repeat.set(0.00608, 0.00825);
// 设置纹理偏移
quanGuoTexture.offset.set(0.5448, 0.549);

// 初始化地图
async function initMap () {
    // 加载地图数据
    let url = 'http://211.143.122.110:18062/mapdata/geojson/areas_v3_full/all/100000.json';
    return await new Promise(resolve => {
        fetch(url)
            .then(response => response.json())
            .then(async data => {
                // 文件加载器，设置类型为json
                const fileLoader = new THREE.FileLoader();
                fileLoader.responseType = 'json';
                // 加载全国降水量数据
                const waterData = await fileLoader.loadAsync('./water.json');
                waterData.arr.forEach(obj => {
                    waterObj[obj['name']] = obj['value'];
                });
                operationData(data, waterObj, resolve);
            })
    })
}
// 解析地图json数据
function operationData (data, waterObj, resolve) {
    // 创建地图模型对象
    const mapModel = new THREE.Group();
    mapModel.rotateX(-Math.PI / 2);
    mapModel.name = '地图模型';
    // 全国信息
    const features = data.features;
    features.forEach((feature, index) => {
        // 单个省份
        const province = new THREE.Object3D();
        const name = feature.properties.name;
        // 设置省份名称
        province.name = name;
        province.animationActive = false;  // 地图浮动动画状态
        mapModel.add(province);


        // 省份边界线
        const provinceLine = new THREE.Object3D();
        provinceLine.name = '省份边界线';
        provinceLine.position.z += 0.2;
        province.add(provinceLine);

        // 省份坐标数据
        const coordinates = feature.geometry.coordinates;
        // 颜色
        const color1 = new THREE.Color('#1BDAFC');
        const color2 = new THREE.Color('#F3FD27');
        const color3 = new THREE.Color('#FD8B24');
        // 降水量标准值，用于颜色插值
        const standard1 = 50000;  // 低至中等降水量的界限
        const standard2 = 80000; // 中等至高降水量的界限
        const value = waterObj[province.name];
        let lerpColor;
        // 根据各地区降水量对颜色进行插值
        if (value < standard1) {
            lerpColor = color1.clone().lerp(color2, value / standard1);
        } else {
            lerpColor = color2.clone().lerp(color3, value / standard2);
        }
        // 绘制地级市边界线
        if (feature.geometry.type === "MultiPolygon") {
            coordinates.forEach((coordinate) => {
                coordinate.forEach((rows) => {
                    // 城市模型
                    const mesh = drawExtrudeMesh(rows, lerpColor);
                    mesh.rotateX(Math.PI);
                    province.add(mesh);
                    // 边线
                    const line = lineDraw(rows);
                    line.name = "边线";
                    line.position.z += 0.15;
                    province.add(line);
                });
            });
        }
        // 创建省份边界线和模型-单个多边形
        if (feature.geometry.type === "Polygon") {
            coordinates.forEach((coordinate) => {
                // 城市模型
                const mesh = drawExtrudeMesh(coordinate, lerpColor);
                mesh.rotateX(Math.PI);
                province.add(mesh);
                // 边线
                const line = lineDraw(coordinate);
                line.position.z += 0.15;
                line.name = "边线";
                province.add(line);
            });
        }


        if (name) {
            // 中心经纬度或面心经纬度
            const center = feature.properties.centroid ? feature.properties.centroid : feature.properties.center;
            // 经纬度转换墨卡托投影坐标
            const pos = projection(center)
            // 存储中心位置
            province.userData.center = pos;
            cityData.push({
                name: name,
                x: pos[0],
                y: -pos[1]
            })
            // 创建地图上的省份名称对象
            const provinceName = createProvinceName(pos, name);
            if (name.includes('澳门') || name.includes('香港')) return
            province.add(provinceName, cylinderObj[name])
            // 存储地图数据
            province.userData.mapData = feature.geometry;
        }

    })
    // 返回地图模型对象
    resolve(mapModel)
}

// 绘制模型
function drawExtrudeMesh (polygon, lerpColor) {
    // 创建形状
    const shape = new THREE.Shape();
    // 遍历坐标数组，绘制形状
    polygon.forEach((row, i) => {
        // 坐标点转换
        const [x, y] = projection(row);
        if (i === 0) {
            shape.moveTo(x, y)
        }
        shape.lineTo(x, y)
    })
    // 将形状进行拉伸
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 10,
        bevelEnabled: true,
        bevelSegments: 10,
        bevelThickness: 0.1,
    })
    // 模型顶部材质
    const material = new THREE.MeshStandardMaterial({
        // 默认先使用深蓝色，不适用计算插值的color
        color: new THREE.Color('#00E6E6'),
        map: quanGuoTexture,
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 1,
    })
    const mesh = new THREE.Mesh(geometry, [material, sideMaterial]);
    mesh.texture = quanGuoTexture;
    mesh.color = lerpColor;
    return mesh
}
// 绘制边界线
function lineDraw (polygon) {
    const lineGeometry = new THREE.BufferGeometry()
    const pointsArray = new Array()
    polygon.forEach((row) => {
        const [x, y] = projection(row)
        // 创建三维点
        pointsArray.push(new THREE.Vector3(x, -y, 0))
    })
    // 放入多个点
    lineGeometry.setFromPoints(pointsArray)
    const lineMaterial = new THREE.LineBasicMaterial({
        color: '#00ffff'
    })
    return new THREE.Line(lineGeometry, lineMaterial)
}
export { initMap, cityData, mapUf, projection, waterObj };
