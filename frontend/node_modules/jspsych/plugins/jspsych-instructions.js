/** custom-instructions.js
 *
 * This plugin displays text (including HTML formatted strings) during the experiment.
 * Use it to show instructions, provide performance feedback, etc...
 *
 * Josh de Leeuw, modified by Stefan Uddenberg.
 *
 * Page numbers can be displayed to help with navigation by setting show_page_number
 * to true.
 *
 * Based off of jspsych-instructions by Josh de Leeuw
 * documentation: docs.jspsych.org
 *
 *
 */

import "lodash";
import jsPsych from "../jspsych";

const instructions = (function () {
  let plugin = {};

  plugin.info = {
    name: "instructions",
    description: "",
    parameters: {
      pages: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: "Pages",
        default: undefined,
        array: true,
        description:
          "Each element of the array is the content for a single page.",
      },
      key_forward: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        pretty_name: "Key forward",
        default: "rightarrow",
        description:
          "The key the subject can press in order to advance to the next page.",
      },
      key_backward: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        pretty_name: "Key backward",
        default: "leftarrow",
        description:
          "The key that the subject can press to return to the previous page.",
      },
      allow_backward: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Allow backward",
        default: true,
        description:
          "If true, the subject can return to the previous page of the instructions.",
      },
      allow_keys: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Allow keys",
        default: false,
        description:
          "If true, the subject can use keyboard keys to navigate the pages.",
      },
      show_clickable_nav: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Show clickable nav",
        default: false,
        description:
          'If true, then a "Previous" and "Next" button will be displayed beneath the instructions.',
      },
      show_page_number: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Show page number",
        default: false,
        description:
          "If true, and clickable navigation is enabled, then Page x/y will be shown between the nav buttons.",
      },
      button_label_previous: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Button label previous",
        default: "Previous",
        description: "The text that appears on the button to go backwards.",
      },
      button_label_next: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Button label next",
        default: "Next",
        description: "The text that appears on the button to go forwards.",
      },
      show_button_delays: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Show button delays",
        array: true,
        default: [0],
        description:
          "The delays until the next and back buttons are shown for each page.",
      },
      enable_button_delays: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Enable button delays",
        array: true,
        default: [0],
        description:
          "The delays until the next and back buttons are enabled for each page.",
      },
      reading_speed_button_delay_type: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Reading speed button delay type",
        default: "none",
        description:
          "How to delay buttons based on reading speed: show | enable",
      },
      reading_speed: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Reading speed",
        default: 300,
        description: "Average reading speed in words per minute.",
      },
    },
  };

  let show_button_timeout, enable_button_timeout;
  plugin.trial = function (display_element, trial) {
    function btnListener(evt) {
      evt.target.removeEventListener("click", btnListener);
      if (this.id === "jspsych-instructions-back") {
        back();
      } else if (this.id === "jspsych-instructions-next") {
        next();
      }
    }

    function showCurrentPage() {
      let html = trial.pages[current_page];

      let pagenum_display = "";
      if (trial.show_page_number) {
        pagenum_display =
          "<span style='margin: 0 1em;' class='" +
          "jspsych-instructions-pagenum'>Page " +
          (current_page + 1) +
          "/" +
          trial.pages.length +
          "</span>";
      }

      if (trial.show_clickable_nav) {
        let nav_html =
          "<div class='jspsych-instructions-nav' style='padding: 10px 0px;'>";
        if (trial.allow_backward) {
          let allowed = current_page > 0 ? "" : "disabled='disabled'";
          nav_html +=
            "<button id='jspsych-instructions-back' class='jspsych-btn btn btn-outline-secondary instructions-btn' style='margin-right: 5px;' " +
            allowed +
            ">&lt; " +
            trial.button_label_previous +
            "</button>";
        }
        if (trial.pages.length > 1 && trial.show_page_number) {
          nav_html += pagenum_display;
        }
        nav_html +=
          "<button id='jspsych-instructions-next' class='jspsych-btn btn btn-primary instructions-btn'" +
          "style='margin-left: 5px;'>" +
          trial.button_label_next +
          " &gt;</button></div>";

        html += nav_html;
        display_element.innerHTML = html;
        if (current_page != 0 && trial.allow_backward) {
          display_element
            .querySelector("#jspsych-instructions-back")
            .addEventListener("click", btnListener);
        }

        display_element
          .querySelector("#jspsych-instructions-next")
          .addEventListener("click", btnListener);
      } else {
        if (trial.show_page_number && trial.pages.length > 1) {
          // page numbers for non-mouse navigation
          html +=
            "<div class='jspsych-instructions-pagenum'>" +
            pagenum_display +
            "</div>";
        }
        display_element.innerHTML = html;
      }
      if (current_page < trial.pages.length) {
        hideButtons();
        disableButtons();
        show_button_timeout = setTimeout(
          showButtons,
          trial.show_button_delays[current_page],
        );
        enable_button_timeout = setTimeout(
          enableButtons,
          trial.enable_button_delays[current_page],
        );
      }
      if (current_page > 0) {
        showAndEnableBackButton();
      }
    }

    function hideButtons() {
      $(".instructions-btn").css({ visibility: "hidden" });
    }

    function showButtons() {
      $(".instructions-btn").css({ visibility: "visible" });
    }

    function disableButtons() {
      $(".instructions-btn").prop("disabled", true);
    }

    function enableButtons() {
      $(".instructions-btn").prop("disabled", false);
    }

    function showAndEnableBackButton() {
      $("#jspsych-instructions-back").css({ visibility: "visible" });
      $("#jspsych-instructions-back").prop("disabled", false);
    }

    function next() {
      addCurrentPageToViewHistory();

      // set delays to zero
      trial.enable_button_delays[current_page] = 0;
      trial.show_button_delays[current_page] = 0;

      current_page++;

      // if done, finish up...
      if (current_page >= trial.pages.length) {
        endTrial();
      } else {
        showCurrentPage();
      }
    }

    function back() {
      addCurrentPageToViewHistory();

      clearTimeout(show_button_timeout);
      clearTimeout(enable_button_timeout);

      current_page--;

      showCurrentPage();
    }

    function addCurrentPageToViewHistory() {
      const current_time = performance.now();

      const page_view_time = current_time - last_page_update_time;

      view_history.push({
        page_index: current_page,
        viewing_time: page_view_time,
      });

      last_page_update_time = current_time;
    }

    function endTrial() {
      if (trial.allow_keys) {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboard_listener);
      }

      display_element.innerHTML = "";

      const trial_data = {
        view_history,
        rt: performance.now() - start_time,
      };

      jsPsych.finishTrial(trial_data);
    }

    function afterResponse(info) {
      // have to reinitialize this instead of letting it persist to prevent accidental skips of pages by holding down keys too long
      keyboard_listener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: afterResponse,
        valid_responses: [trial.key_forward, trial.key_backward],
        rt_method: "date",
        persist: false,
        allow_held_key: false,
      });
      // check if key is forwards or backwards and update page
      if (jsPsych.pluginAPI.compareKeys(info.key, trial.key_backward)) {
        if (current_page !== 0 && trial.allow_backward) {
          back();
        }
      }

      if (jsPsych.pluginAPI.compareKeys(info.key, trial.key_forward)) {
        next();
      }
    }

    function extractContent(html) {
      return new DOMParser().parseFromString(html, "text/html").documentElement
        .textContent;
    }

    function countWords(str) {
      return _.words(str).length;
    }

    function getReadingSpeedDelay(word_count) {
      return (word_count / trial.reading_speed) * 60000;
    }

    let keyboard_listener;

    let current_page = 0;

    let view_history = [];

    const start_time = performance.now();

    let last_page_update_time = start_time;

    const page_content = _.map(trial.pages, extractContent);
    const word_counts = _.map(page_content, countWords);
    const reading_speed_delays = _.map(word_counts, getReadingSpeedDelay);

    if (trial.reading_speed_button_delay_type === "show") {
      trial.enable_button_delays = [0];
      trial.show_button_delays = reading_speed_delays;
    }

    if (trial.reading_speed_button_delay_type === "enable") {
      trial.show_button_delays = [0];
      trial.enable_button_delays = reading_speed_delays;
    }

    // make every page have the same delay if only one delay
    if (trial.show_button_delays.length === 1) {
      trial.show_button_delays = _.times(
        trial.pages.length,
        _.constant(trial.show_button_delays[0]),
      );
    }

    if (trial.enable_button_delays.length === 1) {
      trial.enable_button_delays = _.times(
        trial.pages.length,
        _.constant(trial.enable_button_delays[0]),
      );
    }

    showCurrentPage();

    if (trial.allow_keys) {
      keyboard_listener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: afterResponse,
        valid_responses: [trial.key_forward, trial.key_backward],
        rt_method: "date",
        persist: false,
      });
    }
  };

  return plugin;
})();

export default instructions;
