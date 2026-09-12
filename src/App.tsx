import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LeagueProvider } from "./data/useLeague";
import { Leaderboard } from "./pages/Leaderboard";
import { BestOf } from "./pages/BestOf";
import { Matchups } from "./pages/Matchups";
import { Legends } from "./pages/Legends";
import { Player } from "./pages/Player";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      children: [
        { index: true, element: <Leaderboard /> },
        { path: "best-of", element: <BestOf /> },
        { path: "matchups", element: <Matchups /> },
        { path: "legends", element: <Legends /> },
        { path: "players/:player", element: <Player /> },
        { path: "*", element: <Leaderboard /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" }
);

export default function App() {
  return (
    <LeagueProvider>
      <RouterProvider router={router} />
    </LeagueProvider>
  );
}
