// Places for the "Random spot" button: [name, lat, lng]. Real towns, cities and remote spots spread across every
// continent, so a random pick always lands on land (random coordinates would mostly be ocean).
export const PLACES = [
  // Europe
  ['Reykjavik, Iceland', 64.15, -21.94], ['Tromsø, Norway', 69.65, 18.96], ['Edinburgh, Scotland', 55.95, -3.19],
  ['Galway, Ireland', 53.27, -9.05], ['Lisbon, Portugal', 38.72, -9.14], ['Seville, Spain', 37.39, -5.99],
  ['Marseille, France', 43.3, 5.37], ['Bruges, Belgium', 51.21, 3.22], ['Rotterdam, Netherlands', 51.92, 4.48],
  ['Prague, Czechia', 50.08, 14.44], ['Kraków, Poland', 50.06, 19.94], ['Vienna, Austria', 48.21, 16.37],
  ['Florence, Italy', 43.77, 11.26], ['Dubrovnik, Croatia', 42.65, 18.09], ['Athens, Greece', 37.98, 23.73],
  ['Tbilisi, Georgia', 41.72, 44.79], ['Riga, Latvia', 56.95, 24.11], ['Helsinki, Finland', 60.17, 24.94],
  ['Kyiv, Ukraine', 50.45, 30.52], ['Istanbul, Türkiye', 41.01, 28.98],
  // Africa
  ['Marrakesh, Morocco', 31.63, -7.99], ['Dakar, Senegal', 14.72, -17.47], ['Timbuktu, Mali', 16.77, -3.01],
  ['Accra, Ghana', 5.6, -0.19], ['Lagos, Nigeria', 6.52, 3.38], ['Addis Ababa, Ethiopia', 9.03, 38.74],
  ['Zanzibar, Tanzania', -6.16, 39.2], ['Kampala, Uganda', 0.35, 32.58], ['Windhoek, Namibia', -22.56, 17.08],
  ['Cape Town, South Africa', -33.92, 18.42], ['Antananarivo, Madagascar', -18.88, 47.51], ['Luxor, Egypt', 25.69, 32.64],
  // Middle East and Central Asia
  ['Petra, Jordan', 30.33, 35.44], ['Muscat, Oman', 23.59, 58.41], ['Tehran, Iran', 35.69, 51.39],
  ['Samarkand, Uzbekistan', 39.65, 66.96], ['Almaty, Kazakhstan', 43.24, 76.89],
  // South Asia
  ['Jaipur, India', 26.91, 75.79], ['Varanasi, India', 25.32, 82.97], ['Kochi, India', 9.93, 76.27],
  ['Kathmandu, Nepal', 27.72, 85.32], ['Colombo, Sri Lanka', 6.93, 79.85], ['Thimphu, Bhutan', 27.47, 89.64],
  ['Dhaka, Bangladesh', 23.81, 90.41],
  // East and Southeast Asia
  ['Ulaanbaatar, Mongolia', 47.89, 106.91], ['Lhasa, Tibet', 29.65, 91.13], ['Chengdu, China', 30.57, 104.07],
  ['Kyoto, Japan', 35.01, 135.77], ['Sapporo, Japan', 43.06, 141.35], ['Busan, South Korea', 35.18, 129.08],
  ['Taipei, Taiwan', 25.03, 121.57], ['Hanoi, Vietnam', 21.03, 105.85], ['Luang Prabang, Laos', 19.89, 102.13],
  ['Siem Reap, Cambodia', 13.36, 103.86], ['Chiang Mai, Thailand', 18.79, 98.98], ['Yangon, Myanmar', 16.87, 96.2],
  ['Singapore', 1.35, 103.82], ['Cebu City, Philippines', 10.32, 123.89], ['Davao, Philippines', 7.19, 125.46],
  ['Yogyakarta, Indonesia', -7.8, 110.36], ['Kuching, Malaysia', 1.55, 110.35],
  // Oceania
  ['Sydney, Australia', -33.87, 151.21], ['Perth, Australia', -31.95, 115.86], ['Alice Springs, Australia', -23.7, 133.88],
  ['Queenstown, New Zealand', -45.03, 168.66], ['Auckland, New Zealand', -36.85, 174.76], ['Suva, Fiji', -18.14, 178.44],
  ['Port Moresby, Papua New Guinea', -9.44, 147.18], ['Honolulu, Hawaii', 21.31, -157.86],
  // North America
  ['Anchorage, Alaska', 61.22, -149.9], ['Vancouver, Canada', 49.28, -123.12], ['Banff, Canada', 51.18, -115.57],
  ['Churchill, Canada', 58.77, -94.17], ['Halifax, Canada', 44.65, -63.58], ['Nuuk, Greenland', 64.18, -51.72],
  ['Seattle, USA', 47.61, -122.33], ['Austin, USA', 30.27, -97.74], ['New Orleans, USA', 29.95, -90.07],
  ['Chicago, USA', 41.88, -87.63], ['Boston, USA', 42.36, -71.06], ['Santa Fe, USA', 35.69, -105.94],
  ['Mexico City, Mexico', 19.43, -99.13], ['Oaxaca, Mexico', 17.07, -96.73], ['Havana, Cuba', 23.11, -82.37],
  ['San José, Costa Rica', 9.93, -84.08], ['Panama City, Panama', 8.98, -79.52],
  // South America
  ['Bogotá, Colombia', 4.71, -74.07], ['Quito, Ecuador', -0.18, -78.47], ['Cusco, Peru', -13.53, -71.97],
  ['Lima, Peru', -12.05, -77.04], ['La Paz, Bolivia', -16.49, -68.12], ['Manaus, Brazil', -3.12, -60.02],
  ['Salvador, Brazil', -12.97, -38.51], ['Rio de Janeiro, Brazil', -22.91, -43.17], ['Santiago, Chile', -33.45, -70.67],
  ['Buenos Aires, Argentina', -34.6, -58.38], ['Ushuaia, Argentina', -54.8, -68.3], ['Montevideo, Uruguay', -34.9, -56.16],
  // Far north and south
  ['Longyearbyen, Svalbard', 78.22, 15.63], ['Yakutsk, Russia', 62.04, 129.74], ['Murmansk, Russia', 68.97, 33.07],
  ['McMurdo Station, Antarctica', -77.85, 166.67],
];

// Pick a random place, never the same one twice in a row. Returns { name, lat, lng } with a small random offset
// (about ±8 km) so letters sent to the same place don't stack on exactly the same pixel.
let last = -1;
export function randomPlace() {
  let i;
  do { i = Math.floor(Math.random() * PLACES.length); } while (i === last && PLACES.length > 1);
  last = i;
  const [name, lat, lng] = PLACES[i];
  const jitter = () => (Math.random() - 0.5) * 0.16;
  return { name, lat: Math.max(-85, Math.min(85, lat + jitter())), lng: lng + jitter() };
}
