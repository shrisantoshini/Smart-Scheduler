export default function NotifStatusBadge({ status }) {
  const map = {
    delivered: { label: 'Delivered', cls: 'badge-sent' },
    failed: { label: 'Failed', cls: 'badge-failed' },
    pending: { label: 'Pending', cls: 'badge-pending' },
    sent: { label: 'Sent', cls: 'badge-sent' },
  }
  const { label, cls } = map[status] || { label: status, cls: '' }
  return <span className={`badge ${cls}`}>{label}</span>
}
