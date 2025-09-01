function Queue(concurrency) {
    this.concurrency = concurrency || 5;
    this.running = 0;
    this.queue = [];
    this.paused = false;
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
    while (this.running < this.concurrency && this.queue.length && !this.paused) {
        const {task, resolve, reject} = this.queue.shift();
        this.running++;
        task()
            .then(resolve)
            .catch(reject)
            .finally(() => {
                this.running--;
                this.run();
            });
    }
};

Queue.prototype.pause = function () {
    this.paused = true;
};

Queue.prototype.resume = function () {
    this.paused = false;
    this.run();
};

Queue.prototype.clear = function () {
    this.queue = [];
};

export default Queue;
