class Queue {
    constructor(concurrency) {
        this.concurrency = concurrency || 5;
        this.running = 0;
        this.queue = [];
        this.paused = false;
    }
    enqueue(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                task,
                resolve,
                reject
            });
            this.run();
        });
    }

    run() {
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
    }

    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
        this.run();
    }

    clear() {
        this.queue = [];
    }
}

export default Queue;
