import createAppSlice from "./createAppSlice";
import { createUserSlice } from "./createUserSlice";

import { devtools } from "zustand/middleware";
import { create } from 'zustand';

const useStore = create(
  devtools((set, get) => ({
    ...createAppSlice(set, get),
    ...createUserSlice(set, get),
    // ...createNotificationSlice(set, get),
  }))
);

export default useStore;
