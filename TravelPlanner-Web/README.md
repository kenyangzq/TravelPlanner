# TravelPlanner Web App

A Progressive Web App (PWA) version of TravelPlanner - a trip itinerary planning application. Built with Next.js 14, React, TypeScript, and IndexedDB.

## Features

- ✅ **Trip Management**: Create, view, and delete trips with cities, dates, and destinations
- ✅ **Event Types**: Flights, Hotels, Restaurants, Activities, and Car Rentals
- ✅ **Location Search**: Nominatim API (OpenStreetMap) for finding places
- ✅ **Flight API**: AeroDataBox integration for real-time flight information
- ✅ **Navigation**: Google Maps integration for directions between events
- ✅ **Hotel Headers**: Day-level hotel banners with navigation
- ✅ **Back-to-Hotel**: Last event of each day includes navigation back to hotel
- ✅ **Two Views**: List view and Calendar view for your itinerary
- ✅ **PWA**: Works offline, installable on iPhone/Android
- ✅ **Dark Mode**: Supports system dark mode preference

## Tech Stack

- **Framework**: Next.js 14 (App Router) + React + TypeScript
- **Data**: IndexedDB via Dexie.js (browser-only, no server DB)
- **Flight API**: AeroDataBox via Next.js API route (hides RapidAPI key)
- **Maps**: Google Maps URL links
- **Location Search**: Nominatim API (OpenStreetMap, free, no API key)
- **PWA**: `@ducanh2912/next-pwa` for service worker + manifest
- **State**: Zustand for UI state + Dexie `useLiveQuery` for data
- **Icons**: lucide-react
- **Dates**: date-fns
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- RapidAPI key for AeroDataBox (optional - only needed for flight search)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   # Edit .env.local and add your RapidAPI key
   RAPIDAPI_KEY=your_key_here
   ```
   Get a free key at: https://rapidapi.com/aerodatabox-aerodatabox-default/api/aerodatabox

3. **Generate PWA icons** (optional):
   ```bash
   npm run generate-icons
   ```
   Or use online tools like https://realfavicongenerator.net/ and place icons in `public/icons/`

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
TravelPlanner-Web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout with PWA metadata
│   │   ├── page.tsx              # Trip list (home)
│   │   ├── manifest.ts           # PWA manifest
│   │   ├── trips/[tripId]/       # Trip detail / itinerary
│   │   └── api/flights/route.ts  # AeroDataBox proxy
│   ├── components/
│   │   ├── trips/                # Trip list, new trip dialog
│   │   ├── itinerary/            # List view, calendar view, event rows
│   │   ├── forms/                # Add/edit event forms
│   │   └── ui/                   # Reusable UI components
│   ├── lib/
│   │   ├── db.ts                 # Dexie database schema
│   │   ├── models.ts             # TypeScript interfaces
│   │   ├── store.ts              # Zustand store (UI state)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # API clients (maps, flight, location)
│   │   └── utils/                # Helper functions
│   └── app/globals.css           # Tailwind + custom styles
├── public/
│   ├── icons/                    # PWA icons
│   └── icon.svg                  # Source SVG icon
└── package.json
```

## Key Differences from iOS App

| iOS | Web |
|-----|-----|
| SwiftData with class inheritance | Dexie.js (IndexedDB) with discriminated unions |
| `@Observable` ViewModels | React hooks + Zustand for UI state |
| MKLocalSearch (MapKit) | Nominatim (OpenStreetMap) |
| Apple Maps URLs | Google Maps URLs |
| `MinuteIntervalDatePicker` (UIKit) | Native `<input type="time" step="900">` |
| SF Symbols | lucide-react icons |
| SwiftUI NavigationStack | Next.js App Router |

## Usage

1. **Create a Trip**: Click "New Trip", enter name, destination, cities, and date range
2. **Add Events**: Click "Add Event" and select event type (Flight, Hotel, Restaurant, Activity, Car Rental)
3. **Search Flights**: Enter flight number and date to fetch real-time data
4. **Find Locations**: Use "Find Location" button in event forms to search for places
5. **Navigate**: Click map pin icons to open Google Maps for directions
6. **Switch Views**: Toggle between list and calendar views

## PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open the app in Chrome
2. Tap menu (three dots)
3. Tap "Add to Home Screen" or "Install App"

## API Keys

### AeroDataBox (Flight Search)

1. Go to [RapidAPI](https://rapidapi.com/aerodatabox-aerodatabox-default/api/aerodatabox)
2. Sign up for a free account
3. Get your API key
4. Add to `.env.local`:
   ```
   RAPIDAPI_KEY=your_key_here
   ```

Free tier: ~300 calls/month

### Nominatim (Location Search)

No API key required! Uses OpenStreetMap's free Nominatim API.

**Note**: Nominatim requires proper usage:
- Rate limited: 1 request per second (implemented)
- User-Agent header set to "TravelPlanner-Web"
- Display OSM attribution in UI

## Browser Support

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+

For IndexedDB support:
- iOS Safari 14+
- Chrome for iOS 90+
- Samsung Internet 14+

## Troubleshooting

### Flight Search Not Working
- Check your RapidAPI key in `.env.local`
- Restart dev server after changing env vars
- Check browser console for API errors

### Location Search Not Working
- Nominatim has rate limits (1 request/sec)
- Wait 1 second between searches
- Check network connection

### PWA Not Installing
- Ensure icons exist in `public/icons/`
- Check manifest is loading in DevTools
- For iOS, make sure you're using Safari
- For Android, use Chrome

## License

MIT

## Credits

- Flight data powered by [AeroDataBox](https://aerodatabox.com/)
- Location search powered by [Nominatim](https://nominatim.org/) (OpenStreetMap)
- Icons by [lucide-react](https://lucide.dev/)
