// The original DOE outline view contract, independent of commercial storage.
export type SessionOutlineRecord = {
  outlineId: string;
  sessionId?: string;
  title: string;
  page_count: number;
  revision: number;
  body: Array<{ id?: string; index: number; page: number; contents: string[] }>;
  cards?: Array<{ id: string; title: string; content: string; order: number }>;
  generationMode?: string;
};

export type WorkOutlineCard = {
  id: string;
  page: number;
  title: string;
  content: string;
  contents: string[];
};
export type WorkOutlineDragState = {
  id: string;
  pointerX: number;
  pointerY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  dropIndex: number;
};
export type WorkOutlineToolbarState = {
  slideCount: number;
  canUndo: boolean;
  canRedo: boolean;
  hasPendingChanges: boolean;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  errorMessage: string | null;
};
export type WorkOutlinePreviewHandle = {
  undo: () => void;
  redo: () => void;
  saveNow: () => Promise<SessionOutlineRecord | null>;
};
