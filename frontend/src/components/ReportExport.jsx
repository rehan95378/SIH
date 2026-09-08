import './ReportExport.css';

export default function ReportExport({ graph, analytics }) {
  const downloadReport = () => {
    const report = {
      exported_at: new Date().toISOString(),
      summary: {
        entity_count: graph?.nodes?.length ?? 0,
        connection_count: graph?.edges?.length ?? 0,
      },
      graph,
      analytics
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crime-network-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="export-button" type="button" onClick={downloadReport}>
      Download analysis report
    </button>
  );
}
