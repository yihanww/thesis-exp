/**
 * A jspsych plugin for slider response questions (usually with an image).
 * The slider knob is meant to be invisible until clicked, and the subject
 * cannot proceed until they have made a response.
 * Based off of jspsych-image-slider-response by Josh de Leeuw
 *
 * Stefan Uddenberg
 *
 *
 */

import jsPsych from "jspsych";

const image_slider_response = (function () {
  var plugin = {};

  jsPsych.pluginAPI.registerPreload(
    "image-slider-response",
    "stimulus",
    "image",
  );

  plugin.info = {
    name: "image-slider-response",
    description: "",
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: "Stimulus",
        default: undefined,
        description: "The image to be displayed",
      },
      min: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Min slider",
        default: 0,
        description: "Sets the minimum value of the slider.",
      },
      max: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Max slider",
        default: 100,
        description: "Sets the maximum value of the slider",
      },
      start: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Slider starting value",
        default: 0,
        description: "Sets the starting value of the slider",
      },
      step: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Step",
        default: "any",
        description: "Sets the step of the slider",
      },
      labels: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: "Labels",
        default: [],
        array: true,
        description: "Labels of the slider.",
      },
      button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Button label",
        default: "Continue",
        array: false,
        description: "Label of the button to advance.",
      },
      stimulus_width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Stimulus width",
        default: undefined,
        description: "The width of the image to be displayed in px",
      },
      slider_width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Slider width",
        default: undefined,
        description: "The width of the slider to be displayed in px",
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Prompt",
        default: null,
        description: "Any content here will be displayed below the slider.",
      },
      stimulus_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Stimulus duration",
        default: null,
        description: "How long to hide the stimulus.",
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Trial duration",
        default: null,
        description: "How long to show the trial.",
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Response ends trial",
        default: true,
        description: "If true, trial will end when user makes a response.",
      },
      slider_amount_visible: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Slider amount to be shown",
        default: false,
        description: "If true, can see numeric value of slider.",
      },
      show_slider_delay: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Show slider delay",
        default: 0,
        description: "How long to delay showing the slider.",
      },
    },
  };

  plugin.trial = function (display_element, trial) {
    const response = {
      rt: null,
      response: null,
      initial_response: null,
      initial_response_time: null,
      all_responses: [],
      all_response_times: [],
    };

    function makeSliderVisibleAndEnabled() {
      const el = document.querySelector("#response-slider");
      el.classList.remove("invis");
      el.disabled = false;
    }

    function makeSliderHandleVisible(event) {
      const el = event.target;
      el.classList.remove("not-clicked");
    }

    function makeSliderAmountVisible(event) {
      const el = document.querySelector("#slider-amount");
      const slider_value = parseInt(
        document.querySelector("#response-slider").value,
      );
      el.textContent = `${slider_value}`;
      console.log("trial.slider_amount_visible", trial.slider_amount_visible);
      if (trial.slider_amount_visible) {
        el.classList.remove("invis");
      }
    }

    function makeButtonVisibleAndEnabled(event) {
      const el = document.querySelector("#continue-button");
      el.classList.remove("invis");
      el.classList.remove("disabled");
    }

    function recordInitialResponse(event) {
      const el = event.target;
      if (response.initial_response === null) {
        response.initial_response = parseInt(el.value);
        response.initial_response_time = new Date().getTime() - start_time;
      }
    }

    function recordAllResponses(event) {
      const el = event.target;
      response.all_responses.push(parseInt(el.value));
      response.all_response_times.push(new Date().getTime() - start_time);
    }

    let response_is_valid = false;
    const [left_label, right_label] = trial.labels;
    var html = '<div id="image-slider-response-trial-wrapper">';
    html +=
      '<div id="image-slider-response-trial-stimulus" class="mt-2 mb-3"><img src="' +
      trial.stimulus +
      `" style="width: ${trial.stimulus_width}px"></div>`;
    html +=
      '<div class="image-slider-response-trial-container" class="container">';
    if (trial.prompt !== null) {
      html += trial.prompt;
    }
    html += `<h2 id="slider-amount" class="text-center invis">XXX</h2>`;
    html +=
      '<input type="range" value="' +
      trial.start +
      '" min="' +
      trial.min +
      '" max="' +
      trial.max +
      '" step="' +
      trial.step +
      `" style="width: ${
        trial.slider_width
      }px;" id="response-slider" class="slider not-clicked ${
        trial.show_slider_delay ? "invis" : ""
      }" ${trial.show_slider_delay ? "disabled" : ""}></input>`;
    html += `<div class="container" style="min-width:${
      trial.slider_width + 50
    }px; max-width:${trial.slider_width + 200}px">`;
    html += `<p id="leftLabel" class="float-left mt-2">${left_label}</p>`;
    html += `<p id="rightLabel" class="float-right mt-2">${right_label}</p>`;
    html += `</div>`;
    html += "<div>";
    html += `<h2 id="slider-amount" class="text-center invis">XXX</h2>`;

    html += "</div>";
    html += "</div>";
    html += "</div>";

    // add submit button
    html +=
      '<div class="container my-3">' +
      '<button id="continue-button" class="jspsych-btn btn btn-lg btn-primary invis disabled">' +
      trial.button_label +
      "</button>" +
      "</div>";

    display_element.innerHTML = html;

    if (trial.show_slider_delay) {
      setTimeout(makeSliderVisibleAndEnabled, trial.show_slider_delay);
    }

    // Remove not-clicked class when clicked
    const slider = display_element.querySelector("#response-slider");
    slider.addEventListener("input", recordInitialResponse, false);
    slider.addEventListener("input", recordAllResponses, false);
    slider.addEventListener("input", makeSliderHandleVisible, false);
    slider.addEventListener("input", makeSliderAmountVisible, false);
    slider.addEventListener("input", makeButtonVisibleAndEnabled, false);

    display_element
      .querySelector("#continue-button")
      .addEventListener("click", function () {
        // measure response time
        var end_time = new Date().getTime();
        response.rt = end_time - start_time;
        response.response = parseInt(
          display_element.querySelector("#response-slider").value,
        );

        if (trial.response_ends_trial) {
          end_trial();
        } else {
          display_element.querySelector("#continue-button").disabled = true;
        }
      });

    function end_trial() {
      jsPsych.pluginAPI.clearAllTimeouts();

      // save data
      var trial_data = {
        ...response,
        stimulus: trial.stimulus,
      };

      display_element.innerHTML = "";

      // next trial
      jsPsych.finishTrial(trial_data);
    }

    if (trial.stimulus_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function () {
        display_element.querySelector(
          "#image-slider-response-trial-stimulus",
        ).style.visibility = "hidden";
      }, trial.stimulus_duration);
    }

    // end trial if trial_duration is set
    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function () {
        end_trial();
      }, trial.trial_duration);
    }

    var start_time = new Date().getTime();
  };

  return plugin;
})();

export default image_slider_response;
