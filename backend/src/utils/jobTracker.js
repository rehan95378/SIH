const jobs = new Map();

const createJob = () => {
  const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  jobs.set(id, { status: 'processing', created_at: new Date().toISOString() });
  return id;
};

const completeJob = (id, result) => {
  const job = jobs.get(id);
  if (!job) throw new Error(`Unknown job: ${id}`);
  jobs.set(id, { ...job, status: 'done', result, completed_at: new Date().toISOString() });
};

const failJob = (id, error) => {
  const job = jobs.get(id);
  if (!job) throw new Error(`Unknown job: ${id}`);
  jobs.set(id, {
    ...job,
    status: 'failed',
    error: error instanceof Error ? error.message : String(error),
    completed_at: new Date().toISOString()
  });
};

const getJob = (id) => jobs.get(id) || null;

module.exports = { createJob, completeJob, failJob, getJob };
