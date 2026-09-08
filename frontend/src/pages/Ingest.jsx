import UploadPanel from '../components/UploadPanel.jsx';
import { useNavigate } from 'react-router-dom';
import './Ingest.css';

export default function Ingest() {
  const navigate = useNavigate();

  return (
    <section className="ingest-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">EVIDENCE INTAKE</p>
          <h1>Upload evidence</h1>
          <p className="muted">
            Send reports and structured files to the trained AI analysis service.
          </p>
        </div>
      </div>
      <UploadPanel
        onComplete={(result) => {
          if (result.document?.id) {
            navigate(`/entities?source_document_id=${encodeURIComponent(result.document.id)}`);
          }
        }}
      />
    </section>
  );
}
