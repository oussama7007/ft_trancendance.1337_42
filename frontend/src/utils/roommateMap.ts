import type { MapCameraProps, MapMarker } from '../Components/home/PropertyMap';
import type { Roommate } from '../types/roommate';

export function roomsToMarkers(rooms: Roommate[]): MapMarker[] {
  return rooms.map((room) => ({
    id: `roommate-${room.id}`,
    city: room.listing.city,
    lat: room.listing.lat,
    lng: room.listing.lng,
    title: room.listing.title,
    price: room.monthlyShare,
    category: 'roommate',
    type: room.listing.type,
    description: room.listing.description,
    image: room.listing.imageUrl,
  }));
}

export function cameraForRooms(rooms: Roommate[]): MapCameraProps {
  const totalLat = rooms.reduce((sum, room) => sum + room.listing.lat, 0);
  const totalLng = rooms.reduce((sum, room) => sum + room.listing.lng, 0);

  return {
    center: { lat: totalLat / rooms.length, lng: totalLng / rooms.length },
    zoom: rooms.length === 1 ? 15 : 12.5,
    tilt: 45,
    heading: 0,
  };
}
