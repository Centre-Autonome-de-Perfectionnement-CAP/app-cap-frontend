import { createStore } from 'redux';

interface AppState {
  sidebarShow: boolean;
  theme: string;
}

interface Action {
  type: string;
  [key: string]: any;
}

const initialState: AppState = {
  sidebarShow: true,
  theme: 'light',
};

const changeState = (state: AppState = initialState, { type, ...rest }: Action): AppState => {
  switch (type) {
    case 'set':
      return { ...state, ...rest };
    default:
      return state;
  }
};

const store = createStore(changeState);

export default store;
