/**
 * Declarative colour / layout overrides for the OpenFreeMap Liberty style.
 *
 * Design direction: "Clean Canvas — Water as Hero"
 * Warm-white background, confident teal-blue water, near-invisible roads
 * and buildings, whisper-level parks, brown boundaries for brand colour.
 */

export interface LayerOverride {
  paint?: Record<string, unknown>
  layout?: Record<string, unknown>
}

export const themeOverrides: Record<string, LayerOverride> = {
  // ── Background ───────────────────────────────────────────────
  background: {
    paint: { 'background-color': '#F8F6F1' },
  },

  // ── Natural earth raster — HIDDEN (flat clean canvas) ───────
  // Layer ID is `natural_earth`, not `ne2_shaded` (that's the source)
  natural_earth: {
    layout: { visibility: 'none' },
  },

  // ── Hidden pattern/texture layers ───────────────────────────
  'building-3d': {
    layout: { visibility: 'none' },
  },
  landcover_wetland: {
    layout: { visibility: 'none' },
  },
  road_area_pattern: {
    layout: { visibility: 'none' },
  },

  // ── Water ────────────────────────────────────────────────────
  water: {
    paint: { 'fill-color': '#B8CDD8' },
  },
  waterway_tunnel: { paint: { 'line-color': '#A3BFD0' } },
  waterway_river: { paint: { 'line-color': '#A3BFD0' } },
  waterway_other: { paint: { 'line-color': '#A3BFD0' } },

  // ── Water labels ─────────────────────────────────────────────
  waterway_line_label: { paint: { 'text-color': '#5E8EA6' } },
  water_name_point_label: {
    paint: { 'text-color': '#5E8EA6', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  water_name_line_label: {
    paint: { 'text-color': '#5E8EA6', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },

  // ── Parks / landcover (whisper-level) ────────────────────────
  park: {
    paint: {
      'fill-color': 'rgba(135,148,111,0.08)',
      'fill-opacity': 1,
    },
  },
  park_outline: { paint: { 'line-color': 'rgba(135,148,111,0.1)' } },
  landcover_wood: {
    paint: {
      'fill-color': 'hsla(90,20%,55%,0.06)',
      'fill-opacity': 1,
    },
  },
  landcover_grass: {
    paint: {
      'fill-color': 'rgba(135,148,111,0.06)',
      'fill-opacity': 1,
    },
  },
  landcover_ice: { paint: { 'fill-color': 'rgba(240,245,245,0.8)' } },
  landcover_sand: { paint: { 'fill-color': 'rgba(235,230,215,0.5)' } },
  landuse_cemetery: { paint: { 'fill-color': 'rgba(200,205,190,0.3)' } },
  landuse_hospital: { paint: { 'fill-color': 'rgba(240,230,230,0.3)' } },
  landuse_school: { paint: { 'fill-color': 'rgba(235,232,216,0.3)' } },
  landuse_pitch: { paint: { 'fill-color': 'rgba(220,222,205,0.3)' } },
  landuse_track: { paint: { 'fill-color': 'rgba(220,222,205,0.3)' } },
  landuse_residential: { paint: { 'fill-color': 'hsla(35,20%,90%,0.25)' } },

  // ── Roads (near-invisible) ──────────────────────────────────
  road_motorway: { paint: { 'line-color': '#E2DED6' } },
  road_trunk_primary: { paint: { 'line-color': '#EAE6DE' } },
  road_secondary_tertiary: { paint: { 'line-color': '#EAE6DE' } },
  road_minor: { paint: { 'line-color': '#F0EDE6' } },
  road_link: { paint: { 'line-color': '#EAE6DE' } },
  road_service_track: { paint: { 'line-color': '#F0EDE6' } },
  road_path_pedestrian: { paint: { 'line-color': '#EDE9E2' } },
  road_motorway_link: { paint: { 'line-color': '#E2DED6' } },

  // ── Road casings (subtle gray) ──────────────────────────────
  road_motorway_casing: { paint: { 'line-color': '#D8D4CC' } },
  road_trunk_primary_casing: { paint: { 'line-color': '#D8D4CC' } },
  road_secondary_tertiary_casing: { paint: { 'line-color': '#DCD8D0' } },
  road_minor_casing: { paint: { 'line-color': '#E2DED6' } },
  road_link_casing: { paint: { 'line-color': '#D8D4CC' } },
  road_service_track_casing: { paint: { 'line-color': '#E2DED6' } },
  road_motorway_link_casing: { paint: { 'line-color': '#D8D4CC' } },

  // ── Tunnels ──────────────────────────────────────────────────
  tunnel_motorway: { paint: { 'line-color': '#E8E4DC' } },
  tunnel_trunk_primary: { paint: { 'line-color': '#EEEBE4' } },
  tunnel_secondary_tertiary: { paint: { 'line-color': '#EEEBE4' } },
  tunnel_minor: { paint: { 'line-color': '#F0EDE6' } },
  tunnel_motorway_link: { paint: { 'line-color': '#E8E4DC' } },
  tunnel_service_track: { paint: { 'line-color': '#F0EDE6' } },
  tunnel_link: { paint: { 'line-color': '#EEEBE4' } },
  tunnel_path_pedestrian: { paint: { 'line-color': '#EDE9E2' } },

  // ── Tunnel casings ──────────────────────────────────────────
  tunnel_motorway_casing: { paint: { 'line-color': '#DCD8D0' } },
  tunnel_trunk_primary_casing: { paint: { 'line-color': '#DCD8D0' } },
  tunnel_secondary_tertiary_casing: { paint: { 'line-color': '#E2DED6' } },
  tunnel_minor_casing: { paint: { 'line-color': '#E8E4DC' } },
  tunnel_link_casing: { paint: { 'line-color': '#DCD8D0' } },
  tunnel_service_track_casing: { paint: { 'line-color': '#E8E4DC' } },

  // ── Bridges ──────────────────────────────────────────────────
  bridge_motorway: { paint: { 'line-color': '#E2DED6' } },
  bridge_trunk_primary: { paint: { 'line-color': '#EAE6DE' } },
  bridge_secondary_tertiary: { paint: { 'line-color': '#EAE6DE' } },
  bridge_street: { paint: { 'line-color': '#F0EDE6' } },
  bridge_link: { paint: { 'line-color': '#EAE6DE' } },
  bridge_service_track: { paint: { 'line-color': '#F0EDE6' } },
  bridge_motorway_link: { paint: { 'line-color': '#E2DED6' } },
  bridge_path_pedestrian: { paint: { 'line-color': '#EDE9E2' } },

  // ── Bridge casings ──────────────────────────────────────────
  bridge_motorway_casing: { paint: { 'line-color': '#D8D4CC' } },
  bridge_trunk_primary_casing: { paint: { 'line-color': '#D8D4CC' } },
  bridge_secondary_tertiary_casing: { paint: { 'line-color': '#DCD8D0' } },
  bridge_street_casing: { paint: { 'line-color': '#E2DED6' } },
  bridge_link_casing: { paint: { 'line-color': '#D8D4CC' } },
  bridge_service_track_casing: { paint: { 'line-color': '#E2DED6' } },
  bridge_motorway_link_casing: { paint: { 'line-color': '#D8D4CC' } },
  bridge_path_pedestrian_casing: { paint: { 'line-color': '#E2DED6' } },

  // ── Rail ─────────────────────────────────────────────────────
  road_major_rail: { paint: { 'line-color': '#C8C4BC' } },
  road_transit_rail: { paint: { 'line-color': '#C8C4BC' } },
  road_major_rail_hatching: { paint: { 'line-color': '#C8C4BC' } },
  road_transit_rail_hatching: { paint: { 'line-color': '#C8C4BC' } },
  tunnel_major_rail: { paint: { 'line-color': '#D0CCC4' } },
  tunnel_transit_rail: { paint: { 'line-color': '#D0CCC4' } },
  tunnel_major_rail_hatching: { paint: { 'line-color': '#D0CCC4' } },
  tunnel_transit_rail_hatching: { paint: { 'line-color': '#D0CCC4' } },
  bridge_major_rail: { paint: { 'line-color': '#C8C4BC' } },
  bridge_transit_rail: { paint: { 'line-color': '#C8C4BC' } },
  bridge_major_rail_hatching: { paint: { 'line-color': '#C8C4BC' } },
  bridge_transit_rail_hatching: { paint: { 'line-color': '#C8C4BC' } },

  // ── Aeroways ─────────────────────────────────────────────────
  aeroway_fill: { paint: { 'fill-color': 'rgba(228,224,218,0.4)' } },
  aeroway_runway: { paint: { 'line-color': '#E4E0D8' } },
  aeroway_taxiway: { paint: { 'line-color': '#E4E0D8' } },

  // ── Buildings (flat only, nearly invisible) ──────────────────
  building: { paint: { 'fill-color': '#EAE6DE' } },

  // ── Boundaries (Woodsmoke brown — brand colour) ──────────────
  boundary_2: { paint: { 'line-color': '#8B7355' } },
  boundary_3: { paint: { 'line-color': 'rgba(139,115,85,0.5)' } },
  boundary_disputed: { paint: { 'line-color': '#8B7355' } },

  // ── Country labels (prominent hierarchy) ─────────────────────
  label_country_1: {
    paint: { 'text-color': '#3A3A3A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  label_country_2: {
    paint: { 'text-color': '#3A3A3A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  label_country_3: {
    paint: { 'text-color': '#4A4A4A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },

  // ── City / state labels (hierarchy: dark → lighter) ──────────
  label_city_capital: {
    paint: { 'text-color': '#3A3A3A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  label_city: {
    paint: { 'text-color': '#4A4A4A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  label_state: {
    paint: { 'text-color': '#6A6A6A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  label_town: {
    paint: { 'text-color': '#5A5A5A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  label_village: {
    paint: { 'text-color': '#6A6A6A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  label_other: {
    paint: { 'text-color': '#7A7A7A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },

  // ── POI / road labels ────────────────────────────────────────
  poi_r1: {
    paint: { 'text-color': '#7A7A7A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  poi_r7: {
    paint: { 'text-color': '#7A7A7A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  poi_r20: {
    paint: { 'text-color': '#7A7A7A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  poi_transit: {
    paint: { 'text-color': '#5E8EA6', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  airport: {
    paint: { 'text-color': '#7A7A7A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  'highway-name-path': {
    paint: { 'text-color': '#8B7355', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  'highway-name-minor': {
    paint: { 'text-color': '#7A7A7A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
  'highway-name-major': {
    paint: { 'text-color': '#6A6A6A', 'text-halo-color': '#F8F6F1', 'text-halo-width': 1.5 },
  },
}
