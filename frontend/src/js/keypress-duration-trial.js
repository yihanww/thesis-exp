/**
 * keypress-duration-trial
 * Stefan Uddenberg
 *
 * Plugin for displaying an image
 * and having a subject rate that image by holding
 * down a key for as long as they like. The longer they press,
 * the stronger the rating.
 *
 * Built off of Josh de Leeuw's jspsych-html-keyboard-response plugin.
 *
 **/

import "lodash";
import "mousetrap";
import * as Tone from "tone";
import jsPsych from "jspsych";

const keypress_duration_trial = (function () {
  let plugin = {};

  plugin.info = {
    name: "keypress-duration-trial",
    description: "",
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: "Stimulus",
        default: `<div id="keypress-duration-stimulus" class="container jumbotron alert-success">
          <h1 class="display-3 text-white">PRESS SPACEBAR</h1>
        </div>`,
        description: "The HTML string to be displayed",
      },
      stimulus_id: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Stimulus ID",
        default: "#keypress-duration-stimulus",
        description: "The ID of the stimulus's HTML element",
      },
      save_stimulus: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Save stimulus",
        default: true,
        description: "Whether to save the whole stimulus to the data file.",
      },
      tone_note: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Tone stimulus",
        default: "C4", // XXX TO IMPLEMENT
        description: "The note to play while recording a response.",
      },
      play_tone: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Play sound",
        default: false,
        description: "Whether to play the sound while recording a response.",
      },
      initial_tone_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Initial tone duration",
        default: 0,
        description: "How long to play the tone for before subject's response.",
      },
      use_global_initial_tone_duration: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Use global tone duration",
        default: false,
        description: "Whether to use the global tone duration.",
      },
      initial_tone_delay: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Initial tone delay",
        default: 2,
        description: "How long to wait before playing the initial tone.",
      },
      choices: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        array: true,
        pretty_name: "Choices",
        default: ["space"],
        description:
          "The keys the subject is allowed to press to respond to the stimulus.",
      },
      prompt: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: "Prompt",
        default: null,
        description: "Any content here will be displayed below the stimulus.",
      },
      recording_prompt: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: "Recording prompt",
        default: `
        <div id="recording-prompt" class="container my-5 invis">
          <h1 class="text-center">Recording...</h1>
          <div class="clock my-5">
            <div class="minutes"></div>
            <div class="hours"></div>
          </div>
        </div>
        `,
        description: "The prompt to show that recording is ongoing.",
      },
      feedback_element_id: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Feedback element ID",
        default: "#keypress-duration-stimulus",
        description: "The element via which feedback is shown.",
      },
      stimulus_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Stimulus duration",
        default: null,
        description: "How long to hide the stimulus.",
      },
      interstimulus_interval: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Interstimulus interval",
        default: 0,
        description:
          "How long to show a blank screen after the stimulus in milliseconds, before showing the feedback prompt.",
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Trial duration",
        default: null,
        description: "How long to show trial before it ends in milliseconds.",
      },
      custom_css: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Custom CSS",
        description:
          "Custom CSS for this trial; used in concert with recording_prompt",
        default: `
        .clock {
          position: relative;
          width: 50px;
          height: 50px;
          border-radius: 30px;
          border: solid 5px black;
          left: 50%;
          margin-left: -25px;
          top: 50%;
          margin-top: -25px;
          box-sizing: content-box;
        }
        .clock .hours {
          position: absolute;
          width: 50px;
          height: 5px;
          top: 22.5px;
          -webkit-animation: you-spin-me-round-round-baby-right-round 5s linear 0s infinite;
        }
        .clock .hours:before {
          content: "";
          height: 5px;
          width: 16px;
          position: absolute;
          right: 11px;
          background: black;
          border-radius: 5px;
        }
        .clock .minutes {
          position: absolute;
          width: 50px;
          height: 5px;
          top: 22.5px;
          -webkit-animation: you-spin-me-round-round-baby-right-round 0.41s linear 0s infinite;
        }
        .clock .minutes:before {
          content: "";
          height: 5px;
          width: 22px;
          position: absolute;
          right: 5px;
          background: black;
          border-radius: 5px;
        }

        .responded {
          background-color: #0F705D;
          transform: scale(0.9, 0.9);
          transition: 100ms;
        }

        @-webkit-keyframes you-spin-me-round-round-baby-right-round {
          0% {
            -webkit-transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(360deg);
          }
        }`,
      },
    },
  };

  plugin.trial = function (display_element, trial) {
    function setupSynth() {
      const synth = new Tone.Synth();
      synth.oscillator.type = "sine";
      synth.toMaster();
      return synth;
    }

    function resetTone() {
      // Stop, rewind and clear all events from the transport (from previous plays)
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      Tone.Transport.cancel();
      Tone.Transport.start();
    }

    function playInitialToneStimulus() {
      console.log(`Playing initial tone for ${trial.initial_tone_duration} s.`);
      resetTone();
      setTimeout(() => {
        synth.triggerAttackRelease(
          trial.tone_note,
          trial.initial_tone_duration,
        );
      }, trial.initial_tone_delay * 1000);
    }

    function showRecordingPrompt() {
      $("#recording-prompt").removeClass(["not-displayed", "invis"]);
    }

    function hideRecordingPrompt() {
      $("#recording-prompt").addClass(["not-displayed", "invis"]);
    }

    function showRecordingFeedback(element_id = trial.stimulus_id) {
      $(element_id).addClass("responded");
    }

    function hideRecordingFeedback(element_id = trial.stimulus_id) {
      $(element_id).removeClass("responded");
    }

    function keyDownAction() {
      console.log("key down");
      if (trial.play_tone) {
        synth.triggerAttack(trial.tone_note);
      }
      showRecordingPrompt();
      showRecordingFeedback(trial.feedback_element_id);
    }

    function keyUpAction() {
      console.log("key up");
      if (trial.play_tone) {
        synth.triggerRelease();
      }
      hideRecordingPrompt();
      hideRecordingFeedback(trial.feedback_element_id);
    }

    // Load custom css
    const sheet = jsPsych.pluginAPI.loadCSS(trial.custom_css);

    const extra_delay = 250; // in ms
    const synth = setupSynth();

    let new_html =
      '<div id="jspsych-keypress-duration-response-stimulus-container" class="container">' +
      trial.stimulus +
      "</div>";

    // add prompt
    if (trial.prompt !== null) {
      new_html += trial.prompt;
    }

    if (trial.recording_prompt !== null) {
      new_html += trial.recording_prompt;
    }

    // draw
    display_element.innerHTML = new_html;
    const trial_start_time = performance.now();

    let allow_response = trial.stimulus_duration > 0 ? false : true;
    // play tone
    if (
      trial.use_global_initial_tone_duration &&
      window.initial_tone_duration
    ) {
      trial.initial_tone_duration = window.initial_tone_duration;
    }
    if (trial.initial_tone_duration > 0) {
      allow_response = false;
      playInitialToneStimulus();
      setTimeout(() => {
        allow_response = true;
      }, (trial.initial_tone_duration + trial.initial_tone_delay) * 1000 + extra_delay);
    }

    // store response
    const response = {
      key_start_time: null,
      key_end_time: null,
      key_press_duration: null,
      key_code: null,
      key_name: null,
      key: null,
    };

    let keyboardListener;

    // set up response listeners and reactive styling
    for (let key of trial.choices) {
      if (key === "spacebar") key = "space";
      Mousetrap.bind(key, _.throttle(startResponse, 200), "keydown");
      Mousetrap.bind(key, endResponse, "keyup");
    }
    // function to end trial when it is time
    const endTrial = function () {
      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // kill keyboard listeners
      if (typeof keyboardListener !== "undefined") {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }

      Mousetrap.reset();

      // gather the data to store for the trial
      const trial_data = {
        stimulus: trial.save_stimulus ? trial.stimulus : "redacted",
        stimulus_duration: trial.stimulus_duration,
        initial_tone_duration: trial.initial_tone_duration,
        initial_tone_delay: trial.initial_tone_delay,
        trial_duration: performance.now() - trial_start_time,
        ...response,
      };

      // clear the display
      display_element.innerHTML = "";

      // remove custom css
      jsPsych.pluginAPI.unloadCSS(sheet);

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

    // function to handle responses by the subject
    function startResponse(e) {
      // after initiating a valid response, the stimulus
      // will have the CSS class 'responded'
      // which can be used to provide visual feedback that a response is
      // being recorded.
      if (allow_response && !e.repeat) {
        // because keydown can fire continuously, need to check if
        // we've already recorded a key
        // (although this should be mitigated by e.repeat)
        if (response.key === null) {
          console.log("collecting start of response");
          response.viewing_duration_before_response =
            performance.now() - trial_start_time;
          response.key_start_time = performance.now();
          response.key_code = e.keyCode;
          response.key_name = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(
            e.keyCode,
          );
          response.key = response.key_name;
          keyDownAction();
        }
      }
    }

    function endResponse() {
      if (response.key !== null) {
        response.key_end_time = performance.now();
        response.key_press_duration =
          response.key_end_time - response.key_start_time;
        keyUpAction();
        endTrial();
      }
    }

    // hide stimulus if stimulus_duration is set, show recording prompt
    if (trial.stimulus_duration !== null) {
      allow_response = false;
      jsPsych.pluginAPI.setTimeout(function () {
        display_element
          .querySelector(
            "#jspsych-keypress-duration-response-stimulus-container",
          )
          .classList.add("not-displayed", "invis");
      }, trial.stimulus_duration);

      if (trial.interstimulus_interval) {
        jsPsych.pluginAPI.setTimeout(function () {
          display_element
            .querySelector("#recording-prompt")
            .classList.remove("not-displayed", "invis");
          allow_response = true;
        }, trial.stimulus_duration + trial.interstimulus_interval);
      } else {
        display_element
          .querySelector("#recording-prompt")
          .classList.remove("not-displayed", "invis");
        allow_response = true;
      }
    }

    // end trial if trial_duration is set
    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function () {
        endTrial();
      }, trial.trial_duration);
    }
  };

  return plugin;
})();

export default keypress_duration_trial;
