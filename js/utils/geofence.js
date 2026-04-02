export function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function isGeofenceReady(settings) {
  return (
    settings &&
    typeof settings.officeLatitude === "number" &&
    typeof settings.officeLongitude === "number" &&
    typeof settings.clockInRadiusMeters === "number"
  );
}

export function evaluateGeofence(userPosition, settings) {
  if (!isGeofenceReady(settings)) {
    return {
      allowed: true,
      distanceMeters: null,
      insideFence: null,
      reason: "geofence_not_configured",
    };
  }

  const distanceMeters = getDistanceMeters(
    userPosition.latitude,
    userPosition.longitude,
    settings.officeLatitude,
    settings.officeLongitude
  );

  const insideFence = distanceMeters <= settings.clockInRadiusMeters;

  return {
    allowed: insideFence,
    distanceMeters,
    insideFence,
    reason: insideFence ? "inside_fence" : "outside_fence",
  };
}

export function getCurrentPositionAsync(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("瀏覽器不支援定位功能"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        ...options,
      }
    );
  });
}