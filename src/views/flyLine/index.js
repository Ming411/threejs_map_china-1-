import * as THREE from "three";

// 飞线组对象
const flyGroup = new THREE.Group();
flyGroup.position.y += 0.1;
flyGroup.name = '飞线组对象';

// 更新飞线、迷你飞线、柱子
function updateFlyLine (name, cityData) {
    // 起始点省会/城市,所有飞线将指向此处
    let startPoint = null;
    // 结束点数组，飞线将从起始点飞向所有结束点
    const endPointArr = [];
    cityData.map(item => {
        if (item.name === name) {
            startPoint = new THREE.Vector3(item.x, 0, -item.y);
        } else {
            endPointArr.push(item)
        }
    })
    // 绘制飞线,柱子
    drawFlyLine(startPoint, endPointArr);
}

// 绘制飞线
function drawFlyLine (startPoint, endPointArr) {
    // 释放飞线组对象模型和材质
    if (flyGroup.children.length) disposeGroup(flyGroup)

    // 批量绘制飞线，柱子等
    endPointArr.map((item) => {
        // 结束点坐标
        const endPoint = new THREE.Vector3(item.x, 0, -item.y);
        // 创建飞线
        const flyLine = createFlyLine(startPoint, endPoint);
        flyGroup.add(flyLine);

        // 飞线的坐标数组
        const pointArr = flyLine.userData.pointsArr;
        // 飞线动画起始下标
        const index = 40;
        // 创建迷你飞线
        const miniFlyLine = createMiniFlyLine(index, pointArr);
        // 固定开始位置
        miniFlyLine.userData.index = 0;
        // 随机开始位置
        // miniFlyLine.userData.index = Math.floor((pointArr.length - miniFlyLine.userData.num) * Math.random());
        // 迷你飞线添加到飞线当中
        flyLine.add(miniFlyLine);
    });
}

// 创建飞线
function createFlyLine (startPoint, endPoint) {
    // 创建三维样条曲线的中间点
    const middle = new THREE.Vector3(0, 0, 0);
    // 设置坐标为起始点和结束点的一半
    middle.add(startPoint).add(endPoint).divideScalar(2);
    // 获取两个起始点的距离
    const L = startPoint.clone().sub(endPoint).length();
    // 根据距离设置中间点坐标的z值,距离越远的省会之间，样条曲线会越高
    middle.y = L * 0.2;
    // 创建缓冲几何体
    const bufferGeometry = new THREE.BufferGeometry();
    // 创建三维样条曲线
    const curve = new THREE.CatmullRomCurve3([startPoint, middle, endPoint]);
    // 获取曲线上分布的n个三维向量坐标数组
    const pointsArr = curve.getSpacedPoints(600);
    // 设置缓冲几何体的顶点坐标
    bufferGeometry.setFromPoints(pointsArr);
    // 创建线材质
    const lineMaterial = new THREE.LineBasicMaterial({
        color: '#00ffff',
    })
    // 创建线模型
    const line = new THREE.Line(bufferGeometry, lineMaterial);
    line.name = '飞线';
    line.userData.pointsArr = pointsArr
    return line;
}

// 创建迷你飞线
function createMiniFlyLine (index, pointArr) {
    // 飞线顶点数据长度
    let num = 100;
    // 截取飞线数据
    const flyData = pointArr.slice(index, index + num);
    // 创建三维样条曲线获取更多的顶点
    const curve = new THREE.CatmullRomCurve3(flyData);
    // 飞线顶点数据
    const flyPointData = curve.getSpacedPoints(100);
    // 创建缓冲几何体
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(flyPointData);
    // 每个顶点对应一个百分比数据attributes.percent 用于控制点的渲染大小
    const percentArr = []; // attributes.percent的数据
    for (var i = 0; i < flyPointData.length; i++) {
        percentArr.push(i / flyPointData.length);
    }
    const percentAttribue = new THREE.BufferAttribute(new Float32Array(percentArr), 1);
    geometry.attributes.percent = percentAttribue;
    // 批量计算所有顶点颜色数据
    const colorArr = [];
    for (let i = 0; i < flyPointData.length; i++) {
        const color1 = new THREE.Color(0xffff00);
        const color2 = new THREE.Color(0xffff00);
        const color = color1.lerp(color2, i / flyPointData.length);
        colorArr.push(color.r, color.g, color.b);
    }
    geometry.attributes.color = new THREE.BufferAttribute(new Float32Array(colorArr), 3);
    // 创建点材质
    const pointMaterial = new THREE.PointsMaterial({
        size: 1.5, //点大小
        vertexColors: true, //使用顶点颜色渲染
    })
    // 修改点材质的着色器源码(注意：不同版本细节可能会稍微会有区别)
    pointMaterial.onBeforeCompile = function (shader) {
        // 顶点着色器中声明一个attribute变量:百分比
        shader.vertexShader = shader.vertexShader.replace(
            'void main() {',
            [
                'attribute float percent;', //顶点大小百分比变量，控制点渲染大小
                'void main() {',
            ].join('\n') // .join()把数组元素合成字符串
        );
        // 调整点渲染大小计算方式
        shader.vertexShader = shader.vertexShader.replace(
            'gl_PointSize = size;',
            [
                'gl_PointSize = percent * size;',
            ].join('\n') // .join()把数组元素合成字符串
        );
    };
    // 创建点模型
    const point = new THREE.Points(geometry, pointMaterial);
    point.name = '迷你飞线';
    // 保存当前数据下标和数据长度
    point.userData.num = num;
    point.userData.index = index;
    return point
}

// 更新迷你飞线位置
function updateMiniFly (line, index, pointData) {
    // 截取飞线数据
    const flyData = pointData.slice(index, index + line.userData.num);
    // 创建三维样条曲线获取更多的顶点
    const curve = new THREE.CatmullRomCurve3(flyData);
    // 飞线顶点数据
    const flyPointData = curve.getSpacedPoints(100);
    // 设置几何体顶点位置坐标
    line.geometry.setFromPoints(flyPointData);
    //通知three.js几何体顶点位置坐标数据更新
    line.geometry.verticesNeedUpdate = true;
}

// 释放模型对象几何体和材质所占用的内存
function disposeGroup (group) {
    // .traverse方法递归遍历group的所有后代
    group.traverse(function (obj) {
        if (obj.type === 'Mesh' || obj.type === 'Line') {
            obj.geometry.dispose();
            obj.material.dispose();
        }
    })
    if (group.children.length) {
        group.children = []; //删除所有后代模型对象
    }
}

function flyLineAnimation () {
    flyGroup.children.map(line => {
        // 飞线数据
        const pointArr = line.userData.pointsArr;
        // 迷你飞线
        const childrenLine = line.children[0];
        //飞线取点索引范围
        const indexMax = pointArr.length - childrenLine.userData.num;
        // 在飞线取点范围内则每次增加索引值，超出则归0，
        if (childrenLine.userData.index < indexMax) {
            childrenLine.userData.index += 2;
        } else {
            childrenLine.userData.index = 0;
        }
        // 更新迷你飞线位置，生成飞行动画
        updateMiniFly(childrenLine, childrenLine.userData.index, pointArr);
    })
}


export { flyGroup, updateFlyLine, flyLineAnimation }
