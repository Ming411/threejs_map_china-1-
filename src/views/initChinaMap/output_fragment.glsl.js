export default /* glsl */`
vec3 outgoingLight = reflectedLight.indirectDiffuse;
vec3 gradient = mix(vec3(0.3,0.3,0.3),vec3(0.9,0.9,1.0), vPosition.z/10.0);
outgoingLight = outgoingLight*gradient;
// 开始的位置
float y = uStart + uTime * uSpeed;
// 高度
float h = uHeight / 1.0;
if(vPosition.z > y && vPosition.z < y + h * 1.0) {
    float per = 0.0;
    if(vPosition.z < y + h){
        per = (vPosition.z - y) / h;
        outgoingLight = mix(outgoingLight,uColor,per);
    }else{
        per = (vPosition.z - y - h) / h;
        outgoingLight = mix(uColor,outgoingLight,per);
    }
}

diffuseColor = vec4( outgoingLight, diffuseColor.a );
`
