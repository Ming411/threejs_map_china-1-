export default /* glsl */ `
// 半径
float r = uRadius + uTime * uSpeed;
// 宽度
float w = uWidth;
vec3 center = uCenter;
// 距离圆心的距离
float rDistance = distance(vPosition.xy,center.xy);
if(rDistance > r && rDistance < r+2.0 * w){
    float per = 0.0;
    if(rDistance < r + w){
        per = (rDistance - r) / w;
        outgoingLight = mix(outgoingLight,uColor,per);
    }else{
        per = (rDistance - r - w) / w;
        outgoingLight = mix(uColor,outgoingLight,per);
    }
    gl_FragColor = vec4( outgoingLight, diffuseColor.a );
}else{
    gl_FragColor = vec4( outgoingLight,  0.0);
}
#include <dithering_fragment>
`
