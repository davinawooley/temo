import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gsap } from 'gsap'

// Loaders
const loadingBarElement = document.querySelector('.loading-bar')

let sceneReady = false
const loadingManager = new THREE.LoadingManager(
    () =>
    {
        window.setTimeout(() =>
        {
            // Overlay
            gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 4, value: 0, delay: 1 })

            // Update load
            loadingBarElement.classList.add('ended')
            loadingBarElement.style.transform = ''
        }, 500)

        window.setTimeout(() =>
        {
            sceneReady = true
        }, 2000)
    },

    // Progress
    (itemUrl, itemsLoaded, itemsTotal) =>
    {
        // Calculate progress and update bar
        const progressRatio = itemsLoaded / itemsTotal
        loadingBarElement.style.transform = `scaleX(${progressRatio})`
    }
)
const gltfLoader = new GLTFLoader(loadingManager)
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager)

// Base
// Debug
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// overlay
const overlayGeomeometry = new THREE.PlaneBufferGeometry(2,2,1,1)
const overlayMaterial = new THREE.ShaderMaterial({
    transparent : true,
    side: THREE.DoubleSide,
    uniforms: {
        uAlpha:{value:1}
    },
    vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uAlpha;
        void main()
        {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);            
        }
    `
})
const overlay = new THREE.Mesh(overlayGeomeometry, overlayMaterial)
scene.add(overlay)


// materials

const updateAllMaterials = () =>
{
    scene.traverse((child) =>
    {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
        {
            child.material.envMap = environmentMap
            child.material.envMapIntensity = debugObject.envMapIntensity
            child.material.needsUpdate = true
            child.castShadow = true
            child.receiveShadow = true
            child.geometry.computeBoundingBox()
            child.geometry.boundingBox.expandByScalar(0)

        }
    })
}




/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
    '/textures/update/0/px.jpg',
    '/textures/update/0/nx.jpg',
    '/textures/update/0/py.jpg',
    '/textures/update/0/ny.jpg',
    '/textures/update/0/pz.jpg',
    '/textures/update/0/nz.jpg'
])

environmentMap.encoding = THREE.sRGBEncoding

scene.background = environmentMap
scene.environment = environmentMap

debugObject.envMapIntensity = 2.5

// 3D Model
gltfLoader.load(
    '/models/DamagedHelmet/glTF/dee.gltf',
    (gltf) =>
    {
        gltf.scene.scale.set(1.25, 1.25, 1.25)
        gltf.scene.rotation.y = Math.PI * 0.45
        scene.add(gltf.scene)

        updateAllMaterials()
    }
)

// Raycaster
const raycaster = new THREE.Raycaster()
const points = [
    {
        position: new THREE.Vector3(1.55, 0.3, - 0.6),
        element: document.querySelector('.point-0')
    },
    {
        position: new THREE.Vector3(0.5, 0.8, - 1.6),
        element: document.querySelector('.point-1')
    },
    {
        position: new THREE.Vector3(1.6, - 1.3, - 0.7),
        element: document.querySelector('.point-2')
    }
]

// Lights

const ambientLight = new THREE.AmbientLight('0x3A3B3C', 1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xf4f4f4, 3)

directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(- 5, 5, 0)

// scene.add(directionalLight)
scene.add(directionalLight)

// second light

const directionalLight2 = new THREE.DirectionalLight(0xf4f4f4, 3)

directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = -5
directionalLight.shadow.camera.left =  7
directionalLight.shadow.camera.top = -7
directionalLight.shadow.camera.right = -7
directionalLight.shadow.camera.bottom = - -7
directionalLight.position.set(5, -5, 0)
scene.add(directionalLight2)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(25, 21,  20)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.minAzimuthAngle =-Math.PI*5; 
// controls.maxAzimuthAngle = Math.PI*.05; 
controls.minDistance = 20.0; 
controls.maxDistance = 50.0;
controls.maxPolarAngle = 10;
controls.minPolarAngle=0;
controls.target.set(10, 9, 10)
controls.enableDamping = true 


const cursor = {
    x: 0,
    y: 0
}

window.addEventListener('mousemove', (event) =>
{
    cursor.x = event.clientX / sizes.width - 0.5
    cursor.y = event.clientY / sizes.height - 0.5

    console.log(cursor.x, cursor.y)
})

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas, 
    antialias: true
})

renderer.shadowMap.enabled = true
renderer.physicallyCorrectLights = true
renderer.shadowMap.type = THREE .PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding
renderer.physicallyCorrectLights = true
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 3

// ticker
const tick = () =>
{
    // Update controls
    controls.update()
    

    // Update points only when the scene is ready
    if(sceneReady)
    {
        // Go through each point
        for(const point of points)
        {
            // Get 2D screen position
            const screenPosition = point.position.clone()
            screenPosition.project(camera)
    
            // Set the raycaster
            raycaster.setFromCamera(screenPosition, camera)
            const intersects = raycaster.intersectObjects(scene.children, true)
    
            // No intersect found
            if(intersects.length === 0)
            {
                // Show
                point.element.classList.add('visible')
            }

            // Intersect found
            else
            {
                // Get the distance of the intersection and the distance of the point
                const intersectionDistance = intersects[0].distance
                const pointDistance = point.position.distanceTo(camera.position)
    
                // Intersection is close than the point
                if(intersectionDistance < pointDistance)
                {
                    // Hide
                    point.element.classList.remove('visible')
                }
                // Intersection is further than the point
                else
                {
                    // Show
                    point.element.classList.add('visible')
                }
            }
    
            const translateX = Math.sin(cursor.x * Math.PI * 2) * 2
            const translateY = - cursor.y * 3
            point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
            camera.lookAt(point.position)
        }
    }

    // Render
    renderer.render(scene, camera)

    // ticker for each frame
    window.requestAnimationFrame(tick)
}

tick()