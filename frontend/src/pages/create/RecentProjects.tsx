import { ChevronRight, Presentation } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface RecentProject {
  id: string;
  title: string;
  updatedAt: string;
}

export interface RecentProjectsProps {
  loadRecentProjects: () => Promise<RecentProject[]>;
  onOpenProject: (id: string) => void;
}

export function RecentProjects({ loadRecentProjects, onOpenProject }: RecentProjectsProps) {
  const { t, i18n } = useTranslation('openSourceCreate');
  const headingId = useId();
  const [projects, setProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    let active = true;
    let version = 0;
    const refresh = async () => {
      const currentVersion = ++version;
      setLoading(true);
      setFailed(false);
      try {
        const records = await loadRecentProjects();
        if (active && version === currentVersion) {
          setProjects([...records].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));
        }
      } catch {
        if (active && version === currentVersion) setFailed(true);
      } finally {
        if (active && version === currentVersion) setLoading(false);
      }
    };
    void refresh();
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, [attempt, loadRecentProjects]);

  if (!loading && !failed && projects.length === 0) return null;
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' });

  return <section className="dashboard-recent-projects" aria-labelledby={headingId} aria-busy={loading}>
    <h2 id={headingId}>{t('recentTitle')}</h2>
    <div className="dashboard-prompt-example-panel">
      {loading && projects.length === 0 ? <p className="dashboard-recent-status" role="status">{t('recentLoading')}</p> : null}
      {failed ? <div className="dashboard-recent-status" role="alert"><span>{t('recentFailed')}</span><button className="dashboard-recent-more" type="button" onClick={() => setAttempt(value => value + 1)}>{t('retry')}</button></div> : null}
      <div className="dashboard-prompt-example-list">
        {projects.slice(0, visibleCount).map(project => <button type="button" key={project.id} onClick={() => onOpenProject(project.id)}>
          <Presentation aria-hidden="true" />
          <span className="dashboard-recent-copy"><strong>{project.title || t('untitled')}</strong><time dateTime={project.updatedAt}>{dateFormat.format(new Date(project.updatedAt))}</time></span>
          <ChevronRight className="dashboard-prompt-example-arrow" aria-hidden="true" />
        </button>)}
      </div>
      {projects.length > visibleCount ? <button className="dashboard-recent-more" type="button" onClick={() => setVisibleCount(value => value + 6)}>{t('showMore')}</button> : null}
    </div>
  </section>;
}
