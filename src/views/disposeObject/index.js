import * as THREE from "three";


// 物体清除
export function disposeObject (obj) {
    console.log(obj, 'obj')
    obj.traverse(item => {
        // 清除几何体
        if (item.geometry) {
            item.geometry.dispose();
        }

        // 清除材质
        if (item.material) {
            if (Array.isArray(item.material)) {
                item.material.forEach(material => material.dispose());
            } else {
                item.material.dispose();
            }
        }

        // 清除CSS2D/3D对象dom元素
        if (item.isCSS2DObject || item.isCSS3DObject) {
            if (item.element.parentNode)
                item.element.parentNode.removeChild(item.element);
        }
    })
}
