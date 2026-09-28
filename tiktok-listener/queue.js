let queue = Promise.resolve();

export function enqueueDraw(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}
