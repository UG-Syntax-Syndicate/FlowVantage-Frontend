export type AuditAction =
  | 'account_created'
  | 'login'
  | 'logout'
  | 'password_changed'
  | 'email_change_requested'
  | 'profile_updated'
  | 'notification_preferences_updated'
  | 'data_exported'
  | 'account_deletion_initiated'
  | 'account_deleted'
  // Record-change trail (PRD §8 Auditability). `resourceType` / `resourceId`
  // live in the event metadata.
  | 'record_created'
  | 'record_updated'
  | 'record_deleted'

export type RecordChangeAction = 'create' | 'update' | 'delete'
