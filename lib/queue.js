function Queue(concurrency) {
    this.concurrency = concurrency || 5;
    this.running = 0;
    this.queue = [];
}
Queue.prototype.enqueue = function (task) {
    return new Promise((resolve, reject) => {
        this.queue.push({
            task,
            resolve,
            reject
        });
        this.run();
    });
};

Queue.prototype.run = function () {
    while (this.running < this.concurrency && this.queue.length) {
        const {task, resolve, reject} = this.queue.shift();
        this.running++;
        task()
            .then(resolve)
            .catch(reject)
            .finally(() => {
                this.running--;
            });
    }
};

export default Queue;
