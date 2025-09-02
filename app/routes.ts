import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
    index("routes/home.tsx"),
    route("signaltonoise/:username", "routes/signaltonoise.$username.tsx"),
] satisfies RouteConfig
