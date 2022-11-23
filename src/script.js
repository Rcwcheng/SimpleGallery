import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import vs from './shaders/vertex.glsl'
import fs from './shaders/fragment.glsl'
import gsap from "gsap";

//gui
//const gui = new dat.GUI()


const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
const ShaderMaterials = [];
let DepthMaterial = null;
const PlainMaterials = [];
const ImageArray = [];
const DepthMapArray = [];
const PlaneImages = {};
let openDepth = false;
document.body.classList.add("isLoading");


const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
camera.rotation.order = "XZY";
camera.position.set(0, 0, -5);
scene.add(camera)

const raycaster = new THREE.Raycaster();

//orbitControl
const controls = new OrbitControls(camera, canvas)
controls.enabledDamping;

//renderer
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

let mouseX = 0, mouseY = 0;

const loadImages = () => {
    const loadManager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(loadManager);

    
    for (let i = 0; i < 39; i++) {
        ImageArray.push(textureLoader.load(`SimpleGallery/dist/image/image${i + 1}.png`));
        DepthMapArray.push(textureLoader.load(`SimpleGallery/dist/depth/depth${i + 1}.png`));
        PlainMaterials.push(new THREE.MeshBasicMaterial({
            map: textureLoader.load(`SimpleGallery/dist/image/image${i + 1}.png`)
        }));
    }

    DepthMaterial = new THREE.ShaderMaterial({
        vertexShader: vs,
        fragmentShader: fs,
        side: THREE.DoubleSide,
        uniforms:
        {
            uTime: { value: 0.},
            uDistortMap: { value: 0.003 },
            uDistortUV: { value: 100 },
            uMouse: { value: [mouseX, mouseY] },
            uImageData: {
                value: textureLoader.load(`SimpleGallery/dist/image/image1.png`)
            },
            uDepthMap: {
                value:  textureLoader.load( `SimpleGallery/dist/depth/depth1.png` ),
            },
        }
    })

    const h = 9, vertSpace = 4;
    const row = 4, column = 30;
    const radius = 55;
    const sumH = row * h + (row - 1) * vertSpace;
    const geometry = new THREE.PlaneBufferGeometry(h, h, 1280, 720)
    let imageIndex = 0;
    let planeName = 0;

    for (let i = 0; i < row; i++) {
        for (let j = 0; j < column; j++) {
            const radians = Math.PI * 2 / column * j;
            const x = Math.sin(radians) * radius;
            const z = Math.cos(radians) * radius;
            const y = -sumH * 0.5 + i * (h + vertSpace) + h * 0.5;

            const plane = new THREE.Mesh(geometry, PlainMaterials[imageIndex]);
            plane.name = `image${planeName}`
            PlaneImages[plane.name] = imageIndex

            plane.position.set(x, y, z);
            plane.lookAt(0, y, 0);
            scene.add(plane);
            imageIndex ++;
            planeName++;

            if(imageIndex > 38){
                imageIndex = 0;
            }
        }
    }
};

const resize = () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
};

const on = () => {
    let selectObjectId
    let selectObject = null
    let selectObjectName = null;
    let selectImageIndex = null;
    let target = new THREE.Vector3();
    let isMousedown = false;
    let downPos= {x: 0, y: 0};
    let targetOrientation;
    let startOrientation;

    const zoomInTimeline = (target) => {    
        gsap.to( controls.target, {
            duration: 2,
            x: target.x,
            y: target.y,
            z: target.z,
            onUpdate: function () {
                controls.update();
            }
        } );

        gsap.to( camera, {
            duration: 2,
            zoom: 5.,
            onUpdate: function () {
                camera.updateProjectionMatrix();
            }
        } );
        
        openDepth = true;
    };

    const zoomOutTimeline = () => {    
        gsap.to( controls.target, {
                duration: 2,
                x: 0.,
                y: 0.,
                z: 0.,
                onUpdate: function () {
                    controls.update();
                }
            } );
         gsap.to( camera, {
            duration: 2,
            zoom: 1,
            onUpdate: function () {
                camera.updateProjectionMatrix();
                controls.enabled = true;
            }
        } );
        
        openDepth = false;
    };

    const rotateCarousel = (movementX) => {
        if (isMousedown) {
            camera.rotation.y += movementX * 0.001;
        }
    };

    const ZoomToScene = ( downPos) => {
        raycaster.setFromCamera( downPos, camera);
        const intersects = raycaster.intersectObjects(scene.children);
        controls.enabled = false;

        if (intersects.length > 0) {
            if (selectObjectId !== intersects[0].object.id) {

                if(selectObject != null){
                    if(selectObject.type === 'Mesh'){
                        scene.getObjectByName(selectObjectName).material = PlainMaterials[selectImageIndex]
                    }
                }
                selectObjectName = intersects[0].object.name
                selectImageIndex = PlaneImages[selectObjectName]
                DepthMaterial.uniforms.uImageData.value = ImageArray[selectImageIndex]
                DepthMaterial.uniforms.uDepthMap.value = DepthMapArray[selectImageIndex]
                intersects[0].object.material = DepthMaterial;

                const p = intersects[0].object.position;
                target = new THREE.Vector3().copy(p);
                //const halfP = new THREE.Vector3(p.x * 0.3, p.y, p.z * 0.3);

                //startOrientation = camera.quaternion.clone();
                //targetOrientation = intersects[0].object.quaternion.clone().normalize();

                zoomInTimeline(target);
                selectObject = intersects[0].object
                selectObjectId = intersects[0].object.id;

                
            }
        }
        if (selectObjectId !== null && intersects.length === 0) {
            //startOrientation = camera.quaternion.clone();
            zoomOutTimeline();
            if(selectObject.type === 'Mesh'){
                scene.getObjectByName(selectObjectName).material = PlainMaterials[selectImageIndex]
            }
            selectObjectId = null;
            selectObject = null;
            selectImageIndex = null;
            selectObjectName = null;
        }
    };

    window.addEventListener("mousemove", (event) => {
        event.preventDefault();
        mouseX = (event.offsetX / sizes.width  * 2 - 1) * 0.08;
        mouseY = (event.offsetY / sizes.height * 2 - 1) * 0.08;

        
        if(openDepth){
            DepthMaterial.uniforms.uMouse.value = [mouseX, mouseY]
        }

        const distance = Math.sqrt(Math.pow(event.offsetX - downPos.x, 2) + Math.pow(event.offsetY - downPos.y, 2));
        if (distance > 0.1) {
            rotateCarousel(event.movementX);
        }
    })

    window.addEventListener("mousedown", (event) => {
        event.preventDefault();
        downPos = {x: event.offsetX, y: event.offsetY};
        isMousedown = true;
    });

    window.addEventListener("mouseup", (event) => {
        event.preventDefault();
        isMousedown = false;
    });

    window.addEventListener("dblclick", (event) => {
        event.preventDefault();
        const x = (event.offsetX / window.innerWidth) * 2 - 1;
        const y = - (event.offsetY / window.innerHeight) * 2 + 1;
        downPos = new THREE.Vector2(x, y);
        ZoomToScene(downPos);
    });

    window.addEventListener("resize", resize);

};


const init = () => {
    loadImages();
    resize();
};

init()
on();

const clock = new THREE.Clock()

renderer.setAnimationLoop( function () {

    const elapsedTime = clock.getElapsedTime()
    controls.update()
    renderer.render( scene, camera );

} )
