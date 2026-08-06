export default function Modal({ title, children, onClose }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={event => event.stopPropagation()}>
      <div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>
      {children}
    </section>
  </div>;
}
