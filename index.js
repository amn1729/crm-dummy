import puppeteer from "puppeteer";

/* ────────────────────────────── About ────────────────────────────── */
// This is a puppeteer script to automatically fill the weekly timesheet
// Corporations are known for their Bureaucracy and BS jobs
// this CRM is so badly coded, it constantly rerender stuff, constantly flicker
// Its so bad that I cant even blame reactjs for it.
// Programming is a dying craft.
// This webapp is most likely vibe coded by some dumbfucks.
// This program has a lot of `sleep` statements because this webapp
// cant even render a basic component without flickering,
// even user avatars have a loading animation, its just garbage.
// Anyway if this scripts breaks just increase `sleep` time.

/* ───────────────────────── Puppeteer config ───────────────────────── */
// you can skip these if you are on a Gaming OS
const executablePath = "/usr/bin/chromium";
const userDataDir = "/home/krishna/.config/chromium";
const options = {
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
};

// use these options if you are on a Gaming OS
// const options = {};

/* ──────────────────────── Credentials stuff ──────────────────────── */
const url = "https://softsensor.unirms.com";
const email = "aman.kumar@softsensor.ai";
// if you are on unix like OS
// use this command to add env variable `export crm_dummy_password=yourPassword`
// otherwise just hard code password here
const password = process.env.crm_dummy_password || "yourPassword";

/* ───────────────────────── Global variables ───────────────────────── */
// this has to be declared here and to be set in localStorage as well
// Puppeteer `page.$eval` cant access global scope
// nodejs (this script) cant access browser stuff (localStorage, document etc)
// Another fine offering from the good people of JS world;

// skip Saturday(6) & Sunday(7)
const skipDays = [6, 7]; // dont forget to change this in `initData` function
let rowIdx = 0;

/* ──────────────────────────── Tasks enum ──────────────────────────── */
/**
 * These values are used to select item from dropdown (by text)
 * Use inspect element to find the title or just use eyes
 * Using inspect element and simply copying text is recommended
 * Some titles are poorly typed so dont waste your brain cells
 * and just copy text from the html tags, I learned this the hard way
 */
/**
 * @typedef {Object} Task
 * @property {string} text - The Text of the task (will be used to locate).
 * @property {number | Array<number>} hrs - The name of the item.
 */
/**
 * @constant {Array<Task>} TASKS_ARRAY - All of your tasks
 * add same item multiple times to increase probability
 */

const TASKS = [
  { text: "LMD SCHEDULER DAILY ALL PROJECT KT MEETING", hrs: 0.5 },
  { text: "Scheduler standup call", hrs: 0.25 },
  // this text has 2 fkin spaces in it, it took me an hour to debug
  // this is how bad everything is, they cant even add a text properly
  { text: "LMD SCHEDULER  FRONTEND", hrs: [3.5, 4, 4, 4.5] },
  { text: "Code maintainance (Refactor etc)", hrs: [0, 0.5, 1, 1, 1, 1.5, 2] },
  { text: "Knowledge Transfer / Mentorship", hrs: [0, 0, 0, 1, 1, 1.5, 2] },
  { text: "Document update : LMD scheduler", hrs: [0, 0, 0, 0.5, 1] },
  { text: "Bench / Unassigned", hrs: [1, 1, 1.5, 1.5, 2] },
  { text: "QA Testing Meeting", hrs: [0, 0, 0, 0.25, 0.25, 0.5, 0.5, 0.5, 1] },
  { text: "Scheduler wrapup call", hrs: 0.25 },
];

// Launch the browser and open a new blank page
const browser = await puppeteer.launch(options);
const page = await browser.newPage();
await page.goto(url);

/**
 * Clicks on the add more task button
 */
async function clickAddMore() {
  await page.$("button ::-p-text(Add Row)").then((el) => el.click());
}

/**
 * Clicks on the select task button
 */
async function clickSelectTaskBtn() {
  await page.$("button ::-p-text(Select task...)").then((el) => el.click());
}

/**
 * Set the value of the task using the task dropdown
 * @param {Task} - The task
 * @param {boolean} [addMore='true'] - Whether to click on add more button
 */
async function setTask(task, addMore = true) {
  if (addMore) await clickAddMore();
  await clickSelectTaskBtn();
  await sleep(2);
  await page.$(`span ::-p-text(${task.text})`).then((el) => el.click());
  await page.$$eval("tr.group", (rows) => {
    const rowIdx = Number(localStorage.getItem("rowIdx"));
    rows.at(rowIdx)?.setAttribute("id", `row-${rowIdx}`);
  });
}

/**
 * Fill all input hours (one row)
 * @param {Task} - The task
 */
async function fillInputs(task) {
  await page.$$eval(`tr#row-${rowIdx} input[type=number].h-7`, (inputs) => {
    // Todo: error handle
    const rowIdx = Number(localStorage.getItem("rowIdx"));
    const skipDays = JSON.parse(localStorage.getItem("skipDays"));

    localStorage.setItem("rowIdx", rowIdx + 1);
    inputs.forEach((input, idx) => {
      input.setAttribute("id", `input-${idx}`);
    });
  });

  for (let idx = 0; idx < 7; idx++) {
    if (!skipDays.includes(idx + 1)) {
      let text = Array.isArray(task.hrs) ? randomChoice(task.hrs) : task.hrs;
      await page.focus(`tr#row-${rowIdx} input#input-${idx}`);
      await typeText(text.toString());
    }
  }
  rowIdx++;
}

/**
 * Set the value of the task using the task dropdown, and fill inputs
 * @param {Task} - The task
 * @param {boolean} [addMore='true'] - Whether to click on add more button
 */
async function fillTask(task, addMore = true) {
  await setTask(task, addMore);
  await fillInputs(task);
}

/**
 * Is user logged out, usually true if not using userDataDir
 * @returns {boolean}
 */
async function isLoggedOut() {
  const input = await page.$("form input[type=password]");
  return !!input;
}

/**
 * Fill email and password inputs
 */
async function loginUser() {
  console.log("Logging in ...");
  // This CRM is prolly vibe coded by non programmers
  // It has 2 email inputs and 2 password inputs with same id
  // fortunately this still works
  await page.focus("input#email");
  await typeText(email);
  await page.focus("input#password");
  await typeText(password);
  await page.keyboard.press("Enter");
}

/* ────────────────────────── Init function ────────────────────────── */
async function initData() {
  await page.evaluate(() => {
    const skipDays = [6, 7]; // skip Saturday(6) & Sunday(7)
    // localStorage.clear();
    localStorage.setItem("rowIdx", 0);
    localStorage.setItem("skipDays", JSON.stringify(skipDays));
  });
}

/* ────────────────────────── Main function ────────────────────────── */
async function main() {
  await sleep(2);
  const noUser = await isLoggedOut();
  if (noUser) await loginUser();
  await sleep(4);
  await page.$("a span ::-p-text(Timesheet)").then((el) => el.click());
  await initData();
  await sleep(10);
  // first task's addMore should always be false
  // for some reason this wont work in `forEach` loop
  for (const task of TASKS) {
    await fillTask(task, task.text !== TASKS[0].text);
  }
}

await main();

/* ────────────────────────── Helper functions ────────────────────────── */
/**
 * Type a given text via key presses
 * @param {string} - text
 */
async function typeText(text) {
  for (const char of text.toString()) {
    await page.keyboard.press(char);
  }
}

/**
 * Sleep function to wait while the page/actions loads
 * @param {number} - time to wait in seconds
 */
function sleep(s) {
  page.evaluate(() => {
    const div = document.createElement("div");
    div.id = "waiting";
    div.textContent = "CRM Dummy is waiting ...";
    div.classList.add(
      "p-4",
      "z-10",
      "fixed",
      "top-4",
      "bg-white",
      "rounded-lg",
      "border-2",
      "border-blue-700",
      "text-2xl",
      "text-blue-600"
    );
    div.style.left = "calc(50vw - 5rem)";
    document.body.appendChild(div);
  });
  return new Promise((resolve) =>
    setTimeout(() => {
      page.evaluate(() => {
        document.getElementById("waiting")?.remove();
      });
      resolve();
    }, s * 1000)
  );
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
