import * as THREE from 'three';
let particles = null

const paramsConfig = {
    num: 100, // 粒子数量
    range: 500, // 范围
    renderOrder: 99,
    material: new THREE.PointsMaterial({
        map: createTexture(),
        size: 20,
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
        depthTest: false,
        vertexColors: true,
        blending: THREE.AdditiveBlending, // 混合，参考http://127.0.0.1:8848/three.js-master131/three.js-master/examples/#webgl_materials_blending
        sizeAttenuation: true, // 指定点的大小是否因相机深度而衰减
    }),
}

function createTexture () {
    let canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    let context = canvas.getContext('2d')
    let gradient = context.createRadialGradient(512, 512, 0, 512, 512, 512)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, 1024, 1024)
    const texture = new THREE.CanvasTexture(canvas)
    return texture
}

function createParticles () {
    const { range, material, num, renderOrder } = paramsConfig
    const position = [] // 位置
    const colors = [] // 颜色
    const velocities = [] // 速度
    for (let i = 0; i < num; i++) {
        // 插入-250 ~ 250得位置
        position.push(
            Math.random() * range - range / 2,
            Math.random() * range - range / 2,
            Math.random() * range - range / 2,
        )
        // 插入速度
        velocities.push((Math.random() - 0.5) / 30, 0.1 + Math.random() / 5, 0.1 + Math.random() / 100)
        // 改变图片颜色随机亮度
        const color = material.color.clone()
        let hsl = {}
        color.getHSL(hsl)
        color.setHSL(hsl.h, hsl.s, hsl.l * Math.random())
        colors.push(color.r, color.g, color.b)
    }

    const geo = new THREE.BufferGeometry()
    // 设置属性
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3))
    geo.setAttribute('velocities', new THREE.BufferAttribute(new Float32Array(velocities), 3))
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))

    particles = new THREE.Points(geo, material)
    particles.renderOrder = renderOrder
}

function particlesUpdate () {
    const { range } = paramsConfig
    let position = particles.geometry.getAttribute('position')
    let velocities = particles.geometry.getAttribute('velocities')
    const count = position.count
    for (let i = 0; i < count; i++) {
        // 获取点得位置和速度
        let pos_x = position.getX(i)
        let pos_y = position.getY(i)
        // let pos_z = position.getZ(i)
        let vel_x = velocities.getX(i)
        let vel_y = velocities.getY(i)
        // let vel_z = velocities.getZ(i)
        pos_x += vel_x
        pos_y += vel_y
        // pos_z += vel_z
        // 超出粒子得范围，改变方向
        if (pos_x < -100 || pos_x > 100) vel_x = vel_x * -1
        if (pos_y > 250) pos_y = -250
        // if (pos_z > range / 2) pos_z = -range / 2
        // position.setX(i, pos_x)
        position.setY(i, pos_y)
        // position.setZ(i, pos_z)
        velocities.setX(i, vel_x)
    }
    position.needsUpdate = true
    velocities.needsUpdate = true
}

export { particlesUpdate, createParticles, particles }
