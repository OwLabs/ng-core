export const TOPICS = {
  AUTH: 'auth',
  USERS: 'users',
  MATERIAL: 'material',
} as const;

export const ACTIONS = {
  REGISTER: 'register',
  LOGIN: 'login',
  PROFILE: 'profile',
  REFRESH: 'refresh',
  LOGOUT: 'logout',
  LOGOUT_ALL_DEVICES: 'logout-all-devices',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  MY_MATERIALS: 'my-materials',
} as const;
