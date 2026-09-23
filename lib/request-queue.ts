type QueueTask<T> = () => Promise<T>;

export function createRequestQueue(maxConcurrency: number, maxQueued: number) {
  const queue: QueueTask<any>[] = [];
  let active = 0;

  const runNext = () => {
    if (active >= maxConcurrency || queue.length === 0) return;

    const task = queue.shift();
    if (!task) return;

    active += 1;
    Promise.resolve()
      .then(task)
      .finally(() => {
        active -= 1;
        runNext();
      });
  };

  return {
    enqueue<T>(task: QueueTask<T>): Promise<T> {
      if (queue.length >= maxQueued) {
        return Promise.reject(new Error("Server is busy. Please retry in a moment."));
      }

      return new Promise<T>((resolve, reject) => {
        queue.push(() => task().then(resolve, reject));
        runNext();
      });
    },
    size() {
      return queue.length + active;
    },
  };
}
