import Controller from "./controller.js";
import Service from "./service.js";
import View from "./view.js";

const workerFilePath = `${import.meta.resolve("./")}/worker.js`;

const worker = new Worker(workerFilePath, { type: "module", name: "SearchTermWorker" });
const service = new Service();
const view = new View();

Controller.init({ service, view, worker });
