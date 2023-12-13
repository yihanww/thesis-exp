/**
 * A jspsych plugin for morphing a central image (through a series of images)
 * with a circular slider.
 * Based off of jspsych-image-slider-response by Josh de Leeuw
 *
 * Stefan Uddenberg
 *
 */

import jsPsych from "jspsych";
import _ from "lodash";
import * as $ from "jquery";
import { wait } from "./utils";
import "round-slider";
import "round-slider/dist/roundslider.min.css";

const image_slider_response = (function () {
  var plugin = {};

  jsPsych.pluginAPI.registerPreload(
    "circular-slider-image-morpher",
    "stimuli",
    "image",
  );

  plugin.info = {
    name: "circular-slider-image-morpher",
    description: "",
    parameters: {
      stimuli: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: "Stimuli",
        default: undefined,
        array: true,
        description: "The array of images to be displayed.",
      },
      initial_stimulus_value: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Initial stimulus value",
        default: undefined,
        description:
          "The initial stimulus value from the stimuli list to be displayed. Index is that minus one.",
      },
      intial_slider_val: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Initial slider value",
        default: undefined,
        description:
          "Sets the starting value of the slider. If undefined, picks a random value.",
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
      slider_diameter: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Slider diameter",
        default: undefined,
        description:
          "The diameter of the circular slider to be displayed in px",
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Prompt",
        default: null,
        description:
          "Any content here will be displayed below the slider/stimulus.",
      },
      initial_stimulus_delay: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Initial stimulus delay",
        default: 1000,
        description:
          "How long to wait until the stimulus is shown (initial blank).",
      },
      stimulus_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Stimulus duration",
        default: 1000,
        description: "How long to show the initial stimulus for.",
      },
      post_stimulus_delay: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Post stimulus delay",
        default: 1000,
        description: "How long to wait until responses are allowed.",
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Trial duration",
        default: null,
        description: "How long to show the trial.",
      },
      num_images_to_force_display: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Number of images subject is forced to see",
        default: 0,
        description:
          "The user must sweep through and see at least this many images before being allowed to move on.",
      },
      custom_css: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Custom CSS",
        description:
          "Custom CSS for this trial; used in concert with recording_prompt",
        default: `
        .centered {
          margin: 0 auto;
        }

        .rs-tooltip-text {
          display:none;
        }

        /* Recolor the slider */
        .rs-handle {
          background-color: #1098F7;
        }

        /* Recolor the slider path  */
        .rs-path-color  {
            background-color: #000;
            border-color: none;
        }

        /* Hide the text associated with the shape */
        .rs-tooltip-text {
          color:#000;
          visibility: hidden;
          -webkit-touch-callout: none; /* iOS Safari */
          -webkit-user-select: none; /* Safari */
           -khtml-user-select: none; /* Konqueror HTML */
             -moz-user-select: none; /* Firefox */
              -ms-user-select: none; /* Internet Explorer/Edge */
                  user-select: none; /* Non-prefixed version, currently
                                        supported by Chrome and Opera */
        }

        /*Hide the bar on the slider*/
        .rs-start, .rs-end {
          display:none;
        }

        /* Hide the circular handle and image */

        .rs-move, .rs-handle {
          display: none;
        }

        /* start by hiding the image */
        /*
        .rs-inner.rs-bg-color.rs-border {
          background-size: 0 0;
        }
        */
        `,
      },
    },
  };

  plugin.trial = function (display_element, trial) {
    function sortNumber(a, b) {
      return a - b;
    }

    function angleToImage(angle) {
      let this_angle, this_image;
      if (angle > 180) {
        this_angle = 180 - (angle - 180);
      } else {
        this_angle = angle;
      }

      this_image = Math.round((this_angle * num_stimuli) / 180);
      if (this_image < 1) {
        this_image = 1;
      }
      return this_image;
    }

    function sliderChange({ value, options }) {
      let this_image_num = angleToImage(value);
      let image_list = options.imageList;

      // assign face image
      let url = "url(".concat(image_list[this_image_num - 1]).concat(")");

      console.log(`url: ${url}`);
      $(".rs-inner").css({ "background-image": url });
      $(".rs-inner").css({ "background-repeat": "no-repeat" });
      $(".rs-inner").css({ "background-position": "center" });
      // Add that face image to the list, and prune it to the unique values
      shown_stimuli.push(this_image_num); // add to the list
      shown_stimuli = _.uniq(shown_stimuli); // extract only unique values
      shown_stimuli.sort(sortNumber); // sort numerically for kicks

      sufficient_faces_shown =
        shown_stimuli.length >= trial.num_images_to_force_display;

      if (sufficient_faces_shown) makeButtonVisibleAndEnabled();

      response.stimuli_seen.push(this_image_num); // note that the very first one is non-informative, since we manually set the background-image
      response.stimuli_seen_times.push(performance.now());
      console.log("response", response);
    }

    function initializeStartingImage() {
      // assign face image
      const url = "url("
        .concat(trial.stimuli[trial.initial_stimulus_value - 1])
        .concat(")");
      console.log(`starting face url: ${url}`);
      $(".rs-inner").css({ "background-image": url });
    }

    function setResponsePhaseImage() {
      image_slider_control.setValue(random_starting_value);
    }

    function showSlider() {
      const el = document.querySelector("#response-slider");
      console.log("el", el);

      el.classList.remove("invis");
    }

    function hideStimulus() {
      const el = document.querySelector(".rs-inner");
      el.style.backgroundSize = "0 0";
    }

    function showStimulus() {
      const el = document.querySelector(".rs-inner");

      el.style.removeProperty("background-size");
    }

    function startResponsePhase() {
      // set new image
      setResponsePhaseImage();

      // show image
      const image = document.querySelector(".rs-inner");
      image.style.removeProperty("background-size");

      // show slider
      document.querySelector(".rs-move").style.display = "block";
      document.querySelector(".rs-handle").style.display = "block";
    }

    const makeButtonVisibleAndEnabled = _.once(function () {
      const el = document.querySelector("#continue-button");
      el.classList.remove("invis");
      el.classList.remove("disabled");
    });

    async function doTrial() {
      hideStimulus();
      showSlider();
      initializeStartingImage();
      await wait(showStimulus, trial.initial_stimulus_delay);
      await wait(hideStimulus, trial.stimulus_duration);
      await wait(startResponsePhase, trial.post_stimulus_delay);
    }

    // load custom css
    const sheet = jsPsych.pluginAPI.loadCSS(trial.custom_css);

    let shown_stimuli = [];
    let sufficient_faces_shown = false;
    let num_stimuli = trial.stimuli.length;

    let html = `<div id="experiment-container" class="container">`;
    html += `<div id="response-slider" class="centered invis"></div>`;
    // add submit button
    html +=
      '<div class="container my-3">' +
      '<button id="continue-button" class="jspsych-btn btn btn-lg btn-primary invis disabled">' +
      trial.button_label +
      "</button>" +
      "</div>";
    html += `</div>`;

    const response = {
      rt: null,
      response: null,
      response_angle: null,
      stimuli_seen: [],
      stimuli_seen_times: [],
    };

    display_element.innerHTML = html;

    const start_angle = _.random(0, 359);
    const start_value = _.random(0, 359);
    const random_starting_value = _.random(0, 359);

    $("#response-slider").roundSlider({
      min: 0,
      max: 360,
      startAngle: start_angle,
      startValue: start_value,
      radius: trial.slider_diameter / 2, // controls width of slider area as a whole
      width: 10, // controls size of slider circle (i.e. the black ring)
      handleSize: "+20", // can make the slider circle overflow from its bounds
      animation: false, // makes sure that there isn't a starting animation for setting the value
      showTooltip: true, // shows the shape
      editableTooltip: false, // makes sure the shape isn't clickable
      imageList: trial.stimuli,
      tooltipFormat: sliderChange, // callback updating the images
    });

    const image_slider_control = $("#response-slider").data("roundSlider");

    doTrial();

    display_element
      .querySelector("#continue-button")
      .addEventListener("click", function () {
        // measure response time
        var end_time = new Date().getTime();
        response.rt = end_time - start_time;
        response.response_angle =
          (start_angle + image_slider_control.getValue()) % 360; // note that 0 deg is the west cardinal point on the circle
        response.response = angleToImage(image_slider_control.getValue());
        end_trial();
      });

    function end_trial() {
      jsPsych.pluginAPI.clearAllTimeouts();

      // save data
      const trial_data = {
        ...response,
        ...trial,
      };

      // remove unnecessary items to save
      delete trial.stimuli;
      delete trial.button_label;
      delete trial.custom_css;
      console.log("trial_data", trial_data);

      display_element.innerHTML = "";

      // unload custom CSS
      jsPsych.pluginAPI.unloadCSS(sheet);

      // next trial
      jsPsych.finishTrial(trial_data);
    }

    // if (trial.stimulus_duration !== null) {
    //   jsPsych.pluginAPI.setTimeout(function () {
    //     display_element.querySelector("#response-slider").style.visibility =
    //       "hidden";
    //   }, trial.stimulus_duration);
    // }

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
