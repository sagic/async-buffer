const AsyncBuffer = function AsyncBuffer(concurrent, max = null) {
  let id = 0;
  const queue = [];
  const processNext = () => {
    const item = queue.find(o => !o.isProcessing);
    if (!item) {
      return;
    }
    item.isProcessing = true;
    // console.log('progress', item.id, queue.map((qi) => qi.id));
    const params = item.options.params || [];
    item.func(...params)
      .then(() => {
        // console.log('done', item.id);
        queue.splice(queue.indexOf(item), 1);
        delete item.options;
        delete item.func;
        processNext();
      })
      .catch((err) => {
        throw err;
      });
  };
  const add = (func, options = {}) => {
    if (max && queue.length === max) {
      throw new Error('queue is full');
    }
    queue.push({
      func,
      options,
      id,
      isProcessing: false,
    });
    // console.log('new', id, JSON.stringify(options));
    id += 1;
    queue.sort((a, b) => {
      const ap = a.options.priority || 0;
      const bp = b.options.priority || 0;
      if (ap > bp) {
        return -1;
      } else if (ap < bp) {
        return 1;
      }
      return 0;
    });
    if (queue.reduce((acc, item) => acc + (item.isProcessing ? 1 : 0), 0) < concurrent) {
      processNext();
    }
  };
  const getAll = () => queue;
  return {
    add,
    getAll,
  };
};

export default AsyncBuffer;
