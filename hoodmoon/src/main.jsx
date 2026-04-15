import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import store from "./store";
import { ScrollToTop } from "./hooks/scrollToTop";
import { SkeletonTheme } from "react-loading-skeleton";
import { Provider } from "react-redux";
import "react-loading-skeleton/dist/skeleton.css";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <SkeletonTheme baseColor="#09030b" highlightColor="#1f0c26">
      <BrowserRouter>
        <ScrollToTop />
        <App />
      </BrowserRouter>
    </SkeletonTheme>
  </Provider>,
);
