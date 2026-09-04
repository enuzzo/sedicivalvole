import icon0 from "../public/third-party/tabler-icons/sun.svg?raw";
import icon1 from "../public/third-party/tabler-icons/moon.svg?raw";
import icon2 from "../public/third-party/tabler-icons/sun-moon.svg?raw";
import icon3 from "../public/third-party/tabler-icons/navigation.svg?raw";
import icon4 from "../public/third-party/tabler-icons/map-search.svg?raw";
import icon5 from "../public/third-party/tabler-icons/report-analytics.svg?raw";
const icons = {
  "sun": icon0,
  "moon": icon1,
  "sun-moon": icon2,
  "navigation": icon3,
  "map-search": icon4,
  "report-analytics": icon5
};
export function RailIcon({ name }) {
  return <span className="rail-icon" data-icon={name} aria-hidden="true" dangerouslySetInnerHTML={{ __html: icons[name] }} />;
}
