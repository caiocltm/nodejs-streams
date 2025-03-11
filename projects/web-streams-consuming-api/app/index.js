const API_URL = "http://localhost:3000/";

let counter = 0;

async function consumeAPI(signal) {
  try {
    const response = await fetch(API_URL, { signal });

    const reader = response.body.pipeThrough(new TextDecoderStream()).pipeThrough(parseNDJSON());

    return reader;
  } catch (error) {
    console.error(error.message);
  }
}

function parseNDJSON() {
  let buffer = "";

  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;

      const items = buffer.split("\n");

      if (!items.length || !items[0]) return;

      items.forEach((item) => item.length > 0 && controller.enqueue(JSON.parse(item)));

      buffer = items[items.length - 1];
    },

    flush(controller) {
      if (!buffer.length) return;

      controller.enqueue(JSON.parse(buffer));
    },
  });
}

function createCardElement(elementN, title, description, url) {
  const article = document.createElement("article");
  const divText = document.createElement("div");
  divText.className = "text";

  const h3 = document.createElement("h3");
  h3.textContent = `[${elementN}] ${title}`;

  const p = document.createElement("p");
  p.textContent = description.slice(0, 100);

  const a = document.createElement("a");
  a.href = url;
  a.textContent = "Here's why!";

  divText.appendChild(h3);
  divText.appendChild(p);
  divText.appendChild(a);
  article.appendChild(divText);

  return article;
}

function appendToHTML(element) {
  return new WritableStream({
    write({ title, description, url }) {
      const article = createCardElement(++counter, title, description, url);

      element.appendChild(article);
    },
    abort(reason) {
      console.warn(`Operation aborted due to => ${reason}`);
    },
  });
}

const [startBtn, stopBtn, cards] = ["start", "stop", "cards"].map((id) => document.getElementById(id));

let abortController = new AbortController();

startBtn.addEventListener("click", async () => {
  try {
    debugger;
    const readable = await consumeAPI(abortController.signal);

    await readable.pipeTo(appendToHTML(cards), { signal: abortController.signal });
  } catch (error) {
    console.error(`Error while consuming API. Error ${error.message}`);
  }
});

stopBtn.addEventListener("click", async () => {
  counter = 0;

  abortController.abort("User request");

  console.warn(`Aborting operation...`);

  abortController = new AbortController();
});
