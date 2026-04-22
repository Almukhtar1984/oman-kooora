import { createUserSlice } from "./createUserSlice";

import { devtools } from "zustand/middleware";
import { create } from 'zustand';

const useStore = create(
  devtools((set: any, get: any) => ({
    ...createUserSlice(set, get),
  }))
);

export default useStore;
