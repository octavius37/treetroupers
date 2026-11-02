import { beforeEach } from 'vitest'
import * as email from '../../server/utils/email'
import * as feed from '../../server/utils/feed'
import * as images from '../../server/utils/images'
import * as photos from '../../server/utils/photos'
import * as rank from '../../server/utils/rank'
import * as slugify from '../../server/utils/slugify'
import * as viewer from '../../server/utils/viewer'
import * as co2 from '../../shared/utils/co2'
import { installNitroGlobals, resetNitroGlobals } from '../helpers/nitro'

installNitroGlobals()

// Nitro auto-imports server/utils into every handler. These are pure helpers
// with their own tests, so install the real ones. (sendEmail does nothing
// without RESEND_API_KEY, which tests never set.) Utilities that touch auth or
// the database, such as requireAdmin and authUserId, are stubbed per test.
// requireViewer is real too: it goes through the stubbed authUserId and the
// mocked client, so tests drive it the same way.
Object.assign(globalThis, co2, email, feed, images, photos, rank, slugify, viewer)

beforeEach(() => {
  resetNitroGlobals()
})
