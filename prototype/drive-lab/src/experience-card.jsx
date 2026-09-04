import { curatedExperience } from "./curated-experiences.js";

export function ExperienceCard({ selected = false, onSelect, launch = false }) {
  const experience = curatedExperience("night-glass");
  return (
    <button
      className={`experience-card${selected ? " is-selected" : ""}`}
      type="button"
      aria-pressed={selected}
      aria-label={`${launch ? "Choose" : "Play"} ${experience.title}. ${experience.detail}. Dark appearance.`}
      onClick={() => onSelect(experience.id)}
    >
      <img src={experience.image} alt="" width="160" height="100" />
      <span className="experience-card-copy">
        <small>CURATED EXPERIENCE</small>
        <strong>{experience.title}</strong>
        <span className="experience-card-description">{experience.description}</span>
        <span className="experience-card-detail">{experience.detail}</span>
      </span>
      <span className="experience-card-action">
        <span className="media-glyph is-play" aria-hidden="true" />
        <span>{selected ? "Selected" : launch ? "Choose" : "Play"}</span>
      </span>
    </button>
  );
}
