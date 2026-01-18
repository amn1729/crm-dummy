// ==UserScript==
// @name         CRM Dummy
// @version      2025-01-05
// @description  Userscript for filling weekly timesheet at my dayjob
// @author       Anhsirk0
// @match        https://crm.softsensor.ai/account/timelogs/weekly-timesheets
// @icon         https://www.google.com/s2/favicons?sz=64&domain=crm.softsensor.ai
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

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

  /**
   * Click on an element by selector (inside base)
   * @param {string} - Selector
   * @param {Element} [base=document] - Base Element (used as base to select)
   */
  async function click(selector, base = document) {
    const btn = base.querySelector(selector);
    if (btn) {
      btn.click();
      await sleep(1);
    } else console.log(`Could not click '${selector}'`);
  }

  /**
   * Get a random item from an array
   * @param {Array<T>} - The array
   * @returns {T} The random item
   */
  function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Sleep function to wait while the page/actions loads
   * @param {number} - time to wait in seconds
   */
  function sleep(s) {
    return new Promise((resolve) => setTimeout(resolve, s * 1000));
  }

  /**
   * Clicks on the add more task button
   */
  async function clickAddMore() {
    await click("#add-more-task");
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
    await click(`button[aria-owns=${ariaId}]`);
    await click(`#${optionId}`);
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
      let text = Array.isArray(hrs) ? randomChoice(hrs) : hrs;
      if (task === Task.Timesheet) {
        text = i === days - 1 ? 0.25 : 0;
      }

      const sel = `td[data-index='${i}']>input[name='hours[${idx - 1}][]']`;
      const input = document.querySelector(sel);
      if (input) input.value = text;
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
    await fillInputs(task, order, 5);
  }

  /**
   * Fill task for each task
   */
  async function fillAll() {
    let order = 1;
    await fillTask(Task.Organisation, order++, false);
    await fillTask(Task.StandUp, order++);
    await fillTask(Task.Main, order++);
    await fillTask(Task.Bench, order++);
    await fillTask(Task.Testing, order++);
    await fillTask(Task.WrapUp, order++);
    await fillTask(Task.Timesheet, order++);
  }

  /**
   * Add a button to fill all tasks
   */
  function addFillButton() {
    const table = document.querySelector("div.table-responsive");
    if (!table) return;

    const div = table.querySelector("div.mt-3");
    if (!div) return;

    const btn = document.createElement("button");
    btn.classList.add("btn-info", "f-14", "p-2", "rounded");
    btn.innerHTML = "Fill Timesheet";
    btn.onClick = fillAll;
    div.appendChild(btn);
  }

  function main() {
    setTimeout(addFillButton, 800);
  }

  setTimeout(main, 1200);
})();
