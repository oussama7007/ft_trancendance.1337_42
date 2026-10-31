// The page at /roommates: shows the rooms that match the city and budget in the address,
// for example /roommates?city=rabat&maxBudget=2000
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Users } from 'lucide-react';
import { fetchRoommates } from '../api/roommates';
import type { Roommate } from '../types/roommate';

export const RoommatesPage = () => {
  // useSearchParams() reads the part of the address after the ?.
  // It hands back two things in a list; the brackets take only the first one
  // (the reader) and ignore the second (a function to change the address).
  const [searchParams] = useSearchParams();

  // Take each value out of the address. Everything in an address is text,
  // so the budget is turned into a number. No budget in the address means undefined: no limit.
  const city = searchParams.get('city') ?? '';
  const budgetText = searchParams.get('maxBudget');
  const maxBudget = budgetText ? Number(budgetText) : undefined;

  // The page's memory. Each useState gives the current value and the only function that changes it.
  // Every change makes React draw the page again with the new value.
  const [rooms, setRooms] = useState<Roommate[]>([]); // the rooms to show, empty at first
  const [isLoading, setIsLoading] = useState(true);   // true while waiting for the backend
  const [hasError, setHasError] = useState(false);    // true if the request failed

  // Runs after the page appears, and again whenever the city or the budget changes.
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    fetchRoommates({ city, maxBudget })
      .then(setRooms) // the answer arrived: put the rooms in memory
      .catch((error) => {
        console.error(error); // technical detail for developers, in the browser console only
        setHasError(true);    // the user only sees a simple message below
      })
      .finally(() => setIsLoading(false)); // success or error: stop showing "Loading..."
  }, [city, maxBudget]);

  // What appears on screen.
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Title, for example "Rooms in rabat up to 2000 DH". Each part appears only if it was searched. */}
      <h1 className="text-2xl font-black text-gray-900 mb-6">
        Rooms {city && `in ${city}`} {maxBudget !== undefined && `up to ${maxBudget} DH`}
      </h1>

      {/* condition && <tag>: show the tag only when the condition is true */}
      {isLoading && <p className="text-gray-500">Loading...</p>}
      {hasError && <p className="text-red-600">We couldn't load the rooms. Please try again.</p>}
      {!isLoading && !hasError && rooms.length === 0 && (
        <p className="text-gray-500">No rooms match this search.</p>
      )}

      {/* One card for each room. key tells React which card is which when the list changes. */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <article key={room.id} className="bg-white rounded-3xl shadow-md border border-gray-100 p-5">
            {/* District and price on the same row */}
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-black text-gray-900 capitalize">{room.district}</h2>
              <span className="font-black text-(--color-accent)">{room.price} DH</span>
            </div>
            {/* City with a map pin icon */}
            <p className="text-xs text-gray-500 font-bold flex items-center gap-1 mb-3 capitalize">
              <MapPin className="w-3 h-3 text-red-500" />
              {room.city}
            </p>
            {/* The people already living there, joined into one line: "Mehdi, Hamza" */}
            <p className="text-xs text-gray-700 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {room.roommates.join(', ')}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
};
