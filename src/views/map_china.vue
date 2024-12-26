<template>
  <div id="chinaMap">
    <div id="threejs"></div>
    <!-- 右侧按钮 -->
    <div class="rightButton">
      <div v-for="(item, index) in rightButItem" :key="index" :value="item.value" :class="item.selected ? 'selected common' : 'common'" @click="rightButClick">
        {{ item.name }}
      </div>
    </div>
    <!-- 地图名称元素 -->
    <div id="provinceName" style="display: none"></div>
    <!-- 光柱上方数值元素 -->
    <div id="cylinderValue" style="display: none"></div>
    <!-- 地图标牌元素 -->
    <div id="mapTag" style="display: none">
      <div class="content">
        <div>旅客:</div>
        <div id="mapTag_value">1024万</div>
      </div>
      <div class="arrow"></div>
    </div>
    <!-- 弹框元素 -->
    <div id="popup" style="display: none">
      <div class="popup_line"></div>
      <div class="popup_Main">
        <div class="popupMain_top"></div>
        <div class="popup_content">
          <div class="popup_head">
            <div class="popup_title">
              <div class="title_icon"></div>
              <div id="popup_Name">湖北省</div>
            </div>
            <div class="close" @click="popupClose"></div>
          </div>
          <div class="popup_item">
            <div>当前流入：</div>
            <div class="item_value">388万人次</div>
          </div>
          <div class="popup_item">
            <div>景区容量：</div>
            <div class="item_value">2688万人次</div>
          </div>
          <div class="popup_item">
            <div>交通资源利用率：</div>
            <div class="item_value">88.7%</div>
          </div>
          <div class="popup_item">
            <div>省市热搜指数：</div>
            <div class="item_value">88.7%</div>
          </div>
        </div>
        <div class="popupMain_footer"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import * as THREE from "three";
// 引入TWEENJS
import TWEEN from "@tweenjs/tween.js";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
// threejs基础配置，场景相机渲染器等
import { scene, camera, controls, renderer, css3DRenderer, css2DRenderer, outlinePass, composer, finalComposer, mirror } from "./baseConfig/index.js";
// 加载地图
import { initMap, cityData, mapUf, waterObj, projection } from "./initChinaMap/index.js";
// 地图底部网格背景
import { gridHelper, meshPoint } from "./backgroundMesh/index.js";
// 初始化鼠标移入地图浮动效果
import { initMapFloat } from "./mapFloat/index.js";
// 地图圆圈背景
import { circleUf, outerCircle, innerCircle, diffuseCircle, gradientPlane, planeUf } from "./backgroundCircle/index.js";
// 飞线组对象，更新飞线函数，飞线动画
import { flyGroup, updateFlyLine, flyLineAnimation } from "./flyLine/index.js";
// 光柱组对象，创建光柱函数
import { cylinderGroup, createCylindern, cylinderGlowArr, cylinderObj, apertureAnimation } from "./cylinder/index.js";
// import { createProvinceName } from "./provinceName/index.js";
import { createMapTag, tagGroup } from "./mapTag/index.js";
import { particlesUpdate, createParticles, particles } from "./particles/index.js";
import { disposeObject } from "./disposeObject/index.js";

// 右侧按钮选项
const rightButItem = reactive([
  { value: "tourism", name: "刷色图", selected: false },
  { value: "cylinder", name: "光柱", selected: false },
  { value: "flyLine", name: "飞线", selected: false },
  { value: "tag", name: "标牌", selected: true },
  { value: "particles", name: "粒子", selected: false },
  { value: "mirror", name: "倒影", selected: false },
  { value: "ripple", name: "波纹", selected: false },
]);
// 描边模型
let outLineModel = null;
// 时钟对象，用于获取两帧渲染之间的时间值
const clock = new THREE.Clock();
// 射线拾取中模型对象
let rayModel = null;
// 弹框元素
let divTag = null;
// css2D弹框对象
let css2Dpopup = null;
// 需要辉光的模型数组
let glowArr = [];
let mapModel;

onMounted(async () => {
  document.getElementById("threejs").appendChild(renderer.domElement);
  document.getElementById("threejs").appendChild(css3DRenderer.domElement);
  document.getElementById("threejs").appendChild(css2DRenderer.domElement);
  // 创建省份名称对象
  // createProvinceName();
  // 创建光柱
  createCylindern();
  // 创建粒子
  createParticles();

  // 加载中国地图
  mapModel = await initMap();
  // 初始化鼠标移入地图浮动效果
  initMapFloat(camera, mapModel);
  // 初始化地图点击发光效果
  initMapClickGlow();

  // 创建地图标牌
  createMapTag(cityData, waterObj);
  scene.add(mapModel, gridHelper, meshPoint, outerCircle, innerCircle, diffuseCircle, gradientPlane, tagGroup);
  // 设置需要辉光物体数组
  glowArr = [...cylinderGlowArr, flyGroup.children];
  // 开始循环渲染
  render();
  // 首次进入动画
  eventAnimation();
});

// 循环渲染
function render() {
  requestAnimationFrame(render);
  camera.updateProjectionMatrix();
  controls.update();
  // 两帧渲染间隔
  let deltaTime = clock.getDelta();
  // 地图模型侧边渐变效果
  mapUf.uTime.value += deltaTime;
  if (mapUf.uTime.value >= 5) {
    mapUf.uTime.value = 0.0;
  }

  if (rightButItem[1].selected) apertureAnimation(); // 光圈缩放动画

  // 背景外圈内圈旋转
  outerCircle.rotation.z -= 0.003;
  innerCircle.rotation.z += 0.003;
  // 飞线动画
  if (rightButItem[2].selected) {
    flyLineAnimation();
  }
  // 波纹扩散动画
  if (rightButItem[6].selected) {
    circleUf.uTime.value += deltaTime;
    if (circleUf.uTime.value >= 6) {
      circleUf.uTime.value = 0.0;
    }
  }
  // 粒子动画
  if (rightButItem[4].selected) {
    particlesUpdate();
  }

  // composer.render(scene, camera);
  // css3DRenderer.render(scene, camera);
  // css2DRenderer.render(scene, camera);
  // TWEEN更新
  TWEEN.update();
  // 将场景内的物体材质设置为黑色
  scene.traverse(darkenMaterial);
  // 渲染辉光
  composer.render();
  // 还原材质
  scene.traverse(restoreMaterial);
  // 最终渲染
  finalComposer.render();
  css3DRenderer.render(scene, camera);
  css2DRenderer.render(scene, camera);
}
// 右侧按钮点击事件
function rightButClick(e) {
  const value = e.target.getAttribute("value");
  const clickItem = rightButItem.filter((obj) => obj.value === value)[0];
  clickItem.selected = !clickItem.selected;
  // 点击刷色图按钮
  if (clickItem.value === "tourism") {
    mapModel.traverse((item) => {
      if (item.color) {
        if (clickItem.selected) {
          item.material[0].color = item.color;
          item.material[0].metalness = 0.65;
          item.material[0].map = undefined;
          item.material[0].needsUpdate = true;
        } else {
          item.material[0].color = new THREE.Color("#00FFFF");
          item.material[0].metalness = 0.0;
          item.material[0].map = item.texture;
          item.material[0].needsUpdate = true;
        }
      }
    });
  }
  // 点击飞线按钮
  else if (clickItem.value === "flyLine") {
    if (clickItem.selected) {
      scene.add(flyGroup);
      updateFlyLine("湖北", cityData);
    } else {
      scene.remove(flyGroup);
    }
  }
  // 点击光柱按钮
  else if (clickItem.value === "cylinder") {
    if (clickItem.selected) {
      console.log(cylinderGroup, "cylinderGroup");
      scene.add(cylinderGroup);
      for (let item in cylinderObj) {
        cylinderObj[item].visible = true;
        cylinderObj[item].children[0].visible = true;
      }
    } else {
      for (let item in cylinderObj) {
        cylinderObj[item].visible = false;
        cylinderObj[item].children[0].visible = false;
      }
      for (const iterator of cylinderGroup.children) {
        if (iterator.children) {
          css2DRenderer.domElement.removeChild(iterator.children[0].element); // 重点
        }
      }
      scene.remove(cylinderGroup);
    }
  }
  // 点击波纹按钮
  else if (clickItem.value === "ripple") {
    if (clickItem.selected) {
      diffuseCircle.visible = true;
    } else {
      diffuseCircle.visible = false;
    }
    circleUf.uTime.value = 0.0;
  }
  // 点击倒影按钮
  else if (clickItem.value === "mirror") {
    if (clickItem.selected) {
      scene.add(mirror);
      planeUf.opacitys.radius = 0.05;
      planeUf.opacitys.value = 0.4;
    } else {
      scene.remove(mirror);
      planeUf.opacitys.radius = 0.35;
      planeUf.opacitys.value = 0.7;
    }
  }
  // 点击标牌按钮
  else if (clickItem.value === "tag") {
    if (clickItem.selected) {
      scene.add(tagGroup);
    } else {
      for (const iterator of tagGroup.children) {
        css2DRenderer.domElement.removeChild(iterator.element); // 重点
      }
      scene.remove(tagGroup);
    }
  }
  // 点击粒子按钮
  else if (clickItem.value === "particles") {
    if (clickItem.selected) {
      scene.add(particles);
    } else {
      scene.remove(particles);
    }
  }
}
// 初始化地图点击发光效果
function initMapClickGlow() {
  divTag = document.getElementById("popup");
  const widthScale = window.innerWidth / 1920;
  const heightScale = window.innerHeight / 941;
  divTag.style.top += (37 * heightScale).toFixed(2) + "px";
  divTag.style.left += (390 * widthScale).toFixed(2) + "px";
  // 转换为CSS2D对象
  css2Dpopup = new CSS2DObject(divTag);
  // 设置一个较高的渲染顺序，防止弹框被标牌等物体遮挡住
  css2Dpopup.renderOrder = 99;
  // 弹框名称元素
  const nameDiv = document.getElementById("popup_Name");

  let temp = true;
  // 添加鼠标点击事件
  addEventListener("click", (e) => {
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
      return intersect.object.name !== "光圈" && intersect.object.name !== "光柱" && intersect.object.parent.name !== "省份边界线";
    });
    // 点击选中模型时
    if (intersects.length > 0) {
      // 清除上一次选中模型
      if (outLineModel) {
        disposeObject(outLineModel);
        outLineModel.parent.remove(outLineModel);
        outLineModel = null;
      }
      // 射线拾取中的模型
      const rayModel = intersects[0].object.parent;
      // 地图边线数据
      const mapLineData = rayModel.userData.mapData;
      // 创建shape对象
      const shape = new THREE.Shape();
      // 当数据为多个多边形时
      if (mapLineData.type === "MultiPolygon") {
        // 遍历数据，绘制shape对象数据
        mapLineData.coordinates.forEach((coordinate, index) => {
          if (index === 0) {
            coordinate.forEach((rows) => {
              rows.forEach((row) => {
                const [x, y] = projection(row);
                if (index === 0) {
                  shape.moveTo(x, y);
                }
                shape.lineTo(x, y);
              });
            });
          }
        });
      }
      // 当数据为单个多边形时
      if (mapLineData.type === "Polygon") {
        mapLineData.coordinates.forEach((coordinate) => {
          // 遍历数据，绘制shape对象数据
          mapLineData.coordinates.forEach((rows, index) => {
            if (index === 0) {
              rows.forEach((row) => {
                const [x, y] = projection(row);
                if (index === 0) {
                  shape.moveTo(x, y);
                }
                shape.lineTo(x, y);
              });
            }
          });
        });
      }
      // 创建形状几何体，shape对象作为参数
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: rayModel.children[1].material[0].color,
        map: rayModel.children[1].material[0].map,
        side: THREE.DoubleSide,
      });
      let mesh = new THREE.Mesh(geometry, material);
      mesh.rotateX(-Math.PI);
      mesh.name = "描边模型";

      outLineModel = mesh;
      rayModel.add(outLineModel);

      // 设置描边效果
      outlinePass.selectedObjects = [outLineModel];
      // 获取中心位置
      const center = rayModel.userData.center;
      // 设置弹框位置
      css2Dpopup.position.set(center[0], center[1], 0);
      outLineModel.add(css2Dpopup);
      // 设置弹框名称
      nameDiv.innerHTML = rayModel.parent.name;

      // 弹框逐渐显示
      new TWEEN.Tween({ opacity: 0 })
        .to({ opacity: 1.0 }, 500)
        .onUpdate(function (obj) {
          // 动态更新div元素透明度
          divTag.style.opacity = obj.opacity;
        })
        .start();
    }
  });
}
// 弹框关闭事件
function popupClose() {
  if (outLineModel) {
    // 描边效果清除
    outlinePass.selectedObjects = [];
    // 弹框逐渐隐藏
    new TWEEN.Tween({ opacity: 1 })
      .to({ opacity: 0 }, 500)
      .onUpdate(function (obj) {
        //动态更新div元素透明度
        divTag.style.opacity = obj.opacity;
      })
      .onComplete(function () {
        // 清除选中模型
        disposeObject(outLineModel);
        outLineModel.parent.remove(outLineModel);
        outLineModel = null;
      })
      .start();
  }
}
// 将材质设置成黑色
function darkenMaterial(obj) {
  // 场景颜色单独保存
  if (obj instanceof THREE.Scene) {
    obj.bg = obj.background;
    obj.background = null;
  }
  const material = obj.material;
  if (material && !glowArr.includes(obj) && !material.isShaderMaterial) {
    obj.originalMaterial = obj.material;
    const Proto = Object.getPrototypeOf(material).constructor;
    obj.material = new Proto({ color: new THREE.Color("#000") });
  }
}
// 还原材质
function restoreMaterial(obj) {
  if (obj instanceof THREE.Scene) {
    // obj.background = obj.bg;
  }
  if (!obj.originalMaterial) return;
  obj.material = obj.originalMaterial;
  delete obj.originalMaterial;
}
// 首次进入动画
function eventAnimation() {
  new TWEEN.Tween(camera.clone().position)
    .to(new THREE.Vector3(-5, 250, 150), 1500)
    .easing(TWEEN.Easing.Sinusoidal.InOut)
    .onUpdate((e) => {
      camera.position.copy(e);
      controls.target.set(-5, 0, 10);
      controls.update();
    })
    .start();
}
</script>
<style lang="less">
@media (max-width: 4400px) {
  html {
    font-size: 22px;
  }
}

@media (max-width: 3800px) {
  html {
    font-size: 20px;
  }
}

@media (max-width: 3200px) {
  html {
    font-size: 18px;
  }
}

@media (max-width: 2600px) {
  html {
    font-size: 16px;
  }
}

@media (max-width: 2000px) {
  html {
    font-size: 14px;
  }
}

@media (max-width: 1400px) {
  html {
    font-size: 12px;
  }
}

@media (max-width: 800px) {
  html {
    font-size: 10px;
  }
}
#chinaMap {
  width: 100%;
  height: 100%;
  position: absolute;
  overflow: hidden;
}
#threejs {
  width: 100%;
  height: 100%;
}
.rightButton {
  position: absolute;
  right: 1vw;
  bottom: 40vh;
  width: 4vw;

  .common {
    width: 100%;
    height: 3vh;
    border: 1px solid #00ffff;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 1.2vh 0;
    color: #fafafa;
    opacity: 0.5;
    font-size: 0.8vw;
    cursor: pointer;
    transition: 1s;
  }

  .selected {
    opacity: 1 !important;
    transition: 1s;
  }
}
#provinceName {
  pointer-events: none;
  position: absolute;
  left: 0;
  top: 0;
  color: #8ee5ee;
  padding: 10px;
  width: 200px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  font-size: 13px;
}
#popup {
  z-index: 999;
  position: absolute;
  left: 0px;
  top: 0px;
  width: 41.66vw;
  height: 26.59vh;
  display: flex;

  .popup_line {
    margin-top: 4%;
    width: 24%;
    height: 26%;
    background: url("../../public/popup_line.png") no-repeat;
    background-size: 100% 100%;
  }
  .popup_Main {
    width: 35%;
    height: 80%;

    .popupMain_top {
      width: 100%;
      height: 10%;
      background: url("../../public/popupMain_head.png") no-repeat;
      background-size: 100% 100%;
    }
    .popupMain_footer {
      width: 100%;
      height: 10%;
      background: url("../../public/popupMain_footer.png") no-repeat;
      background-size: 100% 100%;
    }
    .popup_content {
      color: #fafafa;
      // background: rgba(47, 53, 121, 0.9);
      background-image: linear-gradient(to bottom, rgba(15, 36, 77, 1), rgba(8, 124, 190, 1));
      border-radius: 10px;
      width: 100%;
      height: 70%;
      padding: 5% 0%;
      .popup_head {
        width: 100%;
        height: 12%;
        margin-bottom: 2%;
        display: flex;
        align-items: center;
        .popup_title {
          color: #8ee5ee;
          font-size: 1vw;
          letter-spacing: 5px;
          width: 88%;
          height: 100%;
          display: flex;
          align-items: center;

          .title_icon {
            width: 0.33vw;
            height: 100%;
            background: #2586ff;
            margin-right: 10%;
          }
        }
        .close {
          cursor: pointer;
          pointer-events: auto;
          width: 1.5vw;
          height: 1.5vw;
          background: url("../../public/close.png") no-repeat;
          background-size: 100% 100%;
        }
      }
      .popup_item {
        display: flex;
        align-items: center;
        width: 85%;
        padding-left: 5%;
        height: 18%;
        // background: rgb(160, 196, 221);
        border-radius: 10px;
        margin: 2.5% 0%;
        margin-left: 10%;

        div {
          line-height: 100%;
          margin-right: 10%;
        }
        .item_value {
          font-size: 0.9vw;
          color: #00ffff;
          font-weight: 600;
          letter-spacing: 2px;
        }
      }
    }
  }
}
#cylinderValue {
  position: absolute;
  top: 0;
  left: 0;
  color: #bbffff;
}
#mapTag {
  z-index: 997;
  position: absolute;
  top: 0;
  left: 0;
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .content {
    width: 100%;
    height: 100%;
    padding: 2px 3px;
    background: #0e2346;
    border: 1px solid #6298a9;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fafafa;

    #mapTag_value {
      color: #ffd700;
    }
  }
  .content::before {
    content: "";
    width: 100%;
    // height: calc(100% - 1vw);
    position: absolute;
    background: linear-gradient(to top, #26aad1, #26aad1) left top no-repeat,
      //上左
      linear-gradient(to right, #26aad1, #26aad1) left top no-repeat,
      linear-gradient(to top, #26aad1, #26aad1) right bottom no-repeat,
      //下右
      linear-gradient(to left, #26aad1, #26aad1) right bottom no-repeat; //右下
    background-size: 2px 10px, 16px 2px, 2px 10px, 16px 2px;
    pointer-events: none;
  }

  .arrow {
    background: url("../../public/arrow.png") no-repeat;
    background-size: 100% 100%;
    width: 1vw;
    height: 1vw;
  }
}
</style>
