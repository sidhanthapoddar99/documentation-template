// Singleton queue to manage Mermaid rendering synchronization
class MermaidRenderQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async add(renderTask) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task: renderTask, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift();
      
      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      }
      
      // Small delay between renders to prevent conflicts
      await new Promise(r => setTimeout(r, 10));
    }

    this.isProcessing = false;
  }
}

export const mermaidQueue = new MermaidRenderQueue();