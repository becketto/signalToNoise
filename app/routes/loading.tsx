import LoadingScreen from "../components/LoadingScreen"

export function meta() {
    return [
        { title: "Loading Preview - Signal to Noise" },
        { name: "description", content: "Preview of the loading screen animation" },
    ]
}

export default function Loading() {
    return <LoadingScreen />
}
