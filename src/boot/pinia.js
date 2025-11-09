import { boot } from 'quasar/wrappers';
import piniaPluginPersistedState from 'pinia-plugin-persistedstate';

// This boot file registers the Pinia persistence plugin
export default boot(({ store }) => {
  store.use(piniaPluginPersistedState);
});
