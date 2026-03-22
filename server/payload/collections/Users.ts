import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'payload-users',
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      options: ['admin', 'editor'],
      defaultValue: 'editor',
    },
  ],
}
