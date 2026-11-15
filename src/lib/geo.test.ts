import { describe, expect, it } from "vitest";
import { ZONES, ZONE_RADIUS_M, deliveryFeeCents, formatDistance, formatTravel, haversineM, nearestZone, storeLocation, zoneByName } from "./geo";

describe("haversineM", () => {
  it("es cero entre el mismo punto y simétrica", () => {
    const a = { lat: 10.5, lng: -66.85 };
    const b = { lat: 10.49, lng: -66.88 };
    expect(haversineM(a, a)).toBe(0);
    expect(haversineM(a, b)).toBeCloseTo(haversineM(b, a), 6);
  });
  it("un grado de latitud son unos 111 km", () => {
    expect(haversineM({ lat: 10, lng: -66 }, { lat: 11, lng: -66 })).toBeGreaterThan(110_000);
    expect(haversineM({ lat: 10, lng: -66 }, { lat: 11, lng: -66 })).toBeLessThan(112_000);
  });
});
describe("zonas", () => {
  it("los slugs son únicos y las zonas están en Caracas", () => {
    expect(new Set(ZONES.map((z) => z.slug)).size).toBe(ZONES.length);
    for (const z of ZONES) {
      expect(z.lat).toBeGreaterThan(10.4);
      expect(z.lat).toBeLessThan(10.56);
      expect(z.lng).toBeGreaterThan(-67.0);
      expect(z.lng).toBeLessThan(-66.8);
    }
  });
  it("se encuentran por nombre sin importar tildes ni mayúsculas", () => {
    expect(zoneByName("Chacaíto")?.slug).toBe("chacaito");
    expect(zoneByName("LOS PRÓCERES")?.slug).toBe("los-proceres");
    expect(zoneByName("Narnia")).toBeUndefined();
  });
});
describe("nearestZone", () => {
  it("asigna el pin a la zona más cercana", () => {
    expect(nearestZone({ lat: 10.5045, lng: -66.848 })?.zone.slug).toBe("altamira");
    expect(nearestZone({ lat: 10.4318, lng: -66.9741 })?.zone.slug).toBe("caricuao");
  });
  it("fuera del radio de toda zona, no hay cobertura", () => {
    expect(nearestZone({ lat: 10.6, lng: -66.7 })).toBeNull();
    expect(nearestZone({ lat: 40.4, lng: -3.7 })).toBeNull();
  });
  it("rechaza coordenadas inválidas", () => {
    expect(nearestZone({ lat: NaN, lng: 0 })).toBeNull();
    expect(nearestZone({ lat: 200, lng: -66.85 })).toBeNull();
  });
  it("el radio de la zona se respeta", () => {
    const z = ZONES.find((x) => x.slug === "caricuao")!; // aislada: sin otra zona cerca
    const north = { lat: z.lat + (ZONE_RADIUS_M - 100) / 111_000, lng: z.lng };
    const far = { lat: z.lat + (ZONE_RADIUS_M + 600) / 111_000, lng: z.lng };
    expect(nearestZone(north)?.zone.slug).toBe(z.slug);
    expect(nearestZone(far)).toBeNull();
  });
});
describe("storeLocation", () => {
  it("es estable y queda cerca del centro de su zona", () => {
    const a = storeLocation("arepera-dona-chela", "Chacao");
    expect(storeLocation("arepera-dona-chela", "Chacao")).toEqual(a);
    const chacao = ZONES.find((z) => z.slug === "chacao")!;
    expect(haversineM(a, chacao)).toBeLessThan(700);
  });
  it("tiendas distintas de la misma zona no caen en el mismo punto", () => {
    expect(storeLocation("a", "Chacao")).not.toEqual(storeLocation("b", "Chacao"));
  });
  it("sin zona conocida usa la primera", () => {
    expect(haversineM(storeLocation("x", "Narnia"), ZONES[0])).toBeLessThan(700);
  });
});
describe("deliveryFeeCents", () => {
  it("dentro de los primeros 2 km cobra la tarifa base", () => {
    expect(deliveryFeeCents(120, 500)).toBe(120);
    expect(deliveryFeeCents(120, 2000)).toBe(120);
  });
  it("cada kilómetro de más suma 30 centavos, redondeado a 5", () => {
    expect(deliveryFeeCents(120, 3000)).toBe(150);
    expect(deliveryFeeCents(120, 5000)).toBe(210);
    expect(deliveryFeeCents(100, 3300)).toBe(140);
  });
  it("crece con la distancia", () => {
    expect(deliveryFeeCents(120, 7000)).toBeGreaterThan(deliveryFeeCents(120, 4000));
  });
});
describe("formato", () => {
  it("distancia y tiempo legibles", () => {
    expect(formatDistance(850)).toBe("850 m");
    expect(formatDistance(2340)).toBe("2,3 km");
    expect(formatTravel(719)).toBe("12 min");
    expect(formatTravel(5)).toBe("1 min");
  });
});
