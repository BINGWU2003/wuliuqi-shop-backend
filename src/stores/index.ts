import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import useUserStore from './modules/user'
import useCounterStore from './modules/counter'
import useRouteCacheStore from './modules/routeCache'
import useEmailSelectStore from './modules/emailSelect'
import useAccountOperationStore from './modules/accountOperation'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export { useUserStore, useCounterStore, useRouteCacheStore, useEmailSelectStore, useAccountOperationStore }
export default pinia
