import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import RouteAccessibility from "./components/RouteAccessibility";
import ScrollCoordinator from "./components/ScrollCoordinator";
import { caseStudyProjects } from "./data/portfolio";
import CaseStudyPage from "./pages/CaseStudyPage";
import Home from "./pages/Home";

function Site() {
  const location = useLocation();

  return (
    <div className="site-shell">
      <RouteAccessibility />
      <ScrollCoordinator />
      <Header />

      <main id="main-content" tabIndex="-1">
        <Routes>
          <Route path="/" element={<Home key={location.key} />} />
          {caseStudyProjects.map((project) => (
            <Route
              key={project.id}
              path={project.destination.to}
              element={<CaseStudyPage project={project} />}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Site />
    </BrowserRouter>
  );
}
