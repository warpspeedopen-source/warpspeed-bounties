import { useReducer, useCallback } from 'react';

const initialState = {
  history: [],
  future: [],
  edits: [],
  annotations: [],
  activeTool: null
};

function reducer(state, action) {
  switch (action.type) {
    case 'CROP':
    case 'ROTATE':
    case 'ADJUST':
      return { ...state, history: [...state.history, action], future: [], edits: [...state.edits, action] };
    case 'ANNOTATION':
      return { ...state, history: [...state.history, action], future: [], annotations: [...state.annotations, action.payload] };
    case 'UNDO':
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return { ...state, future: [prev, ...state.future], history: state.history.slice(0, -1) };
    case 'REDO':
      if (state.future.length === 0) return state;
      return { ...state, history: [...state.history, state.future[0]], future: state.future.slice(1) };
    default:
      return state;
  }
}

export const useImageEditor = (initialUri) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const applyEdit = useCallback((action) => dispatch(action), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  return { state, applyEdit, undo, redo };
};