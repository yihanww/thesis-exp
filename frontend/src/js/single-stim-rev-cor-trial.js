/**
 * single-stim-rev-cor-trial
 *
 * plugin for displaying a stimulus and getting a keyboard response, with attention check.
 *
 * Stefan Uddenberg
 *
 **/

import jsPsych from "jspsych";
import zipObject from "lodash/zipObject";
import last from "lodash/last";

const single_stim_rev_cor_trial = (function () {
    var plugin = {};

    jsPsych.pluginAPI.registerPreload(
        "single-stim-rev-cor-trial",
        "stimulus",
        "image",
    );

    plugin.info = {
        name: "single-stim-rev-cor-trial",
        description: "",
        parameters: {
            stimulus: {
                type: jsPsych.plugins.parameterType.IMAGE,
                pretty_name: "Stimulus",
                default: undefined,
                description: "The image to be displayed",
            },
            stimulus_height: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: "Image height",
                default: null,
                description: "Set the image height in pixels",
            },
            stimulus_width: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: "Image width",
                default: null,
                description: "Set the image width in pixels",
            },
            maintain_aspect_ratio: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: "Maintain aspect ratio",
                default: true,
                description: "Maintain the aspect ratio after setting width or height",
            },
            choices: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                array: true,
                pretty_name: "Choices",
                default: jsPsych.ALL_KEYS,
                description:
                    "The keys the subject is allowed to press to respond to the stimulus. If attention check is on, the last choice will be taken to be the attention check key.",
            },
            choice_labels: {
                type: jsPsych.plugins.parameterType.STRING,
                array: true,
                pretty_name: "Choice labels",
                default: jsPsych.ALL_KEYS,
                description: "Labels for each choice key.",
            },
            preamble: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: "Preamble",
                default: null,
                description: "Any content here will be displayed above the stimulus.",
            },
            prompt: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: "Prompt",
                default: null,
                description: "Any content here will be displayed below the stimulus.",
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
                description: "How long to show trial before it ends.",
            },
            response_ends_trial: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: "Response ends trial",
                default: true,
                description: "If true, trial will end when subject makes a response.",
            },
            attention_check_on: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: "Attention check",
                default: false,
                description: "If true, will be an attention check trial.",
            },
            attention_check_css: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: "Attention Check CSS",
                default: `border-style: solid; border-width: 20px; border-color: blue;`,
                description: "The custom CSS applied to an attention check trial",
            },
        },
    };

    plugin.trial = function (display_element, trial) {
        const {
            choices,
            choice_labels,
            maintain_aspect_ratio,
            preamble,
            prompt,
            stimulus,
            stimulus_width,
            stimulus_height,
            attention_check_on,
            attention_check_css,
        } = trial;
        let attention_check_key = last(choices);
        // display stimulus
        let html = "";

        // add prompt
        if (preamble !== null) {
            html += preamble;
        }
        html +=
            '<img src="' +
            stimulus +
            '" id="jspsych-single-stim-rev-cor-trial-stimulus" style="';
        if (stimulus_height !== null) {
            html += "height:" + stimulus_height + "px; ";
            if (stimulus_width == null && maintain_aspect_ratio) {
                html += "width: auto; ";
            }
        }
        if (stimulus_width !== null) {
            html += "width:" + stimulus_width + "px; ";
            if (stimulus_height == null && maintain_aspect_ratio) {
                html += "height: auto; ";
            }
        }
        if (attention_check_on) {
            html += attention_check_css;
        }
        html += '"></img>';

        // add prompt
        if (prompt !== null) {
            html += prompt;
        }

        // render
        display_element.innerHTML = html;

        // store response
        var response = {
            rt: null,
            key: null,
        };

        // function to end trial when it is time
        var end_trial = function () {
            // kill any remaining setTimeout handlers
            jsPsych.pluginAPI.clearAllTimeouts();

            // kill keyboard listeners
            if (typeof keyboardListener !== "undefined") {
                jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
            }

            // get choice information
            const choice_dict = zipObject(choices, choice_labels);

            // gather the data to store for the trial
            response.key_name = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(
                response.key,
            );

            const stimulus_number = parseInt(last(stimulus.split(".")[0].split("/")));

            var trial_data = {
                rt: response.rt,
                stimulus: stimulus,
                key_press: response.key,
                key_name: response.key_name,
                response_label: choice_dict[response.key_name],
                stimulus_number,
                attention_check_on,
                attention_check_passed: attention_check_on
                    ? response.key_name === attention_check_key
                    : response.key_name !== attention_check_key,
            };

            // clear the display
            display_element.innerHTML = "";

            // move on to the next trial
            jsPsych.finishTrial(trial_data);
        };

        // function to handle responses by the subject
        var after_response = function (info) {
            // after a valid response, the stimulus will have the CSS class 'responded'
            // which can be used to provide visual feedback that a response was recorded
            display_element.querySelector(
                "#jspsych-single-stim-rev-cor-trial-stimulus",
            ).className += " responded";

            // only record the first response
            if (response.key == null) {
                response = info;
            }

            if (trial.response_ends_trial) {
                end_trial();
            }
        };

        // start the response listener
        if (choices != jsPsych.NO_KEYS) {
            var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: after_response,
                valid_responses: choices,
                rt_method: "performance",
                persist: false,
                allow_held_key: false,
            });
        }

        // hide stimulus if stimulus_duration is set
        if (trial.stimulus_duration !== null) {
            jsPsych.pluginAPI.setTimeout(function () {
                display_element.querySelector(
                    "#jspsych-single-stim-rev-cor-trial-stimulus",
                ).style.visibility = "hidden";
            }, trial.stimulus_duration);
        }

        // end trial if trial_duration is set
        if (trial.trial_duration !== null) {
            jsPsych.pluginAPI.setTimeout(function () {
                end_trial();
            }, trial.trial_duration);
        }
    };

    return plugin;
})();

export default single_stim_rev_cor_trial;
