export default class Service {
  processFile({ query, file, onOccurrenceUpdate, onProgress }) {
    let lineCounter = { counter: 0 };

    file
      .stream()
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(this.#updateProgressBar({ onProgress, fileSize: file.size }))
      .pipeThrough(this.#csvToJSON())
      .pipeThrough(this.#countLines(lineCounter))
      .pipeThrough(this.#findOccurrences(query))
      .pipeTo(this.#notifyProgressBar({ onOccurrenceUpdate, lineCounter }));
  }

  #notifyProgressBar({ onOccurrenceUpdate, lineCounter }) {
    const startedAt = performance.now();

    const elapsed = () => `${((performance.now() - startedAt) / 1000).toFixed(2)} secs`;

    return new WritableStream({
      write(found) {
        onOccurrenceUpdate({
          found,
          took: elapsed(),
          lineCounter: lineCounter.counter,
        });
      },
    });
  }

  #findOccurrences(query) {
    const queryKeys = Object.keys(query);
    let found = {};

    return new TransformStream({
      transform(chunk, controller) {
        for (const key of queryKeys) {
          const value = query[key];

          found[value] = found[value] ?? 0;

          if (value.test(chunk[key])) {
            found[value] += 1;
            console.log(found);
          }

          controller.enqueue(found);
        }
      },
    });
  }

  #countLines(lineCounter) {
    return new TransformStream({
      transform(chunk, controller) {
        lineCounter.counter += 1;

        controller.enqueue(chunk);
      },
    });
  }

  #updateProgressBar({ onProgress, fileSize }) {
    let totalUpdated = 0;

    onProgress(0);

    return new TransformStream({
      transform(chunk, controller) {
        totalUpdated += chunk.length;

        const total = (100 / fileSize) * totalUpdated;

        onProgress(total);

        controller.enqueue(chunk);
      },
      flush(_) {
        onProgress(100);
      },
    });
  }

  #csvToJSON() {
    let BUFFER = "";
    let DELIMITER = ",";
    let COLUMNS = "";
    let BREAK_LINE_SYMBOL = "\n";
    let INDEX_NOT_FOUND = -1;

    const consumeLineData = (breakLineIndex) => {
      const lineToProcessIndex = breakLineIndex + BREAK_LINE_SYMBOL.length;
      const line = BUFFER.slice(0, lineToProcessIndex);

      BUFFER = BUFFER.slice(lineToProcessIndex);

      return line;
    };

    const getJSONLine = (lineData) => {
      const removeBreakLine = (text) => text.replace(BREAK_LINE_SYMBOL, "");

      const headers = Array.from(COLUMNS);
      const jsonObj = {};

      for (const lineValue of lineData.split(DELIMITER)) {
        const key = removeBreakLine(headers.shift());
        const value = removeBreakLine(lineValue);
        const finalValue = value.trimEnd().replace(/"/g, "");

        jsonObj[key] = finalValue;
      }

      if (!Object.keys(jsonObj).length) return null;

      return jsonObj;
    };

    return new TransformStream({
      transform(chunk, controller) {
        BUFFER = BUFFER.concat(chunk);

        let breaklineIndex = 0;

        while (breaklineIndex !== INDEX_NOT_FOUND) {
          breaklineIndex = BUFFER.indexOf(BREAK_LINE_SYMBOL);

          if (breaklineIndex === INDEX_NOT_FOUND) break;

          const lineData = consumeLineData(breaklineIndex);

          if (!COLUMNS.length) {
            COLUMNS = lineData.split(DELIMITER);

            continue;
          }

          if (lineData === BREAK_LINE_SYMBOL) continue;

          const result = getJSONLine(lineData);

          if (!result) continue;

          controller.enqueue(result);
        }
      },
    });
  }
}
