import * as THREE from 'three';
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const tagGroup = new THREE.Group();
// 创建地图标牌
function createMapTag (cityData, waterObj) {
    cityData.map(item => {
        // 标牌元素
        const tagDom = document.getElementById('mapTag').cloneNode(true);
        tagDom.style.top += "-30px";
        tagDom.style.left += "0px";

        tagDom.childNodes[0].childNodes[1].innerHTML = ((waterObj[item.name] - '') / 100).toFixed(0) + '万';
        ['维吾尔', '回族', '自治区', '特别行政区', '壮族', '省', '市'].map(val => {
            if (item.name.includes(val)) {
                item.name = item.name.replace(val, '');
            }
        })
        tagDom.childNodes[0].childNodes[0].innerHTML = item.name + ' :';
        const css2DObject = new CSS2DObject(tagDom);
        css2DObject.position.set(item.x, 0, -item.y);
        tagGroup.add(css2DObject);
    })
}

export { createMapTag, tagGroup }
