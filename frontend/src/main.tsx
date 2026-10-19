import React, { Component, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import { appI18n } from './i18n/i18n';
import { App } from './App';
import './styles/global.css';

class ApplicationBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="application-failure"><h1>Yrkie</h1><p>页面加载遇到问题。已保存的本地文稿仍会保留，请刷新后重试。</p><button onClick={() => window.location.reload()}>重新加载</button></main>;
    return this.props.children;
  }
}
// Keep one root when a shared locale or other non-component module triggers HMR.
const root: Root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<React.StrictMode><ApplicationBoundary><I18nextProvider i18n={appI18n}><App /></I18nextProvider></ApplicationBoundary></React.StrictMode>);
