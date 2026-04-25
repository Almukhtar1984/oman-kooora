import { createUserSlice } from "./createUserSlice";

import { create } from 'zustand';
import { devtools } from "zustand/middleware";

const useStore = create(
  devtools((set: any, get: any) => ({
    ...createUserSlice(set, get),
  }))
);

export default useStore;
