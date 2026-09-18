import { useEffect, useRef, useMemo } from "react";
import ThreeGlobe from "three-globe";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "./globe.json";

const cameraZ = 300;

export type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialCoordinates?: {
    lat: number;
    lng: number;
  };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

export function Globe({ globeConfig, data }: WorldProps) {
  const globeRef = useRef<ThreeGlobe | null>(null);

  const globeObj = useMemo(() => new ThreeGlobe(), []);

  const defaultProps = useMemo(() => ({
    pointSize: 1,
    atmosphereColor: "#7342E2",
    showAtmosphere: true,
    atmosphereAltitude: 0.15,
    polygonColor: "rgba(255,255,255,0.7)",
    globeColor: "#060816",
    emissive: "#000000",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ...globeConfig,
  }), [globeConfig]);

  useEffect(() => {
    if (!globeRef.current) return;

    const globe = globeRef.current;

    globe
      .hexPolygonsData(countries.features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .hexPolygonColor(() => defaultProps.polygonColor);

    globe
      .arcsData(data)
      .arcStartLat((d: any) => d.startLat)
      .arcStartLng((d: any) => d.startLng)
      .arcEndLat((d: any) => d.endLat)
      .arcEndLng((d: any) => d.endLng)
      .arcColor((d: any) => d.color)
      .arcAltitude((d: any) => d.arcAlt)
      .arcStroke(() => 0.6)
      .arcDashLength(defaultProps.arcLength)
      .arcDashGap(4)
      .arcDashInitialGap((d: any) => d.order * 1)
      .arcDashAnimateTime(defaultProps.arcTime);

    globe
      .pointsData(data)
      .pointColor((d: any) => d.color)
      .pointRadius(2)
      .pointAltitude(0.02);
  }, [data, defaultProps]);

  return <primitive object={globeObj} ref={globeRef} />;
}

export function World(props: WorldProps) {
  const { globeConfig } = props;

  return (
    <Canvas camera={{ position: [0, 0, cameraZ], fov: 45 }}>
      <ambientLight color={globeConfig.ambientLight || "#ffffff"} intensity={0.6} />
      <directionalLight position={[-400, 100, 400]} color={globeConfig.directionalLeftLight || "#ffffff"} />
      <directionalLight position={[-200, 500, 200]} color={globeConfig.directionalTopLight || "#ffffff"} />
      <pointLight position={[-200, 500, 200]} color={globeConfig.pointLight || "#ffffff"} intensity={0.8} />
      <Globe {...props} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI - Math.PI / 3}
        autoRotate={globeConfig.autoRotate !== false}
        autoRotateSpeed={globeConfig.autoRotateSpeed || 1.2}
      />
    </Canvas>
  );
}
