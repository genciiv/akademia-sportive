"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const POSITIONS = [
  [
    [3.9, 1.7, 0, 1.15],
    [5.3, -1.6, -1, 0.9],
    [1.8, -2.4, 1, 0.72],
    [6.3, 2.8, -2, 0.72],
    [2.5, 3.3, -1.5, 0.58],
    [4.5, 0, -3, 1.2],
  ],
  [
    [-5.8, 2.5, -2, 0.82],
    [6.2, -2.1, -1, 0.95],
    [-5.3, -3.1, 0, 0.65],
    [6, 3.1, -2, 0.72],
    [0, 3.9, -5, 0.95],
    [-1, -3.8, -4, 0.82],
  ],
  [
    [-5.2, -2.8, -2, 0.55],
    [-3.2, -1.7, -2, 0.68],
    [-1.1, -0.5, -3, 0.82],
    [1.2, 0.7, -3, 0.98],
    [3.4, 1.9, -3, 1.08],
    [5.4, 2.9, -3, 1.2],
  ],
  [
    [-5.8, 0, -1, 1.05],
    [6, 1, 0, 1.15],
    [-3.8, 3.1, -3, 0.65],
    [4.3, -3, -2, 0.82],
    [0, -3.8, -4, 0.9],
    [1, 3.8, -4, 0.65],
  ],
  [
    [-5.8, -1, 2, 0.9],
    [5.8, -1.4, 2, 1],
    [-3.3, 3.3, -1, 0.65],
    [3.4, 3.6, -1, 0.72],
    [0, 4.1, -3, 0.9],
    [-4.8, -3.8, 0, 0.72],
  ],
] as const;

export function PublicHome3DScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2),
    );

    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      1,
      0.1,
      100,
    );

    camera.position.z = 11;

    scene.add(
      new THREE.AmbientLight(0xffffff, 1.05),
    );

    const directional =
      new THREE.DirectionalLight(
        0xffffff,
        1.1,
      );

    directional.position.set(4, 6, 6);

    scene.add(directional);

    const greenLight = new THREE.PointLight(
      0x9db0ff,
      1.35,
      30,
    );

    greenLight.position.set(-5, -2, 5);

    scene.add(greenLight);

    const blueLight = new THREE.PointLight(
      0xdccfff,
      0.8,
      26,
    );

    blueLight.position.set(6, 2, 3);

    scene.add(blueLight);

    const colors = [
      0x9fb4ff,
      0xbdf1de,
      0xdccfff,
      0xe6dcff,
      0xffd5c0,
      0x8095ff,
    ];

    const geometries = [
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.TorusGeometry(
        0.8,
        0.32,
        24,
        64,
      ),
      new THREE.BoxGeometry(
        1.3,
        1.3,
        1.3,
      ),
      new THREE.SphereGeometry(
        0.9,
        40,
        40,
      ),
      new THREE.OctahedronGeometry(1.1),
      new THREE.TorusKnotGeometry(
        0.65,
        0.2,
        80,
        18,
      ),
    ];

    const group = new THREE.Group();

    scene.add(group);

    const meshes: THREE.Mesh[] = [];

    POSITIONS[0].forEach((_, index) => {
      const material =
        new THREE.MeshPhysicalMaterial({
          color: colors[index],
          roughness: 0.22,
          metalness: 0.08,
          transparent: true,
          opacity: 0.92,
          clearcoat: 0.9,
          clearcoatRoughness: 0.18,
          transmission: 0.10,
          thickness: 0.7,
        });

      const mesh = new THREE.Mesh(
        geometries[
          index % geometries.length
        ],
        material,
      );

      mesh.userData = {
        phase: index * 1.35,
        speed: 0.18 + index * 0.045,
      };

      group.add(mesh);
      meshes.push(mesh);
    });

    let mouseX = 0;
    let mouseY = 0;

    let targetMouseX = 0;
    let targetMouseY = 0;

    let currentSection = 0;

    let mobile = false;

    const getSections = () =>
      [
        document.querySelector(
          "main > section:nth-of-type(1)",
        ),
        document.querySelector(
          "#platforma",
        ),
        document.querySelector(
          "#funksionet",
        ),
        document.querySelector(
          "#planet",
        ),
        document.querySelector(
          "footer",
        ),
      ].filter(
        (element): element is Element =>
          element !== null,
      );

    const getScrollTarget = () => {
      const sections = getSections();

      if (sections.length < 2) {
        return 0;
      }

      const y =
        window.scrollY +
        window.innerHeight * 0.48;

      const centers = sections.map(
        (element) => {
          const rect =
            element.getBoundingClientRect();

          return (
            window.scrollY +
            rect.top +
            rect.height / 2
          );
        },
      );

      if (y <= centers[0]) {
        return 0;
      }

      if (
        y >= centers[centers.length - 1]
      ) {
        return Math.min(
          centers.length - 1,
          POSITIONS.length - 1,
        );
      }

      for (
        let index = 0;
        index < centers.length - 1;
        index += 1
      ) {
        if (y < centers[index + 1]) {
          const raw =
            (y - centers[index]) /
            (centers[index + 1] -
              centers[index]);

          const eased =
            raw *
            raw *
            (3 - 2 * raw);

          return index + eased;
        }
      }

      return 0;
    };

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      renderer.setSize(
        width,
        height,
        false,
      );

      camera.aspect = width / height;

      mobile = width < 860;

      camera.updateProjectionMatrix();
    };

    const onPointerMove = (
      event: PointerEvent,
    ) => {
      targetMouseX =
        event.clientX /
          window.innerWidth -
        0.5;

      targetMouseY =
        event.clientY /
          window.innerHeight -
        0.5;
    };

    resize();

    window.addEventListener(
      "resize",
      resize,
    );

    window.addEventListener(
      "pointermove",
      onPointerMove,
      {
        passive: true,
      },
    );

    const startTime = performance.now();

    let frameId = 0;

    const frame = () => {
      const time =
        (performance.now() -
          startTime) /
        1000;

      const scrollTarget =
        getScrollTarget();

      currentSection = reduceMotion
        ? scrollTarget
        : currentSection +
          (scrollTarget -
            currentSection) *
            0.075;

      mouseX +=
        (targetMouseX - mouseX) *
        0.07;

      mouseY +=
        (targetMouseY - mouseY) *
        0.07;

      const positionIndex = Math.min(
        Math.floor(currentSection),
        POSITIONS.length - 2,
      );

      const fraction =
        currentSection - positionIndex;

      const horizontalScale = mobile
        ? 0.48
        : 1;

      const objectScale = mobile
        ? 0.72
        : 1;

      meshes.forEach(
        (mesh, meshIndex) => {
          const from =
            POSITIONS[positionIndex][
              meshIndex
            ];

          const to =
            POSITIONS[
              positionIndex + 1
            ][meshIndex];

          const phase =
            mesh.userData.phase as number;

          const speed =
            mesh.userData.speed as number;

          const x =
            (from[0] +
              (to[0] - from[0]) *
                fraction) *
            horizontalScale;

          const y =
            from[1] +
            (to[1] - from[1]) *
              fraction +
            Math.sin(
              time * 0.9 + phase,
            ) *
              0.32;

          const z =
            from[2] +
            (to[2] - from[2]) *
              fraction;

          mesh.position.set(x, y, z);

          const scale =
            (from[3] +
              (to[3] - from[3]) *
                fraction) *
            objectScale;

          mesh.scale.setScalar(scale);

          mesh.rotation.x =
            time * speed +
            currentSection * 1.45;

          mesh.rotation.y =
            time * speed * 1.45 +
            currentSection * 1.95;

          mesh.rotation.z =
            Math.sin(
              time * 0.35 + phase,
            ) * 0.25;
        },
      );

      /*
       * Stronger mouse reaction than before.
       * This is intentionally close to the
       * reference page.
       */
      group.rotation.y +=
        (mouseX * 1.15 -
          group.rotation.y) *
        0.075;

      group.rotation.x +=
        (-mouseY * 0.8 -
          group.rotation.x) *
        0.075;

      group.position.x +=
        (mouseX * 0.75 -
          group.position.x) *
        0.045;

      group.position.y +=
        (-mouseY * 0.45 -
          group.position.y) *
        0.045;

      renderer.render(scene, camera);

      if (!reduceMotion) {
        frameId =
          requestAnimationFrame(frame);
      }
    };

    frame();

    return () => {
      cancelAnimationFrame(frameId);

      window.removeEventListener(
        "resize",
        resize,
      );

      window.removeEventListener(
        "pointermove",
        onPointerMove,
      );

      geometries.forEach(
        (geometry) => geometry.dispose(),
      );

      meshes.forEach((mesh) => {
        const material =
          mesh.material;

        if (
          material instanceof
          THREE.Material
        ) {
          material.dispose();
        }
      });

      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-0 h-screen w-screen"
    />
  );
}