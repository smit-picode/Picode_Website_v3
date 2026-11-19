import * as THREE from "three";
import { BlendFunction, Effect, GaussianBlurPass } from "postprocessing";

/** Objects enabled on this layer are "the subject": they stay sharp, everything else is blurred. */
export const SUBJECT_LAYER = 7;

const fragmentShader = /* glsl */ `
uniform sampler2D blurBuffer;
uniform sampler2D maskBuffer;
uniform float strength;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float subject = texture2D(maskBuffer, uv).r;
  // Blurred *background only* (premultiplied by "not subject"), normalised back.
  vec4 b = texture2D(blurBuffer, uv);
  vec3 background = b.a > 0.002 ? b.rgb / b.a : inputColor.rgb;
  outputColor = vec4(mix(inputColor.rgb, background, strength * (1.0 - subject)), inputColor.a);
}
`;

/**
 * Selective focus: a Gaussian blur of the background, masked out wherever the current subject
 * (objects on SUBJECT_LAYER) is visible. The subject is removed *before* blurring, so its colours
 * never bleed into the background as a halo/glow — the subject is pin-sharp with clean edges.
 */
export class SubjectFocusEffect extends Effect {
  strength = 1;
  /**
   * Optional vertical focus falloff (world Y): fully sharp below `from`, fully blurred above `to`.
   * Lets a subject fade out of focus with height (e.g. servers sharp, cloud softening above).
   */
  falloff: { from: number; to: number } | null = null;

  private blur: GaussianBlurPass;
  private mask: THREE.WebGLRenderTarget;
  private premult = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  private blurred = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  private black = new THREE.Color(0x000000);
  private clear = new THREE.Color();
  private scene: THREE.Scene;
  private cam: THREE.Camera;

  // Fullscreen pass that writes (color * (1 - subject), 1 - subject).
  private quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quadScene = new THREE.Scene();
  private premultMaterial = new THREE.ShaderMaterial({
    uniforms: { inputBuffer: { value: null }, maskBuffer: { value: null } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D inputBuffer;
      uniform sampler2D maskBuffer;
      varying vec2 vUv;
      void main() {
        float bg = 1.0 - texture2D(maskBuffer, vUv).r;
        gl_FragColor = vec4(texture2D(inputBuffer, vUv).rgb * bg, bg);
      }`,
    depthTest: false,
    depthWrite: false,
  });

  private maskMaterial = new THREE.ShaderMaterial({
    uniforms: { useFalloff: { value: 0 }, fromY: { value: 0 }, toY: { value: 1 } },
    vertexShader: /* glsl */ `
      varying float vWorldY;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldY = wp.y;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform float useFalloff;
      uniform float fromY;
      uniform float toY;
      varying float vWorldY;
      void main() {
        float sharp = mix(1.0, 1.0 - smoothstep(fromY, toY, vWorldY), useFalloff);
        gl_FragColor = vec4(vec3(sharp), 1.0);
      }`,
  });

  constructor(scene: THREE.Scene, camera: THREE.Camera, { kernelSize = 63 } = {}) {
    const blur = new GaussianBlurPass({ kernelSize, iterations: 2, resolutionScale: 0.5 });
    const mask = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
    super("SubjectFocusEffect", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["blurBuffer", new THREE.Uniform(null)],
        ["maskBuffer", new THREE.Uniform(mask.texture)],
        ["strength", new THREE.Uniform(1)],
      ]),
    });
    this.blur = blur;
    this.mask = mask;
    this.scene = scene;
    this.cam = camera;
    this.quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.premultMaterial));
  }

  override update(renderer: THREE.WebGLRenderer, inputBuffer: THREE.WebGLRenderTarget) {
    this.uniforms.get("strength")!.value = this.strength;
    if (this.strength <= 0.001) return;

    const prevTarget = renderer.getRenderTarget();
    const prevAlpha = renderer.getClearAlpha();
    renderer.getClearColor(this.clear);

    // 1) Subject mask: subject objects only, white (sharp) on black.
    const scene = this.scene;
    const cam = this.cam;
    const prev = {
      background: scene.background,
      fog: scene.fog,
      override: scene.overrideMaterial,
      layers: cam.layers.mask,
      shadows: renderer.shadowMap.autoUpdate,
    };
    const u = this.maskMaterial.uniforms;
    u.useFalloff!.value = this.falloff ? 1 : 0;
    if (this.falloff) {
      u.fromY!.value = this.falloff.from;
      u.toY!.value = this.falloff.to;
    }
    scene.background = null;
    scene.fog = null;
    scene.overrideMaterial = this.maskMaterial;
    cam.layers.set(SUBJECT_LAYER);
    renderer.shadowMap.autoUpdate = false;
    renderer.setClearColor(this.black, 1);
    renderer.setRenderTarget(this.mask);
    renderer.clear();
    renderer.render(scene, cam);
    renderer.shadowMap.autoUpdate = prev.shadows;
    cam.layers.mask = prev.layers;
    scene.overrideMaterial = prev.override;
    scene.fog = prev.fog;
    scene.background = prev.background;

    // 2) Background only, premultiplied by its coverage.
    this.premultMaterial.uniforms.inputBuffer!.value = inputBuffer.texture;
    this.premultMaterial.uniforms.maskBuffer!.value = this.mask.texture;
    renderer.setRenderTarget(this.premult);
    renderer.render(this.quadScene, this.quadCam);

    // 3) Gaussian blur of that (colour and coverage blur together → no subject bleed).
    this.blur.render(renderer, this.premult, this.blurred);
    this.uniforms.get("blurBuffer")!.value = this.blurred.texture;

    renderer.setRenderTarget(prevTarget);
    renderer.setClearColor(this.clear, prevAlpha);
  }

  override setSize(width: number, height: number) {
    this.blur.setSize(width, height);
    this.mask.setSize(width, height);
    this.premult.setSize(width, height);
    this.blurred.setSize(Math.max(1, width / 2), Math.max(1, height / 2));
  }

  override initialize(renderer: THREE.WebGLRenderer, alpha: boolean, frameBufferType: number) {
    this.blur.initialize(renderer, alpha, frameBufferType);
    // Half-float keeps the premultiplied blur precise (no banding when dividing back out).
    this.premult.texture.type = THREE.HalfFloatType;
    this.blurred.texture.type = THREE.HalfFloatType;
  }

  override dispose() {
    this.blur.dispose();
    this.mask.dispose();
    this.premult.dispose();
    this.blurred.dispose();
    this.maskMaterial.dispose();
    this.premultMaterial.dispose();
    super.dispose();
  }
}
