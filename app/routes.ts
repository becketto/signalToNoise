import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
    index("routes/home.tsx"),
    route("signaltonoise/:username", "routes/signaltonoise.$username.tsx"),
    route("leaderboard", "routes/leaderboard.tsx"),
    route("calc-logic", "routes/calcLogic.tsx"),
] satisfies RouteConfig
