import { beforeEach } from 'vitest'
import { installNitroGlobals, resetNitroGlobals } from '../helpers/nitro'

installNitroGlobals()

beforeEach(() => {
  resetNitroGlobals()
})
