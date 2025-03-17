export default class Controller {
  #view;
  #service;
  #worker;
  #events = {
    alive: () => console.log("Worker is alive!"),
    progress: ({ total }) => {
      this.#view.updateProgress(total);
    },
    occurrenceUpdate: ({ found, took, lineCounter }) => {
      const [[key, value]] = Object.entries(found);

      this.#view.updateReport(`found ${value} occurrences of ${key} - over ${lineCounter} lines - took ${took}`);
    },
  };

  constructor({ view, service, worker }) {
    this.#view = view;
    this.#service = service;
    this.#worker = this.#configureWorker(worker);
  }

  static init(dependencies) {
    const controller = new Controller(dependencies);

    controller.init();

    return controller;
  }

  init() {
    this.#view.configureOnFileChange(this.#configureOnFileChange.bind(this));
    this.#view.configureOnSubmit(this.#configureOnSubmit.bind(this));
  }

  #formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB", "TB"];

    let i = 0;

    for (; bytes >= 1024 && i < units.length - 1; i++) {
      bytes /= 1024;
    }

    return `${bytes.toFixed(2)} ${units[i]}`;
  }

  #configureWorker(worker) {
    worker.onmessage = ({ data }) => this.#events[data.eventType](data);

    return worker;
  }

  #configureOnFileChange(file) {
    this.#view.setFileSize(this.#formatBytes(file.size));
  }

  #configureOnSubmit({ description, file }) {
    const query = {
      "call description": new RegExp(description, "i"),
    };

    if (this.#view.isWorkerEnabled()) {
      console.log("Executing on worker thread!");

      this.#worker.postMessage({ file, query });

      return;
    }

    console.log("Executing on main thread!");

    this.#service.processFile({
      query,
      file,
      onOccurrenceUpdate: (...args) => {
        this.#events.occurrenceUpdate(args);
      },
      onProgress: (total) => {
        this.#events.progress({ total });
      },
    });
  }
}
