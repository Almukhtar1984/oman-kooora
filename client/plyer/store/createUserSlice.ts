export const createUserSlice = (set: any, get: any) => ({
  token: undefined,
  isAuth: false,
  userData: {},
  // Set when the session is a member-portal sign-in (phone + civil ID)
  // instead of an email account. Holds the result of the portalMe query.
  portalData: null,
});