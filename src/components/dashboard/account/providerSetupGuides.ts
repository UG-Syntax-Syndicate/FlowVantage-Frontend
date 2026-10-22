/**
 * How an administrator obtains OAuth credentials for each provider.
 *
 * These live in the app rather than only in .env.example because the person
 * who hits "Unavailable on this server" is the person who needs them, and
 * sending them to find a file in a repository is how an integration stays
 * unconfigured forever.
 *
 * The redirect URI and the environment variable names are NOT listed here -
 * the server reports those (connection.setup), because the URI depends on
 * API_PUBLIC_URL and must match the vendor's console exactly. Anything
 * duplicated here could drift from what the server actually expects.
 */
export interface ProviderSetupGuide {
  /** Where the credentials come from, e.g. "Google Cloud Console". */
  console: string
  consoleUrl: string
  steps: string[]
  /** APIs or permissions that must be switched on separately. */
  enableFirst?: string
  note?: string
}

const GOOGLE_STEPS = (apiName: string, apiLabel: string): ProviderSetupGuide => ({
  console: 'Google Cloud Console',
  consoleUrl: 'https://console.cloud.google.com/apis/credentials',
  enableFirst: `${apiLabel} — enable it under APIs & Services → Library before creating the client, or authorisation fails at the consent screen.`,
  steps: [
    'Open the Google Cloud Console and pick (or create) a project.',
    `Go to APIs & Services → Library, search for ${apiLabel}, and enable it.`,
    'Go to APIs & Services → OAuth consent screen. Choose External, fill in the app name and support email, and add your own account under Test users while the app is unpublished.',
    `Add the scope ${apiName} on the Scopes step.`,
    'Go to APIs & Services → Credentials → Create credentials → OAuth client ID.',
    'Choose Web application as the application type.',
    'Under Authorised redirect URIs, add the URI shown below exactly — including the scheme and any port.',
    'Create it, then copy the Client ID and Client secret into the environment variables listed below and restart the API.',
  ],
  note: 'While the consent screen is unpublished, only accounts listed as Test users can connect. That is usually what you want during development.',
})

export const PROVIDER_SETUP_GUIDES: Record<string, ProviderSetupGuide> = {
  google_calendar: GOOGLE_STEPS('https://www.googleapis.com/auth/calendar.events', 'the Google Calendar API'),
  gmail: GOOGLE_STEPS('https://www.googleapis.com/auth/gmail.send', 'the Gmail API'),
  google_drive: GOOGLE_STEPS('https://www.googleapis.com/auth/drive.file', 'the Google Drive API'),
  outlook: {
    console: 'Azure Portal',
    consoleUrl: 'https://portal.azure.com',
    enableFirst: 'Microsoft Graph delegated permissions — Mail.Send, Mail.Read, User.Read and offline_access.',
    steps: [
      'Open the Azure Portal and go to Microsoft Entra ID → App registrations → New registration.',
      'Give it a name, and under Supported account types choose "Accounts in any organizational directory and personal Microsoft accounts" so both Microsoft 365 and Outlook.com can connect.',
      'Set the Redirect URI platform to Web and paste the URI shown below.',
      'Register it, then open API permissions → Add a permission → Microsoft Graph → Delegated permissions, and add Mail.Send, Mail.Read, User.Read and offline_access.',
      'Open Certificates & secrets → New client secret, and copy the secret Value (not the Secret ID) immediately — it is shown once.',
      'Copy the Application (client) ID and that secret into the environment variables listed below, then restart the API.',
    ],
    note: 'offline_access is what makes Microsoft issue a refresh token. Without it the connection stops working after about an hour.',
  },
  slack: {
    console: 'Slack API dashboard',
    consoleUrl: 'https://api.slack.com/apps',
    steps: [
      'Open api.slack.com/apps → Create New App → From scratch, and pick the workspace.',
      'Open OAuth & Permissions, and under Redirect URLs add the URI shown below.',
      'Under Scopes → Bot Token Scopes, add chat:write and channels:read.',
      'Install the app to the workspace when prompted.',
      'Copy the Client ID and Client Secret from Basic Information → App Credentials into the environment variables below, then restart the API.',
    ],
  },
  dropbox: {
    console: 'Dropbox App Console',
    consoleUrl: 'https://www.dropbox.com/developers/apps',
    steps: [
      'Open the Dropbox App Console → Create app.',
      'Choose Scoped access, then Full Dropbox or App folder depending on how much access you want to grant.',
      'On the Settings tab, add the URI shown below under OAuth 2 Redirect URIs.',
      'On the Permissions tab, tick files.content.read and files.content.write, then Submit.',
      'Copy the App key and App secret from Settings into the environment variables below, then restart the API.',
    ],
    note: 'Set the permissions before anyone connects — Dropbox does not add scopes to tokens that were issued earlier.',
  },
  zoom: {
    console: 'Zoom App Marketplace',
    consoleUrl: 'https://marketplace.zoom.us/develop/create',
    steps: [
      'Open the Zoom App Marketplace → Develop → Build App, and choose a General App.',
      'Under OAuth, set the Redirect URL for OAuth to the URI shown below, and add the same URI to the allow list.',
      'On the Scopes step, add meeting:write.',
      'Copy the Client ID and Client Secret into the environment variables below, then restart the API.',
    ],
    note: 'A General App stays in development mode until you publish it; while it is, only accounts you add as testers can connect.',
  },
}
