import * as THREE from 'three';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { provinceData } from './provinceData.js';
// 省会城市对象
const provinceNameObj = {};
// function createProvinceName () {
//     provinceData.map((item, index) => {
//         const dom = document.getElementById('provinceName').cloneNode();
//         dom.innerHTML = item.name;
//         const css3DObject = new CSS3DObject(dom);
//         dom.style.pointerEvents = 'none';
//         css3DObject.position.set(item.x, -item.y, 0);
//         css3DObject.scale.set(0.15, 0.15, 0.15);
//         provinceNameObj[item.name] = css3DObject;
//     })
// }

import * as d3 from "d3";
function createProvinceName (center, name) {
    // 页面dom元素
    const dom = document.getElementById('provinceName').cloneNode();
    dom.innerHTML = name;
    // 将其转换成CSS3D对象
    const css3DObject = new CSS3DObject(dom);
    dom.style.pointerEvents = 'none';
    css3DObject.position.set(center[0], -center[1], 0);
    css3DObject.scale.set(0.15, 0.15, 0.15);
    return css3DObject;
}
export { createProvinceName, provinceNameObj };
