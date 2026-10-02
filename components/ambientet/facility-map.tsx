"use client";

import {
  useEffect,
  useRef,
} from "react";

import * as L from "leaflet";

type FacilityMapItem = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  facilities?: FacilityMapItem[];
  selectedFacilityId?: string | null;
  onSelectFacility?: (
    facilityId: string
  ) => void;

  editable?: boolean;
  selectedLatitude?: number | null;
  selectedLongitude?: number | null;
  onLocationChange?: (
    latitude: number,
    longitude: number
  ) => void;

  heightClassName?: string;
};

const ALBANIA_CENTER: L.LatLngExpression = [
  41.1533,
  20.1683,
];

function createPinIcon(
  selected: boolean
) {
  const size =
    selected ? 38 : 32;

  const background =
    selected
      ? "#2563eb"
      : "#0f172a";

  return L.divIcon({
    className: "",
    html: `
      <div
        style="
          width:${size}px;
          height:${size}px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          background:${background};
          border:3px solid white;
          box-shadow:0 8px 20px rgba(15,23,42,.25);
        "
      >
        <div
          style="
            width:9px;
            height:9px;
            border-radius:999px;
            background:white;
          "
        ></div>
      </div>
    `,
    iconSize: [
      size,
      size,
    ],
    iconAnchor: [
      size / 2,
      size,
    ],
    popupAnchor: [
      0,
      -size,
    ],
  });
}

function createPopupContent(
  facility: FacilityMapItem
) {
  const wrapper =
    document.createElement("div");

  wrapper.className =
    "min-w-[180px]";

  const name =
    document.createElement("p");

  name.className =
    "font-semibold text-slate-900";

  name.textContent =
    facility.name;

  const address =
    document.createElement("p");

  address.className =
    "mt-1 text-xs text-slate-500";

  address.textContent =
    facility.address ||
    "Pa adresë";

  wrapper.appendChild(name);
  wrapper.appendChild(address);

  return wrapper;
}

export default function FacilityMap({
  facilities = [],
  selectedFacilityId = null,
  onSelectFacility,
  editable = false,
  selectedLatitude = null,
  selectedLongitude = null,
  onLocationChange,
  heightClassName = "h-[560px]",
}: Props) {
  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const mapRef =
    useRef<L.Map | null>(
      null
    );

  const facilityLayerRef =
    useRef<L.LayerGroup | null>(
      null
    );

  const pickerMarkerRef =
    useRef<L.Marker | null>(
      null
    );

  const onSelectFacilityRef =
    useRef(onSelectFacility);

  const onLocationChangeRef =
    useRef(onLocationChange);

  useEffect(() => {
    onSelectFacilityRef.current =
      onSelectFacility;
  }, [
    onSelectFacility,
  ]);

  useEffect(() => {
    onLocationChangeRef.current =
      onLocationChange;
  }, [
    onLocationChange,
  ]);

  useEffect(() => {
    const container =
      containerRef.current;

    if (
      !container ||
      mapRef.current
    ) {
      return;
    }

    const map =
      L.map(
        container,
        {
          center:
            ALBANIA_CENTER,
          zoom: 7,
          minZoom: 5,
          scrollWheelZoom: true,
        }
      );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          "&copy; OpenStreetMap contributors",
      }
    ).addTo(map);

    const facilityLayer =
      L.layerGroup().addTo(map);

    facilityLayerRef.current =
      facilityLayer;

    mapRef.current =
      map;

    const timer =
      window.setTimeout(
        () => {
          map.invalidateSize();
        },
        0
      );

    return () => {
      window.clearTimeout(
        timer
      );

      facilityLayer.clearLayers();

      if (
        pickerMarkerRef.current
      ) {
        pickerMarkerRef.current.remove();

        pickerMarkerRef.current =
          null;
      }

      map.remove();

      facilityLayerRef.current =
        null;

      mapRef.current =
        null;
    };
  }, []);

  useEffect(() => {
    const layer =
      facilityLayerRef.current;

    if (!layer) {
      return;
    }

    layer.clearLayers();

    if (editable) {
      return;
    }

    facilities.forEach(
      (facility) => {
        if (
          facility.latitude ===
            null ||
          facility.longitude ===
            null
        ) {
          return;
        }

        const selected =
          facility.id ===
          selectedFacilityId;

        const marker =
          L.marker(
            [
              facility.latitude,
              facility.longitude,
            ],
            {
              icon:
                createPinIcon(
                  selected
                ),
            }
          );

        marker.bindPopup(
          createPopupContent(
            facility
          )
        );

        marker.on(
          "click",
          () => {
            onSelectFacilityRef.current?.(
              facility.id
            );
          }
        );

        marker.addTo(layer);
      }
    );
  }, [
    editable,
    facilities,
    selectedFacilityId,
  ]);

  useEffect(() => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    if (editable) {
      if (
        selectedLatitude !==
          null &&
        selectedLongitude !==
          null
      ) {
        map.flyTo(
          [
            selectedLatitude,
            selectedLongitude,
          ],
          16,
          {
            animate: true,
            duration: 0.8,
          }
        );
      }

      return;
    }

    const selectedFacility =
      facilities.find(
        (facility) =>
          facility.id ===
          selectedFacilityId
      );

    if (
      selectedFacility?.latitude !==
        null &&
      selectedFacility?.latitude !==
        undefined &&
      selectedFacility?.longitude !==
        null &&
      selectedFacility?.longitude !==
        undefined
    ) {
      map.flyTo(
        [
          selectedFacility.latitude,
          selectedFacility.longitude,
        ],
        15,
        {
          animate: true,
          duration: 0.8,
        }
      );

      return;
    }

    if (selectedFacilityId) {
      map.flyTo(
        ALBANIA_CENTER,
        7,
        {
          animate: true,
          duration: 0.8,
        }
      );
    }
  }, [
    editable,
    facilities,
    selectedFacilityId,
    selectedLatitude,
    selectedLongitude,
  ]);

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !editable
    ) {
      return;
    }

    const handleClick = (
      event: L.LeafletMouseEvent
    ) => {
      onLocationChangeRef.current?.(
        event.latlng.lat,
        event.latlng.lng
      );
    };

    map.on(
      "click",
      handleClick
    );

    return () => {
      map.off(
        "click",
        handleClick
      );
    };
  }, [
    editable,
  ]);

  useEffect(() => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    if (
      pickerMarkerRef.current
    ) {
      pickerMarkerRef.current.remove();

      pickerMarkerRef.current =
        null;
    }

    if (
      !editable ||
      selectedLatitude === null ||
      selectedLongitude === null
    ) {
      return;
    }

    const marker =
      L.marker(
        [
          selectedLatitude,
          selectedLongitude,
        ],
        {
          icon:
            createPinIcon(
              true
            ),
          draggable: true,
        }
      );

    marker.bindPopup(
      "Zvarrite pin-in për pozicion më të saktë."
    );

    marker.on(
      "dragend",
      () => {
        const position =
          marker.getLatLng();

        onLocationChangeRef.current?.(
          position.lat,
          position.lng
        );
      }
    );

    marker.addTo(map);

    pickerMarkerRef.current =
      marker;

    return () => {
      marker.remove();

      if (
        pickerMarkerRef.current ===
        marker
      ) {
        pickerMarkerRef.current =
          null;
      }
    };
  }, [
    editable,
    selectedLatitude,
    selectedLongitude,
  ]);

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 ${heightClassName}`}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
      />

      {editable &&
      (selectedLatitude === null ||
        selectedLongitude ===
          null) ? (
        <div className="pointer-events-none absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-full border border-white/80 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-600 shadow-lg backdrop-blur">
          Kliko në hartë për të
          vendosur ambientin
        </div>
      ) : null}
    </div>
  );
}