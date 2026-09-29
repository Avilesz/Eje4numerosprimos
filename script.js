const maximum = 1_000_000;
const pageSize = 100;
const form = document.querySelector("#prime-form");
const startInput = document.querySelector("#start");
const endInput = document.querySelector("#end");
const errorMessage = document.querySelector("#error-message");
const resultField = document.querySelector("#prime-results");
const countOutput = document.querySelector("#prime-count");
const rangeCaption = document.querySelector("#range-caption");
const copyButton = document.querySelector("#copy-button");
const numberGrid = document.querySelector("#number-grid");
const sieveStatus = document.querySelector("#sieve-status");
const stepButton = document.querySelector("#step-button");
const finishButton = document.querySelector("#finish-button");
const pageCaption = document.querySelector("#page-caption");
const previousPageButton = document.querySelector("#previous-page");
const nextPageButton = document.querySelector("#next-page");
let activeStart = 1;
let activeEnd = 100;
let sieve = new Uint8Array(0);
let factors = [];
let completedSteps = -1;
let page = 0;

function buildSieve(end) {
  const primeFlags = new Uint8Array(end + 1).fill(1);
  if (end >= 0) primeFlags[0] = 0;
  if (end >= 1) primeFlags[1] = 0;

  for (let candidate = 2; candidate * candidate <= end; candidate += 1) {
    if (primeFlags[candidate]) {
      for (let multiple = candidate * candidate; multiple <= end; multiple += candidate) {
        primeFlags[multiple] = 0;
      }
    }
  }
  return primeFlags;
}

function firstProcessedFactor(number) {
  if (number === 1) return 1;
  for (let index = 0; index <= completedSteps; index += 1) {
    const factor = factors[index];
    if (number > factor && number % factor === 0) return factor;
  }
  return 0;
}

function renderGrid() {
  const pageCount = Math.ceil((activeEnd - activeStart + 1) / pageSize);
  const firstNumber = activeStart + page * pageSize;
  const lastNumber = Math.min(activeEnd, firstNumber + pageSize - 1);
  const cells = document.createDocumentFragment();

  for (let number = firstNumber; number <= lastNumber; number += 1) {
    const cell = document.createElement("div");
    const factor = firstProcessedFactor(number);
    cell.className = "number-cell";
    cell.textContent = String(number);
    cell.setAttribute("aria-label", String(number));
    if (factor === 1) {
      cell.dataset.factor = "1";
      cell.setAttribute("aria-label", "1, no es primo");
    } else if (factor) {
      cell.dataset.factor = [2, 3, 5, 7].includes(factor) ? String(factor) : "other";
      cell.setAttribute("aria-label", `${number}, múltiplo de ${factor}`);
    } else if (completedSteps >= factors.length - 1 && number >= 2 && sieve[number]) {
      cell.classList.add("is-prime");
      cell.setAttribute("aria-label", `${number}, primo`);
    }
    cells.append(cell);
  }
  numberGrid.replaceChildren(cells);
  pageCaption.textContent = `${firstNumber}–${lastNumber} de ${activeEnd - activeStart + 1}`;
  previousPageButton.disabled = page === 0;
  nextPageButton.disabled = page >= pageCount - 1;
}

function updateSieve() {
  const completed = completedSteps >= factors.length - 1;
  stepButton.disabled = completed;
  finishButton.disabled = completed;
  if (completed) {
    const lastFactor = factors[factors.length - 1];
    sieveStatus.textContent = `Criba completa${lastFactor ? ` tras marcar los múltiplos de ${lastFactor}` : ""}: quedan ${countOutput.textContent}.`;
  } else if (completedSteps < 0) {
    sieveStatus.textContent = `Rango ${activeStart}–${activeEnd}. El 1 no es primo; empieza con los múltiplos de 2.`;
  } else {
    const factor = factors[completedSteps];
    const nextFactor = factors[completedSteps + 1];
    sieveStatus.textContent = `Paso ${completedSteps + 1} de ${factors.length}: se marcaron los múltiplos de ${factor}${nextFactor ? `. Sigue con ${nextFactor}.` : "."}`;
  }
  renderGrid();
}

function main() {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorMessage.textContent = "";
  
    const start = Number(startInput.value);
    const end = Number(endInput.value);
    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      errorMessage.textContent = "Escribe un número entero en cada extremo del rango.";
      return;
    }
    if (start < 0 || end > maximum || end < 0 || start > maximum) {
      errorMessage.textContent = "El rango debe estar entre 0 y 1.000.000.";
      return;
    }
    if (start > end) {
      errorMessage.textContent = "El valor «Desde» debe ser menor o igual que «Hasta».";
      return;
    }
  
    activeStart = start;
    activeEnd = end;
    sieve = buildSieve(end);
    factors = [];
    for (let number = 2; number * number <= end; number += 1) {
      if (sieve[number]) factors.push(number);
    }
    completedSteps = -1;
    page = 0;
    const primes = [];
    for (let number = Math.max(2, start); number <= end; number += 1) {
      if (sieve[number]) primes.push(number);
    }
    resultField.value = primes.join(", ");
    countOutput.textContent = `${primes.length} ${primes.length === 1 ? "primo" : "primos"}`;
    rangeCaption.textContent = `Entre ${start.toLocaleString("es-ES")} y ${end.toLocaleString("es-ES")}`;
    copyButton.disabled = primes.length === 0;
    stepButton.disabled = false;
    finishButton.disabled = false;
    updateSieve();
  });
  
  stepButton.addEventListener("click", () => {
    if (completedSteps < factors.length - 1) completedSteps += 1;
    updateSieve();
  });
  
  finishButton.addEventListener("click", () => {
    completedSteps = factors.length - 1;
    updateSieve();
  });
  
  previousPageButton.addEventListener("click", () => {
    page -= 1;
    renderGrid();
  });
  
  nextPageButton.addEventListener("click", () => {
    page += 1;
    renderGrid();
  });
  
  document.querySelector("#reset-button").addEventListener("click", () => {
    startInput.value = "1";
    endInput.value = "100";
    errorMessage.textContent = "";
    resultField.value = "";
    resultField.placeholder = "Los números primos aparecerán aquí.";
    countOutput.textContent = "—";
    rangeCaption.textContent = "";
    copyButton.disabled = true;
    sieve = new Uint8Array(0);
    factors = [];
    completedSteps = -1;
    activeStart = 1;
    activeEnd = 100;
    page = 0;
    sieveStatus.textContent = "Calcula un rango para comenzar.";
    stepButton.disabled = true;
    finishButton.disabled = true;
    renderGrid();
    startInput.focus();
  });
  
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(resultField.value);
      copyButton.textContent = "Lista copiada";
      window.setTimeout(() => { copyButton.textContent = "Copiar lista"; }, 1400);
    } catch {
      resultField.focus();
      resultField.select();
      errorMessage.textContent = "No se pudo copiar automáticamente. Selecciona y copia la lista.";
    }
  });
  
  form.requestSubmit();
}

main();
