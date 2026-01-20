import { MapCanvas } from "./components/map-canvas"

export default function Home() {
  return (
    <main className="h-screen w-screen bg-background">
      <MapCanvas className="h-full w-full" />
    </main>
  )
}
