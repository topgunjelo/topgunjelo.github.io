import { hostOf, screenshotUrl, type Project } from '../content/projects';

/** A quiet macOS-style window around a real project screenshot. */
export function ProjectWindow({ project, eager = false }: { project: Project; eager?: boolean }) {
  const shot = project.screenshot;
  if (!shot) return null;
  const address = hostOf(project.demo) ?? project.repository?.replace(/^https:\/\/(www\.)?/, '') ?? project.title;
  return (
    <figure className="window">
      <div className="window-bar" aria-hidden="true">
        <span className="window-lights">
          <i />
          <i />
          <i />
        </span>
        <span className="window-address">{address}</span>
      </div>
      <div className="window-view">
        <img
          src={screenshotUrl(shot.file)}
          alt={shot.alt}
          width={1200}
          height={750}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
      </div>
      <figcaption className="visually-hidden">{shot.caption}</figcaption>
    </figure>
  );
}
