import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";

// 初始化地图浮动效果
function initMapFloat (camera, mapModel) {
    // 节流函数
    const throttleChange = throttle(rayMonitor, 5, false);
    // 监听鼠标移动事件
    addEventListener("mousemove", (e) => {
        throttleChange(e, camera, mapModel);
    });

}

// 节流函数
function throttle (func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// 射线监测当前鼠标移动点是否有地图模型
function rayMonitor (e, camera, mapModel) {
    const px = e.offsetX;
    const py = e.offsetY;
    // 屏幕坐标转为标准设备坐标
    const x = (px / window.innerWidth) * 2 - 1;
    const y = -(py / window.innerHeight) * 2 + 1;
    // 创建射线
    const raycaster = new THREE.Raycaster();
    // 设置射线参数
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    // 射线交叉计算拾取模型
    let intersects = raycaster.intersectObjects(mapModel.children);
    // 检测结果过滤掉光圈
    intersects = intersects.filter(function (intersect) {
        return intersect.object.name !== "光圈";
    });
    // 将所有模型animationActive重置为false状态
    mapModel.children.forEach((item) => {
        item.animationActive = false;
    });
    // 点击选中模型时
    if (intersects.length > 0) {
        const parent = intersects[0].object.parent;
        // 射线第一个拾取中的模型
        const obj = parent.name && parent.name !== '省份边界线' ? parent : parent.parent;
        // 设置选中模型animationActive为true
        obj.animationActive = true;
        // 遍历所有地图模型
        mapModel.children.map((item) => {
            // 除了animationActive为true的模型进行向上浮动以外，其他模型位置高度重置为0
            if (item.animationActive) {
                // 添加一个白色的发射光呈现高亮效果
                item.children[1].material[0].emissive = new THREE.Color("#fff");
                new TWEEN.Tween(item.position).to({ z: 4 }, 100).easing(TWEEN.Easing.Sinusoidal.Out).start();
            } else {
                // 默认重置为黑色的发射光
                item.children[1].material[0].emissive = new THREE.Color("#000");
                new TWEEN.Tween(item.position).to({ z: 0 }, 100).easing(TWEEN.Easing.Sinusoidal.Out).start();
            }
        });
    }
    // 未选中则将所有模型位置高度重置为0
    else {
        mapModel.children.forEach((item) => {
            // 默认重置为黑色的发射光
            item.children[1].material[0].emissive = new THREE.Color("#000");
            new TWEEN.Tween(item.position).to({ z: 0 }, 100).easing(TWEEN.Easing.Sinusoidal.Out).start();
        });
    }
}

export { initMapFloat };
