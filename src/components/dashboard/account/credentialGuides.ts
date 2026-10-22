/**
 * Step-by-step directions for finding each credential-based vendor's keys.
 *
 * Written from the vendors' own support documentation, because "paste your API
 * key" is useless to someone who has never opened that screen - and these two
 * are the integrations most likely to be set up by whoever runs the business
 * rather than whoever runs the servers.
 *
 * `roleNote` matters: in both products these screens are role-gated, and
 * someone without the right role will not find the menu at all, which looks
 * like the instructions being wrong.
 */
export interface CredentialGuide {
  /** Where the steps happen, e.g. "In Yuki". */
  where: string
  steps: string[]
  roleNote?: string
  /** Anything that will bite them after they paste it. */
  warning?: string
  docsUrl: string
  docsLabel: string
}

export const CREDENTIAL_GUIDES: Record<string, CredentialGuide> = {
  yuki: {
    where: 'In Yuki',
    steps: [
      'Click the Settings (gear) icon in the navigation bar.',
      'Under Integrations, click Web services.',
      'Create a key at administration level — that is the usual choice, and it limits the key to one administration.',
      'Give it access to All web services, then click Save.',
      'Copy the API key it shows you, and the Administration ID listed on the same screen.',
    ],
    roleNote: 'You need the Portal administrator or Management role in Yuki to see this screen.',
    warning: 'Yuki shows the key once, when you create it. Copy it before closing that screen — if you lose it, create a new key.',
    docsUrl: 'https://support.yuki.nl/en/support/solutions/articles/80000786451-where-can-i-find-the-api-key-and-administration-id-in-yuki-',
    docsLabel: "Yuki's own instructions",
  },
  perfectview: {
    where: 'In PerfectView CRM Online',
    steps: [
      'Click the Settings (gear) icon on the right.',
      'Open Connections (Koppelingen).',
      'Under Console, click the API tile.',
      'Switch the API on — the credentials appear once it is active.',
      'Copy the API key, the Database ID and the User ID shown there.',
    ],
    warning: 'The User ID decides whose permissions the sync runs with, so pick an account that can see the contacts you want synced.',
    docsUrl: 'https://kennisbank.perfectviewcrm.nl/knowledge-base/koppelingen/',
    docsLabel: "PerfectView's knowledge base",
  },
}
