import puppeteer from "puppeteer";

const executablePath = "/usr/bin/chromium";
const userDataDir = "/home/krishna/.config/chromium";
const timesheetUrl =
  "https://crm.softsensor.ai/account/timelogs/weekly-timesheets";

/**
 * @enum {string}
 */
const Task = Object.freeze({
  Organisation: "Organisation-wide meeting",
  StandUp: "Scheduler standup call",
  WrapUp: "Scheduler wrapup call",
  Main: "Working on Scheduler",
  Bench: "Task not assigned",
  Testing: "QA Testing meeting",
  Timesheet: "Timesheet record, Administrative activity",
});

// Launch the browser and open a new blank page
const browser = await puppeteer.launch({
  // Basic configuration options
  executablePath,
  headless: false, // Run in non-headless mode (browser will be visible)
  defaultViewport: null, // Use full browser window
  args: [
    `--user-data-dir=${userDataDir}`,
    "--start-maximized",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
  ],
});
const page = await browser.newPage();
await page.goto(timesheetUrl);

/**
 * Clicks on the add more task button
 */
async function clickAddMore() {
  const btn = await page.$("#add-more-task");
  await btn.click();
}

/**
 * Set the value of the task using the task dropdown
 * @param {Task} - The task
 * @param {number} - The index/order of the task
 * @param {boolean} [addMore='true'] - Whether to click on add more button
 */
async function setTask(task, idx, addMore = true) {
  await sleep(1);
  if (addMore) await clickAddMore();

  let ariaId = `bs-select-${idx}`;
  let optionId = `${ariaId}-38`;
  if (task === Task.StandUp) {
    optionId = `${ariaId}-4`;
  } else if (task === Task.Main) {
    optionId = `${ariaId}-34`;
  } else if (task === Task.Bench) {
    optionId = `${ariaId}-56`;
  } else if (task === Task.WrapUp) {
    optionId = `${ariaId}-5`;
  } else if (task === Task.Testing) {
    optionId = `${ariaId}-39`;
  } else if (task === Task.Timesheet) {
    optionId = `${ariaId}-1`;
  }

  const btn = await page.$(`button[aria-owns=${ariaId}]`);
  await btn.click();
  await sleep(1);
  const option = await page.$(`#${optionId}`);
  await option.click();
  await sleep(1);
}

/**
 * Fill all 5 input hours (Monday-Friday)
 * @param {Task} - The task
 * @param {number} - The index/order of the task
 */
async function fillInputs(task, idx, days = 5) {
  let hrs = 0.5; // Number or Array<Number>

  if (task === Task.StandUp) {
    hrs = 0.25;
  } else if (task === Task.Main) {
    hrs = 5.5;
  } else if (task === Task.WrapUp) {
    hrs = 0.25;
  } else if (task === Task.Bench) {
    hrs = [2, 1.5];
  } else if (task === Task.Testing) {
    hrs = [0, 0.25, 0.5];
  }

  for (let i = 0; i < days; i++) {
    const selector = `td[data-index='${i}']>input[name='hours[${idx - 1}][]']`;
    let text = Array.isArray(hrs) ? randomChoice(hrs) : hrs;
    if (task === Task.Timesheet) {
      text = i === days - 1 ? 0.25 : 0;
    }

    await page.focus(selector);
    for (const char of text.toString()) {
      await page.keyboard.press(char);
    }
  }
}

/**
 * Set the value of the task using the task dropdown, and fill inputs
 * @param {Task} - The task
 * @param {number} - The index/order of the task
 * @param {boolean} [addMore='true'] - Whether to click on add more button
 */
async function fillTask(task, order, addMore = true) {
  await setTask(task, order, addMore);
  await fillInputs(task, order, 3);
}

/* ────────────────────────── Main function ────────────────────────── */
async function main() {
  await sleep(10);
  // first task's addMore should always be false
  await fillTask(Task.Organisation, 1, false);
  await fillTask(Task.StandUp, 2);
  await fillTask(Task.Main, 3);
  await fillTask(Task.Bench, 4);
  await fillTask(Task.Testing, 5);
  await fillTask(Task.WrapUp, 6);
  await fillTask(Task.Timesheet, 7);
}

main();

/* ────────────────────────── Helper functions ────────────────────────── */
/**
 * Sleep function to wait while the page/actions loads
 * @param {number} - time to wait in seconds
 */
function sleep(s) {
  return new Promise((resolve) => setTimeout(resolve, s * 1000));
}

/**
 * Get a random item from an array
 * @param {Array<T>} - The array
 * @returns {T} The random item
 */
function randomChoice(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// await browser.close();
