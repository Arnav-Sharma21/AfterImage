import { create } from 'zustand';

// The draft lives in its editor. Only navigation guards need shared status.
export const useEditorStore = create(() => ({ dirty: false, saving: false }));
